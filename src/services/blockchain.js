import { Address, toNano, beginCell, contractAddress, Cell } from '@ton/core';
import JETTON_WALLET_CODE_BOC from '../contract/jetton-wallet-code.txt?raw';

/**
 * (KO) 사용자의 Jetton 지갑 주소를 클라이언트 측에서 직접 계산합니다.
 * (EN) Calculates the user's Jetton wallet address directly on the client-side.
 * @param {string} ownerAddress - (KO) 사용자 지갑 주소 (EN) The user's wallet address.
 * @param {string} jettonMinterAddress - (KO) Jetton 마스터 컨트랙트 주소 (EN) The Jetton master contract address.
 * @returns {Address} The calculated user's Jetton wallet address.
 */
export function calculateJettonWalletAddress(ownerAddress, jettonMinterAddress) {
  const owner = Address.parse(ownerAddress);
  const minter = Address.parse(jettonMinterAddress);

  // (KO) 표준 Jetton 지갑의 코드 셀을 가져옵니다.
  // (EN) Get the code cell for a standard Jetton wallet.
  const walletCode = Cell.fromBase64(JETTON_WALLET_CODE_BOC.trim());

  // (KO) Jetton 지갑의 초기 데이터 셀을 구성합니다.
  // (EN) Construct the initial data cell for the Jetton wallet.
  const data = beginCell()
    .storeCoins(0) // balance
    .storeAddress(owner)
    .storeAddress(minter)
    .endCell();

  // (KO) stateInit 객체는 코드와 데이터를 포함합니다.
  // (EN) The stateInit object contains the code and data.
  const stateInit = {
    code: walletCode,
    data: data,
  };

  // (KO) workchain 0에서 컨트랙트 주소를 계산합니다.
  // (EN) Calculate the contract address on workchain 0.
  const jettonWalletAddress = contractAddress(0, stateInit);

  return jettonWalletAddress;
}

/**
 * (KO) 블록체인 관련 유틸리티 함수 모음
 * (EN) A collection of blockchain-related utility functions
 */

const GAME_WALLET_ADDRESS = 'UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd';

/**
 * (KO) @ton/core를 사용하여 Jetton 전송을 위한 메시지 본문을 생성합니다.
 * (EN) Creates the message body for a Jetton transfer using @ton/core.
 * @param {string} jettonAmount - (KO) 나노 단위가 아닌, 전송할 토큰의 양 (EN) The amount of tokens to transfer, not in nano-units.
 * @param {string} toAddress - (KO) 수신자 주소 (EN) The recipient's address.
 * @param {string} responseAddress - (KO) 응답(초과 가스)을 받을 주소 (EN) The address to receive the response (excess gas).
 * @returns {Cell} The message body cell.
 */
export function createJettonTransferPayload(
  jettonAmount,
  toAddress,
  responseAddress
) {
  try {
    const payload = beginCell()
      .storeUint(0x0f8a7ea5, 32) // (KO) Jetton 전송 op-code (EN) op-code for jetton transfer
      .storeUint(0, 64) // (KO) query_id (EN) query_id
      .storeCoins(toNano(jettonAmount)) // (KO) 전송할 Jetton 양 (EN) amount of Jettons to send
      .storeAddress(Address.parse(toAddress)) // (KO) 수신자 주소 (EN) recipient address
      .storeAddress(Address.parse(responseAddress)) // (KO) 응답 주소 (EN) response address
      .storeBit(false) // (KO) 커스텀 페이로드 없음 (EN) no custom payload
      .storeCoins(0) // (KO) 포워딩할 TON 없음 (EN) no TON to forward
      .storeBit(false) // (KO) 포워드 페이로드 없음 (EN) no forward payload
      .endCell();

    if (!payload) {
      throw new Error('Payload serialization failed');
    }

    return payload;
  } catch (error) {
    console.error('[KO] Jetton 전송 메시지 생성 오류:', error);
    console.error('[EN] Jetton transfer message creation error:', error);
    throw error;
  }
}

/**
 * (KO) 스핀 트랜잭션 객체를 생성합니다.
 * (EN) Creates the spin transaction object.
 * @param {string} jettonWalletAddress - (KO) 사용자의 Jetton 지갑 주소 (EN) The user's Jetton wallet address.
 * @param {number} betAmount - (KO) 베팅 금액 (EN) The bet amount.
 * @param {string} userWalletAddress - (KO) 사용자의 기본 지갑 주소 (EN) The user's base wallet address.
 * @returns {object} The transaction object for TonConnectUI.
 */
export function createSpinTransaction(
  jettonWalletAddress,
  betAmount,
  userWalletAddress
) {
  try {
    // (KO) 입력값 검증 로직을 리팩토링합니다.
    // (EN) Refactor input validation logic.
    if (!Address.isValid(GAME_WALLET_ADDRESS)) {
      throw new Error(`Invalid GAME_WALLET_ADDRESS: ${GAME_WALLET_ADDRESS}`);
    }
    if (!Address.isValid(userWalletAddress)) {
      throw new Error(`Invalid userWalletAddress: ${userWalletAddress}`);
    }
    if (typeof betAmount !== 'number' || betAmount <= 0 || betAmount > 1000000) {
      throw new Error(`Invalid betAmount: ${betAmount}`);
    }

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
        },
      ],
    };
  } catch (err) {
    // (KO) 오류 발생 시 상세 로그 출력
    // (EN) Log detailed error information
    console.error('[KO] 스핀 트랜잭션 생성 오류:', err.message);
    console.error('[EN] Spin transaction creation error:', err.message);
    throw err;
  }
}