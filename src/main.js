import { Buffer } from 'buffer';
window.Buffer = Buffer;

import './style.css';
import { TonConnectUI } from '@tonconnect/ui';
import {
  callCommitApi,
  callRevealApi,
  callClaimApi,
  callDoubleUpApi,
} from './services/api.js';
import {
  createSpinTransaction,
  calculateJettonWalletAddress,
} from './services/blockchain.js';

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
const errorLogDisplay = document.getElementById('error-log-display');

// --- (EN) I18n & Message Functions / (KO) 다국어 및 메시지 함수 ---
function t(key, params = {}) {
  let str = translations[key] || key;
  for (const [pKey, pValue] of Object.entries(params)) {
    let value = pValue;
    if (typeof pValue === 'number') {
      try {
        value = new Intl.NumberFormat(currentLang).format(pValue);
      } catch (e) {
        console.warn(`Could not format number ${pValue} for locale ${currentLang}.`);
        value = pValue.toString();
      }
    }
    str = str.replace(`{${pKey}}`, value);
  }
  return str;
}

function showMessage(key, params = {}) {
  lastMessage = { key, params };
  const message = t(key, params);
  messageDisplay.innerHTML = message; // Use innerHTML to allow simple HTML tags like <br>

  // (KO) 상세 오류 로그 기능: 오류가 있으면 표시하고, 없으면 숨깁니다.
  // (EN) Detailed Error Log Feature: Show if there is an error, otherwise hide.
  if (params && params.error) {
    errorLogDisplay.innerHTML = `<strong>[DEBUG]</strong><br>${params.error}`;
    errorLogDisplay.style.display = 'block';
  } else {
    errorLogDisplay.innerHTML = '';
    errorLogDisplay.style.display = 'none';
  }
}

