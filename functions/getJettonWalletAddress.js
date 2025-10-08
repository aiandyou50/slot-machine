import { TonClient } from "@ton/ton";
import { Address, beginCell } from "@ton/core";

export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { ownerAddress, jettonMinterAddress } = await request.json();

        if (!ownerAddress || !jettonMinterAddress) {
            return new Response(JSON.stringify({ error: "INVALID_REQUEST", details: "ownerAddress and jettonMinterAddress are required." }), { status: 400 });
        }

        // (KO) 환경 변수에서 API 키를 사용하여 TonClient를 초기화합니다.
        // (EN) Initialize TonClient using the API key from environment variables.
        const client = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            apiKey: env.TONCENTER_API_KEY,
        });

        const ownerAddr = Address.parse(ownerAddress);
        const jettonMinterAddr = Address.parse(jettonMinterAddress);
        const ownerWalletSlice = beginCell().storeAddress(ownerAddr).endCell().asSlice();

        // (KO) 스마트 컨트랙트의 'get_wallet_address' 메소드를 호출합니다.
        // (EN) Call the 'get_wallet_address' method of the smart contract.
        const { stack } = await client.runMethod(jettonMinterAddr, 'get_wallet_address', [
            { type: 'slice', cell: ownerWalletSlice.asCell() }
        ]);

        const userJettonWalletAddress = stack.readAddress();

        return new Response(JSON.stringify({ jettonWalletAddress: userJettonWalletAddress.toString() }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        console.error("Error in /getJettonWalletAddress:", e);
        // (KO) runMethod에서 exit_code가 -13인 경우 등 상세 오류를 클라이언트에 전달할 수 있습니다.
        // (EN) Detailed errors, such as exit_code: -13 from runMethod, can be passed to the client.
        return new Response(JSON.stringify({ error: "INTERNAL_SERVER_ERROR", details: e.message }), { status: 500 });
    }
}