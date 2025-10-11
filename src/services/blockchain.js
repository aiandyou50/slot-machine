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
    // (KO) 가장 표준적이고 단순한 Jetton 전송 페이로드로 수정합니다. 불필요한 forward 필드를 제거하여 데이터 손상을 방지합니다.
    // (EN) Modified to the most standard and simple Jetton transfer payload. Removed unnecessary forward fields to prevent data corruption.
    const payload = beginCell()
      .storeUint(0x0f8a7ea5, 32) // op-code for jetton transfer
      .storeUint(0, 64) // query_id
      .storeCoins(toNano(jettonAmount)) // amount of Jettons to send
      .storeAddress(Address.parse(toAddress)) // recipient address
      .storeAddress(Address.parse(responseAddress)) // response address
      .storeBit(false) // custom payload is null
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

  // (KO) 개발자 모드에서는 BOC(원본 바이너리)와 Base64, 그리고 생성된 deep-link를 콘솔에 출력합니다.
  // (EN) In developer mode, print the raw BOC (binary), Base64 string, and the generated deep-link to the console.
  const bocBuffer = transferPayload.toBoc();
  // Compute base64 once and reuse it (avoids multiple toString calls and makes it accessible)
  const base64Boc = bocBuffer.toString('base64');

    // (KO) 로깅 활성화 조건: 개발 모드이거나(local dev) 브라우저에서 수동 토글(localStorage 'BOC_DEBUG' === '1')이 켜진 경우에만 로그를 남깁니다.
    // (EN) Logging enabled only in dev mode or when the manual localStorage toggle ('BOC_DEBUG' === '1') is set by a developer in the browser.
    const localToggle = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('BOC_DEBUG') === '1');
    const shouldLog = (import.meta.env && import.meta.env.DEV) || localToggle;

    if (shouldLog) {
      try {
        // (KO) Raw BOC 출력 (Uint8Array/Buffer 형태)
        // (EN) Log raw BOC (Uint8Array/Buffer)
        console.error('[DEBUG] Raw BOC (Uint8Array):', bocBuffer);

        // (KO) Base64 인코딩 출력
        // (EN) Base64-encoded BOC
        console.error('[DEBUG] Base64 BOC:', base64Boc);

        // (KO) Full deep-link 예시 출력 (URL 인코딩 포함)
        // (EN) Full deep-link example (with URL encoding)
        const deepLink = `ton://transfer/?payload=${encodeURIComponent(base64Boc)}`;
        console.error('[DEBUG] Full deep-link:', deepLink);

        // (KO) 편의상 현재 페이지에서 쉽게 값을 복사할 수 있도록 전역에 노출합니다.
        // (EN) For convenience expose values on window so developers can retrieve them without special tooling.
        try {
          if (typeof window !== 'undefined') {
            window.__LAST_BASE64_BOC = base64Boc;
            window.__LAST_DEEP_LINK = deepLink;
          }
        } catch (ex) {
          // ignore
        }
      } catch (logErr) {
        // (KO) 로깅 중 예외가 발생해도 실행 흐름을 방해하지 않습니다.
        // (EN) Do not let logging errors break the main flow.
        console.error('[DEBUG] BOC logging error:', logErr);
      }
    }

    return {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: jettonWalletAddress,
          amount: toNano('0.05').toString(), // (KO) 가스비 (EN) Gas fee
          payload: base64Boc,
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