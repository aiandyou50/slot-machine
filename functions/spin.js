/**
 * Cloudflare Worker for CandleSpinner Game Logic
 * (클라우드플레어 워커: 캔들스피너 게임 로직)
 *
 * @version 1.1.3 (Backend Logic)
 * @date 2025-10-04
 *
 * @changelog
 * - v1.1.3 (2025-10-04): [FEATURE] Added a developer mode to force wins for testing payouts.
 * (상금 지급 테스트를 위해 승리를 강제하는 개발자 모드를 추가했습니다.)
 * - v1.1.2 (2025-10-04): [BUGFIX] Switched to a dynamic import for TonWeb.
 * (TonWeb을 동적 import로 전환했습니다.)
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

async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
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

export async function onRequest(context) {
    try {
        const requestData = await context.request.json();
        const betAmount = Number(requestData.betAmount);
        const userAddress = requestData.userAddress;
        const devKey = requestData.devKey; // Get the dev key from the request (요청에서 개발자 키 가져오기)

        if (!betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid bet amount or user address." }), {
                headers: { 'Content-Type': 'application/json' }, status: 400
            });
        }

        let finalReels = [];
        const correctDevKey = context.env.DEV_KEY;

        // Check if dev mode is activated and the key is correct.
        // (개발자 모드가 활성화되었고 키가 정확한지 확인합니다.)
        if (correctDevKey && devKey === correctDevKey) {
            console.log("DEV MODE: Forcing a win.");
            finalReels = ['7️⃣', '7️⃣', '7️⃣', '💎', '💰', '🍀', '🔔', '🌸', '🍒']; // Guaranteed win on the first line (첫 줄 무조건 당첨)
        } else {
            // Normal random generation
            // (일반 무작위 생성)
            for (let i = 0; i < (config.gridSize * config.gridSize); i++) {
                finalReels.push(config.symbols[Math.floor(Math.random() * config.symbols.length)]);
            }
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
    }
}
