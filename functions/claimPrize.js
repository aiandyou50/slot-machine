// (EN) English and (KO) Korean comments are mandatory.
import { jwtVerify } from 'jose';

/**
 * (EN) Handles the /claimPrize API endpoint.
 * (KO) /claimPrize API 엔드포인트를 처리합니다.
 * @param {object} context - The Cloudflare Functions context object.
 * @returns {Response} - The response object.
 */
export async function onRequestPost(context) {
  try {
    const { winTicket } = await context.request.json();
    const { JWT_SECRET, GAME_WALLET_MNEMONIC } = context.env;

    if (!winTicket) {
      return new Response(JSON.stringify({ success: false, message: 'Missing winTicket.' }), { status: 400 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    // (EN) Verify the JWT "win ticket". This will throw an error if the token is invalid or expired.
    // (KO) JWT "당첨 티켓"을 검증합니다. 토큰이 유효하지 않거나 만료되면 오류가 발생합니다.
    const { payload } = await jwtVerify(winTicket, secret, {
      issuer: 'urn:candlespinner:server',
      audience: 'urn:candlespinner:client',
    });

    const { userAddress, payout } = payload;

    // (EN) TODO: Implement the actual on-chain transaction using the @ton/ton library.
    // (KO) TODO: @ton/ton 라이브러리를 사용하여 실제 온체인 트랜잭션을 구현해야 합니다.
    // (EN) This involves using the GAME_WALLET_MNEMONIC to send `payout` amount of CSPIN tokens to `userAddress`.
    // (KO) GAME_WALLET_MNEMONIC을 사용하여 `userAddress`로 `payout` 만큼의 CSPIN 토큰을 전송하는 과정이 포함됩니다.
    console.log(`(EN) Simulating payout of ${payout} CSPIN to ${userAddress}.`);
    // (KO) ${payout} CSPIN을 ${userAddress}에게 지급하는 것을 시뮬레이션합니다.

    const transactionResult = {
      // (EN) Placeholder for the actual transaction hash.
      // (KO) 실제 트랜잭션 해시를 위한 플레이스홀더.
      hash: `simulated_tx_${crypto.randomUUID()}`,
      amount: payout,
      to: userAddress,
    };

    return new Response(JSON.stringify({
      success: true,
      message: '(EN) Prize claimed successfully. / (KO) 상금이 성공적으로 지급되었습니다.',
      transaction: transactionResult,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // (EN) Handle JWT errors (e.g., expired, invalid signature).
    // (KO) JWT 오류(예: 만료, 잘못된 서명)를 처리합니다.
    let message = 'An unexpected error occurred.';
    if (error.code === 'ERR_JWT_EXPIRED') {
      message = '(EN) The win ticket has expired. / (KO) 당첨 티켓이 만료되었습니다.';
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      message = '(EN) Invalid win ticket signature. / (KO) 잘못된 당첨 티켓 서명입니다.';
    } else {
      message = error.message;
    }

    return new Response(JSON.stringify({ success: false, message, details: error.code }), {
      status: 401, // (EN) Unauthorized or bad token / (KO) 인증되지 않았거나 잘못된 토큰
      headers: { 'Content-Type': 'application/json' },
    });
  }
}