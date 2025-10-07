import * as jose from 'jose';

// Korean: 최대 더블업 횟수 제한
// English: Maximum double-up count limit
const MAX_DOUBLE_UP_COUNT = 5;

/**
 * Korean: 새로운 당첨 정보를 담은 JWT 티켓을 생성합니다.
 * English: Creates a new JWT ticket with the updated win information.
 */
async function createWinTicket(payload, secret) {
    const secretKey = new TextEncoder().encode(secret);
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m') // 새 티켓에도 5분의 유효기간 부여 (Issue a new ticket with a fresh 5-minute validity)
        .sign(secretKey);
}

export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const { winTicket } = await context.request.json();

        if (!winTicket) {
            return new Response(JSON.stringify({ success: false, message: "Missing win ticket." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const jwtSecret = context.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("CRITICAL: JWT_SECRET is not set in environment.");
        }
        const secretKey = new TextEncoder().encode(jwtSecret);

        // Korean: JWT 티켓 검증
        // English: Verify the JWT ticket
        const { payload } = await jose.jwtVerify(winTicket, secretKey, {
            algorithms: ['HS256'],
        });

        const { userAddress, payout, betAmount, doubleUpCount } = payload;

        // Korean: 최대 더블업 횟수 확인
        // English: Check for maximum double-up count
        if (doubleUpCount >= MAX_DOUBLE_UP_COUNT) {
            return new Response(JSON.stringify({ success: false, outcome: 'limit_reached', message: "Maximum double up limit reached." }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Korean: 50% 확률로 성공/실패 결정
        // English: Determine win/loss with 50% probability
        const isWin = Math.random() < 0.5;

        if (isWin) {
            // --- 성공 (WIN) ---
            const newPayout = payout * 2;
            const newTicketPayload = {
                userAddress,
                payout: newPayout,
                betAmount,
                doubleUpCount: doubleUpCount + 1,
            };
            const newTicket = await createWinTicket(newTicketPayload, jwtSecret);

            return new Response(JSON.stringify({
                success: true,
                outcome: 'win',
                newPayout: newPayout,
                newTicket: newTicket,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } else {
            // --- 실패 (LOSS) ---
            return new Response(JSON.stringify({
                success: true,
                outcome: 'loss',
                payout: 0,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error("Error in /doubleUp function:", error);
        if (error.code === 'ERR_JWT_EXPIRED') {
            return new Response(JSON.stringify({ success: false, message: "Win ticket has expired." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            return new Response(JSON.stringify({ success: false, message: "Invalid win ticket signature." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, message: `Server Error: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}