function applyStaticTranslations() {
  document
    .querySelectorAll('[data-i18n-key]:not(#message-display)')
    .forEach((el) => {
      const key = el.getAttribute('data-i18n-key');
      el.textContent = t(key);
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

// --- (EN) UI & Utility Functions / (KO) UI 및 유틸리티 함수 ---
function updateView(isConnected) {
  landingView.classList.toggle('active', !isConnected);
  gameView.classList.toggle('active', isConnected);
}

function renderReels(reelsData) {
  reelsContainer.innerHTML = '';
  for (const reelData of reelsData) {
    const reelDiv = document.createElement('div');
    reelDiv.className = 'reel';
    for (const symbol of reelData) {
      const symbolDiv = document.createElement('div');
      symbolDiv.className = 'symbol';
      symbolDiv.textContent =
        {
          CHERRY: '🍒', LEMON: '🍋', ORANGE: '🍊',
          PLUM: '🍇', BELL: '🔔', DIAMOND: '💎',
        }[symbol] || symbol;
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

async function verifyCommitment(serverSeed, commitment) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(serverSeed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const rehashedCommitment = [...new Uint8Array(hashBuffer)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return rehashedCommitment === commitment;
  } catch (error) {
    console.error("Verification failed:", error);
    return false;
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
  currentWinTicket = null;

  try {
    showMessage('commit_phase_message');
    const commitment = await callCommitApi();
    const clientSeed = crypto.randomUUID();

    showMessage('creating_transaction_message');
    // (KO) 클라이언트 측에서 Jetton 지갑 주소를 직접 계산합니다. API 호출이 필요 없습니다.
    // (EN) Calculate the Jetton wallet address directly on the client-side. No API call needed.
    const jettonMinterAddress =
      'EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV'; // (KO) CSPIN 토큰 컨트랙트 주소 (EN) CSPIN Token Contract Address
    const userJettonWalletAddress = calculateJettonWalletAddress(
      walletInfo.account.address,
      jettonMinterAddress
    );

    const transaction = createSpinTransaction(
      userJettonWalletAddress.toString(),
      currentBet,
      walletInfo.account.address
    );

    showMessage('confirm_transaction_message');
    const sentTransaction = await tonConnectUI.sendTransaction(transaction);

    showMessage('reveal_phase_message');
    const revealPayload = {
      commitment,
      clientSeed,
      boc: sentTransaction.boc,
      betAmount: currentBet,
      userAddress: walletInfo.account.address,
    };
    const data = await callRevealApi(revealPayload);

    const isVerified = await verifyCommitment(data.serverSeed, commitment);
    if (!isVerified) {
      showMessage('verification_failed_error');
      return;
    }

    showMessage('verification_success_message');
    renderReels(data.reels);

    if (data.win) {
      setTimeout(() => showMessage('spin_win_message', { payout: data.payout }), 500);
      currentWinTicket = data.winTicket;
      postWinActions.classList.remove('hidden');
    } else {
      setTimeout(() => showMessage('spin_lose_message'), 500);
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

  // (KO) 동적 버전 표시 기능 구현
  // (EN) Implement dynamic version display feature
  versionDisplay.textContent = `v${import.meta.env.VITE_APP_VERSION}`;

  tonConnectUI = new TonConnectUI({
    // (KO) TON Wallet 연결 오류 해결: manifestUrl을 절대 경로로 지정
    // (EN) Fix TON Wallet connection error: use absolute manifestUrl
    manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button',
  });

  tonConnectUI.onStatusChange((wallet) => {
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

  // (KO) 개발자 디버그 패널: localStorage 'BOC_DEBUG'가 켜져 있으면
  // window.__LAST_BASE64_BOC가 설정되는 것을 감시해 페이지에 보여줍니다.
  // (EN) Developer debug panel: when localStorage 'BOC_DEBUG' is set,
  // watch for window.__LAST_BASE64_BOC and display it on the page.
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('BOC_DEBUG') === '1') {
      const debugWatcher = setInterval(() => {
        try {
          if (window.__LAST_BASE64_BOC) {
            // create panel
            const existing = document.getElementById('candle-debug-panel');
            if (!existing) {
              const panel = document.createElement('div');
              panel.id = 'candle-debug-panel';
              panel.style.position = 'fixed';
              panel.style.right = '12px';
              panel.style.bottom = '12px';
              panel.style.zIndex = '99999';
              panel.style.maxWidth = '480px';
              panel.style.maxHeight = '60vh';
              panel.style.overflow = 'auto';
              panel.style.background = 'rgba(0,0,0,0.85)';
              panel.style.color = '#fff';
              panel.style.padding = '12px';
              panel.style.border = '2px solid #f0f';
              panel.style.borderRadius = '8px';
              panel.style.fontSize = '12px';
              panel.style.fontFamily = 'monospace';

              const title = document.createElement('div');
              title.textContent = 'DEBUG: Last Base64 BOC (local only)';
              title.style.fontWeight = '700';
              title.style.marginBottom = '8px';
              panel.appendChild(title);

              const pre = document.createElement('pre');
              pre.style.whiteSpace = 'pre-wrap';
              pre.style.wordBreak = 'break-all';
              pre.style.maxHeight = '40vh';
              pre.textContent = window.__LAST_BASE64_BOC || '';
              panel.appendChild(pre);

              const link = document.createElement('a');
              link.href = window.__LAST_DEEP_LINK || '#';
              link.textContent = 'Open deep-link (may prompt wallet)';
              link.style.display = 'inline-block';
              link.style.marginTop = '8px';
              link.style.color = '#0ff';
              link.target = '_blank';
              panel.appendChild(link);

              const closeBtn = document.createElement('button');
              closeBtn.textContent = 'Close';
              closeBtn.style.marginLeft = '12px';
              closeBtn.addEventListener('click', () => panel.remove());
              panel.appendChild(closeBtn);

              document.body.appendChild(panel);
            } else {
              // update existing panel content
              const pre = existing.querySelector('pre');
              if (pre) pre.textContent = window.__LAST_BASE64_BOC;
              const a = existing.querySelector('a');
              if (a) a.href = window.__LAST_DEEP_LINK || '#';
            }
            clearInterval(debugWatcher);
          }
        } catch (e) {
          // ignore
        }
      }, 400);
    }
  } catch (e) {
    // ignore
  }
}

document.addEventListener('DOMContentLoaded', main);