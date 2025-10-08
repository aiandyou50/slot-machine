// (KO) 파일 상단에 @orbs-network/ton-access를 import 합니다.
// (EN) Import @orbs-network/ton-access at the top of the file.
import { getHttpEndpoint } from "@orbs-network/ton-access";
import './style.css';
import { toUserFriendlyAddress } from '@ton/core';
import TonWeb from 'tonweb';

// (EN) English and (KO) Korean comments are mandatory.

// --- (EN) State Management / (KO) 상태 관리 ---
let tonConnectUI;
let walletInfo = null;
let currentBet = 10;
let currentWinTicket = null;
let currentLang = 'en';
let translations = {};
const BET_STEP = 10;

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

/**
 * (EN) Gets a translated string for a given key.
 * (KO) 주어진 키에 대한 번역된 문자열을 가져옵니다.
 * @param {string} key - The key for the translation string.
 * @param {object} params - (Optional) Parameters to replace in the string.
 * @returns {string} The translated string.
 */
function t(key, params = {}) {
  let str = translations[key] || key;
  for (const [pKey, pValue] of Object.entries(params)) {
    str = str.replace(`{${pKey}}`, pValue);
  }
  return str;
}

/**
 * (EN) Applies translations to all elements with data-i18n-key attribute.
 * (KO) data-i18n-key 속성을 가진 모든 요소에 번역을 적용합니다.
 */
function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    el.textContent = t(key);
  });
  // (EN) Update dynamic elements as well
  // (KO) 동적 요소도 업데이트
  document.querySelector('#bet-control span').childNodes[0].textContent = `${t('bet_label')}: `;
  claimButton.textContent = t('claim_button_text');
  doubleUpButton.textContent = t('double_up_button_text');
  spinButton.textContent = t('spin_button_text');
  messageDisplay.textContent = t('welcome_message');
}

/**
 * (EN) Loads a language file and applies the translations.
 * (KO) 언어 파일을 로드하고 번역을 적용합니다.
 * @param {string} lang - The language code to load (e.g., 'en', 'ko').
 */
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

// (EN) Address of the Jetton (CSPIN) contract
// (KO) 제튼(CSPIN) 컨트랙트 주소
const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

