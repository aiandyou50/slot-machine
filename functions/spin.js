/**
 * DEBUGGING TEST for Cloudflare Environment
 * (Cloudflare 환경을 위한 디버깅 테스트)
 *
 * @version 9.9.9 (DEBUG)
 * @date 2025-10-05
 *
 * This is a minimal test file to check if the basic Cloudflare Function environment is working.
 * (이 파일은 기본적인 Cloudflare Function 환경이 작동하는지 확인하기 위한 최소 기능 테스트 파일입니다.)
 */
export async function onRequest(context) {
    try {
        // Just log that we received the request.
        // (요청을 받았다는 사실만 로그로 남깁니다.)
        console.log("Debug function was called successfully.");

        // Immediately return a forced win result, without any complex logic.
        // (복잡한 로직 없이, 즉시 강제 당첨 결과를 반환합니다.)
        return new Response(JSON.stringify({
            success: true,
            message: "Debug test successful!",
            data: {
                symbols: ['✅', '✅', '✅', 'D', 'E', 'B', 'U', 'G', '!'],
                isWin: true, // Force a win (강제 당첨)
                payout: 9999 // Send a fake payout number (가짜 상금 숫자 전송)
            }
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        // If even this fails, the problem is very deep in the environment.
        // (만약 이것조차 실패한다면, 문제는 환경 깊숙한 곳에 있습니다.)
        console.error("Minimal debug test failed:", error);
        return new Response(JSON.stringify({
            success: false,
            message: `Minimal debug test failed: ${error.message}`
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}
