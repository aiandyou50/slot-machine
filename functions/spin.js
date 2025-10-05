/**
 * Cloudflare Worker for CandleSpinner Game Logic - "Lucky Gemstone Slot" Engine
 * (클라우드플레어 워커: 캔들스피너 게임 로직 - "Lucky Gemstone Slot" 엔진)
 *
 * @version 2.2.0 (Backend Logic)
 * @date 2025-10-05
 * @author Jules (AI Assistant)
 *
 * @changelog
 * - v2.2.0 (2025-10-05): [Architectural Change] Implemented delayed payout system using JWT.
 *   - On a win, the function no longer sends a payout directly.
 *   - Instead, it generates a secure JWT "win ticket" containing payout details.
 *   - This ticket is returned to the client to be used for the Double Up feature or to claim the prize later.
 *   - (Korean): JWT를 사용한 지연 지급 시스템을 구현했습니다.
 *     - 당첨 시, 함수는 더 이상 상금을 직접 지급하지 않습니다.
 *     - 대신, 상금 정보가 담긴 보안 JWT "당첨 티켓"을 생성합니다.
 *     - 이 티켓은 더블업 기능에 사용되거나 나중에 상금을 수령하기 위해 클라이언트로 반환됩니다.
 */

// --- 📚 Imports (라이브러리 임포트) ---
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Address, toNano, JettonMaster, JettonWallet } from "@ton/core";
import * as jose from 'jose';

// --- ⚙️ Game Configuration (게임 설정) ---
const config = {
    symbols: { WILD: '👑', SCATTER: '🎁', DIAMOND: '💎', RUBY: '❤️', SAPPHIRE: '💙', A: 'A', K: 'K', Q: 'Q' },
    reelStrips: [
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
        { '👑': 4, '🎁': 5, '💎': 9, '❤️': 12, '💙': 15, 'A': 18, 'K': 20, 'Q': 22 },
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
};

function getWeightedRandomSymbol(weightConfig) {
    const weightedArray = [];
    for (const symbol in weightConfig) for (let i = 0; i < weightConfig[symbol]; i++) weightedArray.push(symbol);
    return weightedArray[Math.floor(Math.random() * weightedArray.length)];
}

function generateReels() {
    const reels = [];
    for (let i = 0; i < config.reels * config.rows; i++) reels.push(getWeightedRandomSymbol(config.reelStrips[i % config.reels]));
    return reels;
}

function calculateWinnings(finalReels, betAmount) {
    let totalPayout = 0;
    const winningPaylines = [];
    let isJackpot = false;
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
    const jackpotLine = config.paylines[config.jackpot.lineIndex];
    if (jackpotLine.every(index => finalReels[index] === config.symbols.WILD)) {
        isJackpot = true;
        totalPayout = betAmount * config.jackpot.multiplier;
        winningPaylines.splice(0, winningPaylines.length, {
            lineIndex: config.jackpot.lineIndex, symbol: config.symbols.WILD, count: 5,
            payout: totalPayout, isJackpot: true,
        });
    }
    const scatterCount = finalReels.filter(s => s === config.symbols.SCATTER).length;
    const scatterMultiplier = config.scatterPayout[scatterCount] || 0;
    if (scatterMultiplier > 0 && !isJackpot) totalPayout += betAmount * scatterMultiplier;
    return {
        reels: finalReels, isWin: totalPayout > 0, payout: totalPayout,
        winningPaylines, isJackpot, isFreeSpinTrigger: scatterCount >= 3,
        freeSpinsAwarded: scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : scatterCount === 5 ? 20 : 0,
    };
}

async function createWinTicket(payload, secret) {
    const secretKey = new TextEncoder().encode(secret);
    const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m') // Ticket is valid for 5 minutes
        .sign(secretKey);
    return jwt;
}

export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
        const requestData = await context.request.json();
        const { boc, betAmount, userAddress, devKey } = requestData;

        if (!boc || !betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid request: missing required fields." }), { status: 400 });
        }

        let finalReels;
        const correctDevKey = context.env.DEV_KEY;
        if (devKey && devKey === correctDevKey) {
            console.log("DEV MODE: Forcing a jackpot win.");
            finalReels = Array(15).fill(config.symbols.Q);
            const jackpotLine = config.paylines[config.jackpot.lineIndex];
            jackpotLine.forEach(index => finalReels[index] = config.symbols.WILD);
        } else {
            finalReels = generateReels();
        }
        
        const result = calculateWinnings(finalReels, Number(betAmount));
        
        let winTicket = null;
        if (result.isWin && result.payout > 0) {
            const jwtSecret = context.env.JWT_SECRET;
            if (!jwtSecret) throw new Error("CRITICAL: JWT_SECRET is not set.");

            const ticketPayload = {
                userAddress,
                payout: result.payout,
                betAmount: Number(betAmount),
                doubleUpCount: 0, // Initial double up count
            };
            winTicket = await createWinTicket(ticketPayload, jwtSecret);
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Spin successful!",
            data: result,
            winTicket: winTicket // Send the ticket to the client
        }), { headers: { 'Content-Type': 'application/json' }, status: 200 });

    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({ success: false, message: `General Error: ${error.message}` }), { status: 500 });
    }
}