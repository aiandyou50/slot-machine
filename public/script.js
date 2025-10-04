/**
 * CandleSpinner Frontend Logic
 *
 * @version 1.1.6
 * @date 2025-10-04
 * @author Gemini AI (in collaboration with the user)
 *
 * @changelog
 * - v1.1.6 (2025-10-04): [DEBUG] Added detailed error logging to the `getJettonWalletAddress` function to expose the raw error from the blockchain.
 * - v1.1.5 (2025-10-04): [FEAT] Added a copy-to-clipboard button for the user's full wallet address.
 * - v1.1.4 (2025-10-04): [BUGFIX] Corrected the object path for TonWeb's JettonMinter class.
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingView = document.getElementById('landing-view');
    const gameView = document.getElementById('game-view');
    const walletInfoSpan = document.getElementById('wallet-info');
    const disconnectBtn = document.getElementById('disconnect-wallet-button');
    const copyAddressBtn = document.getElementById('copy-address-btn');
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
    const TOKEN_MASTER_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV"; // 이 주소가 정확한지 확인이 필요합니다.
    const TOKEN_DECIMALS = 9;
    const MIN_TON_FOR_GAS = 0.05;

    // App Version
    const APP_VERSION = "1.1.6";
    const RELEASE_DATE = "2025-10-04";

    // Game state
    let fullUserAddress = '';
    const symbols = ['💎', '💰', '🍀', '🔔', '🍒', '7️⃣'];
    let currentBet = 10;
    const betStep = 10;
    let isSpinning = false;
    
    versionInfoDiv.textContent = `v${APP_VERSION} (${RELEASE_DATE})`;

    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

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

    copyAddressBtn.addEventListener('click', () => {
        if (!fullUserAddress) return;
        navigator.clipboard.writeText(fullUserAddress).then(() => {
            const originalIcon = copyAddressBtn.textContent;
            copyAddressBtn.textContent = '✅';
            setTimeout(() => { copyAddressBtn.textContent = originalIcon; }, 1500);
        }).catch(err => {
            console.error('Failed to copy address: ', err);
            alert('Failed to copy address.');
        });
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
        if (isSpinning || !tonConnectUI.connected) { return; }
        startSpin();
    });

    // Functions
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
        try {
            const jettonMinter = new tonweb.token.jetton.JettonMinter(tonweb.provider, { address: jettonMasterAddress });
            const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress));
            return jettonWalletAddress.toString(true, true, true);
        } catch (error) {
            // ▼▼▼ [오류 수정] 상세 오류 로깅 기능 추가 ▼▼▼
            console.error("!!! DETAILED ERROR from getJettonWalletAddress:", error);
            let userFriendlyMessage = "Could not find your token wallet.";

            if (error && typeof error.message === 'string') {
                if (error.message.includes("exit_code: -13")) {
                    userFriendlyMessage = "Contract error (-13). Is the TOKEN_MASTER_ADDRESS correct?";
                } else if (error.message.includes("is not a valid Address")) {
                    userFriendlyMessage = "Invalid address format. Check TOKEN_MASTER_ADDRESS.";
                } else {
                    // 기타 기술적인 오류 메시지를 사용자에게 좀 더 친화적으로 표시
                    userFriendlyMessage = "A network or contract error occurred.";
                }
            }
            // 브라우저 콘솔에 찍힌 상세 오류와 함께, 화면에는 좀 더 이해하기 쉬운 메시지를 표시
            throw new Error(userFriendlyMessage);
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        }
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

            showLoadingOverlay("1. Finding your token wallet...");
            const userJettonWalletAddress = await getJettonWalletAddress(fullUserAddress, TOKEN_MASTER_ADDRESS);

            showLoadingOverlay("2. Preparing transaction...");
            
            const amountInNano = new TonWeb.utils.BN(currentBet).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(TOKEN_DECIMALS)));
            
            const body = new TonWeb.boc.Cell();
            body.bits.writeUint(0xf8a7ea5, 32);
            body.bits.writeUint(0, 64);
            body.bits.writeCoins(amountInNano);
            body.bits.writeAddress(new TonWeb.utils.Address(GAME_WALLET_ADDRESS));
            body.bits.writeAddress(new TonWeb.utils.Address(fullUserAddress));
            body.bits.writeBit(0);

            body.bits.writeCoins(TonWeb.utils.toNano('0.01')); 
            body.bits.writeBit(0);

            const payload = TonWeb.utils.bytesToBase64(await body.toBoc());
            
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{
                    address: userJettonWalletAddress,
                    amount: TonWeb.utils.toNano('0.05').toString(),
                    payload: payload
                }]
            };
            
            showLoadingOverlay("3. Please approve in your wallet...");

            const result = await tonConnectUI.sendTransaction(transaction);
            
            showLoadingOverlay("4. Waiting for blockchain confirmation...");

            const response = await fetch('/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boc: result.boc, betAmount: currentBet, userAddress: fullUserAddress })
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

    async function getTonBalance() {
        if (!tonConnectUI.wallet) return 0;
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
            }, spinIntervalTime);
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
                }, 7000);
            }
        }
    }

    checkConnection();
});
