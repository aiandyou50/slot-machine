/**
 * Cloudflare Worker for Claiming Prizes
 * (상금 수령을 위한 클라우드플레어 워커)
 *
 * @version 2.2.0 (Backend Logic)
 * @date 2025-10-05
 * @author Jules (AI Assistant)
 *
 * @description This endpoint validates a JWT "win ticket" and sends the final prize to the user.
 * (이 엔드포인트는 JWT "당첨 티켓"을 검증하고 사용자에게 최종 상금을 전송합니다.)
 */

// --- 📚 Imports (라이브러리 임포트) ---
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, toNano, JettonMaster, JettonWallet } from "@ton/core";
import * as jose from 'jose';

const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) { throw new Error("CRITICAL: GAME_WALLET_MNEMONIC is not set."); }

    const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    const walletContract = client.open(wallet);
    const sender = walletContract.sender(key.secretKey);
    const jettonMaster = client.open(JettonMaster.create(Address.parse(TOKEN_MASTER_ADDRESS)));
    const gameJettonWalletAddress = await jettonMaster.getWalletAddress(walletContract.address);
    const payoutInNano = toNano(payoutAmount.toFixed(2));

    // Korean: 거래 메시지 생성 (가스비 최적화)
    // English: Create transfer message (gas optimized)
    const transferMessage = internal({
        to: gameJettonWalletAddress,
        value: toNano("0.02"), // TON for gas
        body: JettonWallet.createTransferBody({
            queryId: 0,
            jettonAmount: payoutInNano,
            destination: Address.parse(recipientAddress),
            responseDestination: walletContract.address, // Response address
            forwardTonAmount: toNano("0.005"), // Forward TON amount
            forwardPayload: JettonMaster.createComment("Win!"), // Shortened comment
        }),
    });

    await walletContract.sendTransfer(sender, transferMessage);
    console.log(`Prize claim of ${payoutAmount} CSPIN to ${recipientAddress} sent successfully.`);
    return true;
}

export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const requestData = await context.request.json();
        const { winTicket } = requestData;

        if (!winTicket) {
            return new Response(JSON.stringify({ success: false, message: "Missing win ticket." }), { status: 400 });
        }

        const jwtSecret = context.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("CRITICAL: JWT_SECRET is not set.");
        }
        const secretKey = new TextEncoder().encode(jwtSecret);

        const { payload } = await jose.jwtVerify(winTicket, secretKey, {
            algorithms: ['HS256'],
        });

        const { userAddress, payout } = payload;

        if (!userAddress || !payout || payout <= 0) {
            return new Response(JSON.stringify({ success: false, message: "Invalid ticket payload." }), { status: 400 });
        }

        await sendPayoutTransaction(context, userAddress, payout);

        return new Response(JSON.stringify({ success: true, message: `Successfully claimed ${payout} tokens.` }), { status: 200 });

    } catch (error) {
        console.error("Error in /claim-prize function:", error);
        if (error.code === 'ERR_JWT_EXPIRED') {
            return new Response(JSON.stringify({ success: false, message: "Win ticket has expired." }), { status: 401 });
        }
        if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            return new Response(JSON.stringify({ success: false, message: "Invalid win ticket signature." }), { status: 401 });
        }
        return new Response(JSON.stringify({ success: false, message: `General Error: ${error.message}` }), { status: 500 });
    }
}