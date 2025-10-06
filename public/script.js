/**
 * CandleSpinner Frontend Logic & Robust Initializer
 * (CandleSpinner 프론트엔드 로직 및 안정적인 초기화 스크립트)
 *
 * @version 3.2.0
 * @date 2025-10-06
 * @author Jules (AI Assistant)
 *
 * @description This single script first ensures all necessary global libraries (TonConnectUI, TonWeb, jose)
 * are available by polling the window object, then initializes the main application logic.
 * This robust approach prevents all race condition errors.
 * (이 단일 스크립트는 window 객체를 폴링하여 필수 전역 라이브러리(TonConnectUI, TonWeb, jose)를
 * 사용할 수 있는지 먼저 확인한 다음, 메인 애플리케이션 로직을 초기화합니다.
 * 이 강력한 접근 방식은 모든 경쟁 상태 오류를 방지합니다.)
 */

// --- Section 1: Robust Library Loader (1섹션: 라이브러리 로더) ---

(function() {
    // Korean: 페이지에 동적으로 스크립트 태그를 추가하는 함수
    // English: Function to dynamically add a script tag to the page
    function loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Korean: 순차적 실행을 보장합니다. English: Ensures sequential execution.
        document.head.appendChild(script);
    }

    // Korean: 로드할 라이브러리 목록
    // English: List of libraries to load
    const libraries = [
        'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js',
        'https://unpkg.com/tonweb@latest/dist/tonweb.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jose/5.2.4/index.umd.min.js'
    ];

    libraries.forEach(loadScript);

    // Korean: 모든 라이브러리가 전역 변수로 준비될 때까지 기다립니다.
    // English: Wait until all libraries are ready as global variables.
    const readyCheck = setInterval(() => {
        if (window.TonConnectUI && window.TonWeb && window.jose) {
            clearInterval(readyCheck);
            // Korean: 라이브러리가 준비되면 앱을 초기화합니다.
            // English: Once ready, initialize the app.
            console.log("All libraries are loaded and ready. Initializing CandleSpinner...");
            initializeApp();
        } else {
            console.log("Waiting for libraries to be globally available...");
        }
    }, 100); // Check every 100ms

})();


// --- Section 2: Main Application Logic (2섹션: 메인 애플리케이션 로직) ---

// ---  DOM Elements ---
let landingView, gameView, walletInfoDisplay, walletInfoSpan, disconnectBtn,
    languageSelector, devModeBtn, decreaseBetBtn, increaseBetBtn, betAmountSpan,
    spinBtn, reels, versionInfoDiv, loadingOverlay, loadingText, gambleControls,
    claimPrizeBtn, doubleUpBtn, doubleUpModal, doubleUpCurrentWinSpan,
    doubleUpNextWinSpan, doubleUpRedBtn, doubleUpBlackBtn,
    doubleUpChancesLeftSpan, doubleUpCloseBtn;

function queryDOMElements() {
    landingView = document.getElementById('landing-view');
    gameView = document.getElementById('game-view');
    walletInfoDisplay = document.getElementById('wallet-info-display');
    walletInfoSpan = document.getElementById('wallet-info');
    disconnectBtn = document.getElementById('disconnect-wallet-button');
    languageSelector = document.getElementById('language-selector');
    devModeBtn = document.getElementById('dev-mode-btn');
    decreaseBetBtn = document.getElementById('decrease-bet-btn');
    increaseBetBtn = document.getElementById('increase-bet-btn');
    betAmountSpan = document.getElementById('bet-amount');
    spinBtn = document.getElementById('spin-btn');
    reels = document.querySelectorAll('.reel');
    versionInfoDiv = document.querySelector('.version-info');
    loadingOverlay = document.getElementById('loading-overlay');
    loadingText = document.getElementById('loading-text');
    gambleControls = document.getElementById('gamble-controls');
    claimPrizeBtn = document.getElementById('claim-prize-btn');
    doubleUpBtn = document.getElementById('double-up-btn');
    doubleUpModal = document.getElementById('double-up-modal');
    doubleUpCurrentWinSpan = document.getElementById('double-up-current-win');
    doubleUpNextWinSpan = document.getElementById('double-up-next-win');
    doubleUpRedBtn = document.getElementById('double-up-red-btn');
    doubleUpBlackBtn = document.getElementById('double-up-black-btn');
    doubleUpChancesLeftSpan = document.getElementById('double-up-chances-left');
    doubleUpCloseBtn = document.getElementById('double-up-close-btn');
}


