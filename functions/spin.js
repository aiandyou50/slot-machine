/**
 * Cloudflare Worker for CandleSpinner Game Logic (using @ton/* libraries)
 * (클라우드플레어 워커: 캔들스피너 게임 로직 - @ton/* 라이브러리 사용)
 *
 * @version 2.0.0 (Backend Logic) - Engine Swap
 * @date 2025-10-05
 *
 * @changelog
 * - v2.0.0 (2025-10-05): [MAJOR REFACTOR] Replaced the entire blockchain logic from 'tonweb' to the official '@ton/ton', '@ton/crypto', and '@ton/core' libraries to resolve fundamental compatibility issues with the Cloudflare environment.
 * (Cloudflare 환경과의 근본적인 호환성 문제를 해결하기 위해, 블록체인 로직 전체를 'tonweb'에서 공식 '@ton/ton', '@ton/crypto', '@ton/core' 라이브러리로 교체했습니다.)
 */

// Import from the new official TON libraries
// (새로운 공식 TON 라이브러리에서 import 합니다.)
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, toNano, JettonMaster, JettonWallet } from "@ton/core";

// --- ⚙️ Game Configuration (게임 설정) ---
const config = {
    symbols: ['🌸', '💎', '🍀', '🔔', '💰', '7️⃣'],
    gridSize: 3,
    payoutMultipliers: { '🌸': 5, '💎': 10, '🍀': 15, '🔔': 20, '💰': 50, '7️⃣': 100 },
    tokenMasterAddress: "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV",
};

function calculateResult(finalReels, betAmount) {
    let totalPayout = 0;
    for (let i = 0; i < config.gridSize; i++) {
        const lineStartIndex = i * config.gridSize;
        const s1 = finalReels[lineStartIndex], s2 = finalReels[lineStartIndex + 1], s3 = finalReels[lineStartIndex + 2];
        if (s1 === s2 && s2 === s3) { totalPayout += betAmount * (config.payoutMultipliers[s1] || 0); }
    }
    return { symbols: finalReels, isWin: totalPayout > 0, payout: totalPayout };
}

async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) { throw new Error("CRITICAL: GAME_WALLET_MNEMONIC is not set."); }

    // 1. Initialize TON Client
    // (1. TON 클라이언트 초기화)
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });

    // 2. Open the game wallet from mnemonic
    // (2. 니모닉으로 게임 지갑 열기)
    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    const walletContract = client.open(wallet);
    const sender = walletContract.sender(key.secretKey);

    // 3. Find the Jetton wallets for the game wallet
    // (3. 게임 지갑의 젯톤 지갑 찾기)
    const jettonMaster = client.open(JettonMaster.create(Address.parse(config.tokenMasterAddress)));
    const gameJettonWalletAddress = await jettonMaster.getWalletAddress(walletContract.address);

    // 4. Create the transfer message
    // (4. 전송 메시지 생성)
    const payoutInNano = toNano(payoutAmount.toString());
    const forwardPayload = {
        text: "CandleSpinner Prize! Congratulations!",
        toString: function() { return this.text; } // Simple payload
    };

    const transferMessage = internal({
        to: gameJettonWalletAddress,
        value: toNano("0.05"), // Gas fee for the jetton wallet
        body: JettonWallet.createTransferBody({
            queryId: 0,
            jettonAmount: payoutInNano,
            destination: Address.parse(recipientAddress),
            responseDestination: walletContract.address,
            forwardTonAmount: toNano("0.01"),
            forwardPayload: JettonMaster.createComment(forwardPayload.text),
        }),
    });

    // 5. Send the transaction from the main wallet
    // (5. 메인 지갑에서 트랜잭션 전송)
    await walletContract.sendTransfer(sender, transferMessage);
    
    console.log(`Payout of ${payoutAmount} CSPIN to ${recipientAddress} sent successfully.`);
    return true;
}

export async function onRequest(context) {
    try {
        const requestData = await context.request.json();
        const betAmount = Number(requestData.betAmount);
        const userAddress = requestData.userAddress;
        const devKey = requestData.devKey;

        if (!betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid bet amount or user address." }), { headers: { 'Content-Type': 'application/json' }, status: 400 });
        }

        let finalReels = [];
        const correctDevKey = context.env.DEV_KEY;
        if (correctDevKey && devKey === correctDevKey) {
            console.log("DEV MODE: Forcing a win.");
            finalReels = ['7️⃣', '7️⃣', '7️⃣', '💎', '💰', '🍀', '🔔', '🌸', '🍒'];
        } else {
            for (let i = 0; i < 9; i++) { finalReels.push(config.symbols[Math.floor(Math.random() * config.symbols.length)]); }
        }
        
        const result = calculateResult(finalReels, betAmount);
        
        if (result.isWin) {
            console.log(`WIN! Attempting to send ${result.payout} CSPIN to ${userAddress}`);
            try {
                await sendPayoutTransaction(context, userAddress, result.payout);
            } catch (payoutError) {
                console.error("Payout failed:", payoutError);
                return new Response(JSON.stringify({ success: false, message: `Payout Error: ${payoutError.message}` }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Spin successful!", data: result }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({ success: false, message: `General Error: ${error.message}` }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
    }
}
