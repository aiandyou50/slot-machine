/**
 * CandleSpinner Frontend Logic - "Lucky Gemstone Slot" Engine
 * (CandleSpinner 프론트엔드 로직 - "Lucky Gemstone Slot" 엔진)
 *
 * @version 2.0.0
 * @date 2025-10-05
 * @author Jules (AI Assistant)
 *
 * @changelog
 * - v2.0.0 (2025-10-05): [Changed] Updated frontend logic to support the 5x3 "Lucky Gemstone Slot" engine.
 *   - [Fixed] Added visualization for winning paylines by highlighting the winning reels.
 *   - Adapted spin animation and result handling for a 15-reel grid.
 *   - (Korean): 5x3 "Lucky Gemstone Slot" 엔진을 지원하도록 프론트엔드 로직을 업데이트했습니다.
 *     - [수정] 당첨된 릴을 하이라이트하여 당첨 페이라인을 시각화하는 기능을 추가했습니다.
 *     - 15릴 그리드에 맞게 스핀 애니메이션 및 결과 처리를 수정했습니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    // ---  DOM Elements (DOM 요소) ---
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
    const landingErrorMessageP = document.getElementById('error-message');
    const gameErrorMessageP = document.getElementById('game-error-message');
    const versionInfoDiv = document.querySelector('.version-info');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    // --- Blockchain & Game Constants (블록체인 및 게임 상수) ---
    const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
    const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
    const TOKEN_DECIMALS = 9;
    const MIN_TON_FOR_GAS = 0.05;
    const ALL_SYMBOLS = ['👑', '🎁', '💎', '❤️', '💙', 'A', 'K', 'Q'];
    const APP_VERSION = "2.0.0";
    const RELEASE_DATE = "2025-10-05";
    const PAYLINES = [ // Must match backend config
        [1, 4, 7, 10, 13], [0, 3, 6, 9, 12], [2, 5, 8, 11, 14], [0, 4, 8, 10, 12], [2, 4, 6, 10, 14],
        [0, 3, 7, 11, 14], [2, 5, 7, 9, 12], [1, 3, 6, 9, 13], [1, 5, 8, 11, 13], [0, 4, 7, 10, 12],
        [2, 4, 7, 10, 14], [1, 3, 7, 11, 13], [1, 5, 7, 9, 13], [0, 4, 6, 9, 12], [2, 4, 8, 11, 14],
        [1, 4, 6, 9, 13], [1, 4, 8, 11, 13], [0, 3, 8, 11, 14], [2, 5, 6, 9, 12], [0, 5, 8, 11, 12]
    ];

    // --- Game State (게임 상태) ---
    let fullUserAddress = '';
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    let devKey = null;

    // --- Initialization (초기화) ---
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;
    const httpProvider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    const tonweb = new TonWeb(httpProvider);
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json' });
    tonConnectUI.uiOptions = { uiPreferences: { theme: 'DARK' }, buttonRootId: 'connect-wallet-button-container' };

    // --- Event Listeners (이벤트 리스너) ---
    tonConnectUI.onStatusChange(wallet => updateUI(wallet ? wallet.account : null));
    disconnectBtn.addEventListener('click', () => tonConnectUI.disconnect());
    copyAddressBtn.addEventListener('click', copyAddress);
    devModeBtn.addEventListener('click', toggleDevMode);
    decreaseBetBtn.addEventListener('click', () => updateBet(-betStep));
    increaseBetBtn.addEventListener('click', () => updateBet(betStep));
    spinBtn.addEventListener('click', () => {
        if (isSpinning || !tonConnectUI.connected) return;
        startSpin();
    });

    // --- Functions (함수) ---

    function updateUI(account) {
        if (account) {
            fullUserAddress = account.address;
            walletInfoSpan.textContent = `${fullUserAddress.slice(0, 6)}...${fullUserAddress.slice(-4)}`;
            landingView.classList.remove('active');
            gameView.classList.add('active');
            showError('');
        } else {
            fullUserAddress = '';
            gameView.classList.remove('active');
            landingView.classList.add('active');
            walletInfoSpan.textContent = '';
        }
    }

    function copyAddress() {
        if (!fullUserAddress) return;
        navigator.clipboard.writeText(fullUserAddress).then(() => {
            copyAddressBtn.textContent = '✅';
            setTimeout(() => { copyAddressBtn.textContent = '📋'; }, 1500);
        });
    }

    function toggleDevMode() {
        const password = prompt("Enter developer key:", "");
        if (password) {
            devKey = password;
            alert("Dev mode ACTIVATED. Spins will now be forced jackpot wins.");
            devModeBtn.classList.add('active');
        } else if (password === "") {
            devKey = null;
            alert("Dev mode DEACTIVATED.");
            devModeBtn.classList.remove('active');
        }
    }
    
    function updateBet(amount) {
        if (isSpinning) return;
        const newBet = currentBet + amount;
        if (newBet >= betStep) {
            currentBet = newBet;
            betAmountSpan.textContent = currentBet;
        }
    }

    async function startSpin() {
        isSpinning = true;
        setControlsDisabled(true);
        clearHighlights();
        showLoadingOverlay("Checking balance...");
        showError('');
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
                messages: [{ address: userJettonWalletAddress, amount: TonWeb.utils.toNano('0.05').toString(), payload: payload }]
            });

            showLoadingOverlay("Confirming transaction...");
            const requestBody = { boc: result.boc, betAmount: currentBet, userAddress: fullUserAddress };
            if (devKey) requestBody.devKey = devKey;

            const response = await fetch('/spin', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(`Server error: ${responseText}`);
            const spinResult = JSON.parse(responseText);
            if (!spinResult.success) throw new Error(spinResult.message);

            await runSpinAnimation(spinResult.data);

            if (spinResult.data.isWin) {
                highlightWinningReels(spinResult.data.winningPaylines, spinResult.data.scatterWin);
                const winMessage = spinResult.data.isJackpot
                    ? `🎉 GRAND JACKPOT! 🎉\nYou won ${spinResult.data.payout} CSPIN!`
                    : `Congratulations! You won ${spinResult.data.payout} CSPIN!`;
                alert(winMessage);
            }

            if (spinResult.data.isFreeSpinTrigger) {
                alert(`You triggered ${spinResult.data.freeSpinsAwarded} Free Spins! (Feature coming soon!)`);
            }

        } catch (error) {
            console.error('Error during spin:', error);
            showError(error.message || "Transaction failed or was rejected.");
        } finally {
            isSpinning = false;
            setControlsDisabled(false);
            hideLoadingOverlay();
        }
    }

    function highlightWinningReels(winningPaylines, scatterWin) {
        if (winningPaylines && winningPaylines.length > 0) {
            winningPaylines.forEach(win => {
                const line = PAYLINES[win.lineIndex];
                for (let i = 0; i < win.count; i++) {
                    const reelIndex = line[i];
                    reels[reelIndex].classList.add('winning-reel');
                }
            });
        }
        if (scatterWin && scatterWin.count > 0) {
            reels.forEach((reel, index) => {
                if (reel.textContent === '🎁') {
                    reel.classList.add('winning-reel');
                }
            });
        }
    }

    function clearHighlights() {
        reels.forEach(reel => reel.classList.remove('winning-reel'));
    }

    async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) {
        const jettonMinter = new TonWeb.token.jetton.JettonMinter(httpProvider, { address: jettonMasterAddress });
        const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress));
        return jettonWalletAddress.toString(true, true, true);
    }

    async function getTonBalance() {
        if (!fullUserAddress) return 0;
        const balance = await tonweb.getBalance(fullUserAddress);
        return parseFloat(TonWeb.utils.fromNano(balance));
    }

    function runSpinAnimation(resultData) {
        return new Promise(resolve => {
            const spinDuration = 2000;
            const intervalTime = 100;
            reels.forEach(reel => reel.classList.add('spinning'));
            const spinInterval = setInterval(() => {
                reels.forEach(reel => reel.textContent = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
            }, intervalTime);
            setTimeout(() => {
                clearInterval(spinInterval);
                reels.forEach((reel, i) => {
                    reel.classList.remove('spinning');
                    reel.textContent = resultData.reels[i] || '?';
                });
                resolve();
            }, spinDuration);
        });
    }

    function setControlsDisabled(disabled) {
        spinBtn.disabled = disabled;
        increaseBetBtn.disabled = disabled;
        decreaseBetBtn.disabled = disabled;
        spinBtn.textContent = disabled ? 'Spinning...' : 'Spin';
    }

    function showLoadingOverlay(text) {
        loadingText.textContent = text;
        loadingOverlay.classList.add('visible');
    }

    function hideLoadingOverlay() {
        loadingOverlay.classList.remove('visible');
    }

    function showError(message) {
        const errorElement = gameView.classList.contains('active') ? gameErrorMessageP : landingErrorMessageP;
        if (errorElement) {
            errorElement.textContent = message;
            if (message) setTimeout(() => { if (errorElement.textContent === message) errorElement.textContent = ''; }, 7000);
        }
    }
});