// --- Constants ---
const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
const TOKEN_DECIMALS = 9;
const MIN_TON_FOR_GAS = 0.03; // Lowered requirement after optimization
const ALL_SYMBOLS = ['🪐', '💫', '💎', '✨', '☄️', 'A', 'K', 'Q']; // New "Cosmic Gemstone" Symbols
const APP_VERSION = "3.0.0";
const RELEASE_DATE = "2025-10-06"; // Updated release date
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];
const PAYLINES = [ [1, 4, 7, 10, 13], [0, 3, 6, 9, 12], [2, 5, 8, 11, 14], [0, 4, 8, 10, 12], [2, 4, 6, 10, 14], [0, 3, 7, 11, 14], [2, 5, 7, 9, 12], [1, 3, 6, 9, 13], [1, 5, 8, 11, 13], [0, 4, 7, 10, 12], [2, 4, 7, 10, 14], [1, 3, 7, 11, 13], [1, 5, 7, 9, 13], [0, 4, 6, 9, 12], [2, 4, 8, 11, 14], [1, 4, 6, 9, 13], [1, 4, 8, 11, 13], [0, 3, 8, 11, 14], [2, 5, 6, 9, 12], [0, 5, 8, 11, 12] ];

// --- State ---
let fullUserAddress = '';
let currentBet = 10;
const betStep = 10;
let isSpinning = false;
let devKey = null;
let versionClickCount = 0;
let versionClickTimeout = null;
let currentWinTicket = null;
let currentLanguage = 'en';
let translations = {};

// --- Initialization ---
let httpProvider;
let tonweb;
let tonConnectUI;

function createTonConnectInstance(lang) {
    // Korean: TonConnect UI 언어 설정 및 재생성
    // English: Set language and recreate TonConnect UI
    const tonConnectLangMap = { 'zh-CN': 'zh_CN', 'zh-TW': 'zh_TW', 'en': 'en', 'ko': 'ko', 'ja': 'ja' };
    const tonConnectLang = tonConnectLangMap[lang] || 'en';

    if (tonConnectUI) {
        // Disconnect and clean up the previous instance to avoid conflicts
        tonConnectUI.disconnect();
    }

    // Ensure the landing page button container is empty before mounting a new one
    const buttonContainer = document.getElementById('connect-wallet-button-container-landing');
    if (buttonContainer) buttonContainer.innerHTML = '';

    tonConnectUI = new window.TonConnectUI({
        manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json',
        uiOptions: {
            uiPreferences: { theme: 'DARK' },
            // Mount the button to the container in the landing view
            buttonRootId: 'connect-wallet-button-container-landing',
            language: tonConnectLang,
        }
    });

    // The status change will handle showing/hiding the correct view
    tonConnectUI.onStatusChange(wallet => updateUI(wallet ? wallet.account : null));
}

// --- Event Listeners ---
function setupEventListeners() {
    languageSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    disconnectBtn.addEventListener('click', () => tonConnectUI.disconnect());
    spinBtn.addEventListener('click', () => { if (!isSpinning && tonConnectUI && tonConnectUI.connected) startSpin(); });
    claimPrizeBtn.addEventListener('click', handleClaimPrize);
    doubleUpBtn.addEventListener('click', showDoubleUpModal);
    doubleUpRedBtn.addEventListener('click', () => handleDoubleUpChoice('red'));
    doubleUpBlackBtn.addEventListener('click', () => handleDoubleUpChoice('black'));
    doubleUpCloseBtn.addEventListener('click', () => { hideDoubleUpModal(); handleClaimPrize(); });
    versionInfoDiv.addEventListener('click', () => {
        clearTimeout(versionClickTimeout);
        versionClickCount++;
        if (versionClickCount >= 7) { devModeBtn.classList.add('visible'); versionClickCount = 0; }
        versionClickTimeout = setTimeout(() => { versionClickCount = 0; }, 1000);
    });
}

