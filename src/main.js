import './style.css';
import { Address, toNano, beginCell } from '@ton/core';
// (KO) TonClient는 백엔드 프록시로 이전되었으므로 프론트엔드에서 더 이상 필요하지 않습니다.
// (EN) TonClient is no longer needed on the frontend as it has been moved to a backend proxy.

// (KO) English and (KO) Korean comments are mandatory.

// --- (EN) State Management / (KO) 상태 관리 ---
let tonConnectUI;
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
    str = str.replace(`{${pKey}}`, pValue);
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
  redChoiceButton.disabled = isLoading;
  blackChoiceButton.disabled = isLoading;
  showMessage(isLoading ? 'processing_message' : lastMessage.key, lastMessage.params);
}

const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";

function createJettonTransferPayload(jettonAmount, toAddress, responseAddress) {
    const forwardPayload = beginCell()
        .storeUint(0, 32) // op-code for a text comment
        .storeStringTail("Bet")
        .endCell();

    return beginCell()
        .storeUint(0x0f8a7ea5, 32) // op-code for jetton transfer
        .storeUint(0, 64) // query_id
        .storeCoins(toNano(jettonAmount))
        .storeAddress(Address.parse(toAddress))
        .storeAddress(Address.parse(responseAddress))
        .storeBit(false) // no custom payload
        .storeCoins(toNano('0.01')) // forward fee
        .storeBit(true) // forward payload included
        .storeRef(forwardPayload)
        .endCell();
}

async function handleSpin() {
  if (!walletInfo) {
    showMessage('connect_wallet_error');
    return;
  }

  setControlsLoading(true);
  postWinActions.classList.add('hidden');
  showMessage('creating_transaction_message');

  try {
    const response = await fetch('/getJettonWalletAddress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ownerAddress: walletInfo.account.address,
            jettonMinterAddress: CSPIN_JETTON_ADDRESS
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get Jetton wallet address.');
    }

    const { jettonWalletAddress } = await response.json();

    const transferPayload = createJettonTransferPayload(
        currentBet.toString(),
        GAME_WALLET_ADDRESS,
        walletInfo.account.address
    );

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: jettonWalletAddress,
          amount: toNano('0.05').toString(),
          payload: transferPayload.toBoc().toString('base64'),
        }
      ]
    };

    showMessage('confirm_transaction_message');
    const result = await tonConnectUI.sendTransaction(transaction);
    showMessage('sending_transaction_message');

    const spinResponse = await fetch('/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boc: result.boc, devKey: localStorage.getItem('DEV_KEY') }),
    });

    const data = await spinResponse.json();
    if (data.error) throw new Error(data.details || data.error);

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
    const response = await fetch('/claimPrize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winTicket: currentWinTicket }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
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
    const response = await fetch('/doubleUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winTicket: currentWinTicket, choice }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);

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
 * (KO) CDN에서 @tonconnect/ui가 로드될 때까지 기다립니다.
 * (EN) Waits for @tonconnect/ui to be loaded from the CDN.
 */
async function waitForTonConnectUI(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.TonConnectUI) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}


async function main() {
  if (window.__CANDLESPINNER_INITIALIZED) return;
  window.__CANDLESPINNER_INITIALIZED = true;

  versionDisplay.textContent = `v${import.meta.env.VITE_APP_VERSION}`;

  tonConnectUI = new window.TonConnectUI({
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

document.addEventListener('DOMContentLoaded', async () => {
    const loaded = await waitForTonConnectUI();
    if (!loaded) {
        document.getElementById('message-display').textContent = 'Error: Could not load wallet connect UI.';
        return;
    }
    main();
});