// (EN) English and (KO) Korean comments are mandatory.
import { jwtVerify, SignJWT } from 'jose';

const MAX_DOUBLE_UP_COUNT = 5;

/**
 * (EN) Handles the /doubleUp API endpoint.
 * (KO) /doubleUp API 엔드포인트를 처리합니다.
 * @param {object} context - The Cloudflare Functions context object.
 * @returns {Response} - The response object.
 */
export async function onRequestPost(context) {
  try {
    const { winTicket } = await context.request.json();
    const { JWT_SECRET } = context.env;

    if (!winTicket) {
      return new Response(JSON.stringify({ success: false, message: 'Missing winTicket.' }), { status: 400 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    // (EN) Verify the incoming ticket.
    // (KO) 수신된 티켓을 검증합니다.
    const { payload } = await jwtVerify(winTicket, secret, {
      issuer: 'urn:candlespinner:server',
      audience: 'urn:candlespinner:client',
    });

    const { userAddress, payout, doubleUpCount = 0 } = payload;

    // (EN) Check if the maximum double-up limit has been reached.
    // (KO) 최대 더블업 한도에 도달했는지 확인합니다.
    if (doubleUpCount >= MAX_DOUBLE_UP_COUNT) {
      return new Response(JSON.stringify({
        success: false,
        message: `(EN) Maximum double-up limit (${MAX_DOUBLE_UP_COUNT}) reached. / (KO) 최대 더블업 한도(${MAX_DOUBLE_UP_COUNT}회)에 도달했습니다.`
      }), { status: 403 });
    }

    // (EN) Perform a 50/50 random chance.
    // (KO) 50/50 확률의 무작위 추첨을 수행합니다.
    const isWin = Math.random() < 0.5;

    if (isWin) {
      // (EN) Success: Issue a new ticket with double the payout.
      // (KO) 성공: 두 배의 상금이 걸린 새 티켓을 발급합니다.
      const newPayout = payout * 2;
      const newDoubleUpCount = doubleUpCount + 1;
      const spinId = payload.spinId || crypto.randomUUID();

      const newTicket = await new SignJWT({ userAddress, payout: newPayout, spinId, doubleUpCount: newDoubleUpCount })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('1h') // (EN) The new ticket is also valid for 1 hour. / (KO) 새 티켓 또한 1시간 동안 유효합니다.
        .sign(secret);

      return new Response(JSON.stringify({
        success: true,
        win: true,
        message: `(EN) Double Up successful! New payout: ${newPayout} / (KO) 더블업 성공! 새로운 상금: ${newPayout}`,
        newPayout: newPayout,
        newTicket: newTicket,
      }), { headers: { 'Content-Type': 'application/json' } });

    } else {
      // (EN) Failure: The prize is lost.
      // (KO) 실패: 상금을 잃었습니다.
      return new Response(JSON.stringify({
        success: true,
        win: false,
        message: '(EN) Double Up failed. You lost the prize. / (KO) 더블업에 실패하여 상금을 잃었습니다.',
        newPayout: 0,
        newTicket: null,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    // (EN) Handle JWT and other errors.
    // (KO) JWT 및 기타 오류를 처리합니다.
    let message = 'An unexpected error occurred.';
    if (error.code === 'ERR_JWT_EXPIRED') {
      message = '(EN) The win ticket has expired. / (KO) 당첨 티켓이 만료되었습니다.';
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      message = '(EN) Invalid win ticket signature. / (KO) 잘못된 당첨 티켓 서명입니다.';
    } else {
      message = error.message;
    }

    return new Response(JSON.stringify({ success: false, message, details: error.code }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}