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
    const { winTicket, choice } = await context.request.json();
    const { JWT_SECRET } = context.env;

    if (!winTicket || !choice) {
      return new Response(JSON.stringify({ success: false, message: 'Missing winTicket or choice.' }), { status: 400 });
    }
    if (choice !== 'red' && choice !== 'black') {
      return new Response(JSON.stringify({ success: false, message: 'Invalid choice. Must be "red" or "black".' }), { status: 400 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(winTicket, secret, {
      issuer: 'urn:candlespinner:server',
      audience: 'urn:candlespinner:client',
    });

    const { userAddress, payout, spinId, doubleUpCount = 0 } = payload;

    if (doubleUpCount >= MAX_DOUBLE_UP_COUNT) {
      return new Response(JSON.stringify({
        success: false,
        message: `(EN) Maximum double-up limit (${MAX_DOUBLE_UP_COUNT}) reached. / (KO) 최대 더블업 한도(${MAX_DOUBLE_UP_COUNT}회)에 도달했습니다.`
      }), { status: 403 });
    }

    // (EN) Determine the winning color based on the spinId and double-up count for deterministic results.
    // (KO) 스핀 ID와 더블업 횟수를 기반으로 승리 색상을 결정하여 결과의 일관성을 보장합니다.
    const combinedString = `${spinId}-${doubleUpCount}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combinedString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const winningColor = hashArray[0] % 2 === 0 ? 'red' : 'black';

    const isWin = choice === winningColor;

    if (isWin) {
      const newPayout = payout * 2;
      const newDoubleUpCount = doubleUpCount + 1;

      const newTicket = await new SignJWT({ userAddress, payout: newPayout, spinId, doubleUpCount: newDoubleUpCount })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('1h')
        .sign(secret);

      return new Response(JSON.stringify({
        success: true,
        win: true,
        message: `(EN) Double Up successful! New payout: ${newPayout} / (KO) 더블업 성공! 새로운 상금: ${newPayout}`,
        newPayout: newPayout,
        newTicket: newTicket,
      }), { headers: { 'Content-Type': 'application/json' } });

    } else {
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