/**
 * CandleSpinner v4.0: Galactic Casino - Main Application Entry Point
 * @version 4.0.3
 * @author Jules (AI Assistant)
 */
import './style.css'; // Vite가 CSS 파일을 JS로 가져옵니다.
import { TonConnectUI } from '@tonconnect/ui';
import TonWeb from 'tonweb';
import * as jose from 'jose';

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
                <div id="connect-wallet-button-container-landing"></div>
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
                        <option value="en">EN</option>
                        <option value="ko">KO</option>
                        <option value="ja">JA</option>
                        <option value="zh-CN">CN</option>
                        <option value="zh-TW">TW</option>
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
                    <div class="reel-grid">
                        ${Array(15).fill('<div class="reel"></div>').join('')}
                    </div>
                </div>
            </main>

            <footer class="app-footer">
                <div class="bet-controls">
                    <button id="decrease-bet-btn" class="bet-btn">-</button>
                    <div class="bet-display">
                        <span data-i18n-key="bet.amount">BET</span>
                        <span id="bet-amount">10</span>
                    </div>
                    <button id="increase-bet-btn" class="bet-btn">+</button>
                </div>
                <div class="spin-container">
                    <button id="spin-btn" class="spin-btn" data-i18n-key="spin">SPIN</button>
                    <div id="gamble-controls">
                        <button id="claim-prize-btn" data-i18n-key="gamble.controls.claim">CLAIM</button>
                        <button id="double-up-btn" data-i18n-key="gamble.controls.double_up">DOUBLE</button>
                    </div>
                </div>
                 <div class="version-info">v4.0.3</div>
            </footer>
        </div>
    </div>
`;

// --- DOM 요소 쿼리 ---
const landingView = document.getElementById('landing-view');
const gameView = document.getElementById('game-view');
const walletInfoDisplay = document.querySelector('.wallet-info');
const walletAddressShort = document.getElementById('wallet-address-short');
const cspinBalanceSpan = document.getElementById('cspin-balance');
const disconnectBtn = document.getElementById('disconnect-wallet-button');
const languageSelector = document.getElementById('language-selector');
const decreaseBetBtn = document.getElementById('decrease-bet-btn');
const increaseBetBtn = document.getElementById('increase-bet-btn');
const betAmountSpan = document.getElementById('bet-amount');
const spinBtn = document.getElementById('spin-btn');
const reels = document.querySelectorAll('.reel');
const versionInfoDiv = document.querySelector('.version-info');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const gambleControls = document.getElementById('gamble-controls');
const claimPrizeBtn = document.getElementById('claim-prize-btn');
const doubleUpBtn = document.getElementById('double-up-btn');

// --- 상수 및 상태 변수 ---
const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
const TOKEN_DECIMALS = 9;
const MIN_TON_FOR_GAS = 0.03;
const ALL_SYMBOLS = ['🪐', '💫', '💎', '✨', '☄️', 'A', 'K', 'Q'];
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];

let fullUserAddress = '';
let currentBet = 10;
const betStep = 10;
let isSpinning = false;
let currentWinTicket = null;
let translations = {};

// --- 라이브러리 초기화 ---
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));
const tonConnectUI = new TonConnectUI({
    manifestUrl: '/tonconnect-manifest.json',
    uiOptions: {
        uiPreferences: { theme: 'DARK' },
        buttonRootId: 'connect-wallet-button-container-landing',
    }
});

// --- 핵심 함수들 ---

function updateUI(account) {
    if (account) {
        fullUserAddress = account.address;
        walletAddressShort.textContent = `${fullUserAddress.slice(0, 4)}...${fullUserAddress.slice(-4)}`;
        gameView.classList.add('active');
        landingView.classList.remove('active');
    } else {
        fullUserAddress = '';
        gameView.classList.remove('active');
        landingView.classList.add('active');
    }
}

async function startSpin() {
    console.log("Spin started with bet:", currentBet);
    // 여기에 기존 startSpin 함수 로직을 붙여넣으시면 됩니다.
}

// --- 이벤트 리스너 설정 ---
function setupEventListeners() {
    disconnectBtn.addEventListener('click', () => tonConnectUI.disconnect());
    spinBtn.addEventListener('click', startSpin);
}

// --- 애플리케이션 초기화 ---
async function initializeApp() {
    console.log("CandleSpinner v4.0.3 Initializing...");
    setupEventListeners();
    tonConnectUI.onStatusChange(wallet => updateUI(wallet ? wallet.account : null));
}

initializeApp();