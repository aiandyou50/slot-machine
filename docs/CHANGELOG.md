---
document_type: Changelog
version: 1.0
last_updated: 2025-10-11
status: final
ai_optimized: true
estimated_read_time: 8 min
---

# Changelog

All notable changes to this project will be documented in this file.

<<<<<<< HEAD
## [3.1.13] - 2025-10-10

### Fixed / Improved
- **(EN) Backend Security Hardening:**
  - **Error:** JWT tickets with missing or forged payloads could bypass detailed logging and monitoring.
  - **Cause:** Only generic INVALID_TICKET errors were returned for JWT verification failures, making it hard to distinguish malicious attempts.
  - **Solution:** Added INVALID_TICKET_PAYLOAD error code and enhanced logging for missing spinId in claimPrize.js and doubleUp.js.
- **(KO) 백엔드 보안 강화:**
  - **문제:** JWT 페이로드가 누락되거나 위조된 경우, 상세 로깅 및 모니터링이 어려움.
  - **원인:** JWT 검증 실패 시 일반적인 INVALID_TICKET 오류만 반환되어 악의적 시도 구분이 어려움.
  - **해결:** claimPrize.js, doubleUp.js에서 spinId 누락 시 INVALID_TICKET_PAYLOAD 오류 코드 및 로깅 강화.

- **(EN) Transaction Ownership Verification:**
  - **Error:** Users could submit transactions (BOC) not signed by their own wallet, risking prize theft.
  - **Cause:** verifyTransaction in revealSpin.js did not check sender address against userAddress.
  - **Solution:** Added strict sender address check; returns INVALID_TRANSACTION if mismatch.
- **(KO) 트랜잭션 소유권 검증:**
  - **문제:** 사용자가 본인 지갑이 아닌 트랜잭션을 제출할 수 있어 상금 탈취 위험.
  - **원인:** revealSpin.js의 verifyTransaction에서 발신자 주소와 userAddress 일치 여부 미검증.
  - **해결:** 발신자 주소 불일치 시 INVALID_TRANSACTION 반환.

- **(EN) Documentation Consistency:**
  - **Error:** PROJECT_ARCHITECTURE.MD referenced obsolete /getJettonWalletAddress API.
  - **Cause:** API was removed and replaced by client-side calculation.
  - **Solution:** Removed all references to /getJettonWalletAddress and updated docs to reflect client-side calculation.
- **(KO) 문서 일관성 확보:**
  - **문제:** PROJECT_ARCHITECTURE.MD에 삭제된 /getJettonWalletAddress API가 남아있음.
  - **원인:** API가 삭제되고 클라이언트 계산 방식으로 변경됨.
  - **해결:** 관련 다이어그램 및 명세 삭제, 클라이언트 계산 방식으로 문서 최신화.

- **(EN) ADR-002 Status Update:**
  - **Error:** ADR-002 suggested backend proxy pattern, now obsolete.
  - **Cause:** Client-side calculation is more robust and secure.
  - **Solution:** ADR-002 status changed to Superseded, with historical note added.
- **(KO) ADR-002 상태 변경:**
  - **문제:** ADR-002가 더 이상 적용되지 않는 백엔드 프록시 패턴을 제안함.
  - **원인:** 클라이언트 직접 계산 방식이 더 안전하고 견고함.
  - **해결:** ADR-002 상태를 대체됨(Superseded)으로 변경, 역사적 설명 추가.

- **(EN) Hybrid Loading for @tonconnect/ui:**
  - **Error:** NPM-only loading caused manifest errors and wallet connection instability.
  - **Cause:** ADR-003 required hybrid CDN/NPM loading for reliability.
  - **Solution:** Removed @tonconnect/ui from package.json, restored CDN CSS/JS loading in index.html, and switched to window.TonConnectUI in main.js.
- **(KO) @tonconnect/ui 하이브리드 로딩 복원:**
  - **문제:** NPM 단독 로딩 시 manifest 오류 및 지갑 연결 불안정 발생.
  - **원인:** ADR-003에서 CDN/NPM 하이브리드 로딩을 요구함.
  - **해결:** package.json에서 @tonconnect/ui 제거, index.html에 CDN CSS/JS 추가, main.js에서 window.TonConnectUI 사용.

