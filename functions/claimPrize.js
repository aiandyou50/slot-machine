import { jwtVerify } from 'jose';
import TonWeb from 'tonweb';

// (KO) 환경 변수에서 민감한 정보를 가져옵니다.
// (EN) Source sensitive information from environment variables.
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-super-secret-key-for-local-dev');
const GAME_WALLET_SEED = process.env.GAME_WALLET_SEED; // (KO) 게임 지갑의 시드 구문 (EN) Seed phrase for the game wallet

/**
 * (KO) 온체인 트랜잭션을 전송하고 해시를 반환하는 함수
 * (EN) Function to send an on-chain transaction and return the hash
 * @param {string} userAddress - (KO) 상금을 받을 사용자 주소 (EN) The user's address to receive the prize.
 * @param {number} amount - (KO) 전송할 토큰의 양 (EN) The amount of tokens to send.
 * @returns {Promise<string>} The transaction hash.
 */
async function sendTransaction(userAddress, amount) {
  // (KO) TODO: 이 부분은 실제 tonweb을 사용하여 트랜잭션을 생성하고 전송하는 로직으로 구현해야 합니다.
  // (KO) 게임 지갑의 잔액 확인 로직도 포함되어야 합니다.
  // (EN) TODO: This section must be implemented using tonweb to create and send the transaction.
  // (EN) It should also include logic to check the game wallet's balance.

  if (!GAME_WALLET_SEED) {
    throw new Error("GAME_WALLET_SEED is not configured in environment variables.");
  }

  // (KO) 아래는 시뮬레이션된 트랜잭션 해시입니다.
  // (EN) The following is a simulated transaction hash.
  console.log(`Sending ${amount} CSPIN to ${userAddress}...`);
  const simulatedTxHash = `simulated_tx_${crypto.randomUUID()}`;
  console.log(`Transaction successful with hash: ${simulatedTxHash}`);

  return simulatedTxHash;
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { winTicket } = await request.json();

    if (!winTicket) {
      return new Response(JSON.stringify({ success: false, message: "INVALID_TICKET" }), { status: 400 });
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
    // const ticketId = payload.spinId;
    // const isUsed = await env.USED_TICKETS.get(ticketId);
    // if (isUsed) {
    //   return new Response(JSON.stringify({ success: false, message: "TICKET_ALREADY_USED" }), { status: 409 });
    // }

    const { payout, sub: userAddress } = payload; // (KO) 'sub' 클레임에 사용자 주소가 있다고 가정 (EN) Assuming user address is in 'sub' claim

    // (KO) 실제 토큰 전송 실행
    // (EN) Execute the actual token transfer
    const txHash = await sendTransaction(userAddress, payout);

    // (KO) TODO: 티켓 사용 처리
    // (EN) TODO: Mark the ticket as used
    // await env.USED_TICKETS.put(ticketId, "true", { expirationTtl: 3600 }); // (KO) 1시간 후 자동 삭제 (EN) Auto-delete after 1 hour

    return new Response(JSON.stringify({
      success: true,
      transaction: {
        txHash: txHash,
        amount: payout,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error(e);
    // (KO) 게임 지갑 잔액 부족 등 특정 오류 처리
    // (EN) Handle specific errors like insufficient funds in the game wallet
    if (e.message.includes("insufficient funds")) { // (KO) 실제 오류 메시지에 맞게 수정 필요 (EN) Adjust to match the actual error message
        return new Response(JSON.stringify({ success: false, message: 'INSUFFICIENT_FUNDS' }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}