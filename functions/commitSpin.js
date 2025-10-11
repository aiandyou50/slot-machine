// (KO) 이 함수는 Commit-Reveal 스킴의 'Commit' 단계를 처리합니다.
// (EN) This function handles the 'Commit' phase of the Commit-Reveal scheme.

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

export async function onRequestGet(context) {
  try {
    const { env } = context;

    // (KO) KV 네임스페이스가 바인딩되었는지 확인합니다.
    // (EN) Check if the KV namespace is bound.
    if (!env.SPIN_COMMITMENTS) {
      console.error(
        'CRITICAL: SPIN_COMMITMENTS KV namespace is not bound.'
      );
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 'CONFIGURATION_ERROR',
          message: 'Server configuration for KV is incomplete.',
        }),
        { status: 500 }
      );
    }

    // (KO) 암호학적으로 안전한 서버 시드를 생성합니다.
    // (EN) Generate a cryptographically secure server seed.
    const serverSeed = crypto.randomUUID();

    // (KO) 서버 시드를 SHA-256으로 해시하여 commitment를 생성합니다.
    // (EN) Create a commitment by hashing the server seed with SHA-256.
    const encoder = new TextEncoder();
    const data = encoder.encode(serverSeed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const commitment = bufferToHex(hashBuffer);

    // (KO) commitment를 키로, 서버 시드를 값으로 KV에 5분(300초) TTL로 저장합니다.
    // (EN) Store the server seed in KV with the commitment as the key, with a 5-minute (300 seconds) TTL.
    await env.SPIN_COMMITMENTS.put(commitment, serverSeed, {
      expirationTtl: 300,
    });

    // (KO) commitment를 클라이언트에 반환합니다.
    // (EN) Return the commitment to the client.
    return new Response(
      JSON.stringify({
        success: true,
        commitment: commitment,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    console.error('Error in /commitSpin:', e);
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