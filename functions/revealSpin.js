import { SignJWT } from 'jose';
import { Cell, loadMessage, fromNano, Address } from '@ton/core';

// (KO) 이 함수는 Commit-Reveal 스킴의 'Reveal' 단계를 처리합니다.
// (EN) This function handles the 'Reveal' phase of the Commit-Reveal scheme.

const GAME_WALLET_ADDRESS = 'UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd';
const SYMBOLS = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'DIAMOND'];

/**
 * (KO) 16진수 문자열로 변환하는 헬퍼 함수
 * (EN) Helper function to convert an ArrayBuffer to a hex string.
 * @param {ArrayBuffer} buffer - 변환할 ArrayBuffer
 * @returns {string} 16진수 문자열
 */
function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * (KO) 시드 기반의 결정론적 난수 생성기(PRNG)
 * (EN) A deterministic Pseudo-Random Number Generator (PRNG) based on a seed.
 * @param {string} seed - 난수 생성을 위한 시드
 * @returns {() => number} 0과 1 사이의 부동 소수점을 반환하는 함수
 */
function createDeterministicRandom(seed) {
  let h = 1779033703,
    u = 3735928559,
    v = 2891695549,
    w = 1025202367;
  for (let i = 0, k; i < seed.length; i++) {
    k = seed.charCodeAt(i);
    h = (h ^ k) * 16777619;
    u = (u ^ k) * 16777619;
    v = (v ^ k) * 16777619;
    w = (w ^ k) * 16777619;
  }
  return function () {
    h = (h ^ (h << 13)) | 0;
    h = h >>> 17;
    h = (h ^ (h << 5)) | 0;
    u = (u + v) | 0;
    v = (v + w) | 0;
    w = (w + h) | 0;
    h = (h + u) | 0;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * (KO) 시드 기반으로 릴 결과를 생성합니다. Math.random()을 사용하지 않습니다.
 * (EN) Generates reel results based on a seed, without using Math.random().
 * @param {string} serverSeed - 서버에서 생성된 시드
 * @param {string} clientSeed - 클라이언트에서 생성된 시드
 * @returns {string[][]} 2D 배열의 릴 결과
 */
function generateReels(serverSeed, clientSeed) {
  const combinedSeed = `${serverSeed}-${clientSeed}`;
  const random = createDeterministicRandom(combinedSeed);

  return Array(5)
    .fill(null)
    .map(() =>
      Array(3)
        .fill(null)
        .map(() => SYMBOLS[Math.floor(random() * SYMBOLS.length)])
    );
}

/**
 * (KO) 페이라인을 기반으로 당첨금을 계산합니다. (간단한 예시)
 * (EN) Calculates payout based on paylines. (Simple example)
 * @param {string[][]} reels - 릴 결과
 * @returns {number} 당첨 배수
 */
function calculatePayoutMultiplier(reels) {
  // (KO) 첫 번째 라인에 다이아몬드 3개가 나오면 10배 지급
  // (EN) 10x payout for three diamonds on the first line
  if (
    reels[0][0] === 'DIAMOND' &&
    reels[1][0] === 'DIAMOND' &&
    reels[2][0] === 'DIAMOND'
  ) {
    return 10;
  }
  return 0;
}

/**
 * (KO) 온체인 트랜잭션을 검증합니다.
 * (EN) Verifies the on-chain transaction.
 * @param {string} boc - Base64 인코딩된 BOC
 * @param {number} betAmount - 베팅 금액
 * @param {string} userAddress - 사용자 지갑 주소
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
async function verifyTransaction(boc, betAmount, userAddress) {
  try {
    const messageCell = Cell.fromBoc(Buffer.from(boc, 'base64'))[0];
    const message = loadMessage(messageCell);

    if (message.info.src.toString() !== Address.parse(userAddress).toString()) {
      throw new Error('Sender address does not match user address.');
    }

    const bodySlice = message.body.beginParse();
    const op = bodySlice.loadUint(32);
    if (op !== 0x0f8a7ea5) { // Jetton transfer op-code
      throw new Error(`Invalid operation code. Expected 0x0f8a7ea5, got ${op.toString(16)}`);
    }

    bodySlice.loadUint(64); // query_id
    const jettonAmount = fromNano(bodySlice.loadCoins());
    const toAddress = bodySlice.loadAddress();

    if (jettonAmount !== betAmount.toString()) {
      throw new Error(`Bet amount mismatch. Expected ${betAmount}, got ${jettonAmount}`);
    }

    if (toAddress.toString() !== Address.parse(GAME_WALLET_ADDRESS).toString()) {
      throw new Error('Invalid recipient address.');
    }

    return { isValid: true };
  } catch (error) {
    console.error('BOC verification failed:', error);
    return { isValid: false, error: error.message };
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { JWT_SECRET, SPIN_COMMITMENTS } = env;

    if (!JWT_SECRET || !SPIN_COMMITMENTS) {
      console.error('CRITICAL: JWT_SECRET or SPIN_COMMITMENTS are not set.');
      return new Response(JSON.stringify({ success: false, errorCode: 'CONFIGURATION_ERROR' }), { status: 500 });
    }

    const body = await request.json();
    const { commitment, clientSeed, boc, betAmount, userAddress } = body;

    if (!commitment || !clientSeed || !boc || !betAmount || !userAddress) {
      return new Response(JSON.stringify({ success: false, errorCode: 'INVALID_REQUEST' }), { status: 400 });
    }

    const serverSeed = await SPIN_COMMITMENTS.get(commitment);
    if (!serverSeed) {
      return new Response(JSON.stringify({ success: false, errorCode: 'COMMITMENT_NOT_FOUND' }), { status: 400 });
    }

    // (KO) 사용된 commitment는 즉시 삭제하여 재사용을 방지합니다.
    // (EN) Immediately delete the used commitment to prevent reuse.
    await SPIN_COMMITMENTS.delete(commitment);

    // (KO) 서버 시드를 다시 해시하여 받은 commitment와 일치하는지 확인합니다.
    // (EN) Re-hash the server seed to verify it matches the received commitment.
    const encoder = new TextEncoder();
    const data = encoder.encode(serverSeed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const rehashedCommitment = bufferToHex(hashBuffer);

    if (rehashedCommitment !== commitment) {
        console.error('CRITICAL: Commitment mismatch! Potential tampering.');
        return new Response(JSON.stringify({ success: false, errorCode: 'COMMITMENT_MISMATCH' }), { status: 500 });
    }

    const { isValid, error } = await verifyTransaction(boc, betAmount, userAddress);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, errorCode: 'INVALID_TRANSACTION', message: error }), { status: 400 });
    }

    const reels = generateReels(serverSeed, clientSeed);
    const winMultiplier = calculatePayoutMultiplier(reels);
    const payout = betAmount * winMultiplier;
    const win = payout > 0;

    let responseData = { success: true, reels, win, payout, serverSeed };

    if (win) {
      const winTicket = await new SignJWT({ payout, spinId: crypto.randomUUID() })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userAddress)
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('5m')
        .sign(new TextEncoder().encode(JWT_SECRET));

      responseData.winTicket = winTicket;
    }

    return new Response(JSON.stringify(responseData), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('Error in /revealSpin:', e);
    return new Response(JSON.stringify({ success: false, errorCode: 'INTERNAL_SERVER_ERROR', message: e.message }), { status: 500 });
  }
}