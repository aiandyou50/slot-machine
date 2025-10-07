// (EN) English and (KO) Korean comments are mandatory.
import { SignJWT } from 'jose';

// --- (EN) Game Configuration / (KO) 게임 설정 ---
const SYMBOLS = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'DIAMOND'];
const REEL_COUNT = 5;
const ROW_COUNT = 3;

// (EN) TODO: Implement full 20 paylines as per requirements.
// (KO) TODO: 요구사항에 따라 20개의 전체 페이라인을 구현해야 합니다.
const PAYLINES = [
  [[0,0], [0,1], [0,2], [0,3], [0,4]], // (EN) Top row / (KO) 상단 행
  [[1,0], [1,1], [1,2], [1,3], [1,4]], // (EN) Middle row / (KO) 중간 행
  [[2,0], [2,1], [2,2], [2,3], [2,4]], // (EN) Bottom row / (KO) 하단 행
];

// (EN) Payout multipliers for 3, 4, or 5 matching symbols.
// (KO) 3, 4, 5개 심볼이 일치할 때의 배수.
const PAYOUT_TABLE = {
  'CHERRY':  { 3: 5,  4: 10, 5: 20 },
  'LEMON':   { 3: 5,  4: 10, 5: 20 },
  'ORANGE':  { 3: 10, 4: 20, 5: 50 },
  'PLUM':    { 3: 10, 4: 20, 5: 50 },
  'BELL':    { 3: 20, 4: 50, 5: 100 },
  'DIAMOND': { 3: 50, 4: 100, 5: 500 },
};
// --- (EN) End Game Configuration / (KO) 게임 설정 종료 ---

/**
 * (EN) Generates random reel results.
 * (KO) 무작위 릴 결과를 생성합니다.
 * @param {string | null} forceResult - (EN) Can be 'jackpot' to force a win. / (KO) 'jackpot'으로 설정하여 강제 당첨시킬 수 있습니다.
 * @returns {string[][]} - (EN) A 2D array representing the slot reels. / (KO) 슬롯 릴을 나타내는 2D 배열.
 */
function generateReelResults(forceResult = null) {
  if (forceResult === 'jackpot') {
    return Array(REEL_COUNT).fill(null).map(() => Array(ROW_COUNT).fill('DIAMOND'));
  }

  // (EN) TODO: Implement weighted random generation. For now, it's uniform.
  // (KO) TODO: 가중치 기반 무작위 생성을 구현해야 합니다. 현재는 균등 분포입니다.
  return Array(REEL_COUNT).fill(null).map(() =>
    Array(ROW_COUNT).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  );
}

/**
 * (EN) Calculates winnings based on reel results and paylines.
 * (KO) 릴 결과와 페이라인을 기반으로 당첨금을 계산합니다.
 * @param {string[][]} reels - (EN) The generated reel results. / (KO) 생성된 릴 결과.
 * @param {number} betAmount - (EN) The amount of the bet. / (KO) 베팅 금액.
 * @returns {{win: boolean, payout: number, winDetails: object[]}} - (EN) Win status, total payout, and details. / (KO) 당첨 여부, 총 당첨금, 상세 내역.
 */
function calculateWinnings(reels, betAmount) {
  let totalPayout = 0;
  const winDetails = [];

  for (const line of PAYLINES) {
    const symbol = reels[line[0][1]][line[0][0]];
    let matchCount = 1;
    for (let i = 1; i < line.length; i++) {
      if (reels[line[i][1]][line[i][0]] === symbol) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const multiplier = PAYOUT_TABLE[symbol]?.[matchCount] || 0;
      if (multiplier > 0) {
        const payout = betAmount * multiplier;
        totalPayout += payout;
        winDetails.push({ line, symbol, matchCount, payout });
      }
    }
  }

  return { win: totalPayout > 0, payout: totalPayout, winDetails };
}


/**
 * (EN) Handles the /spin API endpoint.
 * (KO) /spin API 엔드포인트를 처리합니다.
 */
export async function onRequestPost(context) {
  try {
    // (EN) For now, we assume the request body is JSON. It might change to handle 'boc'.
    // (KO) 현재는 요청 바디가 JSON이라고 가정합니다. 'boc' 처리를 위해 변경될 수 있습니다.
    const { betAmount, userAddress, devKey } = await context.request.json();
    const { JWT_SECRET, DEV_KEY } = context.env;

    // (EN) TODO: Implement BOC verification and broadcast logic here.
    // (KO) TODO: BOC 검증 및 브로드캐스트 로직을 여기에 구현해야 합니다.
    // (EN) For now, we simulate success.
    // (KO) 현재는 성공했다고 가정합니다.

    // (EN) Handle Developer Mode to force a result.
    // (KO) 개발자 모드를 처리하여 결과를 강제합니다.
    let forceResult = null;
    if (DEV_KEY && devKey === DEV_KEY) {
      forceResult = 'jackpot';
    }

    const reels = generateReelResults(forceResult);
    const { win, payout, winDetails } = calculateWinnings(reels, betAmount);

    let winTicket = null;
    if (win && payout > 0) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const spinId = crypto.randomUUID(); // (EN) Unique ID for this spin / (KO) 해당 스핀의 고유 ID

      winTicket = await new SignJWT({ userAddress, payout, spinId, doubleUpCount: 0 })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('1h') // (EN) Ticket is valid for 1 hour / (KO) 티켓은 1시간 동안 유효합니다.
        .sign(secret);
    }

    const responseBody = {
      reels,
      win,
      payout,
      winDetails,
      winTicket,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}