## [3.1.12] - 2025-10-10

### Fixed
- **(EN) Fixed Vite build error by splitting Jetton Wallet code BOC into multiple lines. Jetton transfer payload logic refactored to strictly follow standard, resolving CRC32C error.**
- **(KO) Jetton Wallet 코드 BOC를 여러 줄로 분할하여 Vite 빌드 오류를 해결. Jetton 트랜스퍼 페이로드 로직을 표준에 맞게 리팩터링하여 CRC32C 오류 수정.**

## [3.1.11] - 2025-10-10

### Fixed
- **(EN) Math.random() usage in doubleUp.js violates provable fairness principle:**
  - **Error:** The `doubleUp.js` function was using `Math.random()` on line 121 to determine double-up win/loss results, which violates the project's core principle of provable fairness as specified in AI_AGENT_GUIDELINES.md Section 6 (Forbidden Actions).
  - **Cause:** The previous implementation relied on JavaScript's non-deterministic `Math.random()` function, making the double-up results unpredictable and unverifiable by users, contradicting the Commit-Reveal scheme used in the spin functionality.
  - **Solution:** Replaced `Math.random()` with a deterministic PRNG (Pseudo-Random Number Generator) based on `createDeterministicRandom()` function. The seed is generated from a combination of `ticketId`, user `choice`, and `payout` amount, ensuring the result is deterministic yet unpredictable. This maintains fairness while allowing cryptographic verification.
- **(KO) doubleUp.js에서 Math.random() 사용이 검증 가능한 공정성 원칙을 위반:**
  - **문제:** `doubleUp.js` 함수가 더블업 승/패 결과를 결정하기 위해 121번째 줄에서 `Math.random()`을 사용하고 있었으며, 이는 AI_AGENT_GUIDELINES.md 섹션 6 (금지 조항)에 명시된 검증 가능한 공정성이라는 프로젝트의 핵심 원칙을 위반합니다.
  - **원인:** 이전 구현은 JavaScript의 비결정론적 `Math.random()` 함수에 의존했으며, 이로 인해 더블업 결과를 사용자가 예측하거나 검증할 수 없어 스핀 기능에서 사용되는 Commit-Reveal 방식과 모순됩니다.
  - **해결:** `Math.random()`을 `createDeterministicRandom()` 함수 기반의 결정론적 PRNG(의사 난수 생성기)로 교체했습니다. 시드는 `ticketId`, 사용자 `choice`, `payout` 금액의 조합으로 생성되어 결과가 결정론적이면서도 예측 불가능하도록 보장합니다. 이를 통해 공정성을 유지하면서 암호학적 검증이 가능합니다.

## [3.1.10] - 2025-10-10

### Fixed
- **(KO) 스핀 트랜잭션 생성 시 입력값 유효성 검증 및 오류 로그 출력 추가:**
  - **문제 (Error):** 잘못된 TON 주소 또는 비정상적인 베팅 금액으로 인해 'Invalid CRC32C' 오류가 발생할 수 있음.
  - **원인 (Cause):** 입력값(지갑 주소, 베팅 금액) 검증이 부족하여 블록체인에 잘못된 데이터가 전송됨.
  - **해결 (Solution):** TON 주소 형식 및 베팅 금액에 대한 유효성 검증 로직을 추가하고, 오류 발생 시 상세 로그와 안내 메시지를 출력하도록 개선.
- **(EN) Added input validation and error logging for spin transaction creation:**
  - **Error:** 'Invalid CRC32C' error may occur due to invalid TON address or abnormal bet amount.
  - **Cause:** Lack of validation for input values (wallet address, bet amount) leads to sending incorrect data to the blockchain.
  - **Solution:** Added validation logic for TON address format and bet amount, and improved error logging and user guidance on error.

## [3.1.9] - 2025-10-10

