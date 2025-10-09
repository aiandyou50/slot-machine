import { Address, toNano, beginCell } from '@ton/core';

/**
 * (KO) 블록체인 관련 유틸리티 함수 모음
 * (EN) A collection of blockchain-related utility functions
 */

const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";

/**
 * (KO) @ton/core를 사용하여 Jetton 전송을 위한 메시지 본문을 생성합니다.
 * (EN) Creates the message body for a Jetton transfer using @ton/core.
 * @param {string} jettonAmount - (KO) 나노 단위가 아닌, 전송할 토큰의 양 (EN) The amount of tokens to transfer, not in nano-units.
 * @param {string} toAddress - (KO) 수신자 주소 (EN) The recipient's address.
 * @param {string} responseAddress - (KO) 응답(초과 가스)을 받을 주소 (EN) The address to receive the response (excess gas).
 * @returns {Cell} The message body cell.
 */
export function createJettonTransferPayload(jettonAmount, toAddress, responseAddress) {
    // (KO) 이 함수는 이제 순수하게 데이터 변환 책임만 가집니다.
    // (EN) This function now purely holds the responsibility for data transformation.
    const forwardPayload = beginCell()
        .storeUint(0, 32) // (KO) 텍스트 주석을 위한 op-code (EN) op-code for a text comment
        .storeStringTail("Bet")
        .endCell();

    return beginCell()
        .storeUint(0x0f8a7ea5, 32) // (KO) Jetton 전송 op-code (EN) op-code for jetton transfer
        .storeUint(0, 64) // (KO) query_id (EN) query_id
        .storeCoins(toNano(jettonAmount))
        .storeAddress(Address.parse(toAddress))
        .storeAddress(Address.parse(responseAddress))
        .storeBit(false) // (KO) 커스텀 페이로드 없음 (EN) no custom payload
        .storeCoins(toNano('0.01')) // (KO) 포워딩 수수료 (EN) forward fee
        .storeBit(true) // (KO) 포워드 페이로드 포함 (EN) forward payload included
        .storeRef(forwardPayload)
        .endCell();
}

/**
 * (KO) 스핀 트랜잭션 객체를 생성합니다.
 * (EN) Creates the spin transaction object.
 * @param {string} jettonWalletAddress - (KO) 사용자의 Jetton 지갑 주소 (EN) The user's Jetton wallet address.
 * @param {number} betAmount - (KO) 베팅 금액 (EN) The bet amount.
 * @param {string} userWalletAddress - (KO) 사용자의 기본 지갑 주소 (EN) The user's base wallet address.
 * @returns {object} The transaction object for TonConnectUI.
 */
export function createSpinTransaction(jettonWalletAddress, betAmount, userWalletAddress) {
    const transferPayload = createJettonTransferPayload(
        betAmount.toString(),
        GAME_WALLET_ADDRESS,
        userWalletAddress
    );

    return {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: jettonWalletAddress,
          amount: toNano('0.05').toString(), // (KO) 가스비 (EN) Gas fee
          payload: transferPayload.toBoc().toString('base64'),
        }
      ]
    };
}