// --- Main Game Flow ---
async function startSpin() {
    isSpinning = true;
    setControlsDisabled(true);
    clearHighlights();
    showLoadingOverlay("Checking balance...");
    try {
        const tonBalance = await getTonBalance();
        if (tonBalance < MIN_TON_FOR_GAS) throw new Error(`Not enough TON for gas. Need ${MIN_TON_FOR_GAS} TON.`);
        showLoadingOverlay("Preparing transaction...");
        const userJettonWalletAddress = await getJettonWalletAddress(fullUserAddress, TOKEN_MASTER_ADDRESS);
        const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
        // Korean: 페이로드 생성 (가스비 최적화)
        // English: Create payload (gas optimized)
        const payloadCell = TonWeb.token.jetton.JettonWallet.createTransferBody({
            jettonAmount: amountInNano,
            toAddress: new TonWeb.utils.Address(GAME_WALLET_ADDRESS),
            responseAddress: new TonWeb.utils.Address(fullUserAddress),
            forwardAmount: TonWeb.utils.toNano('0.005') // Forward TON amount
        });
        const payload = TonWeb.utils.bytesToBase64(await payloadCell.toBoc());

        showLoadingOverlay("Please approve in wallet...");
        const result = await tonConnectUI.sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{
                address: userJettonWalletAddress,
                amount: TonWeb.utils.toNano('0.02').toString(), // TON for gas
                payload
            }]
        });
        showLoadingOverlay("Confirming transaction...");
        const requestBody = { boc: result.boc, betAmount: currentBet, userAddress: fullUserAddress, devKey };
        const spinResult = await fetchApi('/spin', requestBody);
        await runSpinAnimation(spinResult.data);
        if (spinResult.data.isWin && spinResult.winTicket) {
            currentWinTicket = spinResult.winTicket;
            highlightWinningReels(spinResult.data.winningPaylines, spinResult.data.isJackpot);
            showGambleControls();
        } else {
            isSpinning = false;
            setControlsDisabled(false);
        }
    } catch (error) {
        handleError(error, () => { isSpinning = false; setControlsDisabled(false); });
    } finally {
        hideLoadingOverlay();
    }
}

// --- Double Up Flow ---
function showGambleControls() {
    spinBtn.style.display = 'none';
    gambleControls.classList.add('visible');
}

function hideGambleControls() {
    currentWinTicket = null;
    gambleControls.classList.remove('visible');
    spinBtn.style.display = 'block';
    isSpinning = false;
    setControlsDisabled(false);
    clearHighlights();
}

async function handleClaimPrize() {
    if (!currentWinTicket) return;
    showLoadingOverlay("Claiming prize...");
    try {
        const result = await fetchApi('/claimPrize', { winTicket: currentWinTicket });
        alert(result.message);
    } catch (error) {
        handleError(error);
    } finally {
        hideGambleControls();
        hideLoadingOverlay();
    }
}

// --- JWT Helper ---
function decodeWinTicketPayload(jwtString) {
    try {
        // Korean: UI 목적을 위해 JWT 페이로드를 안전하게 디코딩합니다. 'jose' 라이브러리를 사용합니다.
        // English: Safely decode the JWT payload for UI purposes using the 'jose' library.
        return window.jose.decodeJwt(jwtString);
    } catch (e) {
        console.error('Failed to decode JWT payload', e);
        return null;
    }
}

function showDoubleUpModal() {
    const payload = decodeWinTicketPayload(currentWinTicket);
    if (!payload) {
        handleError(new Error("Invalid win ticket."));
        return;
    }
    updateDoubleUpModalUI(payload.payout, payload.doubleUpCount || 0);
    doubleUpModal.classList.add('visible');
}

function hideDoubleUpModal() {
    doubleUpModal.classList.remove('visible');
}

function updateDoubleUpModalUI(currentWin, count) {
    doubleUpCurrentWinSpan.textContent = currentWin.toFixed(2);
    doubleUpNextWinSpan.textContent = (currentWin * 2).toFixed(2);
    doubleUpChancesLeftSpan.textContent = 5 - count;
}

async function handleDoubleUpChoice(choice) {
    showLoadingOverlay(`Gambling for ${choice}...`);
    try {
        const result = await fetchApi('/doubleUp', { winTicket: currentWinTicket, choice });
        hideLoadingOverlay();
        if (result.outcome === 'win') {
            currentWinTicket = result.newTicket;
            alert(`SUCCESS! Your win is now ${result.newPayout.toFixed(2)}!`);
            const decodedTicket = decodeWinTicketPayload(currentWinTicket);
            if (decodedTicket.doubleUpCount >= 5) {
                alert("Maximum double ups reached! Claiming your prize.");
                hideDoubleUpModal();
                handleClaimPrize();
            } else {
                updateDoubleUpModalUI(result.newPayout, decodedTicket.doubleUpCount);
            }
        } else {
            alert("You lost! Better luck next time.");
            hideDoubleUpModal();
            hideGambleControls();
        }
    } catch (error) {
        handleError(error, () => { hideDoubleUpModal(); hideGambleControls(); });
    }
}

// --- Utility Functions ---
async function fetchApi(endpoint, body) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        // Korean: 서버에서 유효하지 않은 JSON 응답을 보냈습니다.
        // English: The server sent an invalid JSON response.
        console.error("Invalid JSON response from server:", text);
        throw new Error(`Server returned invalid data. See console for details.`);
    }

    if (!response.ok || !result.success) {
        // Korean: API 오류 발생
        // English: An API error occurred
        throw new Error(result.message || `API Error: HTTP ${response.status}`);
    }
    return result;
}

