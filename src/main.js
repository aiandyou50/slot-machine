import './styles/main.css';
import TonConnectUI from '@tonconnect/ui';

// ---  HTML 뼈대 렌더링 ---
document.querySelector('#app').innerHTML = `
    <div class="stars"></div>
    <div id="loading-overlay">
        <div class="loader"></div>
        <p id="loading-text"></p>
    </div>

    <div id="app-container">
        <div id="landing-view" class="view active">
            <div class="landing-content">
                <div class="logo-large">
                    <h1>CandleSpinner</h1>
                    <p class="tagline">The Galactic Casino</p>
                </div>

                <div id="ton-connect-container"></div>

                <p class="secure-note" data-i18n-key="landing.secure_note">Securely connects via TON Connect.</p>
            </div>
        </div>

        <div id="game-view" class="view">
            <header class="app-header">
                 <div class="wallet-info">
                    <span id="cspin-balance">0</span>
                    <span class="token-symbol">CSPIN</span>
                 </div>
                 <div id="wallet-address-short"></div>
                 <div class="header-controls">
                    <select id="language-selector">
                        <option value="en">EN</option><option value="ko">KO</option><option value="ja">JA</option><option value="zh-CN">CN</option><option value="zh-TW">TW</option>
                    </select>
                    <button id="disconnect-wallet-button" title="Disconnect">⏏</button>
                 </div>
            </header>
            <main class="main-content">
                <div class="jackpot-display">
                    <span data-i18n-key="jackpot">JACKPOT</span>
                    <span id="jackpot-amount">1,000,000</span>
                </div>
                <div class="slot-machine">
                    <div class="reel-grid">${Array(15).fill('<div class="reel"></div>').join('')}</div>
                </div>
            </main>
            <footer class="app-footer">
                <div class="bet-controls">
                    <button id="decrease-bet-btn" class="bet-btn">-</button>
                    <div class="bet-display"><span data-i18n-key="bet.amount">BET</span><span id="bet-amount">10</span></div>
                    <button id="increase-bet-btn" class="bet-btn">+</button>
                </div>
                <div class="spin-container">
                    <button id="spin-btn" class="spin-btn" data-i18n-key="spin">SPIN</button>
                    <div id="gamble-controls">
                        <button id="claim-prize-btn" data-i18n-key="gamble.controls.claim">CLAIM</button>
                        <button id="double-up-btn" data-i18n-key="gamble.controls.double_up">DOUBLE</button>
                    </div>
                </div>
                 <div class="version-info">v1.0.0</div>
            </footer>
        </div>
    </div>
`;

// --- DOM 요소 쿼리 ---
const landingView = document.getElementById('landing-view');
const gameView = document.getElementById('game-view');
const walletAddressShort = document.getElementById('wallet-address-short');
const disconnectBtn = document.getElementById('disconnect-wallet-button');

// --- 라이브러리 초기화 ---
const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://gist.githubusercontent.com/siandreev/75f1a2ff3da620b2606599819a557551/raw/tonconnect-manifest.json', // 임시 Gist URL 사용
    uiOptions: {
        uiPreferences: { theme: 'DARK' },
        buttonRootId: 'ton-connect-container'
    }
});

// --- 핵심 함수들 ---

/**
 * 지갑 연결 상태에 따라 UI를 업데이트합니다.
 * Updates the UI based on the wallet connection status.
 * @param {import('@tonconnect/ui').Wallet | null} wallet - 연결된 지갑 정보 또는 null
 */
function updateUI(wallet) {
    if (wallet) {
        // 지갑 연결 시: 게임 뷰 활성화
        // On wallet connection: activate game view
        const address = wallet.account.address;
        walletAddressShort.textContent = `${address.slice(0, 4)}...${address.slice(-4)}`;
        gameView.classList.add('active');
        landingView.classList.remove('active');
    } else {
        // 지갑 연결 해제 시: 랜딩 뷰 활성화
        // On wallet disconnection: activate landing view
        walletAddressShort.textContent = '';
        gameView.classList.remove('active');
        landingView.classList.add('active');
    }
}

/**
 * 이벤트 리스너를 설정합니다.
 * Sets up event listeners.
 */
function setupEventListeners() {
    disconnectBtn.addEventListener('click', () => tonConnectUI.disconnect());
    // 다른 게임 관련 이벤트 리스너는 향후 구현될 예정입니다.
    // Other game-related event listeners will be implemented later.
}

/**
 * 애플리케이션을 초기화합니다.
 * Initializes the application.
 */
async function initializeApp() {
    console.log('CandleSpinner App is initializing...');

    // 지갑 상태 변경을 감지하여 UI 업데이트
    // Subscribe to wallet status changes to update the UI
    tonConnectUI.onStatusChange(updateUI);

    setupEventListeners();

    console.log('CandleSpinner App has been initialized.');
}

// 앱 실행
initializeApp();