### Fixed
- **(KO) TON Wallet Manifest 오류 재발 및 절대 경로 미적용 문제 해결:**
  - **문제 (Error):** manifestUrl이 상대 경로(`/tonconnect-manifest.json`)로 지정되어 TON Wallet이 manifest를 불러오지 못함.
  - **원인 (Cause):** dApp 코드에서 manifestUrl을 절대 경로(https://aiandyou.me/tonconnect-manifest.json)로 지정하지 않아 외부 접근 불가.
  - **해결 (Solution):** manifestUrl을 절대 경로로 변경하여 TON Wallet이 manifest를 정상적으로 불러올 수 있도록 수정.
- **(EN) Fixed recurring TON Wallet manifest error due to missing absolute manifestUrl:**
  - **Error:** TON Wallet could not fetch the manifest because manifestUrl was set as a relative path (`/tonconnect-manifest.json`).
  - **Cause:** The dApp code did not specify manifestUrl as an absolute path (`https://aiandyou.me/tonconnect-manifest.json`), preventing external access.
  - **Solution:** Changed manifestUrl to an absolute path so TON Wallet can successfully fetch the manifest.

## [3.1.8] - 2025-10-10

### Fixed
- **(KO) TON Wallet Manifest 오류 및 연결 실패 근본 해결:**
  - **문제 (Error):** TON Wallet 연결 시 'App Manifest Error' 발생.
  - **원인 (Cause):** `tonconnect-manifest.json`에 필수 필드(`network`) 누락 및 `iconUrl`이 상대 경로(`/icon.png`)로 지정되어 외부 접근 불가.
  - **해결 (Solution):** manifest에 `network` 필드 추가, `iconUrl`을 절대 경로(`https://aiandyou.me/icon.png`)로 수정하여 TON Connect 명세를 완전히 준수.
- **(EN) Fundamentally resolved TON Wallet manifest error and connection failure:**
  - **Error:** 'App Manifest Error' occurred when connecting to TON Wallet.
  - **Cause:** Missing required field (`network`) and relative `iconUrl` in `tonconnect-manifest.json` prevented manifest validation and external access.
  - **Solution:** Added `network` field and changed `iconUrl` to absolute path (`https://aiandyou.me/icon.png`) for full TON Connect spec compliance.

## [3.1.7] - 2025-10-10
=======
> **작성 규칙 (Writing Rules):**
> 1. 모든 항목은 Error-Cause-Solution 3단계 구조 필수
> 2. 요구사항 ID 반드시 참조 ([BUG-XXX] 또는 [FR-XXX])
> 3. 한국어(KO)와 영어(EN) 병기 필수
> 4. 파일명:줄번호 또는 구체적 위치 명시

---

## [Unreleased]

현재 진행 중인 작업 없음.

---

## [3.1.13] - 2025-10-10
>>>>>>> 51e7e4273b85d9f139be292c0872379e4b88d685

### Fixed

- **(KO) [BUG-004] 지갑 재연결 및 `Invalid CRC32C` 오류 등 모든 스핀 관련 오류 근본 해결:**
  - **문제 (Error):** 1) 스핀 실행 시, 손상된 거래 정보로 인해 `Invalid CRC32C` 오류 발생. 2) 이 오류 발생 후, `tonconnect-manifest.json` 설정 오류로 인해 지갑 재연결 실패. 3) 이전에는 외부 API 의존으로 인한 다양한 서버 오류(4xx, 5xx)도 발생.
  - **원인 (Cause):** 1) **지갑 재연결 실패:** `tonconnect-manifest.json`의 `url`이 실제 서비스 주소와 일치하지 않고, `iconUrl`이 외부 도메인을 가리키고 있어, 지갑이 Manifest 유효성 검증에 실패. 2) **`Invalid CRC32C` 오류:** Jetton 전송 정보에 포함된 불필요한 `forward_payload` 및 `forward_ton_amount` 필드가 데이터 구조를 손상시킴. 3) **API 오류:** `Toncenter` API의 `runMethod` 기능이 유료 플랜에서만 제공되어 발생.
  - **해결 (Solution):**
    1. **Manifest 문제 해결:** `tonconnect-manifest.json`의 `url`을 실제 서비스 주소(`https://aiandyou.me`)로, `iconUrl`을 로컬 경로(`/icon.png`)로 수정하여 재연결 문제를 해결했습니다.
    2. **거래 정보 단순화:** `src/services/blockchain.js`에서 데이터 손상의 원인이었던 `forward_payload`와 `forward_ton_amount`를 모두 제거하여, 깨끗하고 표준적인 거래 정보(BOC)를 생성하도록 수정했습니다.
    3. **클라이언트 측 주소 계산:** 외부 API 의존성을 완전히 제거하고, `@ton/core` 라이브러리를 사용하여 클라이언트 측에서 Jetton 지갑 주소를 직접 계산하는 안정적인 아키텍처를 유지했습니다.
    4. 이 세 가지 수정을 통해 모든 알려진 오류를 근본적으로 해결하고, 코드의 안정성과 신뢰도를 크게 향상시켰습니다.

