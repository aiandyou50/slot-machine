import { jwtVerify } from 'jose';
import { TonClient, WalletContractV4 } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, toNano, beginCell } from '@ton/core';

// (KO) 환경 변수에서 민감한 정보를 가져옵니다.
// (EN) Source sensitive information from environment variables.
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
 * @param {string} userAddress - (KO) 상금을 받을 사용자 주소 (EN) The user's address to receive the prize.
 * @param {number} amount - (KO) 전송할 토큰의 양 (EN) The amount of tokens to send.
 * @param {object} env - (KO) Cloudflare 환경 변수 (EN) Cloudflare environment variables.
 * @returns {Promise<string>} A confirmation string indicating success.
 */
async function sendTransaction(userAddress, amount, env) {
    const GAME_WALLET_SEED = env.GAME_WALLET_SEED;
    if (!GAME_WALLET_SEED) {
        throw new Error("GAME_WALLET_SEED is not configured in environment variables.");
    }

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: env.TONCENTER_API_KEY,
    });

    const keys = await mnemonicToWalletKey(GAME_WALLET_SEED.split(" "));
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

    // (KO) 트랜잭션이 처리될 때까지 잠시 대기합니다.
    // (EN) Wait a moment for the transaction to be processed.
    let currentSeqno = seqno;
    let attempt = 0;
    while (currentSeqno === seqno && attempt < 15) { // (KO) 약 30초 타임아웃 (EN) Approx. 30s timeout
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
    const { winTicket } = await request.json();
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET || 'your-default-super-secret-key-for-local-dev');

    if (!winTicket) {
      return new Response(JSON.stringify({ success: false, message: "INVALID_TICKET" }), { status: 400 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(winTicket, JWT_SECRET, {
        issuer: 'urn:candlespinner:server',
        audience: 'urn:candlespinner:client',
      });
      payload = verifiedPayload;
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: "INVALID_TICKET" }), { status: 401 });
    }

    const userAddress = payload.sub;
    const payout = payload.payout;

    if (!userAddress || !payout) {
        return new Response(JSON.stringify({ success: false, message: "INVALID_TICKET_PAYLOAD" }), { status: 400 });
    }

    const txHash = await sendTransaction(userAddress, payout, env);

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
    if (e.message.includes("insufficient funds")) {
        return new Response(JSON.stringify({ success: false, message: 'INSUFFICIENT_FUNDS' }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}