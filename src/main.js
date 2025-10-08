// (KO) 파일 상단에 @orbs-network/ton-access를 import 합니다.
// (EN) Import @orbs-network/ton-access at the top of the file.
import { getHttpEndpoint } from "@orbs-network/ton-access";
import './style.css';
import { toUserFriendlyAddress } from '@ton/core';
// (KO) TonWeb을 window 객체에서 가져옵니다. (CDN 방식)
// (KO) TonWeb: CDN으로 로드된 전역 객체를 안전하게 가져오는 헬퍼
// (EN) Helper to safely obtain TonWeb from the global window (loaded via CDN).
async function getTonWeb(timeout = 10000) {
  if (typeof window === 'undefined') throw new Error('Not running in browser');
  if (window.TonWeb) return window.TonWeb;
  // Wait for CDN script to set window.TonWeb
  const interval = 100;
  let waited = 0;
  return await new Promise((resolve, reject) => {
    const iv = setInterval(() => {
      if (window.TonWeb) {
        clearInterval(iv);
        return resolve(window.TonWeb);
      }
      waited += interval;
      if (waited >= timeout) {
        clearInterval(iv);
        console.warn('TonWeb CDN not available after', timeout, 'ms — attempting dynamic import("tonweb") fallback');
        // Fallback: try dynamic import of the npm package
        import('tonweb').then(mod => {
          const TonWebModule = mod.default || mod;
          if (TonWebModule) {
            console.info('Dynamic import("tonweb") succeeded');
            return resolve(TonWebModule);
          }
          console.error('Dynamic import("tonweb") returned no module');
          return reject(new Error('TonWeb module import failed'));
        }).catch(err => {
          console.error('Dynamic import("tonweb") failed:', err);
          return reject(new Error('TonWeb CDN not available and dynamic import failed: ' + err.message));
        });
      }
    }, interval);
  });
}

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

// --- (EN) Client-side game config for fallback/test spin / (KO) 클라이언트 폴백 스핀 설정 ---
const SYMBOLS = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'DIAMOND'];
const REEL_COUNT = 5;
const ROW_COUNT = 3;

/**
 * (EN) Generate reel results for the client (used by fallback/test mode).
 * (KO) 클라이언트용 릴 결과를 생성합니다 (폴백/테스트 모드에서 사용).
 * @param {string|null} forceResult - if 'jackpot', force top result
 */