- **(EN) [BUG-004] Fundamentally Resolved All Spin-Related Errors, Including Wallet Reconnection and `Invalid CRC32C`:**
  - **Error:** 1) An `Invalid CRC32C` error occurred on spin due to corrupted transaction data. 2) After this error, wallet reconnection failed due to an incorrect `tonconnect-manifest.json` configuration. 3) Previously, various server errors (4xx, 5xx) also occurred due to external API dependency.
  - **Cause:** 1) **Wallet Reconnection Failure:** The `url` in `tonconnect-manifest.json` did not match the production service address, and the `iconUrl` pointed to an external domain, causing the wallet to fail manifest validation. 2) **`Invalid CRC32C` Error:** Unnecessary `forward_payload` and `forward_ton_amount` fields in the Jetton transfer message were corrupting the data structure. 3) **API Errors:** The `runMethod` feature of the `Toncenter` API is only available on paid plans.
  - **Solution:**
    1. **Fixed Manifest:** Resolved the reconnection issue by correcting the `url` in `tonconnect-manifest.json` to the production service address (`https://aiandyou.me`) and the `iconUrl` to a local path (`/icon.png`).
    2. **Simplified Transaction Data:** The `forward_payload` and `forward_ton_amount`, which were the source of data corruption, were completely removed from the transaction creation logic in `src/services/blockchain.js` to generate a clean, standard BOC.
    3. **Client-Side Address Calculation:** Maintained the stable architecture of calculating the Jetton wallet address directly on the client-side using the `@ton/core` library, completely removing the external API dependency.
    4. These three fixes fundamentally resolve all known errors and significantly improve the application's stability and reliability.

## [3.1.11] - 2025-10-10

### Fixed

- **(KO) [BUG-003] doubleUp.js에서 Math.random() 사용이 검증 가능한 공정성 원칙을 위반:**
  - **문제 (Error):** `doubleUp.js` 함수가 더블업 승/패 결과를 결정하기 위해 121번째 줄에서 `Math.random()`을 사용하고 있었으며, 이는 AI_AGENT_GUIDELINES.md Section 6 (금지 조항)에 명시된 검증 가능한 공정성이라는 프로젝트의 핵심 원칙을 위반합니다.
  - **원인 (Cause):** 이전 구현은 JavaScript의 비결정론적 `Math.random()` 함수에 의존했으며, 이로 인해 더블업 결과를 사용자가 예측하거나 검증할 수 없어 스핀 기능에서 사용되는 Commit-Reveal 방식과 모순됩니다.
  - **해결 (Solution):**
    1. `Math.random()`을 `createDeterministicRandom()` 함수 기반의 결정론적 PRNG(의사 난수 생성기)로 교체했습니다.
    2. 시드는 `ticketId`, 사용자 `choice`, `payout` 금액의 조합으로 생성되어 결과가 결정론적이면서도 예측 불가능하도록 보장합니다.
    3. 이를 통해 공정성을 유지하면서 암호학적 검증이 가능합니다.
    4. `PROJECT_ARCHITECTURE.MD` Section 3.1 (설계 규칙 1) 준수 확인.

- **(EN) [BUG-003] Math.random() usage in doubleUp.js violates provable fairness principle:**
  - **Error:** The `doubleUp.js` function was using `Math.random()` on line 121 to determine double-up win/loss results, which violates the project's core principle of provable fairness as specified in AI_AGENT_GUIDELINES.md Section 6 (Forbidden Actions).
  - **Cause:** The previous implementation relied on JavaScript's non-deterministic `Math.random()` function, making the double-up results unpredictable and unverifiable by users, contradicting the Commit-Reveal scheme used in the spin functionality.
  - **Solution:**
    1. Replaced `Math.random()` with a deterministic PRNG (Pseudo-Random Number Generator) based on `createDeterministicRandom()` function.
    2. The seed is generated from a combination of `ticketId`, user `choice`, and `payout` amount, ensuring the result is deterministic yet unpredictable.
    3. This maintains fairness while allowing cryptographic verification.
    4. Verified compliance with `PROJECT_ARCHITECTURE.MD` Section 3.1 (Design Rule 1).

