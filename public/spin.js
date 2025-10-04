/**
 * Cloudflare Worker for CandleSpinner Game Logic
 * (클라우드플레어 워커: 캔들스피너 게임 로직)
 *
 * @version 1.1.2 (Backend Logic)
 * @date 2025-10-04
 *
 * @changelog
 * - v1.1.2 (2025-10-04): [BUGFIX] Switched to a dynamic import for TonWeb to bypass a parsing bug in the secure Cloudflare runtime.
 * (보안 클라우드플레어 런타임의 파싱 버그를 우회하기 위해 TonWeb를 동적 import로 전환했습니다.)
 * - v1.1.1 (2025-10-04): [BUGFIX] Corrected a typo in the TonWeb import URL.
 * (TonWeb import URL의 오타를 수정했습니다.)
 */

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
 */
async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
    // [BUGFIX] Dynamically import TonWeb inside the function to bypass the runtime parsing issue.
    // ([버그 수정] 런타임 파싱 이슈를 우회하기 위해 함수 내부에서 TonWeb을 동적으로 import합니다.)
    const TonWeb = (await import('https://esm.sh/tonweb@0.0.66')).default;
    
    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) {
        console.error("CRITICAL: GAME_WALLET_MNEMONIC is not set.");
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

    await wallet.methods.transfer({
        secretKey: keyPair.secretKey,
        to: gameJettonWalletAddress.toString(true, true, true),
        amount: TonWeb.utils.toNano('0.05'),
        seqno: seqno || 0,
        payload: transferPayload,
        sendMode: 3
    }).send();

    console.log(`Payout of ${payoutAmount} CSPIN to ${recipientAddress} sent successfully.`);
    return true;
}

/**
 * Handles the HTTP request for a spin.
 * ('/spin' 요청을 처리하는 메인 핸들러 함수입니다.)
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
            console.log(`WIN! Queuing payout of ${result.payout} CSPIN to ${userAddress}`);
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
