// (EN) English and (KO) Korean comments are mandatory.
import { jwtVerify } from 'jose';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, WalletContractV4, internal, fromNano } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import TonWeb from "tonweb";
import { Address } from '@ton/core';


const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

/**
 * (EN) Creates and sends a Jetton transfer transaction.
 * (KO) 제튼 전송 트랜잭션을 생성하고 전송합니다.
 */
async function sendJetton(wallet, keyPair, toAddress, jettonAmount, context) {
  const tonweb = new TonWeb(new TonWeb.HttpProvider(await getHttpEndpoint({ network: "testnet" })));

  const fromAddress = wallet.address;
  const to = new TonWeb.utils.Address(toAddress);

  // (EN) The amount of Jettons to send, specified in elementary units.
  // (KO) 전송할 제튼의 양을 최소 단위로 지정합니다.
  const amount = TonWeb.utils.toNano(jettonAmount.toString());

  // (EN) Fee for the forward message, if any. We send 0.05 TON.
  // (KO) 포워드 메시지에 대한 수수료 (있는 경우). 0.05 TON을 보냅니다.
  const forwardTonAmount = TonWeb.utils.toNano('0.05');

  const jettonMinter = new tonweb.token.jetton.JettonMinter(tonweb.provider, {
      address: CSPIN_JETTON_ADDRESS
  });

  const jettonWallet = await jettonMinter.getJettonWallet(fromAddress.toString());
  const seqno = await wallet.getSeqno();

  const transferPayload = await jettonWallet.createTransferBody({
      jettonAmount: amount,
      toAddress: to,
      forwardAmount: forwardTonAmount,
      forwardPayload: new Uint8Array(), // (EN) Empty payload / (KO) 빈 페이로드
      responseAddress: fromAddress
  });

  await wallet.sendTransfer({
      secretKey: keyPair.secretKey,
      seqno: seqno,
      messages: [internal({
          to: await jettonWallet.getAddress(),
          value: TonWeb.utils.toNano('0.1'), // (EN) Gas fee for the transaction / (KO) 트랜잭션 가스비
          body: transferPayload,
      })]
  });

  // (EN) Note: We don't have an immediate tx hash here. The client needs to check their balance.
  // (KO) 참고: 즉각적인 트랜잭션 해시를 여기서 얻을 수 없습니다. 클라이언트는 자신의 잔액을 확인해야 합니다.
  return { success: true, seqno };
}


/**
 * (EN) Handles the /claimPrize API endpoint.
 * (KO) /claimPrize API 엔드포인트를 처리합니다.
 * @param {object} context - The Cloudflare Functions context object.
 * @returns {Response} - The response object.
 */
export async function onRequestPost(context) {
  try {
    const { winTicket } = await context.request.json();
    const { JWT_SECRET, GAME_WALLET_MNEMONIC, TON_API_KEY } = context.env;

    if (!winTicket) {
      return new Response(JSON.stringify({ success: false, message: 'Missing winTicket.' }), { status: 400 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(winTicket, secret, {
      issuer: 'urn:candlespinner:server',
      audience: 'urn:candlespinner:client',
    });

    const { userAddress, payout } = payload;
    if (!userAddress || !payout) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid ticket payload.' }), { status: 400 });
    }

    // (EN) Initialize TON client and wallet
    // (KO) TON 클라이언트 및 지갑 초기화
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });
    const keyPair = await mnemonicToWalletKey(GAME_WALLET_MNEMONIC.split(" "));
    const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });

    // (EN) Send the Jetton payout
    // (KO) 제튼 상금 전송
    await sendJetton(wallet, keyPair, userAddress, payout, context);

    const transactionResult = {
      // (EN) On-chain tx hash is not immediately available in this model.
      // (KO) 이 모델에서는 온체인 트랜잭션 해시를 즉시 사용할 수 없습니다.
      hash: `payout_initiated_for_seqno_${await wallet.getSeqno()}`,
      amount: payout,
      to: userAddress,
    };

    return new Response(JSON.stringify({
      success: true,
      message: '(EN) Prize claim processed. / (KO) 상금 지급이 처리되었습니다.',
      transaction: transactionResult,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // (EN) Handle JWT errors (e.g., expired, invalid signature).
    // (KO) JWT 오류(예: 만료, 잘못된 서명)를 처리합니다.
    let message = 'An unexpected error occurred.';
    if (error.code === 'ERR_JWT_EXPIRED') {
      message = '(EN) The win ticket has expired. / (KO) 당첨 티켓이 만료되었습니다.';
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      message = '(EN) Invalid win ticket signature. / (KO) 잘못된 당첨 티켓 서명입니다.';
    } else {
      message = error.message;
    }

    return new Response(JSON.stringify({ success: false, message, details: error.code }), {
      status: 401, // (EN) Unauthorized or bad token / (KO) 인증되지 않았거나 잘못된 토큰
      headers: { 'Content-Type': 'application/json' },
    });
  }
}