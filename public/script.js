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

    // Game state
    const symbols = ['💎', '💰', '🍀', '🔔', '🍒', '7️⃣'];
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    
    // Version
    const APP_VERSION = "1.0.0";
    const RELEASE_DATE = "2025-10-04";
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
        updateUI(wallet ? wallet.account.address : null);
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
        if (isSpinning) { return; }
        startSpin();
    });

    // Functions
    function updateUI(address) {
        if (address) {
            landingView.classList.remove('active');
            gameView.classList.add('active');
            errorMessageP.textContent = '';
            const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                updateUI(tonConnectUI.wallet.account.address);
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

        try {
            // Call the serverless backend function
            const response = await fetch('/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            
            const result = await response.json();

            if (result.success) {
                // Run animation with the result from the backend
                await runSpinAnimation(result.data);
            } else {
                throw new Error(result.message || 'Spin failed on the server.');
            }
        } catch (error) {
            console.error('Error during spin:', error);
            // Display error to the user in a non-blocking way if needed
        } finally {
            isSpinning = false;
            setControlsDisabled(false);
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
                // Update reels with the final result from the backend
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

    // Initial check
    checkConnection();
});
