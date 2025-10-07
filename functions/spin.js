import * as jose from 'jose';

// --- ⚙️ 게임 설정 (Game Configuration) ---
// Korean: 게임의 심볼, 릴 구성, 페이라인, 페이테이블 등 핵심 규칙을 정의합니다.
// English: Defines the core game rules, including symbols, reel configurations, paylines, and the paytable.
const config = {
    symbols: { WILD: '👑', SCATTER: '🎁', DIAMOND: '💎', RUBY: '❤️', SAPPHIRE: '💙', A: 'A', K: 'K', Q: 'Q' },
    reelStrips: [
        // 각 릴별 심볼 등장 가중치 (Weight for each symbol per reel)
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

/**
 * Korean: 가중치 설정에 따라 무작위 심볼을 반환합니다.
 * English: Returns a random symbol based on the weight configuration.
 */
function getWeightedRandomSymbol(weightConfig) {
    const weightedArray = [];
    for (const symbol in weightConfig) for (let i = 0; i < weightConfig[symbol]; i++) weightedArray.push(symbol);
    return weightedArray[Math.floor(Math.random() * weightedArray.length)];
}

/**
 * Korean: 15개의 릴 결과를 생성합니다.
 * English: Generates 15 reel results.
 */
function generateReels() {
    const reels = [];
    for (let i = 0; i < config.reels * config.rows; i++) reels.push(getWeightedRandomSymbol(config.reelStrips[i % config.reels]));
    return reels;
}

/**
 * Korean: 릴 결과와 베팅 금액을 기반으로 당첨금을 계산합니다.
 * English: Calculates winnings based on the reel results and bet amount.
 */
function calculateWinnings(finalReels, betAmount) {
    let totalPayout = 0;
    const winningPaylines = [];
    let isJackpot = false;

    // 페이라인 당첨 계산
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

    // 잭팟 확인
    const jackpotLine = config.paylines[config.jackpot.lineIndex];
    if (jackpotLine.every(index => finalReels[index] === config.symbols.WILD)) {
        isJackpot = true;
        totalPayout = betAmount * config.jackpot.multiplier;
        winningPaylines.splice(0, winningPaylines.length, {
            lineIndex: config.jackpot.lineIndex, symbol: config.symbols.WILD, count: 5,
            payout: totalPayout, isJackpot: true,
        });
    }

    // 스캐터 당첨 계산
    const scatterCount = finalReels.filter(s => s === config.symbols.SCATTER).length;
    const scatterMultiplier = config.scatterPayout[scatterCount] || 0;
    if (scatterMultiplier > 0 && !isJackpot) totalPayout += betAmount * scatterMultiplier;

    return {
        reels: finalReels, isWin: totalPayout > 0, payout: totalPayout,
        winningPaylines, isJackpot
    };
}

/**
 * Korean: 당첨 정보를 담은 JWT 티켓을 생성합니다.
 * English: Creates a JWT ticket containing the win information.
 */
async function createWinTicket(payload, secret) {
    const secretKey = new TextEncoder().encode(secret);
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m') // 티켓 유효기간 5분 (Ticket is valid for 5 minutes)
        .sign(secretKey);
}

export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

        const { betAmount, userAddress, devKey } = await context.request.json();

        if (!betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid request: missing required fields." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 개발자 모드 확인 (Check for developer mode)
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
            if (!jwtSecret) throw new Error("CRITICAL: JWT_SECRET is not set in environment.");

            const ticketPayload = {
                userAddress,
                payout: result.payout,
                betAmount: Number(betAmount),
                doubleUpCount: 0,
            };
            winTicket = await createWinTicket(ticketPayload, jwtSecret);
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Spin successful!",
            data: result,
            winTicket: winTicket
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({ success: false, message: `Server Error: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}