function generateReelResults(forceResult = null) {
  if (forceResult === 'jackpot') {
    return Array(REEL_COUNT).fill(null).map(() => Array(ROW_COUNT).fill('DIAMOND'));
  }
  return Array(REEL_COUNT).fill(null).map(() =>
    Array(ROW_COUNT).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  );
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
  const TonWebLib = await getTonWeb().catch(e => { throw new Error('TonWeb unavailable: ' + e.message); });
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  // Alternative endpoints to try if the dynamic endpoint returns invalid responses
  // Prefer using the local RPC proxy endpoint to forward JSON-RPC requests to the whitelist
  // This helps avoid CORS/proxy/response-format issues in some browsers.
  const ALT_RPC_ENDPOINTS = [
    `${window.location.origin}/functions/rpcProxy`, // Cloudflare Pages default Functions path
    `${window.location.origin}/.netlify/functions/rpcProxy`, // legacy Netlify-style path (kept for some hosts)
    `${window.location.origin}/api/rpcProxy`, // another possible hosting path
    // Direct endpoints as ultimate fallback
    'https://testnet.toncenter.com/api/v2/jsonRPC',
    'https://net.ton.dev',
    'https://mainnet.toncenter.com/api/v2/jsonRPC'
  ];

  // Helper: test an RPC endpoint by sending a minimal JSON-RPC request
  async function testRpcEndpoint(endpoint, timeout = 4000) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      // If endpoint is our proxy path, call it with ?use=index to map to whitelist
      let url = endpoint;
      let body = {};
      if (endpoint.startsWith(window.location.origin)) {
        // Use ?use=0 by default; we can override by index when calling
        url = endpoint + '?use=0';
        // Proxy expects raw JSON-RPC or wrapper. We'll send a basic net.getTime or version call
        body = { jsonrpc: '2.0', method: 'net.getVersion', params: [], id: 1 };
      } else {
        body = { jsonrpc: '2.0', method: 'net.getVersion', params: [], id: 1 };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(id);
      const text = await res.text();
      // Basic sanity: should be JSON and not an HTML error page
      if (!text || text.trim().length === 0) return false;
      if (text.trim().startsWith('<')) return false; // HTML -> likely error page
      try { JSON.parse(text); return true; } catch { return false; }
    } catch (err) {
      return false;
    }
  }

  // Choose a working RPC endpoint. Try dynamic endpoint first, then proxy/direct alternates.
  let chosenEndpoint = endpoint;
  let tonweb = null;

  try {
    // Test the dynamic endpoint first
    const dynamicOk = await testRpcEndpoint(endpoint).catch(() => false);
    if (dynamicOk) {
      chosenEndpoint = endpoint;
      tonweb = new TonWebLib(new TonWebLib.HttpProvider(chosenEndpoint));
      console.info('Using dynamic endpoint from ton-access:', chosenEndpoint);
    } else {
      // Try alternates in order
      let found = false;
      for (let i = 0; i < ALT_RPC_ENDPOINTS.length; i++) {
        const alt = ALT_RPC_ENDPOINTS[i];
        console.info('Testing alternate RPC endpoint:', alt);
        const ok = await testRpcEndpoint(alt).catch(() => false);
        if (ok) {
          chosenEndpoint = alt;
          tonweb = new TonWebLib(new TonWebLib.HttpProvider(chosenEndpoint));
          console.info('Selected alternate RPC endpoint:', chosenEndpoint);
          found = true;
          break;
        } else {
          console.warn('Endpoint failed quick test:', alt);
        }
      }
      if (!found) {
        // As a last resort, still try dynamic endpoint and hope for the best
        chosenEndpoint = endpoint;
        tonweb = new TonWebLib(new TonWebLib.HttpProvider(chosenEndpoint));
        console.warn('No alternate endpoint passed quick tests; falling back to dynamic endpoint:', chosenEndpoint);
      }
    }
  } catch (err) {
    console.error('Error while selecting RPC endpoint:', err);
    // create a provider with the original endpoint to let TonWeb attempt its own requests
    tonweb = new TonWebLib(new TonWebLib.HttpProvider(endpoint));
  }

  // Debug info: log TonWeb availability
  console.debug('TonWebLib loaded:', !!TonWebLib);
  console.debug('tonweb instance has token?:', !!tonweb.token);
  console.debug('TonWebLib.token exists?:', !!TonWebLib.token);

  // (EN) Get the Jetton Minter for our CSPIN token.
  // (KO) CSPIN 토큰에 대한 제튼 발행자를 가져옵니다.
  try {
    let tokenNamespace = tonweb.token || TonWebLib.token;
    if (!tokenNamespace || !tokenNamespace.jetton) {
      console.error('tokenNamespace or tokenNamespace.jetton missing', { tonwebToken: !!tonweb.token, TonWebLibToken: !!TonWebLib.token });
      throw new Error('TonWeb Jetton module is not available on instance or constructor');
    }

    const jettonMinter = new tokenNamespace.jetton.JettonMinter(tonweb.provider, { address: CSPIN_JETTON_ADDRESS });

    // (EN) Get the user's Jetton Wallet address. Try alternative RPC endpoints if parsing fails.
    // (KO) 사용자의 제튼 지갑 주소를 가져옵니다. 파싱 오류 발생 시 대체 RPC 엔드포인트를 시도합니다.
    let userJettonWalletAddress;
    try {
      userJettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWebLib.utils.Address(walletInfo.account.address));
    } catch (jetErr) {
      console.warn('TonWeb Jetton flow primary endpoint failed:', jetErr.message);
      // If provider parse response error, try alternatives
      if (jetErr.message && jetErr.message.toLowerCase().includes('http provider parse response error')) {
        let success = false;
        for (const alt of ALT_RPC_ENDPOINTS) {
          try {
            console.info('Attempting alternative RPC endpoint:', alt);
            // If the alt looks like a local proxy path, instruct the provider to use it directly.
            if (alt.startsWith(window.location.origin)) {
              // Our rpcProxy expects a POST body with { endpoint, payload } - but TonWeb HttpProvider
              // expects a URL. We'll still construct an HttpProvider pointing to the proxy, which will
              // forward the JSON-RPC requests to the whitelisted endpoints on the server side.
              tonweb = new TonWebLib(new TonWebLib.HttpProvider(alt));
            } else {
              tonweb = new TonWebLib(new TonWebLib.HttpProvider(alt));
            }
            const altTokenNamespace = tonweb.token || TonWebLib.token;
            if (!altTokenNamespace || !altTokenNamespace.jetton) continue;
            const altMinter = new altTokenNamespace.jetton.JettonMinter(tonweb.provider, { address: CSPIN_JETTON_ADDRESS });
            userJettonWalletAddress = await altMinter.getJettonWalletAddress(new TonWebLib.utils.Address(walletInfo.account.address));
            // replace tokenNamespace/jetton with altTokenNamespace for subsequent calls
            tokenNamespace = altTokenNamespace;
            success = true;
            console.info('Alternative RPC endpoint succeeded:', alt);
            break;
          } catch (altErr) {
            console.warn('Alternative endpoint failed:', alt, altErr.message);
            try {
              // Attempt to fetch a small JSON-RPC response snippet for diagnostics
              const probe = await fetch(alt, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'net.getVersion', params: [], id: 1 }),
              });
              const probeText = await probe.text();
              console.warn('Alternative endpoint probe response snippet:', probeText.slice(0, 400));
            } catch (probeErr) {
              console.warn('Alternative endpoint probe failed:', probeErr.message);
            }
            continue;
          }
        }
        if (!success) throw jetErr;
      } else {
        throw jetErr;
      }
    }

    // (EN) Create a JettonWallet instance for the user's wallet.
    // (KO) 사용자의 지갑에 대한 JettonWallet 인스턴스를 생성합니다.
    const userJettonWallet = new tokenNamespace.jetton.JettonWallet(tonweb.provider, { address: userJettonWalletAddress.toString() });

    // (EN) Create a payload for the Jetton transfer using the instance method.
    // (KO) 인스턴스 메소드를 사용하여 제튼 전송을 위한 페이로드를 생성합니다.
    const body = await userJettonWallet.createTransferBody({
      queryId: 0,
      jettonAmount: TonWebLib.utils.toNano(currentBet.toString()),
      toAddress: new TonWebLib.utils.Address(GAME_WALLET_ADDRESS),
      responseAddress: new TonWebLib.utils.Address(walletInfo.account.address)
    });

    // proceed with TonConnect transaction using 'body' as before
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: userJettonWalletAddress.toString(true, true, true),
        amount: TonWebLib.utils.toNano('0.1').toString(),
        payload: body.toBoc().toString('base64')
      }]
    };

    messageDisplay.textContent = t('confirm_transaction_message');
    const result = await tonConnectUI.sendTransaction(transaction);
    messageDisplay.textContent = t('sending_transaction_message');

    // send to backend
    const response = await fetch('/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boc: result.boc, devKey: localStorage.getItem('DEV_KEY') }),
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

    // end of TonWeb flow
    setControlsLoading(false);
    return;
  } catch (err) {
    // If Jetton module is unavailable or any TonWeb-related error occurs, offer fallback test-mode spin
    console.error('TonWeb Jetton flow failed:', err);
    try { console.error('Chosen RPC endpoint during failure:', chosenEndpoint); } catch(e) { /* ignore */ }
    messageDisplay.textContent = t('generic_error_message', { error: err.message });
    const tryFallback = confirm('Jetton module unavailable or transfer preparation failed. Run a local test spin instead? (테스트 스핀을 대신 실행하시겠습니까?)');
    if (tryFallback) {
      const reels = generateReelResults();
      renderReels(reels);
      messageDisplay.textContent = '[Fallback] 테스트 모드 결과입니다.';
      postWinActions.classList.add('hidden');
      currentWinTicket = null;
      setControlsLoading(false);
      return;
    }
    // if not falling back, rethrow to outer catch
    throw err;
  }

    // (EN) Create the transaction object for TonConnectUI
    // (KO) TonConnectUI를 위한 트랜잭션 객체를 생성합니다.
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600, // (EN) 10 minutes from now / (KO) 지금으로부터 10분
      messages: [
        {
          address: userJettonWalletAddress.toString(true, true, true),
          amount: TonWebLib.utils.toNano('0.1').toString(), // (EN) Value in nanotons for the transaction fee
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