function handleError(error, finallyCallback) {
    // Korean: 오류 처리기 - 디버깅을 위해 전체 오류 객체를 콘솔에 기록
    // English: Error handler - log the full error object to the console for debugging
    console.error("An error occurred:", error.message, "\nStack:", error.stack);
    alert(`Error: ${error.message}`);
    if (finallyCallback) finallyCallback();
}

function updateUI(account) {
    // Korean: 지갑 연결 상태에 따라 UI 뷰 전환
    // English: Switch UI view based on wallet connection status
    if (account) {
        fullUserAddress = account.address;
        walletInfoSpan.textContent = `${fullUserAddress.slice(0, 4)}...${fullUserAddress.slice(-4)}`;

        // Show game view, hide landing view
        gameView.classList.add('active');
        landingView.classList.remove('active');
    } else {
        fullUserAddress = '';

        // Show landing view, hide game view
        landingView.classList.add('active');
        gameView.classList.remove('active');
    }
}

function highlightWinningReels(winningPaylines, isJackpot) {
    if (!winningPaylines) return;
    winningPaylines.forEach(win => {
        const line = PAYLINES[win.lineIndex];
        const reelsToHighlight = isJackpot ? line : line.slice(0, win.count);
        reelsToHighlight.forEach(reelIndex => reels[reelIndex].classList.add('winning-reel'));
    });
}

function clearHighlights() { reels.forEach(reel => reel.classList.remove('winning-reel')); }
function setControlsDisabled(disabled) { spinBtn.disabled = disabled; increaseBetBtn.disabled = disabled; decreaseBetBtn.disabled = disabled; }
function showLoadingOverlay(text) { loadingText.textContent = text; loadingOverlay.classList.add('visible'); }
function hideLoadingOverlay() { loadingOverlay.classList.remove('visible'); }
async function getTonBalance() { if (!fullUserAddress) return 0; const b = await tonweb.getBalance(fullUserAddress); return parseFloat(TonWeb.utils.fromNano(b)); }
async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) { const jm = new TonWeb.token.jetton.JettonMinter(httpProvider, { address: jettonMasterAddress }); const jwa = await jm.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress)); return jwa.toString(true, true, true); }
function runSpinAnimation(resultData) { return new Promise(resolve => { const d = 2000, i = 100; reels.forEach(r => r.classList.add('spinning')); const si = setInterval(() => reels.forEach(r => r.textContent = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]), i); setTimeout(() => { clearInterval(si); reels.forEach((r, idx) => { r.classList.remove('spinning'); r.textContent = resultData.reels[idx] || '?'; }); resolve(); }, d); }); }

// --- Language Functions ---
async function initLanguage() {
    // Korean: 저장된 언어 또는 브라우저 기본 언어 설정
    // English: Set language from localStorage or browser default
    const savedLang = localStorage.getItem('candleSpinnerLang');
    let lang = savedLang || navigator.language.split('-')[0];
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        lang = 'en'; // Fallback to English
    }
    await setLanguage(lang);
}

async function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    currentLanguage = lang;
    localStorage.setItem('candleSpinnerLang', lang);

    // Korean: 언어 변경 시 TonConnect UI 인스턴스를 재생성합니다.
    // English: Recreate the TonConnect UI instance when the language changes.
    createTonConnectInstance(lang);

    await loadTranslations(lang);
    applyTranslations();

    const langSelector = document.getElementById('language-selector');
    if (langSelector) langSelector.value = lang;
}

async function loadTranslations(lang) {
    // Korean: 해당 언어의 JSON 파일 로드
    // English: Load the JSON file for the given language
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) throw new Error(`Could not load ${lang}.json`);
        translations = await response.json();
    } catch (error) {
        console.error("Failed to load translations:", error);
        // Fallback to English on error
        if (lang !== 'en') {
            await loadTranslations('en');
        }
    }
}

function applyTranslations() {
    // Korean: UI 요소에 번역된 텍스트 적용
    // English: Apply translated text to UI elements
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
    // Update dynamic text elements if needed
    // e.g., Update button text that changes state
}

// --- App Initialization Function ---
async function initializeApp() {
    // Korean: DOM 요소들을 변수에 할당합니다.
    // English: Assign DOM elements to variables.
    queryDOMElements();

    // Korean: 라이브러리 인스턴스를 생성합니다.
    // English: Create library instances.
    httpProvider = new window.TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    tonweb = new window.TonWeb(httpProvider);

    versionInfoDiv.textContent = `v${APP_VERSION}`; // Date removed for cleaner UI
    setupEventListeners();
    await initLanguage();
    // The rest of the initialization logic will be triggered by UI events
}