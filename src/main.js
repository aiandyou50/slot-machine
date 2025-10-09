import './style.css';
import { getJettonWalletAddress, callSpinApi, callClaimApi, callDoubleUpApi } from './services/api.js';
import { createSpinTransaction } from './services/blockchain.js';

// (KO) English and (KO) Korean comments are mandatory.

// --- (EN) State Management / (KO) 상태 관리 ---
let tonConnectUI; // (KO) DOM 로드 후 초기화 (EN) Initialized after DOM loads
let walletInfo = null;
let currentBet = 10;
let currentWinTicket = null;
let currentLang = 'en';
let translations = {};
const BET_STEP = 10;
let lastMessage = { key: 'welcome_message', params: {} };

// --- (EN) DOM Element References / (KO) DOM 요소 참조 ---
const landingView = document.getElementById('landing-view');
const gameView = document.getElementById('game-view');
const langSelect = document.getElementById('lang-select');
const reelsContainer = document.getElementById('reels-container');
const messageDisplay = document.getElementById('message-display');
const postWinActions = document.getElementById('post-win-actions');
const claimButton = document.getElementById('claim-button');
const doubleUpButton = document.getElementById('double-up-button');
const doubleUpChoiceView = document.getElementById('double-up-choice');
const redChoiceButton = document.getElementById('red-choice-button');
const blackChoiceButton = document.getElementById('black-choice-button');
const betAmountSpan = document.getElementById('bet-amount');
const decreaseBetButton = document.getElementById('decrease-bet');
const increaseBetButton = document.getElementById('increase-bet');
const spinButton = document.getElementById('spin-button');
const versionDisplay = document.getElementById('version-display');

// --- (EN) I18n & Message Functions / (KO) 다국어 및 메시지 함수 ---
function t(key, params = {}) {
  let str = translations[key] || key;
  for (const [pKey, pValue] of Object.entries(params)) {
    let value = pValue;
    // (KO) 파라미터가 숫자일 경우, 현재 언어의 로케일에 맞게 숫자 서식을 적용합니다.
    // (EN) If the parameter is a number, format it according to the current language's locale.
    if (typeof pValue === 'number') {
      try {
        value = new Intl.NumberFormat(currentLang).format(pValue);
      } catch (e) {
        console.warn(`Could not format number ${pValue} for locale ${currentLang}. Falling back to default.`, e);
        value = pValue.toString();
      }
    }
    str = str.replace(`{${pKey}}`, value);
  }
  return str;
}

function showMessage(key, params = {}) {
    lastMessage = { key, params };
    messageDisplay.textContent = t(key, params);
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    if (el.id !== 'message-display') {
        el.textContent = t(key);
    }
  });
  showMessage(lastMessage.key, lastMessage.params);
}

