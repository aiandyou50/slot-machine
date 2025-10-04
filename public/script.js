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
    const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV"; // CSPIN 토큰 마스터 주소
    const TOKEN_DECIMALS = 9;
    const MIN_TON_FOR_GAS = 0.05;

    // App Version
    const APP_VERSION = "1.1.3"; // 버전 업데이트
    const RELEASE_DATE = "2025-10-04";

    // Game state
    const symbols = ['🌸', '💎', '🍀', '🔔', '💰', '7️⃣'];
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;
    
    // ▼▼▼ [오류 수정 핵심 1] tonweb 라이브러리 초기화 ▼▼▼
    // 블록체인과 직접 통신(토큰 지갑 주소 조회 등)을 위해 tonweb 인스턴스를 생성합니다.
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));
    console.log("TonWeb instance created.");
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // TON Connect UI Initialization
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json', // 실제 운영 도메인에 맞게 수정
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
            landingErrorMessageP.textContent = '';
            gameErrorMessageP.textContent = '';
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
    
    // ▼▼▼ [오류 수정 핵심 2] 사용자의 토큰 지갑 주소를 찾는 함수 추가 ▼▼▼
    /**
     * @param {string} ownerAddress 사용자의 메인 TON 지갑 주소
     * @returns {Promise<string>} 해당 토큰에 대한 사용자의 토큰 지갑 주소
     */
    async function getJettonWalletAddress(ownerAddress) {
        try {
            console.log(`Finding jetton wallet for owner: ${ownerAddress}`);
            const jettonMinter = new tonweb.token.jetton.JettonMinter(tonweb.provider, { address: TOKEN_MASTER_ADDRESS });
            const userTokenWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress));
            const addressString = userTokenWalletAddress.toString(true, true, true);
            console.log(`Found jetton wallet address: ${addressString}`);
            return addressString;
        } catch (error) {
            console.error("Error getting jetton wallet address:", error);
            throw new Error("Could not find your token wallet. Make sure you have CSPIN token.");
        }
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    async function startSpin() {
        isSpinning = true;
        setControlsDisabled(true);
        showLoadingOverlay("Checking TON balance for gas fee...");
        showError('');

        try {
            // 1. Check for sufficient TON balance
            const tonBalance = await getTonBalance();
            if (tonBalance < MIN_TON_FOR_GAS) {
                throw new Error(`Not enough TON for gas fee. You need at least ${MIN_TON_FOR_GAS} TON.`);
            }

            // ▼▼▼ [오류 수정 핵심 3] 트랜잭션 생성 로직 수정 ▼▼▼
            showLoadingOverlay("1. Finding your token wallet...");
            
            // 사용자의 CSPIN 토큰 지갑 주소를 먼저 조회합니다.
            const userTokenWalletAddress = await getJettonWalletAddress(tonConnectUI.wallet.account.address);

            showLoadingOverlay("2. Preparing transaction...");
            
            // 2. Create Jetton transfer payload
            const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
            
            const body = new TonWeb.boc.Cell();
            body.bits.writeUint(0xf8a7ea5, 32); // op-code for jetton transfer
            body.bits.writeUint(0, 64); // query-id
            body.bits.writeCoins(amountInNano);
            body.bits.writeAddress(new TonWeb.utils.Address(GAME_WALLET_ADDRESS)); // 받는 주소 (게임 지갑)
            body.bits.writeAddress(new TonWeb.utils.Address(tonConnectUI.wallet.account.address)); // 응답 받을 주소 (사용자 지갑)
            body.bits.writeBit(0); // no custom payload
            body.bits.writeCoins(TonWeb.utils.toNano('0.01')); // forward_ton_amount
            body.bits.writeBit(0); // no forward_payload

            const payload = TonWeb.utils.bytesToBase64(await body.toBoc());
            
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{
                    // [중요] 메시지를 보내는 목적지를 TOKEN_MASTER_ADDRESS가 아닌,
                    // 위에서 찾은 사용자의 토큰 지갑 주소(userTokenWalletAddress)로 변경합니다.
                    address: userTokenWalletAddress, 
                    amount: TonWeb.utils.toNano('0.05').toString(),
                    payload: payload
                }]
            };
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            showLoadingOverlay("3. Please approve in your wallet...");

            const result = await tonConnectUI.sendTransaction(transaction);
            
            showLoadingOverlay("4. Waiting for blockchain confirmation...");

            const response = await fetch('/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boc: result.boc, betAmount: currentBet }) // 백엔드로 베팅액 정보 추가 전달
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const spinResult = await response.json();
            if (!spinResult.success) throw new Error(spinResult.message);

            showLoadingOverlay("5. Spin starting!");
            await runSpinAnimation(spinResult.data);
            
            // 당첨 시 메시지 표시 (임시)
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

    async function getTonBalance() {
        if (!tonConnectUI.wallet) return 0;
        try {
            // tonweb 인스턴스를 사용하여 잔액 조회
            const balanceNano = await tonweb.getBalance(tonConnectUI.wallet.account.address);
            return parseFloat(TonWeb.utils.fromNano(balanceNano));
        } catch (e) {
            console.error("Could not fetch TON balance", e);
            // fallback to toncenter http api
            try {
                const response = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${tonConnectUI.wallet.account.address}`);
                if (!response.ok) return 0;
                const data = await response.json();
                if (data.ok) {
                    const balanceInNano = new TonWeb.utils.BN(data.result.balance);
                    return parseFloat(TonWeb.utils.fromNano(balanceInNano));
                }
                return 0;
            } catch (fallbackError) {
                 console.error("Could not fetch TON balance from fallback", fallbackError);
                 return 0;
            }
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
                    if (errorElement.textContent === message) {
                        errorElement.textContent = '';
                    }
                }, 5000);
            }
        }
    }

    checkConnection();
});
