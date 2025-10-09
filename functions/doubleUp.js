import { SignJWT, jwtVerify } from 'jose';

// (KO) 최대 더블업 횟수 상수
// (EN) Constant for the maximum number of double-ups.
const MAX_DOUBLE_UP = 5;

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // (KO) Fail-Safe: 환경 변수가 설정되지 않았으면 즉시 실패
    // (EN) Fail-Safe: Fail immediately if environment variables are not set
    if (!env.JWT_SECRET || !env.USED_TICKETS) {
      console.error(
        'CRITICAL: JWT_SECRET or USED_TICKETS KV namespace is not set.'
      );
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'CONFIGURATION_ERROR',
          message: 'Server configuration is incomplete.',
        }),
        { status: 500 }
      );
    }
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

    const { winTicket, choice } = await request.json();

    if (!winTicket || !choice || !['red', 'black'].includes(choice)) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'INVALID_REQUEST',
          message: "winTicket and choice ('red' or 'black') are required.",
        }),
        { status: 400 }
      );
    }

    // (KO) JWT 티켓 검증
    // (EN) Verify the JWT ticket
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(
        winTicket,
        JWT_SECRET,
        {
          issuer: 'urn:candlespinner:server',
          audience: 'urn:candlespinner:client',
        }
      );
      payload = verifiedPayload;
    } catch (err) {
      if (err.code === 'ERR_JWT_EXPIRED') {
        return new Response(
          JSON.stringify({
            success: false,
            errorCode: 'TICKET_EXPIRED',
            message: 'This prize ticket has expired.',
          }),
          { status: 401 }
        );
      }
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'INVALID_TICKET',
          message: 'The provided ticket is invalid.',
        }),
        { status: 401 }
      );
    }

    const ticketId = payload.spinId;
    if (!ticketId) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'INVALID_TICKET_PAYLOAD',
          message: "Ticket payload is missing 'spinId'.",
        }),
        { status: 400 }
      );
    }

    // (KO) 티켓 재사용 방지 로직
    // (EN) Ticket reuse prevention logic
    const isUsed = await env.USED_TICKETS.get(ticketId);
    if (isUsed) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'TICKET_ALREADY_USED',
          message: 'This prize ticket has already been used.',
        }),
        { status: 409 }
      );
    }

    // (KO) 더블업 횟수 확인
    // (EN) Check double-up count
    const doubleUpCount = (payload.doubleUpCount || 0) + 1;
    if (doubleUpCount > MAX_DOUBLE_UP) {
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'MAX_DOUBLE_UP_REACHED',
          message: 'Maximum double-up limit reached.',
        }),
        { status: 403 }
      );
    }

    // (KO) 이전 티켓을 사용 처리 (성공하든 실패하든 이전 티켓은 무효화)
    // (EN) Mark the previous ticket as used (the old ticket is invalidated regardless of success or failure)
    await env.USED_TICKETS.put(ticketId, 'true', { expirationTtl: 3600 });

    // (KO) 50% 확률로 더블업 성공/실패 결정
    // (EN) Determine double-up success/failure with 50% probability
    const isWin = Math.random() < 0.5;

    if (isWin) {
      const newPayout = payload.payout * 2;
      // (KO) 성공 시, 새로운 티켓 발급
      // (EN) On success, issue a new ticket
      const newTicket = await new SignJWT({
        ...payload,
        payout: newPayout,
        doubleUpCount,
        spinId: crypto.randomUUID(),
      }) // (KO) 새로운 spinId 생성 (EN) Generate new spinId
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('5m')
        .sign(JWT_SECRET);

      return new Response(
        JSON.stringify({ success: true, win: true, newPayout, newTicket }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      // (KO) 실패 시, 상금은 0이 되고 티켓은 무효화됨 (이미 KV에 저장됨)
      // (EN) On failure, the prize is lost and the ticket is invalidated (already stored in KV)
      return new Response(
        JSON.stringify({ success: true, win: false, newPayout: 0 }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: e.message,
      }),
      { status: 500 }
    );
  }
}
