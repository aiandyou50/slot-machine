/**
 * CandleSpinner Frontend Logic
 * (CandleSpinner 프론트엔드 로직)
 *
 * @version 1.2.2
 * @date 2025-10-05
 * @author Gemini AI (in collaboration with the user)
 *
 * @changelog
 * - v1.2.2 (2025-10-05): [FEATURE] Changed dev mode activation from a URL parameter to a button with a password prompt.
 * (개발자 모드 활성화를 URL 파라미터에서 비밀번호 프롬프트가 있는 버튼 방식으로 변경했습니다.)
 * - v1.2.1 (2025-10-04): [FEAT] Added developer mode via URL parameter.
 * (URL 파라미터를 통한 개발자 모드를 추가했습니다.)
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // Blockchain & Game Constants
    const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
    const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
    const TOKEN_DECIMALS = 9;
    const MIN_TON_FOR_GAS = 0.05;

    // App Version
    const APP_VERSION = "1.2.2";
    const RELEASE_DATE = "2025-10-05";

    // Game state
    let fullUserAddress = '';
    const symbols = ['💎', '💰', '🍀', '🔔', '🍒', '7️⃣'];
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    let devKey = null; // Variable to store the dev key (개발자 키를 저장할 변수)
    
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;

    const httpProvider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    const tonweb = new TonWeb(httpProvider);
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json' });
    tonConnectUI.uiOptions = { uiPreferences: { theme: 'DARK' }, buttonRootId: 'connect-wallet-button-container' };
    
    // Event Listeners
    tonConnectUI.onStatusChange(wallet => updateUI(wallet ? wallet.account : null));
    disconnectBtn.addEventListener('click', () => tonConnectUI.disconnect());
    copyAddressBtn.addEventListener('click', () => {
        if (!fullUserAddress) return;
        navigator.clipboard.writeText(fullUserAddress).then(() => {
            copyAddressBtn.textContent = '✅';
            setTimeout(() => { copyAddressBtn.textContent = '📋'; }, 1500);
        });
    });
    devModeBtn.addEventListener('click', () => {
        const password = prompt("Enter developer key to activate dev mode:", "");
        if (password) { // If user enters text and clicks OK
            devKey = password;
            alert("Developer mode ACTIVATED. Spins will now be forced wins.");
            devModeBtn.classList.add('active');
        } else if (password === "") { // If user enters nothing and clicks OK
            devKey = null;
            alert("Developer mode DEACTIVATED.");
            devModeBtn.classList.remove('active');
        }
        // If user clicks Cancel, password is null, do nothing.
    });
    decreaseBetBtn.addEventListener('click', () => {
        if (isSpinning) return;
        if (currentBet > betStep) {
            currentBet -= betStep;
            betAmountSpan.textContent = currentBet;
        }
    });
    increaseBetBtn.addEventListener('click', () => {
        if (isSpinning) return;
        currentBet += betStep;
        betAmountSpan.textContent = currentBet;
    });
    spinBtn.addEventListener('click', () => {
        if (isSpinning || !tonConnectUI.connected) return;
        startSpin();
    });

    // Functions
    function updateUI(account) { /* ... same as before ... */ }
    async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) { /* ... same as before ... */ }
    async function startSpin() {
        isSpinning = true;
        setControlsDisabled(true);
        showLoadingOverlay("Checking TON balance for gas fee...");
        showError('');
        try {
            const tonBalance = await getTonBalance();
            if (tonBalance < MIN_TON_FOR_GAS) throw new Error(`Not enough TON for gas fee. You need at least ${MIN_TON_FOR_GAS} TON.`);
            
            showLoadingOverlay("1. Finding your token wallet...");
            const userJettonWalletAddress = await getJettonWalletAddress(fullUserAddress, TOKEN_MASTER_ADDRESS);
            
            showLoadingOverlay("2. Preparing transaction...");
            const userJettonWallet = new TonWeb.token.jetton.JettonWallet(httpProvider, { address: userJettonWalletAddress });
            const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
            const payloadCell = await userJettonWallet.createTransferBody({
                jettonAmount: amountInNano,
                toAddress: new TonWeb.utils.Address(GAME_WALLET_ADDRESS),
                responseAddress: new TonWeb.utils.Address(fullUserAddress),
                forwardAmount: TonWeb.utils.toNano('0.01')
            });
            const payload = TonWeb.utils.bytesToBase64(await payloadCell.toBoc());
            
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{ address: userJettonWalletAddress, amount: TonWeb.utils.toNano('0.05').toString(), payload: payload }]
            };
            
            showLoadingOverlay("3. Please approve in your wallet...");
            const result = await tonConnectUI.sendTransaction(transaction);
            
            showLoadingOverlay("4. Waiting for blockchain confirmation...");
            const requestBody = {
                boc: result.boc,
                betAmount: currentBet,
                userAddress: fullUserAddress
            };
            if (devKey) { requestBody.devKey = devKey; }

            const response = await fetch('/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const spinResult = await response.json();
            if (!spinResult.success) throw new Error(spinResult.message);
            
            showLoadingOverlay("5. Spin starting!");
            await runSpinAnimation(spinResult.data);
            if (spinResult.data.isWin) {
                alert(`Congratulations! You won ${spinResult.data.payout} CSPIN!`);
            }
        } catch (error) {
            console.error('Error during spin transaction:', error);
            showError(error.message || "Transaction was rejected or failed.");
        } finally {
            hideLoadingOverlay();
            isSpinning = false;
            setControlsDisabled(false);
        }
    }
    // ... all other helper functions (getTonBalance, runSpinAnimation, etc.) are the same ...
    
    function updateUI(account) {
        if (account) {
            fullUserAddress = account.address;
            const shortAddress = `${fullUserAddress.slice(0, 6)}...${fullUserAddress.slice(-4)}`;
            walletInfoSpan.textContent = shortAddress;
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
    async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) {
        try {
            const jettonMinter = new TonWeb.token.jetton.JettonMinter(httpProvider, { address: jettonMasterAddress });
            const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress));
            return jettonWalletAddress.toString(true, true, true);
        } catch (error) {
            console.error("!!! DETAILED ERROR from getJettonWalletAddress:", error);
            let userFriendlyMessage = "A network or contract error occurred.";
            if (error && typeof error.message === 'string' && error.message.includes("exit_code: -13")) {
                userFriendlyMessage = "Contract error (-13). Is the TOKEN_MASTER_ADDRESS correct?";
            }
            throw new Error(userFriendlyMessage);
        }
    }
    async function getTonBalance() {
        if (!fullUserAddress) return 0;
        try {
            const balance = await tonweb.getBalance(fullUserAddress);
            return parseFloat(TonWeb.utils.fromNano(balance));
        } catch (e) {
            console.error("Could not fetch TON balance", e);
            return 0;
        }
    }
    function runSpinAnimation(resultData) {
        return new Promise(resolve => {
            const spinDuration = 3000;
            const spinIntervalTime = 100;
            const spinningInterval = setInterval(() => {
                reels.forEach(reel => {
                    reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                });
            }, spinIntervalTime);
            setTimeout(() => {
                clearInterval(spinningInterval);
                reels.forEach((reel, index) => {
                    reel.textContent = resultData.symbols[index] || '?';
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
            if (message) {
                setTimeout(() => {
                    if (errorElement.textContent === message) errorElement.textContent = '';
                }, 7000);
            }
        }
    }
    checkConnection();
});
