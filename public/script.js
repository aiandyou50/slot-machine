/**
 * CandleSpinner Frontend Logic - "Lucky Gemstone Slot" Engine with Double Up
 * (CandleSpinner 프론트엔드 로직 - 더블업 기능이 포함된 "Lucky Gemstone Slot" 엔진)
 *
 * @version 2.2.0
 * @date 2025-10-05
 * @author Jules (AI Assistant)
 *
 * @changelog
 * - v2.2.0 (2025-10-05): [Feat] Implemented Double Up minigame feature.
 *   - On a win, the player receives a JWT "win ticket" instead of an instant payout.
 *   - Implemented UI and logic to call `/double-up` and `/claim-prize` endpoints.
 *   - (Korean): 더블업 미니게임 기능을 구현했습니다.
 *     - 당첨 시, 즉시 지급 대신 JWT "당첨 티켓"을 받습니다.
 *     - 티켓을 사용하여 `/double-up` 및 `/claim-prize` 엔드포인트를 호출하는 로직을 구현했습니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    // ---  DOM Elements ---
    const landingView = document.getElementById('landing-view');
    const gameView = document.getElementById('game-view');
    const walletInfoSpan = document.getElementById('wallet-info');
    const disconnectBtn = document.getElementById('disconnect-wallet-button');
    const copyAddressBtn = document.getElementById('copy-address-btn');
    const devModeBtn = document.getElementById('dev-mode-btn');
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
    const doubleUpModal = document.getElementById('double-up-modal');
    const doubleUpCurrentWinSpan = document.getElementById('double-up-current-win');
    const doubleUpNextWinSpan = document.getElementById('double-up-next-win');
    const doubleUpRedBtn = document.getElementById('double-up-red-btn');
    const doubleUpBlackBtn = document.getElementById('double-up-black-btn');
    const doubleUpChancesLeftSpan = document.getElementById('double-up-chances-left');
    const doubleUpCloseBtn = document.getElementById('double-up-close-btn');

    // --- Constants ---
    const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
    const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
    const TOKEN_DECIMALS = 9;
    const MIN_TON_FOR_GAS = 0.05;
    const ALL_SYMBOLS = ['👑', '🎁', '💎', '❤️', '💙', 'A', 'K', 'Q'];
    const APP_VERSION = "2.2.0";
    const RELEASE_DATE = "2025-10-05";
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

    // --- Initialization ---
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;
    const httpProvider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    const tonweb = new TonWeb(httpProvider);
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json' });
    tonConnectUI.uiOptions = { uiPreferences: { theme: 'DARK' }, buttonRootId: 'connect-wallet-button-container' };

    // --- Event Listeners ---
    tonConnectUI.onStatusChange(wallet => updateUI(wallet ? wallet.account : null));
    spinBtn.addEventListener('click', () => { if (!isSpinning && tonConnectUI.connected) startSpin(); });
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
            const payloadCell = TonWeb.token.jetton.JettonWallet.createTransferBody({
                jettonAmount: amountInNano, toAddress: new TonWeb.utils.Address(GAME_WALLET_ADDRESS),
                responseAddress: new TonWeb.utils.Address(fullUserAddress), forwardAmount: TonWeb.utils.toNano('0.01')
            });
            const payload = TonWeb.utils.bytesToBase64(await payloadCell.toBoc());
            showLoadingOverlay("Please approve in wallet...");
            const result = await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{ address: userJettonWalletAddress, amount: TonWeb.utils.toNano('0.05').toString(), payload }]
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
            const result = await fetchApi('/claim-prize', { winTicket: currentWinTicket });
            alert(result.message);
        } catch (error) {
            handleError(error);
        } finally {
            hideGambleControls();
            hideLoadingOverlay();
        }
    }

    function showDoubleUpModal() {
        const decodedTicket = jose.decodeJwt(currentWinTicket);
        updateDoubleUpModalUI(decodedTicket.payout, decodedTicket.doubleUpCount);
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
            const result = await fetchApi('/double-up', { winTicket: currentWinTicket, choice });
            hideLoadingOverlay();
            if (result.outcome === 'win') {
                currentWinTicket = result.newTicket;
                alert(`SUCCESS! Your win is now ${result.newPayout.toFixed(2)}!`);
                const decodedTicket = jose.decodeJwt(currentWinTicket);
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
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'An unknown API error occurred.');
        return result;
    }

    function handleError(error, finallyCallback) {
        console.error('An error occurred:', error);
        alert(`Error: ${error.message}`);
        if(finallyCallback) finallyCallback();
    }

    function updateUI(account) {
        if (account) {
            fullUserAddress = account.address;
            walletInfoSpan.textContent = `${fullUserAddress.slice(0, 6)}...${fullUserAddress.slice(-4)}`;
            document.getElementById('landing-view').classList.remove('active');
            gameView.classList.add('active');
        } else {
            fullUserAddress = '';
            gameView.classList.remove('active');
            document.getElementById('landing-view').classList.add('active');
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
});