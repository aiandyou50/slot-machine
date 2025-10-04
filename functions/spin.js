/**
 * Cloudflare Worker for CandleSpinner Game Logic
 * (클라우드플레어 워커: 캔들스피너 게임 로직)
 *
 * @version 1.1.1 (Backend Logic)
 * @date 2025-10-04
 *
 * @changelog
 * - v1.1.1 (2025-10-04): [BUGFIX] Corrected a typo in the TonWeb import URL (https:/ -> https://).
 * (TonWeb import URL의 오타를 수정했습니다.)
 * - v1.1.0 (2025-10-04): [FEATURE] Implemented on-chain payout logic.
 * (온체인 상금 지급 로직을 구현했습니다.)
 */

// [BUGFIX] Corrected the import URL from 'https:/' to 'https://'
// ([버그 수정] import URL을 'https:/' 에서 'https://'로 수정)
import TonWeb from 'https://esm.sh/tonweb@0.0.66';

// --- ⚙️ Game Configuration (게임 설정) ---
const config = {
    symbols: ['🌸', '💎', '🍀', '🔔', '💰', '7️⃣'],
    gridSize: 3,
    payoutMultipliers: {
        '🌸': 5, '💎': 10, '🍀': 15, '🔔': 20, '💰': 50, '7️⃣': 100
    },
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
    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) {
        console.error("CRITICAL: GAME_WALLET_MNEMONIC is not set in Cloudflare environment variables.");
        return false;
    }

    const httpProvider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    const keyPair = await TonWeb.utils.mnemonicToKeyPair(mnemonic.split(' '));
    const WalletClass = TonWeb.Wallets.all.v4R2;
    const wallet = new WalletClass(httpProvider, { publicKey: keyPair.publicKey });
    const gameWalletAddress = await wallet.getAddress();

    const jettonMinter = new TonWeb.token.jetton.JettonMinter(httpProvider, { address: config.tokenMasterAddress });
    const gameJettonWalletAddress = await jettonMinter.getJettonWalletAddress(gameWalletAddress);

    const amountInNano = new TonWeb.utils.BN(payoutAmount).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(config.tokenDecimals)));
    const seqno = await wallet.methods.seqno().call();

    const transferPayload = await jettonMinter.createTransferBody({
        jettonAmount: amountInNano,
        toAddress: new TonWeb.utils.Address(recipientAddress),
        forwardAmount: TonWeb.utils.toNano('0.01'),
        responseAddress: gameWalletAddress
    });

    const result = await wallet.methods.transfer({
        secretKey: keyPair.secretKey,
        to: gameJettonWalletAddress.toString(true, true, true),
        amount: TonWeb.utils.toNano('0.05'),
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
        const userAddress = requestData.userAddress;

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
