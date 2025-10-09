import { jwtVerify } from 'jose';
import { TonClient, WalletContractV4 } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, toNano, beginCell } from '@ton/core';

// (KO) 이 상수는 여러 곳에서 사용될 수 있으므로 전역에 둡니다.
// (EN) This constant can be used in multiple places, so it remains global.
const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

/**
 * (KO) @ton/core를 사용하여 Jetton 전송을 위한 메시지 본문을 생성합니다.
 * (EN) Creates the message body for a Jetton transfer using @ton/core.
 */
function createJettonTransferPayload(jettonAmount, toAddress, responseAddress) {
    return beginCell()
        .storeUint(0x0f8a7ea5, 32) // op-code for jetton transfer
        .storeUint(0, 64) // query_id
        .storeCoins(toNano(jettonAmount))
        .storeAddress(Address.parse(toAddress))
        .storeAddress(Address.parse(responseAddress)) // response_destination
        .storeBit(false) // no custom payload
        .storeCoins(toNano('0.01')) // forward_ton_amount
        .storeBit(false) // no forward_payload
        .endCell();
}

/**
 * (KO) 온체인 트랜잭션을 전송하고 트랜잭션 성공 여부를 반환하는 함수
 * (EN) Function to send an on-chain transaction and return its success status
 */
async function sendTransaction(userAddress, amount, env) {
    if (!env.GAME_WALLET_SEED) {
        throw new Error("CRITICAL: GAME_WALLET_SEED is not configured in environment variables.");
    }

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: env.TONCENTER_API_KEY,
    });

    const keys = await mnemonicToWalletKey(env.GAME_WALLET_SEED.split(" "));
    const wallet = WalletContractV4.create({ publicKey: keys.publicKey, workchain: 0 });

    if (!await client.isContractDeployed(wallet.address)) {
        throw new Error("Game wallet is not deployed.");
    }

    const contract = client.open(wallet);
    const seqno = await contract.getSeqno();

    const jettonMinterAddress = Address.parse(CSPIN_JETTON_ADDRESS);
    const gameWalletSlice = beginCell().storeAddress(wallet.address).endCell().asSlice();
    const { stack: gameWalletStack } = await client.runMethod(jettonMinterAddress, 'get_wallet_address', [{ type: 'slice', cell: gameWalletSlice.asCell() }]);
    const gameJettonWalletAddress = gameWalletStack.readAddress();

    const transferPayload = createJettonTransferPayload(
        amount.toString(),
        userAddress,
        wallet.address.toString()
    );

    await contract.sendTransfer({
        seqno,
        secretKey: keys.secretKey,
        messages: [
            {
                to: gameJettonWalletAddress,
                value: toNano("0.1"),
                body: transferPayload,
            },
        ],
    });

    let currentSeqno = seqno;
    let attempt = 0;
    while (currentSeqno === seqno && attempt < 15) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentSeqno = await contract.getSeqno();
        attempt++;
    }

    if (currentSeqno === seqno) {
        throw new Error("Transaction confirmation timed out.");
    }

    return `seqno_${seqno}_confirmed`;
}


export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.JWT_SECRET || !env.USED_TICKETS) {
      console.error("CRITICAL: JWT_SECRET or USED_TICKETS KV namespace is not set.");
      return new Response(JSON.stringify({ success: false, errorCode: "CONFIGURATION_ERROR", message: "Server configuration is incomplete." }), { status: 500 });
    }
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

    const { winTicket } = await request.json();

    if (!winTicket) {
      return new Response(JSON.stringify({ success: false, errorCode: "INVALID_REQUEST", message: "winTicket is required." }), { status: 400 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(winTicket, JWT_SECRET, {
        issuer: 'urn:candlespinner:server',
        audience: 'urn:candlespinner:client',
      });
      payload = verifiedPayload;
    } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') {
            return new Response(JSON.stringify({ success: false, errorCode: 'TICKET_EXPIRED', message: 'This prize ticket has expired.' }), { status: 401 });
        }
        return new Response(JSON.stringify({ success: false, errorCode: 'INVALID_TICKET', message: 'The provided ticket is invalid.' }), { status: 401 });
    }

    const userAddress = payload.sub;
    const payout = payload.payout;
    const ticketId = payload.spinId;

    if (!userAddress || !payout || !ticketId) {
        return new Response(JSON.stringify({ success: false, errorCode: "INVALID_TICKET_PAYLOAD", message: "Ticket payload is missing required fields." }), { status: 400 });
    }

    const isUsed = await env.USED_TICKETS.get(ticketId);
    if (isUsed) {
      return new Response(JSON.stringify({ success: false, errorCode: "TICKET_ALREADY_USED", message: "This prize ticket has already been used." }), { status: 409 });
    }

    const txHash = await sendTransaction(userAddress, payout, env);

    await env.USED_TICKETS.put(ticketId, "true", { expirationTtl: 3600 }); // (KO) 1시간 후 자동 삭제 (EN) Auto-delete after 1 hour

    return new Response(JSON.stringify({
      success: true,
      transaction: {
        txHash: txHash,
        amount: payout,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error(e);
    if (e.message.includes("insufficient funds")) { // (KO) 실제 오류 메시지에 맞게 조정될 수 있음 (EN) May need adjustment for the actual error message
        return new Response(JSON.stringify({ success: false, errorCode: 'INSUFFICIENT_FUNDS', message: 'The game wallet has insufficient funds to pay out the prize.' }), { status: 503 });
    }
    return new Response(JSON.stringify({ success: false, errorCode: 'INTERNAL_SERVER_ERROR', message: e.message }), { status: 500 });
  }
}