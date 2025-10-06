/**
 * Cloudflare Worker for Double Up Minigame
 * (더블업 미니게임을 위한 클라우드플레어 워커)
 *
 * @version 2.2.0 (Backend Logic)
 * @date 2025-10-05
 * @author Jules (AI Assistant)
 *
 * @description This endpoint handles the Double Up logic. It validates a win ticket,
 * determines the outcome of the gamble, and issues a new ticket on success.
 * (이 엔드포인트는 더블업 로직을 처리합니다. 당첨 티켓을 검증하고,
 * 도박의 결과를 결정하며, 성공 시 새로운 티켓을 발급합니다.)
 */

import * as jose from 'jose';

const MAX_DOUBLE_UP_COUNT = 5;

async function createWinTicket(payload, secret) {
    const secretKey = new TextEncoder().encode(secret);
    const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m') // Issue a new ticket with a fresh 5-minute validity
        .sign(secretKey);
    return jwt;
}

export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const requestData = await context.request.json();
        const { winTicket, choice } = requestData;

        if (!winTicket || !choice || !['red', 'black'].includes(choice)) {
            return new Response(JSON.stringify({ success: false, message: "Missing or invalid parameters." }), { status: 400 });
        }

        const jwtSecret = context.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("CRITICAL: JWT_SECRET is not set.");
        }
        const secretKey = new TextEncoder().encode(jwtSecret);

        const { payload } = await jose.jwtVerify(winTicket, secretKey, {
            algorithms: ['HS256'],
        });

        const { userAddress, payout, betAmount, doubleUpCount } = payload;

        if (doubleUpCount >= MAX_DOUBLE_UP_COUNT) {
            return new Response(JSON.stringify({ success: false, message: "Maximum double up limit reached." }), { status: 403 });
        }

        // Determine the outcome
        const outcome = Math.random() < 0.5 ? 'red' : 'black';

        if (choice === outcome) {
            // WIN
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
            }), { status: 200 });

        } else {
            // LOSS
            return new Response(JSON.stringify({
                success: true,
                outcome: 'loss',
                payout: 0,
            }), { status: 200 });
        }

    } catch (error) {
        console.error("Error in /double-up function:", error);
        if (error.code === 'ERR_JWT_EXPIRED') {
            return new Response(JSON.stringify({ success: false, message: "Win ticket has expired." }), { status: 401 });
        }
        if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            return new Response(JSON.stringify({ success: false, message: "Invalid win ticket signature." }), { status: 401 });
        }
        return new Response(JSON.stringify({ success: false, message: `General Error: ${error.message}` }), { status: 500 });
    }
}