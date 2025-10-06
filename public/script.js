/**
 * CandleSpinner Dynamic Script Loader
 * (CandleSpinner 동적 스크립트 로더)
 *
 * @version 3.1.0
 * @date 2025-10-06
 * @author Jules (AI Assistant)
 *
 * @description This script ensures all external libraries are fully loaded in the correct
 * order before executing the main application logic. This avoids race conditions.
 * (이 스크립트는 메인 앱 로직을 실행하기 전에 모든 외부 라이브러리가 올바른 순서로
 * 로드되는 것을 보장하여, 경쟁 상태 오류를 방지합니다.)
 */
(function() {
    // Korean: 로드할 라이브러리 목록과 메인 앱 스크립트
    // English: List of libraries to load and the main app script
    const libraries = [
        'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js',
        'https://unpkg.com/tonweb@latest/dist/tonweb.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jose/5.2.4/index.umd.min.js'
    ];
    const mainAppScript = 'app.js';

    let loadedCount = 0;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`${src} loaded successfully.`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    async function initialize() {
        try {
            // Korean: 모든 라이브러리가 순차적으로 로드될 때까지 기다립니다.
            // English: Wait for all libraries to load sequentially.
            for (const lib of libraries) {
                await loadScript(lib);
            }

            // Korean: 모든 라이브러리가 로드된 후, 메인 앱을 로드합니다.
            // English: After all libraries are loaded, load the main app.
            await loadScript(mainAppScript);

        } catch (error) {
            // Korean: 로딩 실패 시 사용자에게 알림
            // English: Notify user on loading failure
            const loadingText = document.getElementById('loading-text');
            if (loadingText) {
                loadingText.textContent = 'Error loading game assets. Please refresh the page.';
                loadingText.style.color = 'red';
            }
        }
    }

    // Korean: DOM이 준비되면 초기화를 시작합니다.
    // English: Start initialization once the DOM is ready.
    document.addEventListener('DOMContentLoaded', initialize);
})();