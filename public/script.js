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

    // ▼▼▼ [추가] 블록체인 및 게임 관련 상수 ▼▼▼
    const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
    const TOKEN_DECIMALS = 9;
    const APP_VERSION = "1.1.0";
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
        if (isSpinning || !tonConnectUI.connected) { return; }
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
    
    // ▼▼▼ [수정] startSpin 함수 전체 로직 변경 ▼▼▼
    async function startSpin() {
        isSpinning = true;
        setControlsDisabled(true);
        showLoadingOverlay("1. Preparing transaction...");

        try {
            // 1. Create Jetton transfer payload
            const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
            
            const body = new TonWeb.boc.Cell();
            body.bits.writeUint(0xf8a7ea5, 32); // op-code for jetton transfer
            body.bits.writeUint(0, 64); // query-id
            body.bits.writeCoins(amountInNano);
            body.bits.writeAddress(new TonWeb.utils.Address(GAME_WALLET_ADDRESS));
            body.bits.writeAddress(new TonWeb.utils.Address(tonConnectUI.wallet.account.address)); // response-address
            body.bits.writeBit(0); // custom payload
            body.bits.writeCoins(new TonWeb.utils.BN(1)); // forward ton amount
            body.bits.writeBit(0); // forward payload

            const payload = TonWeb.utils.bytesToBase64(await body.toBoc());
            
            // 2. Prepare transaction object
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
                messages: [
                    {
                        address: "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV", // CSPIN Jetton Master Address
                        amount: TonWeb.utils.toNano('0.05').toString(), // 0.05 TON for gas
                        payload: payload
                    }
                ]
            };
            
            showLoadingOverlay("2. Please approve in your wallet...");

            // 3. Send transaction
            const result = await tonConnectUI.sendTransaction(transaction);
            
            showLoadingOverlay("3. Waiting for blockchain confirmation...");

            // 4. (보안) 백엔드에 거래 검증 및 결과 요청 (지금은 성공으로 간주)
            // TODO: 실제 운영 시에는 result.boc를 백엔드로 보내 검증해야 합니다.
            
            // 5. 서버에 결과 요청
            const response = await fetch('/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boc: result.boc }) // 거래 증거를 백엔드에 전달
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const spinResult = await response.json();
            if (!spinResult.success) throw new Error(spinResult.message || 'Spin failed on the server.');

            showLoadingOverlay("4. Spin starting!");
            await runSpinAnimation(spinResult.data);

        } catch (error) {
            console.error('Error during spin transaction:', error);
            errorMessageP.textContent = error.message || "Transaction was rejected or failed.";
            setTimeout(() => errorMessageP.textContent = '', 5000);
        } finally {
            hideLoadingOverlay();
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

    checkConnection();
});
