/**
 * Cloudflare Worker for CandleSpinner Game Logic (using @ton/* libraries via npm)
 * (클라우드플레어 워커: 캔들스피너 게임 로직 - npm을 통해 @ton/* 라이브러리 사용)
 *
 * @version 2.1.1 (Backend Logic) - NPM Import Fix for Deployment
 * @date 2025-10-05
 *
 * @changelog
 * - v2.1.1 (2025-10-05): [FIX] Switched back to npm imports to resolve Cloudflare deployment bug with URL imports (missing slash in esm.sh URLs).
 * (클라우드플레어 배포 버그(URL import 시 슬래시 누락)를 해결하기 위해 npm import으로 전환했습니다.)
 */

// Import from the official TON libraries via npm.
// (npm을 통해 공식 TON 라이브러리에서 import 합니다.)
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

    const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    const walletContract = client.open(wallet);
    const sender = walletContract.sender(key.secretKey);
    const jettonMaster = client.open(JettonMaster.create(Address.parse(config.tokenMasterAddress)));
    const gameJettonWalletAddress = await jettonMaster.getWalletAddress(walletContract.address);
    const payoutInNano = toNano(payoutAmount.toString());

    const transferMessage = internal({
        to: gameJettonWalletAddress,
        value: toNano("0.05"),
        body: JettonWallet.createTransferBody({
            queryId: 0,
            jettonAmount: payoutInNano,
            destination: Address.parse(recipientAddress),
            responseDestination: walletContract.address,
            forwardTonAmount: toNano("0.01"),
            forwardPayload: JettonMaster.createComment("CandleSpinner Prize!"),
        }),
    });

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
