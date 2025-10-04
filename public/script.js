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
    const errorMessageP = document.getElementById('error-message');
    const versionInfoDiv = document.querySelector('.version-info');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    // Blockchain & Game Constants
    const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
    const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";
    const TOKEN_DECIMALS = 9;
    const MIN_TON_FOR_GAS = 0.05; // 가스비를 위한 최소 TON 잔액 (예: 0.05 TON)

    // App Version
    const APP_VERSION = "1.1.1";
    const RELEASE_DATE = "2025-10-04";

    // Game state
    const symbols = ['💎', '💰', '🍀', '🔔', '🍒', '7️⃣'];
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;

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
            errorMessageP.textContent = '';
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
        } finally {
             tonConnectUI.getWallets().then(() => {
                 if(!tonConnectUI.wallet) errorMessageP.textContent = '';
             });
        }
    }
    
    async function startSpin() {
        isSpinning = true;
        setControlsDisabled(true);
        showLoadingOverlay("Checking TON balance for gas fee...");

        try {
            // 1. Check for sufficient TON balance
            const tonBalance = await getTonBalance();
            if (tonBalance < MIN_TON_FOR_GAS) {
                throw new Error(`Not enough TON for gas fee. You need at least ${MIN_TON_FOR_GAS} TON.`);
            }

            showLoadingOverlay("1. Preparing transaction...");
            
            // 2. Create Jetton transfer payload
            const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
            
            const body = new TonWeb.boc.Cell();
            body.bits.writeUint(0xf8a7ea5, 32); // op-code for jetton transfer
            body.bits.writeUint(0, 64); // query-id
            body.bits.writeCoins(amountInNano);
            body.bits.writeAddress(new TonWeb.utils.Address(GAME_WALLET_ADDRESS));
            body.bits.writeAddress(new TonWeb.utils.Address(tonConnectUI.wallet.account.address));
            body.bits.writeBit(0);
            body.bits.writeCoins(new TonWeb.utils.BN(1));
            body.bits.writeBit(0);

            const payload = TonWeb.utils.bytesToBase64(await body.toBoc());
            
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{
                    address: TOKEN_MASTER_ADDRESS,
                    amount: TonWeb.utils.toNano('0.05').toString(),
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
            // Using a public TON API to get balance
            const response = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${tonConnectUI.wallet.account.address}`);
            const data = await response.json();
            if (data.ok) {
                const balanceInNano = new TonWeb.utils.BN(data.result.balance);
                return parseFloat(TonWeb.utils.fromNano(balanceInNano));
            }
            return 0;
        } catch (e) {
            console.error("Could not fetch TON balance", e);
            return 0; // Assume 0 if API fails
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
        // A helper to show error messages on the main screen
        const errorElement = document.getElementById('error-message') || document.querySelector('.error-text');
        if (errorElement) {
            errorElement.textContent = message;
            setTimeout(() => {
                if (errorElement.textContent === message) {
                    errorElement.textContent = '';
                }
            }, 5000); // Clear message after 5 seconds
        }
    }

    checkConnection();
});