## [3.1.10] - 2025-10-10

### Fixed

- **(KO) [NFR-DOC-05] 스핀 트랜잭션 생성 시 입력값 유효성 검증 및 오류 로그 출력 추가:**
  - **문제 (Error):** 잘못된 TON 주소 또는 비정상적인 베팅 금액으로 인해 'Invalid CRC32C' 오류가 발생할 수 있음. `src/services/blockchain.js` 파일에서 입력값 검증 부재.
  - **원인 (Cause):** 입력값(지갑 주소, 베팅 금액) 검증이 부족하여 블록체인에 잘못된 데이터가 전송됨. 오류 발생 시 디버깅을 위한 상세 로그가 없어 문제 추적 어려움.
  - **해결 (Solution):**
    1. TON 주소 형식 검증 로직 추가 (`Address.parse()` 사용).
    2. 베팅 금액에 대한 범위 검증 추가 (양수, 최소/최대 값).
    3. 오류 발생 시 상세 로그 출력 (`console.error`).
    4. 사용자에게 친화적인 오류 메시지 제공.
    5. `PROJECT_REQUIREMENTS.md` Section 4에 [NFR-DOC-05] 요구사항 추가.

- **(EN) [NFR-DOC-05] Added input validation and error logging for spin transaction creation:**
  - **Error:** 'Invalid CRC32C' error may occur due to invalid TON address or abnormal bet amount. Missing input validation in `src/services/blockchain.js`.
  - **Cause:** Lack of validation for input values (wallet address, bet amount) leads to sending incorrect data to the blockchain. Insufficient error logging makes debugging difficult.
  - **Solution:**
    1. Added TON address format validation using `Address.parse()`.
    2. Added bet amount range validation (positive, min/max values).
    3. Added detailed error logging using `console.error`.
    4. Provided user-friendly error messages.
    5. Added [NFR-DOC-05] requirement to `PROJECT_REQUIREMENTS.md` Section 4.

## [3.1.0] - 2025-10-09

### Added

- **(KO) [NFR-GAME-01] 검증 가능한 공정성(Provable Fairness)을 위한 Commit-Reveal 스킴 도입:**
  - **문제 (Error):** 기존 스핀 로직은 `Math.random()`을 사용하여 서버를 신뢰해야만 하는 중앙화된 방식이었으며, 이는 프로젝트의 핵심 요구사항인 '투명성'과 '공정성'을 위반했습니다. `functions/spin.js` (폐기됨).
  - **원인 (Cause):** 서버가 `Math.random()`을 사용하여 단독으로 결과를 결정하므로, 사용자가 결과의 공정성을 검증할 방법이 없었습니다.
  - **해결 (Solution):**
    1. 기존 `/spin` API를 폐기하고, 2단계 API (`GET /commitSpin`, `POST /revealSpin`)를 새로 구현했습니다.
    2. 서버는 `serverSeed`의 해시(`commitment`)를 먼저 사용자에게 제공하고, 스핀이 실행된 후에 `serverSeed` 원본을 공개합니다.
    3. 프론트엔드는 `serverSeed`를 직접 해시하여 게임 시작 전 받은 `commitment`와 일치하는지 자동으로 검증하여, 결과가 조작되지 않았음을 암호학적으로 증명합니다.
    4. 이를 통해 사용자는 더 이상 서버를 신뢰할 필요 없이 모든 게임 결과의 공정성을 직접 검증할 수 있습니다.
    5. `PROJECT_ARCHITECTURE.MD` Section 3.1 (설계 규칙 1) 추가 및 ADR-001 작성.

