import * as jose from 'jose';

/**
 * Korean: 상금 지급 트랜잭션을 전송합니다. (현재는 시뮬레이션)
 * English: Sends the prize payout transaction. (Currently a simulation)
 * @param {object} context - Cloudflare context, contains environment variables.
 * @param {string} recipientAddress - The user's wallet address.
 * @param {number} payoutAmount - The amount of CSPIN to send.
 * @returns {Promise<boolean>} - True if successful.
 */
async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
    // Korean: 실제 트랜잭션 로직은 여기에 구현됩니다.
    // English: The actual transaction logic will be implemented here.
    // Korean: 지금은 환경 변수 확인 및 성공 로그 출력으로 시뮬레이션합니다.
    // English: For now, we simulate by checking environment variables and logging success.

    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) {
        throw new Error("CRITICAL: GAME_WALLET_MNEMONIC is not set in environment.");
    }

    console.log(`[SIMULATION] Prize claim of ${payoutAmount} CSPIN to ${recipientAddress} sent successfully.`);

    // Korean: 실제 구현에서는 @ton/ton 라이브러리를 사용하여 트랜잭션을 전송합니다.
    // English: In a real implementation, you would use the @ton/ton library to send the transaction.

    return true;
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

        // Korean: JWT 티켓을 검증합니다. 실패 시 여기서 에러가 발생합니다.
        // English: Verify the JWT ticket. An error will be thrown here on failure.
        const { payload } = await jose.jwtVerify(winTicket, secretKey, {
            algorithms: ['HS256'],
        });

        const { userAddress, payout } = payload;

        if (!userAddress || !payout || payout <= 0) {
            return new Response(JSON.stringify({ success: false, message: "Invalid ticket payload." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Korean: 상금 지급 트랜잭션 전송 (시뮬레이션)
        // English: Send payout transaction (simulation)
        await sendPayoutTransaction(context, userAddress, payout);

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully claimed ${payout} tokens.`
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Error in /claimPrize function:", error);
        if (error.code === 'ERR_JWT_EXPIRED') {
            return new Response(JSON.stringify({ success: false, message: "Win ticket has expired." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            return new Response(JSON.stringify({ success: false, message: "Invalid win ticket signature." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, message: `Server Error: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}