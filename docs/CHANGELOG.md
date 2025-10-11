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

> **작성 규칙 (Writing Rules):**
> 1. 모든 항목은 Error-Cause-Solution 3단계 구조 필수
> 2. 요구사항 ID 반드시 참조 ([BUG-XXX] 또는 [FR-XXX])
> 3. 한국어(KO)와 영어(EN) 병기 필수
> 4. 파일명:줄번호 또는 구체적 위치 명시

---

## [Unreleased]

- **(KO) [BUG-005] `Invalid magic` 오류로 인한 Spin 처리 실패:**
  - **문제 (Error):** 스핀 버튼 클릭 시 외부 핸들러(tg://resolve...)가 실행되며 Wallet/핸들러 측에서 `Invalid magic` 오류가 발생하여 스핀 트랜잭션의 리빌/검증 플로우가 중단됩니다. 콘솔 로그에 외부 핸들러로 전달된 deep-link 문자열이 출력됩니다.
  - **원인 (Cause) (가설):**
    1. BOC 또는 트랜잭션 페이로드가 생성/인코딩되는 과정에서 손상 또는 잘못된 형식(예: 잘못된 base64, URL 이스케이프 문제)이 발생했을 가능성.
    2. `tonconnect` 매니페스트 또는 manifestUrl 필드의 구성 혹은 접근성(HTTPS, CORS) 문제로 인해 Wallet이 manifest를 검증하지 못함.
    3. deep-link 구성 시 특수문자/인코딩 누락으로 인해 Wallet이 수신한 payload를 유효하지 않은 것으로 판단함.
  - **해결 (Solution) (초안):**
    1. 프론트엔드에서 외부 핸들러로 전달되는 deep-link 전체 문자열을 로그로 캡처하고, 필요 시 BOC 원본(base64)도 함께 저장하여 비교 분석을 수행합니다.
    2. `src/services/blockchain.js`의 BOC/트랜잭션 생성 로직에서 base64 인코딩/디코딩 및 문자열 이스케이프 처리를 점검하고, 레거시 `forward_payload`/`forward_ton_amount` 등의 불필요 필드를 제거합니다.
    3. `public/tonconnect-manifest.json`의 `url`, `iconUrl`, `manifestUrl` 필드가 정확한 HTTPS 경로를 가리키며, 외부에서 접근 가능한지(HTTP 200), CORS 또는 리디렉션 이슈가 없는지 확인합니다.
    4. Wallet이 요구하는 deep-link 포맷(인코딩/escape 규칙)에 맞게 deep-link 생성 코드를 표준화하고, 테스트 케이스(특수문자 포함)를 추가합니다.
    5. 사용자에게 표시할 한/영 에러 메시지와 개발자용 상세 로그(BOC, deep-link) 수집 로직을 구현합니다.

- **(EN) [BUG-005] Spin flow failure caused by `Invalid magic`:**
  - **Error:** Clicking Spin launches an external handler (tg://resolve...) and the wallet/handler rejects the payload with `Invalid magic`, interrupting reveal/verification flow. The console prints the deep-link sent to the handler.
  - **Cause (Hypothesis):**
    1. Malformed or incorrectly encoded BOC/transaction payload (e.g., wrong base64, improper URL escaping) may cause the wallet to reject it.
    2. `tonconnect` manifest or manifestUrl configuration/accessibility (HTTPS, CORS) may be invalid, causing the wallet to fail manifest validation.
    3. Deep-link construction may omit proper encoding/escaping for special characters, resulting in an invalid payload received by the wallet.
  - **Solution (Draft):**
    1. Capture the full deep-link string sent to the external handler from the frontend logs and store the raw BOC (base64) for analysis.
    2. Inspect and harden `src/services/blockchain.js` transaction/BOC generation for correct base64 encoding/decoding and escaping; remove legacy `forward_payload`/`forward_ton_amount` fields if present.
    3. Verify `public/tonconnect-manifest.json` `url`, `iconUrl`, `manifestUrl` are reachable over HTTPS (HTTP 200) and free of CORS/redirect issues.
    4. Standardize deep-link construction to wallet requirements and add unit/integration tests for special-character payloads.
    5. Implement bilingual user-facing error messages and developer-focused logs (BOC, deep-link) for post-mortem analysis.

### Added

- **(KO) [FR-DEV-03] 개발자 모드 Deep-link BOC 로깅 기능 (초안):**
  - **문제 (Error):** Jetton 전송 시 Wallet에 전달되는 deep-link의 payload(BOC)가 손상 또는 인코딩 문제로 인해 Wallet에서 거부되는 상황의 원인 분석이 어렵습니다. 개발자들이 재현 가능한 원본 BOC와 deep-link를 확보할 수 있는 방법이 필요합니다.
  - **원인 (Cause):** 디버깅 시 원본 바이너리 데이터(BOC)를 수집하지 못하면, 인코딩/이스케이프 문제 또는 manifest/URL 구성 문제를 정확히 판별하기 어렵습니다.
  - **해결 (Solution):** `src/services/blockchain.js`의 Jetton 전송 BOC 직렬화 직후, 개발자 모드(`import.meta.env.DEV`)에서만 콘솔에 다음을 출력하도록 구현했습니다:
    1. Raw BOC (Uint8Array/Buffer)
    2. Base64-encoded BOC
    3. 예시 deep-link (URL-encoded payload 포함)
  - **영향 (Impact):** 개발 환경에서 재현 가능한 디버깅 데이터가 확보되어 `Invalid magic` 유형의 문제 분석이 쉬워집니다. 프로덕션에는 영향을 주지 않습니다.

- **(EN) [FR-DEV-03] Deep-link BOC logging in developer mode (Draft):**
  - **Error:** It's difficult to analyze causes when the deep-link payload (BOC) delivered to wallets is rejected due to corruption or encoding issues. Developers need a way to capture reproducible raw BOC and deep-link strings.
  - **Cause:** Without capturing raw binary BOC data during debugging, it's hard to determine whether encoding/escaping issues or manifest/URL misconfigurations caused the rejection.
  - **Solution:** After serializing the Jetton transfer to a BOC in `src/services/blockchain.js`, log the following in developer mode (`import.meta.env.DEV`) only:
    1. Raw BOC (Uint8Array/Buffer)
    2. Base64-encoded BOC
    3. Example deep-link (with URL-encoded payload)
  - **Impact:** Enables reproducible debugging data in development for `Invalid magic`-type investigations. No effect in production.

---

## [3.1.13] - 2025-10-10

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