async function loadTranslations(lang) {
  try {
    const response = await fetch(`/lang/${lang}.json`);
    if (!response.ok) throw new Error('Language file not found.');
    translations = await response.json();
    currentLang = lang;
    applyStaticTranslations();
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
}

// --- (EN) UI Update Functions / (KO) UI 업데이트 함수 ---
function updateView(isConnected) {
  if (isConnected) {
    landingView.classList.remove('active');
    gameView.classList.add('active');
  } else {
    landingView.classList.add('active');
    gameView.classList.remove('active');
  }
}

function renderReels(reelsData) {
  reelsContainer.innerHTML = '';
  for (const reelData of reelsData) {
    const reelDiv = document.createElement('div');
    reelDiv.className = 'reel';
    for (const symbol of reelData) {
      const symbolDiv = document.createElement('div');
      symbolDiv.className = 'symbol';
      symbolDiv.textContent = {'CHERRY': '🍒', 'LEMON': '🍋', 'ORANGE': '🍊', 'PLUM': '🍇', 'BELL': '🔔', 'DIAMOND': '💎'}[symbol] || symbol;
      reelDiv.appendChild(symbolDiv);
    }
    reelsContainer.appendChild(reelDiv);
  }
}

function updateBetDisplay() {
  betAmountSpan.textContent = currentBet;
}

function setControlsLoading(isLoading) {
  spinButton.disabled = isLoading;
  claimButton.disabled = isLoading;
  doubleUpButton.disabled = isLoading;
  redChoiceButton.disabled = isLoading;
  blackChoiceButton.disabled = isLoading;
  if (isLoading) {
    showMessage('processing_message');
  }
}

// --- (EN) Game Logic Handlers / (KO) 게임 로직 핸들러 ---

async function handleSpin() {
  if (!walletInfo) {
    showMessage('connect_wallet_error');
    return;
  }

  setControlsLoading(true);
  postWinActions.classList.add('hidden');

  try {
    showMessage('creating_transaction_message');
    const jettonWalletAddress = await getJettonWalletAddress(walletInfo.account.address);
    const transaction = createSpinTransaction(jettonWalletAddress, currentBet, walletInfo.account.address);

    showMessage('confirm_transaction_message');
    const result = await tonConnectUI.sendTransaction(transaction);

    showMessage('sending_transaction_message');
    const data = await callSpinApi(result.boc, currentBet, walletInfo.account.address);

    renderReels(data.reels);

    if (data.win) {
      showMessage('spin_win_message', { payout: data.payout });
      currentWinTicket = data.winTicket;
      postWinActions.classList.remove('hidden');
    } else {
      showMessage('spin_lose_message');
      currentWinTicket = null;
    }
  } catch (error) {
     if (error.message.includes('Transaction was rejected')) {
        showMessage('transaction_cancelled_message');
    } else {
        showMessage('generic_error_message', { error: error.message });
    }
  } finally {
    setControlsLoading(false);
  }
}

async function handleClaim() {
  if (!currentWinTicket) return;
  setControlsLoading(true);

  try {
    const data = await callClaimApi(currentWinTicket);
    showMessage('claim_success_message', { amount: data.transaction.amount });
  } catch (error) {
    showMessage('claim_failed_message', { error: error.message });
  } finally {
    currentWinTicket = null;
    postWinActions.classList.add('hidden');
    setControlsLoading(false);
  }
}

async function handleDoubleUp(choice) {
  if (!currentWinTicket) return;
  setControlsLoading(true);
  doubleUpChoiceView.classList.add('hidden');

  try {
    const data = await callDoubleUpApi(currentWinTicket, choice);
    if (data.win) {
        showMessage('double_up_success_message', { payout: data.newPayout });
        currentWinTicket = data.newTicket;
        postWinActions.classList.remove('hidden');
    } else {
        showMessage('double_up_failed_message');
        currentWinTicket = null;
        postWinActions.classList.add('hidden');
    }
  } catch (error) {
    showMessage('double_up_error_message', { error: error.message });
    currentWinTicket = null;
    postWinActions.classList.add('hidden');
  } finally {
    setControlsLoading(false);
  }
}

/**
 * (KO) 애플리케이션 초기화 함수
 * (EN) Initializes the application
 */
async function main() {
  if (window.__CANDLESPINNER_INITIALIZED) return;
  window.__CANDLESPINNER_INITIALIZED = true;

  versionDisplay.textContent = `v${import.meta.env.VITE_APP_VERSION}`;

  tonConnectUI = new TonConnectUI({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
      buttonRootId: 'ton-connect-button',
  });

  tonConnectUI.onStatusChange(wallet => {
    walletInfo = wallet;
    updateView(!!wallet);
  });

  langSelect.addEventListener('change', (e) => loadTranslations(e.target.value));
  decreaseBetButton.addEventListener('click', () => {
    currentBet = Math.max(BET_STEP, currentBet - BET_STEP);
    updateBetDisplay();
  });
  increaseBetButton.addEventListener('click', () => {
    currentBet += BET_STEP;
    updateBetDisplay();
  });
  spinButton.addEventListener('click', handleSpin);
  claimButton.addEventListener('click', handleClaim);
  doubleUpButton.addEventListener('click', () => {
    postWinActions.classList.add('hidden');
    doubleUpChoiceView.classList.remove('hidden');
  });
  redChoiceButton.addEventListener('click', () => handleDoubleUp('red'));
  blackChoiceButton.addEventListener('click', () => handleDoubleUp('black'));

  const initialLang = navigator.language.startsWith('ko') ? 'ko' : 'en';
  langSelect.value = initialLang;
  await loadTranslations(initialLang);

  updateBetDisplay();
  renderReels(Array(5).fill(Array(3).fill('?')));
}

document.addEventListener('DOMContentLoaded', main);