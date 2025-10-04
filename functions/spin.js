/**
 * Cloudflare Worker for CandleSpinner Game Logic
 * (클라우드플레어 워커: 캔들스피너 게임 로직)
 *
 * @version 1.1.0 (Backend Logic)
 * @date 2025-10-04
 *
 * @changelog
 * - v1.1.0 (2025-10-04): [FEATURE] Implemented on-chain payout logic. The server now sends CSPIN tokens to the winner from the game wallet.
 * (온체인 상금 지급 로직 구현. 서버가 이제 게임 지갑에서 승자에게 CSPIN 토큰을 전송합니다.)
 */

// Use esm.sh for modern ES module support of TonWeb in CF Workers.
// (CF Worker 환경에서 TonWeb의 ES 모듈을 지원하기 위해 esm.sh를 사용합니다.)
import TonWeb from 'https://esm.sh/tonweb@0.0.66';

// --- ⚙️ Game Configuration (게임 설정) ---
const config = {
    symbols: ['🌸', '💎', '🍀', '🔔', '💰', '7️⃣'],
    gridSize: 3,
    payoutMultipliers: {
        '🌸': 5, '💎': 10, '🍀': 15, '🔔': 20, '💰': 50, '7️⃣': 100
    },
    // The master address of the CSPIN token.
    // (CSPIN 토큰의 마스터 주소입니다.)
    tokenMasterAddress: "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV",
    tokenDecimals: 9,
};

/**
 * Calculates the result of a spin, including wins and payout.
 * (스핀 결과를 계산하고, 당첨 여부와 총 상금을 반환합니다.)
 * @param {string[]} finalReels - A flat array of 9 symbols representing the 3x3 grid. (3x3 그리드를 나타내는 9개의 심볼 배열)
 * @param {number} betAmount - The amount bet by the user. (사용자가 베팅한 금액)
 * @returns {{symbols: string[], isWin: boolean, payout: number}} - The result object. (게임 결과 객체)
 */
function calculateResult(finalReels, betAmount) {
    let totalPayout = 0;
    for (let i = 0; i < config.gridSize; i++) {
        const lineStartIndex = i * config.gridSize;
        const s1 = finalReels[lineStartIndex], s2 = finalReels[lineStartIndex + 1], s3 = finalReels[lineStartIndex + 2];
        if (s1 === s2 && s2 === s3) {
            totalPayout += betAmount * (config.payoutMultipliers[s1] || 0);
        }
    }
    return { symbols: finalReels, isWin: totalPayout > 0, payout: totalPayout };
}

/**
 * Sends the payout as a Jetton transaction from the game wallet to the user.
 * (게임 지갑에서 사용자에게 젯톤 트랜잭션으로 상금을 전송합니다.)
 * @param {object} context - The Cloudflare Worker context, containing environment variables. (환경 변수를 포함한 CF 워커 컨텍스트)
 * @param {string} recipientAddress - The user's wallet address to send the payout to. (상금을 받을 사용자의 지갑 주소)
 * @param {number} payoutAmount - The amount of CSPIN tokens to send. (전송할 CSPIN 토큰의 양)
 * @returns {Promise<boolean>} - True if the transaction was sent successfully. (트랜잭션이 성공적으로 전송되었으면 true)
 */
async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
    // 1. Securely load the game wallet's mnemonic from Cloudflare's environment variables.
    // (1. Cloudflare 환경 변수에서 게임 지갑의 니모닉을 안전하게 불러옵니다.)
    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) {
        console.error("CRITICAL: GAME_WALLET_MNEMONIC is not set in Cloudflare environment variables.");
        return false;
    }

    // 2. Initialize TonWeb and the game wallet from the mnemonic.
    // (2. TonWeb을 초기화하고 니모닉으로부터 게임 지갑을 생성합니다.)
    const httpProvider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    const keyPair = await TonWeb.utils.mnemonicToKeyPair(mnemonic.split(' '));
    const WalletClass = TonWeb.Wallets.all.v4R2; // Use a standard wallet version, e.g., v4R2
    const wallet = new WalletClass(httpProvider, { publicKey: keyPair.publicKey });
    const gameWalletAddress = await wallet.getAddress();

    // 3. Find the game wallet's own Jetton wallet for CSPIN.
    // (3. CSPIN 토큰에 대한 게임 지갑 자신의 젯톤 지갑을 찾습니다.)
    const jettonMinter = new TonWeb.token.jetton.JettonMinter(httpProvider, { address: config.tokenMasterAddress });
    const gameJettonWalletAddress = await jettonMinter.getJettonWalletAddress(gameWalletAddress);

    // 4. Create the transaction.
    // (4. 트랜잭션을 생성합니다.)
    const amountInNano = new TonWeb.utils.BN(payoutAmount).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(config.tokenDecimals)));

    const seqno = await wallet.methods.seqno().call(); // Get the current sequence number of the wallet. (지갑의 현재 시퀀스 번호를 가져옵니다.)

    // Create the transfer payload
    // (전송 페이로드를 생성합니다.)
    const transferPayload = await jettonMinter.createTransferBody({
        jettonAmount: amountInNano,
        toAddress: new TonWeb.utils.Address(recipientAddress),
        forwardAmount: TonWeb.utils.toNano('0.01'),
        responseAddress: gameWalletAddress
    });

    // Send the transaction from the game wallet
    // (게임 지갑에서 트랜잭션을 전송합니다.)
    const result = await wallet.methods.transfer({
        secretKey: keyPair.secretKey,
        to: gameJettonWalletAddress.toString(true, true, true),
        amount: TonWeb.utils.toNano('0.05'), // Gas fee for the transaction (트랜잭션 가스비)
        seqno: seqno || 0,
        payload: transferPayload,
        sendMode: 3
    }).send();

    console.log("Payout transaction sent:", result);
    return true;
}


/**
 * Handles the HTTP request for a spin.
 * ('/spin' 요청을 처리하는 메인 핸들러 함수입니다.)
 * @param {object} context - The Cloudflare Worker context. (CF 워커 컨텍스트)
 */
export async function onRequest(context) {
    try {
        const requestData = await context.request.json();
        const betAmount = Number(requestData.betAmount);
        const userAddress = requestData.userAddress; // Get the user's address from the request (요청에서 사용자 주소 가져오기)

        if (!betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid bet amount or user address." }), {
                headers: { 'Content-Type': 'application/json' }, status: 400
            });
        }

        const finalReels = [];
        for (let i = 0; i < (config.gridSize * config.gridSize); i++) {
            finalReels.push(config.symbols[Math.floor(Math.random() * config.symbols.length)]);
        }
        
        const result = calculateResult(finalReels, betAmount);
        
        if (result.isWin) {
            console.log(`WIN! Sending ${result.payout} CSPIN to ${userAddress}`);
            // Do not wait for the transaction to complete to keep the UI responsive.
            // (UI 응답성을 유지하기 위해 트랜잭션이 완료될 때까지 기다리지 않습니다.)
            context.waitUntil(sendPayoutTransaction(context, userAddress, result.payout));
        }

        return new Response(JSON.stringify({ success: true, message: "Spin successful!", data: result }), {
            headers: { 'Content-Type': 'application/json' }, status: 200
        });

    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({ success: false, message: "An error occurred during the spin." }), {
            headers: { 'Content-Type': 'application/json' }, status: 500
        });
    }
}
