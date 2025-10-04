/**
 * Cloudflare Worker for CandleSpinner Game Logic
 *
 * Endpoint: POST /spin
 *
 * Responsibilities:
 * 1. Receives bet information from the client.
 * 2. Generates a random 3x3 slot machine result.
 * 3. Calculates winnings based on predefined payout rules.
 * 4. (Future) Triggers the on-chain payout transaction for wins.
 *
 * @version 1.0.0 (Backend Logic)
 * @date 2025-10-04
 */

// --- ⚙️ 게임 설정: 이곳에서 심볼, 배당률 등 게임의 모든 규칙을 관리합니다. ---
const config = {
    symbols: ['🌸', '💎', '🍀', '🔔', '💰', '7️⃣'],
    gridSize: 3,
    // 당첨 라인별 배당률 설정 (베팅액 대비 배수)
    payoutMultipliers: {
        '🌸': 5,    // 벚꽃: 5배
        '💎': 10,   // 다이아: 10배
        '🍀': 15,   // 클로버: 15배
        '🔔': 20,   // 종: 20배
        '💰': 50,   // 돈주머니: 50배
        '7️⃣': 100   // 행운의 7: 100배
    }
};

/**
 * 스핀 결과를 계산하고, 당첨 여부와 총 상금을 반환합니다.
 * @param {string[]} finalReels - 3x3 그리드를 나타내는 9개의 심볼 배열
 * @param {number} betAmount - 사용자가 베팅한 금액
 * @returns {{symbols: string[], isWin: boolean, payout: number}} - 게임 결과 객체
 */
function calculateResult(finalReels, betAmount) {
    let totalPayout = 0;

    // 3개의 가로 라인을 순회하며 당첨 여부를 확인합니다.
    for (let i = 0; i < config.gridSize; i++) {
        const lineStartIndex = i * config.gridSize;
        const symbol1 = finalReels[lineStartIndex];
        const symbol2 = finalReels[lineStartIndex + 1];
        const symbol3 = finalReels[lineStartIndex + 2];

        // 한 줄의 3개 심볼이 모두 동일한지 확인합니다.
        if (symbol1 === symbol2 && symbol2 === symbol3) {
            const winningSymbol = symbol1;
            // 설정된 배당률을 가져와 상금을 계산합니다.
            const multiplier = config.payoutMultipliers[winningSymbol] || 0;
            totalPayout += betAmount * multiplier;
        }
    }

    return {
        symbols: finalReels,
        isWin: totalPayout > 0,
        payout: totalPayout
    };
}


/**
 * '/spin' 요청을 처리하는 메인 핸들러 함수입니다.
 * @param {object} context - Cloudflare Worker의 실행 컨텍스트
 */
export async function onRequest(context) {
    try {
        // 1. 클라이언트로부터 'betAmount'(베팅액) 정보를 받습니다.
        const requestData = await context.request.json();
        const betAmount = Number(requestData.betAmount);

        // 유효하지 않은 베팅액은 400 에러를 반환합니다.
        if (!betAmount || betAmount <= 0) {
            return new Response(JSON.stringify({ success: false, message: "Invalid bet amount." }), {
                headers: { 'Content-Type': 'application/json' },
                status: 400 // Bad Request
            });
        }

        // 2. 9개의 릴에 들어갈 심볼을 무작위로 생성합니다.
        const finalReels = [];
        for (let i = 0; i < (config.gridSize * config.gridSize); i++) {
            const randomIndex = Math.floor(Math.random() * config.symbols.length);
            finalReels.push(config.symbols[randomIndex]);
        }
        
        // 3. 당첨 여부를 판별하고 상금을 계산합니다.
        const result = calculateResult(finalReels, betAmount);
        
        // 4. 만약 당첨되었다면, 실제 토큰을 전송하는 로직을 호출합니다.
        if (result.isWin) {
            // TODO: (Phase 1-B 핵심) 블록체인 상에서 실제 상금을 지급하는 로직 구현 단계
            // - 게임 지갑의 Private Key를 안전하게 로드
            // - 사용자의 지갑으로 'result.payout' 만큼의 CSPIN 토큰을 전송하는 트랜잭션 생성
            // - 트랜잭션을 TON 블록체인 네트워크로 전송
            console.log(`WIN! Payout of ${result.payout} CSPIN to be sent.`);
        }

        // 5. 계산된 게임 결과를 클라이언트로 전송합니다.
        return new Response(JSON.stringify({
            success: true,
            message: "Spin successful!",
            data: result
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({
            success: false,
            message: "An error occurred during the spin."
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}
