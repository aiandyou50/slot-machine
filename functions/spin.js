import { SignJWT } from 'jose';

// (KO) JWT 서명에 사용할 비밀 키. 이는 Cloudflare 환경 변수에서 가져와야 합니다.
// (EN) The secret key to sign the JWT. This should be sourced from Cloudflare environment variables.
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-super-secret-key-for-local-dev');
const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";

// (KO) 슬롯머신 심볼과 가중치. 실제 게임에서는 더 복잡한 로직이 필요합니다.
// (EN) Slot machine symbols and weights. A real game would require more complex logic.
const SYMBOLS = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'DIAMOND'];
const WEIGHTS = { 'CHERRY': 50, 'LEMON': 40, 'ORANGE': 30, 'PLUM': 20, 'BELL': 10, 'DIAMOND': 5 };

/**
 * (KO) 가중치를 기반으로 랜덤 심볼을 선택하는 함수
 * (EN) Function to select a random symbol based on weights
 * @returns {string} A random symbol.
 */
function getWeightedRandomSymbol() {
  const totalWeight = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  for (const symbol in WEIGHTS) {
    if (random < WEIGHTS[symbol]) {
      return symbol;
    }
    random -= WEIGHTS[symbol];
  }
  return SYMBOLS[0];
}

/**
 * (KO) 5x3 릴 결과를 생성하는 함수
 * (EN) Function to generate 5x3 reel results
 * @returns {Array<Array<string>>} The 5x3 reel grid.
 */
function generateReels() {
  const reels = Array(5).fill(null).map(() => Array(3).fill(null));
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      reels[i][j] = getWeightedRandomSymbol();
    }
  }
  return reels;
}

/**
 * (KO) 당첨금을 계산하는 함수 (단순화된 예시)
 * (EN) Function to calculate winnings (simplified example)
 * @param {Array<Array<string>>} reels - The reel grid.
 * @returns {number} The payout amount.
 */
function calculatePayout(reels) {
  // (KO) 예시: 첫 번째 라인에 다이아몬드 3개 이상이면 100배
  // (EN) Example: 3 or more diamonds on the first line pays 100x
  if (reels[0][0] === 'DIAMOND' && reels[1][0] === 'DIAMOND' && reels[2][0] === 'DIAMOND') {
    return 100;
  }
  // (KO) 페이라인 로직 추가 필요
  // (EN) Payline logic needs to be added
  return 0;
}


export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { boc, devKey } = await request.json();

    // (KO) TODO: 실제 프로덕션에서는 BOC를 검증하여 트랜잭션이 실제로 발생했는지,
    // (KO) 금액과 수신자가 올바른지 확인해야 합니다.
    // (EN) TODO: In a real production environment, the BOC must be verified to ensure
    // (EN) the transaction actually occurred with the correct amount and recipient.
    if (!boc) {
      return new Response(JSON.stringify({ error: "INVALID_REQUEST", details: "BOC is missing." }), { status: 400 });
    }

    let reels, payout;

    // (KO) 개발자 모드: 특정 결과를 강제합니다.
    // (EN) Developer Mode: Force a specific result.
    if (devKey && devKey === (env.DEV_KEY || process.env.DEV_KEY)) {
      reels = [
        ["DIAMOND", "DIAMOND", "DIAMOND"],
        ["DIAMOND", "DIAMOND", "DIAMOND"],
        ["DIAMOND", "DIAMOND", "DIAMOND"],
        ["CHERRY", "CHERRY", "CHERRY"],
        ["BELL", "BELL", "BELL"]
      ];
      payout = 500; // Jackpot
    } else {
      reels = generateReels();
      payout = calculatePayout(reels);
    }

    const win = payout > 0;

    if (win) {
      // (KO) 당첨 시, 5분 유효한 JWT 당첨 티켓을 생성합니다.
      // (EN) If it's a win, create a JWT win ticket valid for 5 minutes.
      const winTicket = await new SignJWT({ payout, spinId: crypto.randomUUID() })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('5m')
        .sign(JWT_SECRET);

      return new Response(JSON.stringify({ reels, win, payout, winTicket }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ reels, win, payout }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "INTERNAL_SERVER_ERROR", details: e.message }), { status: 500 });
  }
}