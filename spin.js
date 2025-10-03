/**
 * POST /spin
 * 이 함수는 사용자가 SPIN 버튼을 눌렀을 때 호출되는 서버리스 백엔드입니다.
 * Cloudflare Pages는 functions 폴더의 파일을 자동으로 서버리스 함수로 배포합니다.
 */
export async function onRequest(context) {
  try {
    // TODO: 여기에 실제 슬롯머신 결과 계산 로직, 블록체인 트랜잭션 등을 추가합니다.
    const result = {
      symbols: ['🍒', '🍋', '🔔'], // 임시 결과
      isWin: true,
      payout: 50
    };

    // 성공 응답을 프론트엔드에 JSON 형태로 보냅니다.
    return new Response(JSON.stringify({
      success: true,
      message: "Spin successful!",
      data: result
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // 에러 발생 시 실패 응답을 보냅니다.
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred during the spin."
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}