// (EN) The address of the game wallet to which users send their bets.
// (KO) 사용자가 베팅을 보내는 게임 지갑의 주소입니다.
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
    // (KO) ton-access를 사용해 안정적인 테스트넷 엔드포인트를 가져옵니다.
    // (EN) Get a reliable testnet endpoint using ton-access.
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint));

    // (EN) Get the Jetton Minter for our CSPIN token.
    // (KO) CSPIN 토큰에 대한 제튼 발행자를 가져옵니다.
    const jettonMinter = new tonweb.token.jetton.JettonMinter(tonweb.provider, { address: CSPIN_JETTON_ADDRESS });

    // (EN) Get the user's Jetton Wallet address.
    // (KO) 사용자의 제튼 지갑 주소를 가져옵니다.
    const userJettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(walletInfo.account.address));

    // (EN) Create a JettonWallet instance for the user's wallet.
    // (KO) 사용자의 지갑에 대한 JettonWallet 인스턴스를 생성합니다.
    const userJettonWallet = new tonweb.token.jetton.JettonWallet(tonweb.provider, { address: userJettonWalletAddress.toString() });

    // (EN) Create a payload for the Jetton transfer using the instance method.
    // (KO) 인스턴스 메소드를 사용하여 제튼 전송을 위한 페이로드를 생성합니다.
    const body = await userJettonWallet.createTransferBody({
        queryId: 0,
        jettonAmount: TonWeb.utils.toNano(currentBet.toString()),
        toAddress: new TonWeb.utils.Address(GAME_WALLET_ADDRESS),
        responseAddress: new TonWeb.utils.Address(walletInfo.account.address)
    });

    // (EN) Create the transaction object for TonConnectUI
    // (KO) TonConnectUI를 위한 트랜잭션 객체를 생성합니다.
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600, // (EN) 10 minutes from now / (KO) 지금으로부터 10분
      messages: [
        {
          address: userJettonWalletAddress.toString(true, true, true),
          amount: TonWeb.utils.toNano('0.1').toString(), // (EN) Value in nanotons for the transaction fee
                                                                // (KO) 트랜잭션 수수료를 위한 나노톤 단위의 값
          payload: body.toBoc().toString('base64') // (EN) The BOC of the message payload / (KO) 메시지 페이로드의 BOC
        }
      ]
    };

    messageDisplay.textContent = t('confirm_transaction_message');

    // (EN) Request the user to sign the transaction
    // (KO) 사용자에게 트랜잭션 서명을 요청합니다.
    const result = await tonConnectUI.sendTransaction(transaction);

    messageDisplay.textContent = t('sending_transaction_message');

    // (EN) Send the signed transaction (boc) to the backend
    // (KO) 서명된 트랜잭션(boc)을 백엔드로 전송합니다.
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
     // (EN) Distinguish between transaction cancellation and other errors
     // (KO) 트랜잭션 취소와 기타 오류를 구분합니다.
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
        postWinActions.classList.remove('hidden'); // (EN) Show options again on win / (KO) 성공 시 옵션 다시 표시
    } else {
        messageDisplay.textContent = t('double_up_failed_message');
        currentWinTicket = null;
        postWinActions.classList.add('hidden'); // (EN) Hide on loss / (KO) 실패 시 숨김
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

  tonConnectUI = new window.TON_CONNECT_UI.TonConnectUI({
    manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
    buttonRootId: 'ton-connect-button',
  });

  tonConnectUI.onStatusChange(wallet => {
    walletInfo = wallet;
    updateView(!!wallet);
  });

  // (KO) 개발자 모드 관련 변수
  let devMode = false;
  let testMode = false;
  let versionClickCount = 0;
  const versionDisplay = document.getElementById('version-display');
  const devButtons = document.getElementById('dev-buttons');
  const devModeToggle = document.getElementById('dev-mode-toggle');
  const testModeToggle = document.getElementById('test-mode-toggle');

  // (KO) 개발자 모드 진입: 버전 표시 7회 클릭
  versionDisplay.addEventListener('click', () => {
    versionClickCount++;
    if (versionClickCount >= 7 && !devMode) {
      const key = prompt('DEV_KEY를 입력하세요 (Enter DEV_KEY)');
      if (key && key.length > 0) {
        localStorage.setItem('DEV_KEY', key);
        devMode = true;
        devButtons.style.display = 'block';
        alert('개발자 모드가 활성화되었습니다. (Developer mode ON)');
        devModeToggle.textContent = '개발자 모드: ON';
      } else {
        alert('DEV_KEY가 입력되지 않았습니다. (No DEV_KEY entered)');
      }
      versionClickCount = 0;
    }
  });

  // (KO) 개발자 모드 on/off 버튼
  devModeToggle.addEventListener('click', () => {
    devMode = !devMode;
    devModeToggle.textContent = devMode ? '개발자 모드: ON' : '개발자 모드: OFF';
    alert(devMode ? '개발자 모드가 켜졌습니다.' : '개발자 모드가 꺼졌습니다.');
    devButtons.style.display = devMode ? 'block' : 'none';
  });

  // (KO) 토큰 없이 플레이 모드 on/off 버튼
  testModeToggle.addEventListener('click', () => {
    testMode = !testMode;
    testModeToggle.textContent = testMode ? '테스트 모드(토큰 없이): ON' : '테스트 모드(토큰 없이): OFF';
    alert(testMode ? '테스트 모드가 켜졌습니다. CSPIN 토큰 없이 게임을 플레이할 수 있습니다.' : '테스트 모드가 꺼졌습니다.');
  });

  // (EN) Event Listeners / (KO) 이벤트 리스너
  langSelect.addEventListener('change', (e) => loadTranslations(e.target.value));
  decreaseBetButton.addEventListener('click', () => {
    currentBet = Math.max(BET_STEP, currentBet - BET_STEP);
    updateBetDisplay();
  });
  increaseBetButton.addEventListener('click', () => {
    currentBet += BET_STEP;
    updateBetDisplay();
  });
  spinButton.addEventListener('click', () => {
    if (testMode) {
      // (KO) 테스트 모드: CSPIN 토큰 없이 서버 호출 없이 로컬에서 결과 생성
      const reels = Array(5).fill(null).map(() => Array(3).fill('?'));
      renderReels(reels);
      messageDisplay.textContent = '[테스트 모드] 슬롯머신 결과가 랜덤으로 표시됩니다.';
      postWinActions.classList.add('hidden');
      currentWinTicket = null;
      setControlsLoading(false);
    } else {
      handleSpin();
    }
  });
  claimButton.addEventListener('click', handleClaim);

  // (EN) When Double Up is clicked, show the choice buttons.
  // (KO) 더블업 버튼을 클릭하면, 선택 버튼들을 표시합니다.
  doubleUpButton.addEventListener('click', () => {
    postWinActions.classList.add('hidden');
    doubleUpChoiceView.classList.remove('hidden');
  });

  // (EN) Handle clicks on Red/Black choice buttons.
  // (KO) 레드/블랙 선택 버튼 클릭을 처리합니다.
  redChoiceButton.addEventListener('click', () => handleDoubleUp('red'));
  blackChoiceButton.addEventListener('click', () => handleDoubleUp('black'));

  // (EN) Initial setup / (KO) 초기 설정
  // (EN) Detect browser language or default to 'en'
  // (KO) 브라우저 언어를 감지하거나 기본값 'en'으로 설정
  const initialLang = navigator.language.startsWith('ko') ? 'ko' : 'en';
  langSelect.value = initialLang;
  await loadTranslations(initialLang);

  updateBetDisplay();
  renderReels(Array(5).fill(Array(3).fill('?')));
}

main();
