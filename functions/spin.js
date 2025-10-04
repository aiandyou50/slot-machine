/**
 * Cloudflare Worker for CandleSpinner Game Logic
 * (클라우드플레어 워커: 캔들스피너 게임 로직)
 *
 * @version 1.1.7 (Backend Logic)
 * @date 2025-10-05
 *
 * @changelog
 * - v1.1.7 (2025-10-05): [DEBUG] Added robust error handling around the dynamic import of TonWeb to diagnose persistent server crashes.
 * (지속적인 서버 다운 현상을 진단하기 위해 TonWeb 동적 import 구문에 강력한 오류 처리 로직을 추가했습니다.)
 * - v1.1.6 (2025-10-05): [CRITICAL BUGFIX] Re-added the missing dynamic import for TonWeb.
 * (누락되었던 TonWeb의 동적 import 구문을 다시 추가했습니다.)
 */

// --- ⚙️ Game Configuration (게임 설정) ---
const config = {
    symbols: ['🌸', '💎', '🍀', '🔔', '💰', '7️⃣'],
    gridSize: 3,
    payoutMultipliers: { '🌸': 5, '💎': 10, '🍀': 15, '🔔': 20, '💰': 50, '7️⃣': 100 },
    tokenMasterAddress: "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV",
    tokenDecimals: 9,
};

function calculateResult(finalReels, betAmount) {
    let totalPayout = 0;
    for (let i = 0; i < config.gridSize; i++) {
        const lineStartIndex = i * config.gridSize;
        const s1 = finalReels[lineStartIndex], s2 = finalReels[lineStartIndex + 1], s3 = finalReels[lineStartIndex + 2];
        if (s1 === s2 && s2 === s3) { totalPayout += betAmount * (config.payoutMultipliers[s1] || 0); }
    }
    return { symbols: finalReels, isWin: totalPayout > 0, payout: totalPayout };
}

async function sendPayoutTransaction(context, recipientAddress, payoutAmount) {
    let TonWeb;
    try {
        // Add robust checking for the imported module.
        // (import된 모듈에 대한 강력한 검사를 추가합니다.)
        const TonWebModule = await import('https://esm.sh/tonweb@0.0.66');
        if (!TonWebModule || !TonWebModule.default) {
            throw new Error("Failed to import TonWeb library or its default export is missing.");
        }
        TonWeb = TonWebModule.default;
    } catch (importError) {
        console.error("TonWeb import failed:", importError);
        throw new Error(`TonWeb library import failed: ${importError.message}`);
    }
    
    const mnemonic = context.env.GAME_WALLET_MNEMONIC;
    if (!mnemonic) { throw new Error("CRITICAL: GAME_WALLET_MNEMONIC is not set."); }

    const httpProvider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');
    const keyPair = await TonWeb.utils.mnemonicToKeyPair(mnemonic.split(' '));
    const WalletClass = TonWeb.Wallets.all.v4R2;
    const wallet = new WalletClass(httpProvider, { publicKey: keyPair.publicKey });
    const gameWalletAddress = await wallet.getAddress();
    const jettonMinter = new TonWeb.token.jetton.JettonMinter(httpProvider, { address: config.tokenMasterAddress });
    const gameJettonWalletAddress = await jettonMinter.getJettonWalletAddress(gameWalletAddress);
    const gameJettonWallet = new TonWeb.token.jetton.JettonWallet(httpProvider, { address: gameJettonWalletAddress.toString(true, true, true) });
    const amountInNano = new TonWeb.utils.BN(payoutAmount).mul(new TonWeb.utils.BN(10).pow(new TonWeb.utils.BN(config.tokenDecimals)));
    const seqno = await wallet.methods.seqno().call();
    const transferPayload = await gameJettonWallet.createTransferBody({
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
        const devKey = requestData.devKey;

        if (!betAmount || betAmount <= 0 || !userAddress) {
            return new Response(JSON.stringify({ success: false, message: "Invalid bet amount or user address." }), { headers: { 'Content-Type': 'application/json' }, status: 400 });
        }

        let finalReels = [];
        const correctDevKey = context.env.DEV_KEY;
        if (correctDevKey && devKey === correctDevKey) {
            console.log("DEV MODE: Forcing a win.");
            finalReels = ['7️⃣', '7️⃣', '7️⃣', '💎', '💰', '🍀', '🔔', '🌸', '🍒'];
        } else {
            for (let i = 0; i < 9; i++) { finalReels.push(config.symbols[Math.floor(Math.random() * config.symbols.length)]); }
        }
        
        const result = calculateResult(finalReels, betAmount);
        
        if (result.isWin) {
            console.log(`WIN! Attempting to send ${result.payout} CSPIN to ${userAddress}`);
            try {
                await sendPayoutTransaction(context, userAddress, result.payout);
            } catch (payoutError) {
                console.error("Payout failed:", payoutError);
                return new Response(JSON.stringify({ success: false, message: `Payout Error: ${payoutError.message}` }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Spin successful!", data: result }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
    } catch (error) {
        console.error("Error in /spin function:", error);
        return new Response(JSON.stringify({ success: false, message: `General Error: ${error.message}` }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
    }
}
