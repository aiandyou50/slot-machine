import './style.css';
import { TonConnectUI } from '@tonconnect/ui';
import TonWeb from 'tonweb';
import { toUserFriendlyAddress } from '@ton/core';

// (EN) English and (KO) Korean comments are mandatory.

// --- (EN) State Management / (KO) 상태 관리 ---
let walletInfo = null;
let currentBet = 10;
let currentWinTicket = null;
let currentLang = 'en';
let translations = {};
const BET_STEP = 10;

// (EN) Initialize libraries from NPM packages
// (KO) NPM 패키지로부터 라이브러리 초기화
const tonweb = new TonWeb(
    new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC')
);

// (EN) TonConnectUI will be initialized in main() after the DOM is ready.
// (KO) TonConnectUI는 DOM이 준비된 후 main() 함수 내에서 초기화됩니다.
let tonConnectUI;

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

// --- (EN) I18n Functions / (KO) 다국어 함수 ---
function t(key, params = {}) {
  let str = translations[key] || key;
  for (const [pKey, pValue] of Object.entries(params)) {
    str = str.replace(`{${pKey}}`, pValue);
  }
  return str;
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    el.textContent = t(key);
  });
  document.querySelector('#bet-control span').childNodes[0].textContent = `${t('bet_label')}: `;
  claimButton.textContent = t('claim_button_text');
  doubleUpButton.textContent = t('double_up_button_text');
  spinButton.textContent = t('spin_button_text');
  messageDisplay.textContent = t('welcome_message');
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

// --- (EN) Core Application Logic / (KO) 핵심 애플리케이션 로직 ---
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
  messageDisplay.textContent = isLoading ? t('processing_message') : messageDisplay.textContent;
}

const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";

async function handleSpin() {
  if (!walletInfo) {
    messageDisplay.textContent = t('connect_wallet_error');
    return;
  }
  if (GAME_WALLET_ADDRESS === "YOUR_GAME_WALLET_ADDRESS_HERE") {
    messageDisplay.textContent = t('error_game_wallet_not_configured');
    console.error("CRITICAL: GAME_WALLET_ADDRESS is not set in src/main.js");
    return;
  }

  setControlsLoading(true);
  postWinActions.classList.add('hidden');
  messageDisplay.textContent = t('creating_transaction_message');

  try {
    const jettonMinter = new tonweb.token.jetton.JettonMinter(
        tonweb.provider, 
        { address: CSPIN_JETTON_ADDRESS }
    );

    const userWalletAddress = new TonWeb.utils.Address(walletInfo.account.address);
    const userJettonWalletAddress = await jettonMinter.getJettonWalletAddress(userWalletAddress);

    const userJettonWallet = new tonweb.token.jetton.JettonWallet(
        tonweb.provider, 
        { address: userJettonWalletAddress }
    );

    const body = await userJettonWallet.createTransferBody({
        queryId: 0,
        jettonAmount: TonWeb.utils.toNano(currentBet.toString()),
        toAddress: new TonWeb.utils.Address(GAME_WALLET_ADDRESS),
        responseAddress: new TonWeb.utils.Address(walletInfo.account.address),
        forwardTonAmount: TonWeb.utils.toNano('0.01'),
        forwardPayload: new TextEncoder().encode('Bet')
    });

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: userJettonWalletAddress.toString(true, true, true),
          amount: TonWeb.utils.toNano('0.1'),
          stateInit: null,
          payload: await body.toBoc().then(boc => boc.toString('base64')),
        }
      ]
    };

    messageDisplay.textContent = t('confirm_transaction_message');
    const result = await tonConnectUI.sendTransaction(transaction);
    messageDisplay.textContent = t('sending_transaction_message');

    const response = await fetch('/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          boc: result.boc,
          devKey: localStorage.getItem('DEV_KEY'),
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.details || data.error);

    renderReels(data.reels);

    if (data.win) {
      messageDisplay.textContent = t('spin_win_message', { payout: data.payout });
      currentWinTicket = data.winTicket;
      postWinActions.classList.remove('hidden');
    } else {
      messageDisplay.textContent = t('spin_lose_message');
      currentWinTicket = null;
    }
  } catch (error) {
    if (error.message.includes('Transaction was rejected')) {
        messageDisplay.textContent = t('transaction_cancelled_message');
    } else {
        messageDisplay.textContent = t('generic_error_message', { error: error.message });
    }
  } finally {
    setControlsLoading(false);
  }
}

async function handleClaim() {
  if (!currentWinTicket) return;
  setControlsLoading(true);

  try {
    const response = await fetch('/claimPrize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winTicket: currentWinTicket }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    messageDisplay.textContent = t('claim_success_message', { amount: data.transaction.amount });
  } catch (error) {
    messageDisplay.textContent = t('claim_failed_message', { error: error.message });
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
    const response = await fetch('/doubleUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winTicket: currentWinTicket, choice }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);

    if (data.win) {
        messageDisplay.textContent = t('double_up_success_message', { payout: data.newPayout });
        currentWinTicket = data.newTicket;
        postWinActions.classList.remove('hidden');
    } else {
        messageDisplay.textContent = t('double_up_failed_message');
        currentWinTicket = null;
        postWinActions.classList.add('hidden');
    }
  } catch (error) {
    messageDisplay.textContent = t('double_up_error_message', { error: error.message });
    currentWinTicket = null;
    postWinActions.classList.add('hidden');
  } finally {
    setControlsLoading(false);
  }
}

/**
 * (EN) Initializes the application.
 * (KO) 애플리케이션을 초기화합니다.
 */
async function main() {
  if (window.__CANDLESPINNER_INITIALIZED) return;
  window.__CANDLESPINNER_INITIALIZED = true;

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