import { SignJWT, jwtVerify } from 'jose';

// (KO) 최대 더블업 횟수 상수
// (EN) Constant for the maximum number of double-ups.
const MAX_DOUBLE_UP = 5;

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // (KO) Fail-Safe: JWT 시크릿 키가 설정되지 않았으면 즉시 실패
    // (EN) Fail-Safe: Fail immediately if JWT_SECRET is not set
    if (!env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET environment variable is not set.");
      return new Response(JSON.stringify({ success: false, message: "CONFIGURATION_ERROR" }), { status: 500 });
    }
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

    const { winTicket, choice } = await request.json();

    if (!winTicket || !choice || !['red', 'black'].includes(choice)) {
      return new Response(JSON.stringify({ success: false, message: "INVALID_REQUEST" }), { status: 400 });
    }

    // (KO) JWT 티켓 검증
    // (EN) Verify the JWT ticket
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(winTicket, JWT_SECRET, {
        issuer: 'urn:candlespinner:server',
        audience: 'urn:candlespinner:client',
      });
      payload = verifiedPayload;
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: "INVALID_TICKET" }), { status: 401 });
    }

    // (KO) TODO: 티켓 재사용 방지 로직 구현 (Cloudflare KV 사용)
    // (EN) TODO: Implement ticket reuse prevention logic (using Cloudflare KV)

    const doubleUpCount = (payload.doubleUpCount || 0) + 1;

    if (doubleUpCount > MAX_DOUBLE_UP) {
        return new Response(JSON.stringify({ success: false, message: "MAX_DOUBLE_UP_REACHED" }), { status: 403 });
    }

    // (KO) 50% 확률로 더블업 성공/실패 결정
    // (EN) Determine double-up success/failure with 50% probability
    const isWin = Math.random() < 0.5;

    if (isWin) {
      const newPayout = payload.payout * 2;
      const newTicket = await new SignJWT({ ...payload, payout: newPayout, doubleUpCount })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(JWT_SECRET);

      return new Response(JSON.stringify({ success: true, win: true, newPayout, newTicket }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      // (KO) TODO: 실패 시 티켓을 무효화하는 로직 추가 (예: KV에 저장)
      // (EN) TODO: Add logic to invalidate the ticket on failure (e.g., by storing in KV)
      return new Response(JSON.stringify({ success: true, win: false, newPayout: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}