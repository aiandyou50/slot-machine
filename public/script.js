document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingView = document.getElementById('landing-view');
    const gameView = document.getElementById('game-view');
    const walletInfoSpan = document.getElementById('wallet-info');
    const disconnectBtn = document.getElementById('disconnect-wallet-button');
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
    const APP_VERSION = "1.1.3"; // 버전 업데이트
    const RELEASE_DATE = "2025-10-04";

    // Game state
    const symbols = ['💎', '💰', '🍀', '🔔', '🍒', '7️⃣'];
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;

    // TonWeb Initialization
    // HTML에서 TonWeb 라이브러리를 로드하므로, 여기서 new TonWeb()을 사용할 수 있습니다.
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

    // TON Connect UI Initialization
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json',
    });

    tonConnectUI.uiOptions = {
        uiPreferences: { theme: 'DARK' },
        buttonRootId: 'connect-wallet-button-container'
    };
    
    // Event Listeners
    tonConnectUI.onStatusChange(wallet => {
        updateUI(wallet ? wallet.account : null);
    });
    disconnectBtn.addEventListener('click', () => { tonConnectUI.disconnect(); });
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
        if (isSpinning || !tonConnectUI.connected) { return; }
        startSpin();
    });

    // Functions
    function updateUI(account) {
        if (account) {
            landingView.classList.remove('active');
            gameView.classList.add('active');
            showError(''); // 뷰가 바뀔 때 에러 메시지 초기화
            const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
            walletInfoSpan.textContent = shortAddress;
        } else {
            gameView.classList.remove('active');
            landingView.classList.add('active');
            walletInfoSpan.textContent = '';
        }
    }
    
    async function checkConnection() {
        try {
            await tonConnectUI.restoreConnection();
            if (tonConnectUI.wallet) {
                updateUI(tonConnectUI.wallet.account);
            }
        } catch (error) {
            console.error("Failed to restore connection", error);
            showError("Could not restore wallet connection.");
        }
    }
    
    async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) {
        const jettonMinter = new tonweb.jetton.JettonMinter(tonweb.provider, { address: jettonMasterAddress });
        const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress));
        return jettonWalletAddress.toString(true, true, true);
    }

    async function startSpin() {
        isSpinning = true;
        setControlsDisabled(true);
        showLoadingOverlay("Checking TON balance for gas fee...");
        showError('');

        try {
            const tonBalance = await getTonBalance();
            if (tonBalance < MIN_TON_FOR_GAS) {
                throw new Error(`Not enough TON for gas fee. You need at least ${MIN_TON_FOR_GAS} TON.`);
            }

            showLoadingOverlay("Finding your token wallet...");
            const userJettonWalletAddress = await getJettonWalletAddress(tonConnectUI.wallet.account.address, TOKEN_MASTER_ADDRESS);

            showLoadingOverlay("1. Preparing transaction...");
            
            const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
            
            const body = new TonWeb.boc.Cell();
            body.bits.writeUint(0xf8a7ea5, 32); // op-code for jetton transfer
            body.bits.writeUint(0, 64); // query-id
            body.bits.writeCoins(amountInNano); // jetton amount
            body.bits.writeAddress(new TonWeb.utils.Address(GAME_WALLET_ADDRESS)); // destination
            body.bits.writeAddress(new TonWeb.utils.Address(tonConnectUI.wallet.account.address)); // response address
            body.bits.writeBit(0); // custom payload
            body.bits.writeCoins(new TonWeb.utils.BN(1)); // forward ton amount (usually 1 nano)
            body.bits.writeBit(0); // forward payload

            const payload = TonWeb.utils.bytesToBase64(await body.toBoc());
            
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
                messages: [{
                    address: userJettonWalletAddress,
                    amount: TonWeb.utils.toNano('0.05').toString(), // gas fee for the transaction
                    payload: payload
                }]
            };
            
            showLoadingOverlay("2. Please approve in your wallet...");

            const result = await tonConnectUI.sendTransaction(transaction);
            
            showLoadingOverlay("3. Waiting for blockchain confirmation...");

            const response = await fetch('/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boc: result.boc })
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const spinResult = await response.json();
            if (!spinResult.success) throw new Error(spinResult.message);

            showLoadingOverlay("4. Spin starting!");
            await runSpinAnimation(spinResult.data);

        } catch (error) {
            console.error('Error during spin transaction:', error);
            showError(error.message || "Transaction was rejected or failed.");
        } finally {
            hideLoadingOverlay();
            isSpinning = false;
            setControlsDisabled(false);
        }
    }

    async function getTonBalance() {
        if (!tonConnectUI.wallet) return 0;
        try {
            // 일관성을 위해 TonWeb 라이브러리를 사용하여 잔액을 가져옵니다.
            const balance = await tonweb.getBalance(tonConnectUI.wallet.account.address);
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
                    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                    reel.textContent = randomSymbol;
                    reel.classList.add('spinning');
                    setTimeout(() => reel.classList.remove('spinning'), 50);
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
            if(message){
                setTimeout(() => {
                    // 메시지가 지워지기 전에 다른 에러로 바뀌지 않았는지 확인
                    if (errorElement.textContent === message) {
                        errorElement.textContent = '';
                    }
                }, 7000); // 에러 메시지 표시 시간 증가
            }
        }
    }

    checkConnection();
});