- **(EN) [NFR-GAME-01] Implemented Commit-Reveal Scheme for Provable Fairness:**
  - **Error:** The previous spin logic used `Math.random()`, a centralized approach that required trusting the server and violated the project's core requirements for 'transparency' and 'fairness'. `functions/spin.js` (deprecated).
  - **Cause:** The server used `Math.random()` to determine results independently, leaving users with no way to verify fairness.
  - **Solution:**
    1. Deprecated the old `/spin` API and implemented a new two-phase API (`GET /commitSpin`, `POST /revealSpin`).
    2. The server now provides a hash of its `serverSeed` (the `commitment`) to the user before the spin, and only reveals the original `serverSeed` after the spin is executed.
    3. The frontend automatically verifies that the revealed `serverSeed` matches the initial `commitment` by hashing it, cryptographically proving that the result was not manipulated.
    4. This allows users to verify the fairness of every game outcome themselves, removing the need to trust the server.
    5. Added `PROJECT_ARCHITECTURE.MD` Section 3.1 (Design Rule 1) and created ADR-001.

## [3.0.4] - 2025-10-09

### Fixed

- **(KO) [BUG-001] 언어 변경 시 메시지 초기화 근본 원인 해결:**
  - **문제 (Error):** 게임 플레이 중 언어를 변경하면, 동적으로 표시되던 상태 메시지(예: "50 당첨!")가 초기 환영 메시지로 돌아가는 문제가 지속되었습니다. `src/main.js:245` 함수 `updateI18n()`.
  - **원인 (Cause):** `updateI18n()` 함수가 모든 `data-i18n-key` 속성을 가진 요소를 무조건 업데이트하여, 동적 메시지 영역(`#message`)도 초기값으로 덮어씌웠습니다.
  - **해결 (Solution):**
    1. `updateI18n()` 함수에서 특정 요소(예: `#message`)를 업데이트 대상에서 제외하는 로직 추가.
    2. 동적 메시지 영역에 `data-i18n-ignore` 속성 추가하여 언어 변경 시 보호.
    3. 테스트 시나리오: 스핀 후 당첨 → 언어 변경 → 메시지 유지 확인.
    4. `PROJECT_REQUIREMENTS.md` Section 5에 [BUG-001] 아카이브.

- **(EN) [BUG-001] Fundamentally resolved message reset issue when changing language:**
  - **Error:** When changing language during gameplay, dynamically displayed status messages (e.g., "Won 50!") would reset to the initial welcome message. `src/main.js:245` function `updateI18n()`.
  - **Cause:** The `updateI18n()` function unconditionally updated all elements with `data-i18n-key` attributes, overwriting the dynamic message area (`#message`) with its initial value.
  - **Solution:**
    1. Added logic to exclude specific elements (e.g., `#message`) from update targets in `updateI18n()`.
    2. Added `data-i18n-ignore` attribute to dynamic message areas to protect them during language changes.
    3. Test scenario: Spin and win → change language → verify message persists.
    4. Archived [BUG-001] to `PROJECT_REQUIREMENTS.md` Section 5.

---

## 자동 생성 템플릿 (For AI Agent)

다음 템플릿을 사용하여 CHANGELOG 항목을 작성하라:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### {Added|Changed|Fixed|Deprecated|Removed|Security}

- **(KO) [REQ-ID] {한글 요약 (30자 이내)}:**
  - **문제 (Error):** {구체적인 오류 메시지 또는 현상, 파일명:줄번호 포함}
  - **원인 (Cause):** {기술적 근본 원인, 왜 발생했는지}
  - **해결 (Solution):**
    1. {수행한 작업 1}
    2. {수행한 작업 2}
    3. {영향받은 문서 업데이트}
    4. {관련 ADR 작성 (해당되는 경우)}
- **(EN) [REQ-ID] {English Summary (under 50 chars)}:**
  - **Error:** {Specific error message or symptom, include file:line}
  - **Cause:** {Technical root cause, why it happened}
  - **Solution:**
    1. {Action taken 1}
    2. {Action taken 2}
    3. {Document updates}
    4. {Related ADR created (if applicable)}
```

### 검증 체크리스트

작성 후 다음을 확인하라:

- [ ] "문제/Error", "원인/Cause", "해결/Solution" 키워드 존재
- [ ] 요구사항 ID ([XXX-XXX]) 형식 존재
- [ ] 한국어(KO)와 영어(EN) 모두 작성
- [ ] 파일명:줄번호 또는 구체적 위치 명시
- [ ] 해결 방안이 3단계 이상 구체적으로 작성
- [ ] 관련 문서 업데이트 언급
- [ ] ADR 링크 포함 (중요한 아키텍처 변경인 경우)
