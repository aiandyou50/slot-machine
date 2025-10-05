/**
 * Cloudflare Worker for CandleSpinner Game Logic - "Lucky Gemstone Slot" Engine
 * (클라우드플레어 워커: 캔들스피너 게임 로직 - "Lucky Gemstone Slot" 엔진)
 *
 * @version 2.0.0 (Backend Logic)
 * @date 2025-10-05
 * @author Jules (AI Assistant)
 *
 * @changelog
 * - v2.0.0 (2025-10-05): [Changed] Major overhaul to "Lucky Gemstone Slot" engine.
 *   - Implemented a 5-reel, 3-row, 20-payline system.
 *   - Introduced new symbols with weighted reel strips.
 *   - Implemented payline, scatter, and jackpot win calculations.
 *   - (Korean): "Lucky Gemstone Slot" 게임 엔진으로 대대적인 개편을 진행했습니다.
 *     - 5릴, 3행, 20 페이라인 시스템을 구현했습니다.
 *     - 가중치가 적용된 릴 스트립과 함께 새로운 심볼을 도입했습니다.
 *     - 페이라인, 스캐터, 잭팟 당첨 계산 로직을 구현했습니다.
 */

// --- 📚 Imports (라이브러리 임포트) ---
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, toNano, JettonMaster, JettonWallet } from "@ton/core";

// --- ⚙️ Game Configuration (게임 설정) ---
const config = {
    symbols: { WILD: '👑', SCATTER: '🎁', DIAMOND: '💎', RUBY: '❤️', SAPPHIRE: '💙', A: 'A', K: 'K', Q: 'Q' },
    reelStrips: [
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 }, { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 }, { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
    ],
    reels: 5,
    rows: 3,
    paylines: [
        [1, 4, 7, 10, 13], [0, 3, 6, 9, 12], [2, 5, 8, 11, 14], [0, 4, 8, 10, 12], [2, 4, 6, 10, 14],
        [0, 3, 7, 11, 14], [2, 5, 7, 9, 12], [1, 3, 6, 9, 13], [1, 5, 8, 11, 13], [0, 4, 7, 10, 12],
        [2, 4, 7, 10, 14], [1, 3, 7, 11, 13], [1, 5, 7, 9, 13], [0, 4, 6, 9, 12], [2, 4, 8, 11, 14],
        [1, 4, 6, 9, 13], [1, 4, 8, 11, 13], [0, 3, 8, 11, 14], [2, 5, 6, 9, 12], [0, 5, 8, 11, 12]
    ],
    paytable: {
        '👑': { 5: 1000, 4: 200, 3: 50, 2: 10 }, '💎': { 5: 500, 4: 100, 3: 40 },
        '❤️': { 5: 400, 4: 80, 3: 30 }, '💙': { 5: 300, 4: 60, 3: 20 },
        'A': { 5: 150, 4: 40, 3: 15 }, 'K': { 5: 120, 4: 30, 3: 10 }, 'Q': { 5: 100, 4: 20, 3: 5 }
    },
    scatterPayout: { 5: 100, 4: 20, 3: 5, 2: 2 },
    jackpot: { lineIndex: 0, symbol: '👑', multiplier: 5000 },
    tokenMasterAddress: "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV",
};

// --- Helper Functions (헬퍼 함수) ---

function getWeightedRandomSymbol(weightConfig) {
    const weightedArray = [];
    for (const symbol in weightConfig) {
        for (let i = 0; i < weightConfig[symbol]; i++) weightedArray.push(symbol);
    }
    return weightedArray[Math.floor(Math.random() * weightedArray.length)];
}

function generateReels() {
    const reels = [];
    for (let i = 0; i < config.reels * config.rows; i++) {
        reels.push(getWeightedRandomSymbol(config.reelStrips[i % config.reels]));
    }
    return reels;
}

