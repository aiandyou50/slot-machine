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

// Robust but compact handleSpin: try TonWeb -> server prepareTransfer -> local fallback
async function handleSpin() {
  if (!walletInfo) {
    messageDisplay.textContent = t('connect_wallet_error');
    return;
  }
  if (GAME_WALLET_ADDRESS === "YOUR_GAME_WALLET_ADDRESS_HERE") {
    messageDisplay.textContent = t('error_game_wallet_not_configured');
    console.error('CRITICAL: GAME_WALLET_ADDRESS is not set in src/main.js');
    return;
  }

  setControlsLoading(true);
  postWinActions.classList.add('hidden');
  messageDisplay.textContent = t('creating_transaction_message');

  try {
    const TonWebLib = await getTonWeb().catch(e => { throw new Error('TonWeb unavailable: ' + e.message); });
    const endpoint = await getHttpEndpoint({ network: 'testnet' }).catch(() => null);
    const providerUrl = endpoint || 'https://net.ton.dev';
    const tonweb = new TonWebLib(new TonWebLib.HttpProvider(providerUrl));

    const tokenNamespace = tonweb.token || TonWebLib.token;
    if (!tokenNamespace || !tokenNamespace.jetton) throw new Error('TonWeb Jetton module not available');

    const jettonMinter = new tokenNamespace.jetton.JettonMinter(tonweb.provider, { address: CSPIN_JETTON_ADDRESS });

    // Try to obtain user's Jetton wallet address
    let userJettonWalletAddress = null;
    try {
      userJettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWebLib.utils.Address(walletInfo.account.address));
    } catch (e) {
      console.warn('getJettonWalletAddress failed:', e && e.message);
      userJettonWalletAddress = null;
    }

    // If no wallet address from client RPC, try server-side prepared transfer
    if (!userJettonWalletAddress) {
      try {
        const resp = await fetch('/functions/prepareTransfer', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerAddress: walletInfo.account.address, amount: currentBet })
        });
        const prep = await resp.json();
        if (prep && prep.success && prep.transferBodyBase64) {
          const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [{ address: prep.userJettonWalletAddress, amount: TonWebLib.utils.toNano('0.1').toString(), payload: prep.transferBodyBase64 }]
          };
          messageDisplay.textContent = t('confirm_transaction_message');
          const result = await tonConnectUI.sendTransaction(transaction);
          messageDisplay.textContent = t('sending_transaction_message');
          const back = await fetch('/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boc: result.boc, devKey: localStorage.getItem('DEV_KEY') }) });
          const data = await back.json();
          if (data.error) throw new Error(data.details || data.error);
          renderReels(data.reels);
          if (data.win) { messageDisplay.textContent = t('spin_win_message', { payout: data.payout }); currentWinTicket = data.winTicket; postWinActions.classList.remove('hidden'); }
          else { messageDisplay.textContent = t('spin_lose_message'); currentWinTicket = null; }
          setControlsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Server prepareTransfer failed or unavailable:', err && err.message);
      }
    }

    // If we have user jetton wallet address, prepare transfer body and request signing
    if (userJettonWalletAddress) {
      const userJettonWallet = new tokenNamespace.jetton.JettonWallet(tonweb.provider, { address: userJettonWalletAddress.toString() });
      const body = await userJettonWallet.createTransferBody({ queryId: 0, jettonAmount: TonWebLib.utils.toNano(currentBet.toString()), toAddress: new TonWebLib.utils.Address(GAME_WALLET_ADDRESS), responseAddress: new TonWebLib.utils.Address(walletInfo.account.address) });
      const payloadBase64 = body.toBoc().toString('base64');

      const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: userJettonWalletAddress.toString(true, true, true), amount: TonWebLib.utils.toNano('0.1').toString(), payload: payloadBase64 }] };
      messageDisplay.textContent = t('confirm_transaction_message');
      const result = await tonConnectUI.sendTransaction(transaction);
      messageDisplay.textContent = t('sending_transaction_message');

      const response = await fetch('/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boc: result.boc, devKey: localStorage.getItem('DEV_KEY') }) });
      const data = await response.json();
      if (data.error) throw new Error(data.details || data.error);
      renderReels(data.reels);
      if (data.win) { messageDisplay.textContent = t('spin_win_message', { payout: data.payout }); currentWinTicket = data.winTicket; postWinActions.classList.remove('hidden'); }
      else { messageDisplay.textContent = t('spin_lose_message'); currentWinTicket = null; }
      setControlsLoading(false);
      return;
    }

    // Final fallback: local test spin
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

    throw new Error('Unable to prepare Jetton transfer');
  } catch (error) {
    messageDisplay.textContent = t('generic_error_message', { error: error && error.message });
    console.error('handleSpin error:', error);
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
