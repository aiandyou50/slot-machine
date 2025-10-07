import './styles/main.css';
import TonConnectUI from '@tonconnect/ui';
import TonWeb from 'tonweb';

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
const cspinBalanceSpan = document.getElementById('cspin-balance');
const disconnectBtn = document.getElementById('disconnect-wallet-button');
const languageSelector = document.getElementById('language-selector');
const decreaseBetBtn = document.getElementById('decrease-bet-btn');
const increaseBetBtn = document.getElementById('increase-bet-btn');
const betAmountSpan = document.getElementById('bet-amount');
const spinBtn = document.getElementById('spin-btn');
const reels = document.querySelectorAll('.reel');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const gambleControls = document.getElementById('gamble-controls');
const claimPrizeBtn = document.getElementById('claim-prize-btn');
const doubleUpBtn = document.getElementById('double-up-btn');

// --- 상수 및 상태 변수 ---
const ALL_SYMBOLS = ['🪐', '💫', '💎', '✨', '☄️', 'A', 'K', 'Q', '👑', '🎁', '❤️', '💙'];
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];
let fullUserAddress = '';
let currentBet = 10;
const betStep = 10;
let isSpinning = false;
let currentWinTicket = null;
let translations = {};

// --- 라이브러리 초기화 ---
const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json',
    uiOptions: {
        uiPreferences: { theme: 'DARK' },
        buttonRootId: 'ton-connect-container'
    }
});

// --- 핵심 함수들 ---

function updateUI(wallet) {
    if (wallet) {
        fullUserAddress = wallet.account.address;
        walletAddressShort.textContent = `${fullUserAddress.slice(0, 4)}...${fullUserAddress.slice(-4)}`;
        // Korean: 실제 잔액 조회 로직은 여기에 추가될 것입니다. 지금은 1000으로 설정합니다.
        // English: The actual balance query logic will be added here. For now, it's set to 1000.
        cspinBalanceSpan.textContent = '1,000';
        gameView.classList.add('active');
        landingView.classList.remove('active');
    } else {
        fullUserAddress = '';
        walletAddressShort.textContent = '';
        cspinBalanceSpan.textContent = '0';
        gameView.classList.remove('active');
        landingView.classList.add('active');
    }
}

async function fetchApi(endpoint, body) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || "An unknown API error occurred.");
    }
    return result;
}

async function startSpin() {
    if (isSpinning) return;
    isSpinning = true;
    setControlsDisabled(true);
    hideGambleControls();
    showLoadingOverlay("Spinning the reels...");
    try {
        const spinResult = await fetchApi('/spin', { betAmount: currentBet, userAddress: fullUserAddress });
        await runSpinAnimation(spinResult.data);
        if (spinResult.data.isWin && spinResult.winTicket) {
            currentWinTicket = spinResult.winTicket;
            showGambleControls();
        } else {
            isSpinning = false;
            setControlsDisabled(false);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        isSpinning = false;
        setControlsDisabled(false);
    } finally {
        hideLoadingOverlay();
    }
}

async function claimPrize() {
    if (!currentWinTicket) return;
    showLoadingOverlay("Claiming your prize...");
    try {
        const claimResult = await fetchApi('/claimPrize', { winTicket: currentWinTicket });
        alert(claimResult.message);
        resetAfterGamble();
    } catch (error) {
        alert(`Error: ${error.message}`);
        resetAfterGamble();
    } finally {
        hideLoadingOverlay();
    }
}

async function doubleUp() {
    if (!currentWinTicket) return;
    showLoadingOverlay("Doubling up...");
    try {
        const doubleUpResult = await fetchApi('/doubleUp', { winTicket: currentWinTicket });
        if (doubleUpResult.outcome === 'win') {
            currentWinTicket = doubleUpResult.newTicket;
            alert(`Success! New prize: ${doubleUpResult.newPayout}`);
        } else if (doubleUpResult.outcome === 'limit_reached') {
            alert("You've reached the double up limit! Please claim your prize.");
        } else {
            alert("You lost! The prize is gone.");
            resetAfterGamble();
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        resetAfterGamble();
    } finally {
        hideLoadingOverlay();
    }
}

function runSpinAnimation(resultData) {
    return new Promise(resolve => {
        const duration = 2000, interval = 100;
        reels.forEach(r => r.classList.add('spinning'));
        const spinInterval = setInterval(() => {
            reels.forEach(r => r.textContent = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
        }, interval);
        setTimeout(() => {
            clearInterval(spinInterval);
            reels.forEach((r, idx) => {
                r.classList.remove('spinning');
                r.textContent = resultData.reels[idx] || '?';
            });
            resolve();
        }, duration);
    });
}

// --- 다국어 지원 함수들 ---
async function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    localStorage.setItem('candleSpinnerLang', lang);
    await loadTranslations(lang);
    applyTranslations();
    languageSelector.value = lang;
}

async function initLanguage() {
    const savedLang = localStorage.getItem('candleSpinnerLang');
    let lang = savedLang || navigator.language.split('-')[0];
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        lang = 'en'; // Fallback to English
    }
    await setLanguage(lang);
}

async function loadTranslations(lang) {
    try {
        const response = await fetch(`/lang/${lang}.json`);
        if (!response.ok) throw new Error(`Could not load ${lang}.json`);
        translations = await response.json();
    } catch (error) {
        console.error("Failed to load translations:", error);
        if (lang !== 'en') await loadTranslations('en');
    }
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}

// --- UI 제어 함수들 ---
function setControlsDisabled(disabled) {
    spinBtn.disabled = disabled;
    increaseBetBtn.disabled = disabled;
    decreaseBetBtn.disabled = disabled;
}
function showLoadingOverlay(text) {
    loadingText.textContent = text;
    loadingOverlay.classList.add('visible');
}
function hideLoadingOverlay() {
    loadingOverlay.classList.remove('visible');
}
function showGambleControls() {
    spinBtn.style.display = 'none';
    gambleControls.style.display = 'flex';
}
function hideGambleControls() {
    spinBtn.style.display = 'block';
    gambleControls.style.display = 'none';
}
function resetAfterGamble() {
    currentWinTicket = null;
    isSpinning = false;
    setControlsDisabled(false);
    hideGambleControls();
}

// --- 이벤트 리스너 설정 ---
function setupEventListeners() {
    disconnectBtn.addEventListener('click', () => tonConnectUI.disconnect());
    spinBtn.addEventListener('click', startSpin);
    claimPrizeBtn.addEventListener('click', claimPrize);
    doubleUpBtn.addEventListener('click', doubleUp);
    languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));

    increaseBetBtn.addEventListener('click', () => {
        currentBet += betStep;
        betAmountSpan.textContent = currentBet;
    });
    decreaseBetBtn.addEventListener('click', () => {
        currentBet = Math.max(betStep, currentBet - betStep);
        betAmountSpan.textContent = currentBet;
    });
}

// --- 애플리케이션 초기화 ---
async function initializeApp() {
    console.log('CandleSpinner App is initializing...');
    await initLanguage();
    tonConnectUI.onStatusChange(updateUI);
    setupEventListeners();
    console.log('CandleSpinner App has been initialized.');
}

// 앱 실행
initializeApp();