function calculateWinnings(finalReels, betAmount) {
    let totalPayout = 0;
    const winningPaylines = [];
    let isJackpot = false;

    // 1. Payline Wins
    config.paylines.forEach((line, lineIndex) => {
        const lineSymbols = line.map(index => finalReels[index]);
        const firstSymbol = lineSymbols[0];
        if (firstSymbol === config.symbols.SCATTER) return;

        let matchCount = 1;
        let wildCount = firstSymbol === config.symbols.WILD ? 1 : 0;
        for (let i = 1; i < lineSymbols.length; i++) {
            if (lineSymbols[i] === firstSymbol || lineSymbols[i] === config.symbols.WILD) {
                matchCount++;
                if (lineSymbols[i] === config.symbols.WILD) wildCount++;
            } else break;
        }

        const effectiveSymbol = (wildCount === matchCount && matchCount > 0) ? config.symbols.WILD : firstSymbol;
        const payoutMultiplier = config.paytable[effectiveSymbol]?.[matchCount] || 0;

        if (payoutMultiplier > 0) {
            const payout = betAmount * payoutMultiplier;
            totalPayout += payout;
            winningPaylines.push({ lineIndex, symbol: effectiveSymbol, count: matchCount, payout });
        }
    });

    // 2. Jackpot Check (overrides other wins)
    const jackpotLine = config.paylines[config.jackpot.lineIndex];
    if (jackpotLine.every(index => finalReels[index] === config.symbols.WILD)) {
        isJackpot = true;
        totalPayout = betAmount * config.jackpot.multiplier;
        winningPaylines.splice(0, winningPaylines.length, {
            lineIndex: config.jackpot.lineIndex, symbol: config.symbols.WILD, count: 5,
            payout: totalPayout, isJackpot: true,
        });
    }

    // 3. Scatter Wins (added to other wins, unless jackpot)
    const scatterCount = finalReels.filter(s => s === config.symbols.SCATTER).length;
    const scatterMultiplier = config.scatterPayout[scatterCount] || 0;
    let scatterPayout = 0;
    if (scatterMultiplier > 0) {
        scatterPayout = betAmount * scatterMultiplier;
        if (!isJackpot) totalPayout += scatterPayout;
    }

    return {
        reels: finalReels,
        isWin: totalPayout > 0,
        payout: totalPayout,
        winningPaylines,
        scatterWin: { count: scatterCount, payout: scatterPayout },
        isJackpot,
        isFreeSpinTrigger: scatterCount >= 3,
        freeSpinsAwarded: scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : scatterCount === 5 ? 20 : 0,
    };
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
    const payoutInNano = toNano(payoutAmount.toFixed(2));
    const transferMessage = internal({
        to: gameJettonWalletAddress, value: toNano("0.05"),
        body: JettonWallet.createTransferBody({
            queryId: 0, jettonAmount: payoutInNano,
            destination: Address.parse(recipientAddress), responseDestination: walletContract.address,
            forwardTonAmount: toNano("0.01"), forwardPayload: JettonMaster.createComment("CandleSpinner Prize!"),
        }),
    });
    await walletContract.sendTransfer(sender, transferMessage);
    console.log(`Payout of ${payoutAmount} CSPIN to ${recipientAddress} sent successfully.`);
    return true;
}

// --- ☁️ Cloudflare Worker Entry Point ---
export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

        const requestData = await context.request.json();
        const { boc, betAmount, userAddress, devKey } = requestData;

        if (!boc || !betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid request parameters." }), { status: 400 });
        }

        let finalReels;
        const correctDevKey = context.env.DEV_KEY;
        if (correctDevKey && devKey === correctDevKey) {
            console.log("DEV MODE: Forcing a jackpot win.");
            finalReels = Array(15).fill(config.symbols.Q);
            const jackpotLine = config.paylines[config.jackpot.lineIndex];
            jackpotLine.forEach(index => finalReels[index] = config.symbols.WILD);
        } else {
            finalReels = generateReels();
        }
        
        const result = calculateWinnings(finalReels, Number(betAmount));
        
        if (result.isWin && result.payout > 0) {
            console.log(`WIN! Total Payout: ${result.payout}. Attempting to send to ${userAddress}`);
            try {
                await sendPayoutTransaction(context, userAddress, result.payout);
            } catch (payoutError) {
                console.error("Payout failed:", payoutError);
                return new Response(JSON.stringify({
                    success: true, message: `Spin successful, but payout failed: ${payoutError.message}`, data: result
                }), { status: 200 });
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Spin successful!", data: result }), { status: 200 });
    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({ success: false, message: `General Error: ${error.message}` }), { status: 500 });
    }
}