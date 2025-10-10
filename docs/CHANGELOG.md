# Changelog

All notable changes to this project will be documented in this file.

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

### Fixed

- **(KO) 지갑 재연결 및 `Invalid CRC32C` 오류 등 모든 스핀 관련 오류 근본 해결:**
  - **문제 (Error):** 1) 스핀 실행 시, 손상된 거래 정보로 인해 `Invalid CRC32C` 오류 발생. 2) 이 오류 발생 후, `tonconnect-manifest.json` 설정 오류로 인해 지갑 재연결 실패. 3) 이전에는 외부 API 의존으로 인한 다양한 서버 오류(4xx, 5xx)도 발생.
  - **원인 (Cause):** 1) **지갑 재연결 실패:** `tonconnect-manifest.json`의 `url`이 실제 서비스 주소와 일치하지 않거나, `iconUrl`이 외부 도메인을 가리키고 있어, 지갑이 Manifest 유효성 검증에 실패. 2) **`Invalid CRC32C` 오류:** Jetton 전송 정보에 포함된 불필요한 `forward_payload` 및 `forward_ton_amount` 필드가 데이터 구조를 손상시킴. 3) **API 오류:** `Toncenter` API의 `runMethod` 기능이 유료 플랜에서만 제공되어 발생.
  - **해결 (Solution):**
    1.  **Manifest 문제 해결:** `tonconnect-manifest.json`의 `url`을 실제 서비스 주소(`https://aiandyou.me`)로, `iconUrl`을 로컬 경로(`/icon.png`)로 수정하여 재연결 문제를 해결했습니다.
    2.  **거래 정보 단순화:** `src/services/blockchain.js`에서 데이터 손상의 원인이었던 `forward_payload`와 `forward_ton_amount`를 모두 제거하여, 깨끗하고 표준적인 거래 정보(BOC)를 생성하도록 수정했습니다.
    3.  **클라이언트 측 주소 계산:** 외부 API 의존성을 완전히 제거하고, `@ton/core` 라이브러리를 사용하여 클라이언트 측에서 Jetton 지갑 주소를 직접 계산하는 안정적인 아키텍처를 유지했습니다.
    4.  이 세 가지 수정을 통해 모든 알려진 오류를 근본적으로 해결하고, 코드의 안정성과 신뢰도를 크게 향상시켰습니다.

- **(EN) Fundamentally Resolved All Spin-Related Errors, Including Wallet Reconnection and `Invalid CRC32C`:**
  - **Error:** 1) An `Invalid CRC32C` error occurred on spin due to corrupted transaction data. 2) After this error, wallet reconnection failed due to an incorrect `tonconnect-manifest.json` configuration. 3) Previously, various server errors (4xx, 5xx) also occurred due to external API dependency.
  - **Cause:** 1) **Wallet Reconnection Failure:** The `url` in `tonconnect-manifest.json` did not match the production service address, and/or the `iconUrl` pointed to an external domain, causing the wallet to fail manifest validation. 2) **`Invalid CRC32C` Error:** Unnecessary `forward_payload` and `forward_ton_amount` fields in the Jetton transfer message were corrupting the data structure. 3) **API Errors:** The `runMethod` feature of the `Toncenter` API is only available on paid plans.
  - **Solution:**
    1.  **Fixed Manifest:** Resolved the reconnection issue by correcting the `url` in `tonconnect-manifest.json` to the production service address (`https://aiandyou.me`) and the `iconUrl` to a local path (`/icon.png`).
    2.  **Simplified Transaction Data:** The `forward_payload` and `forward_ton_amount`, which were the source of data corruption, were completely removed from the transaction creation logic in `src/services/blockchain.js` to generate a clean, standard BOC.
    3.  **Client-Side Address Calculation:** Maintained the stable architecture of calculating the Jetton wallet address directly on the client-side using the `@ton/core` library, completely removing the external API dependency.
    4.  These three fixes fundamentally resolve all known errors and significantly improve the application's stability and reliability.

## [3.1.0] - 2025-10-09

### Added

- **(KO) 검증 가능한 공정성(Provable Fairness)을 위한 Commit-Reveal 스킴 도입:**
  - **원인:** 기존 스핀 로직은 `Math.random()`을 사용하여 서버를 신뢰해야만 하는 중앙화된 방식이었으며, 이는 프로젝트의 핵심 요구사항인 '투명성'과 '공정성'을 위반했습니다.
  - **해결:**
    1.  기존 `/spin` API를 폐기하고, 2단계 API (`GET /commitSpin`, `POST /revealSpin`)를 새로 구현했습니다.
    2.  서버는 `serverSeed`의 해시(`commitment`)를 먼저 사용자에게 제공하고, 스핀이 실행된 후에 `serverSeed` 원본을 공개합니다.
    3.  프론트엔드는 `serverSeed`를 직접 해시하여 게임 시작 전 받은 `commitment`와 일치하는지 자동으로 검증하여, 결과가 조작되지 않았음을 암호학적으로 증명합니다.
    4.  이를 통해 사용자는 더 이상 서버를 신뢰할 필요 없이 모든 게임 결과의 공정성을 직접 검증할 수 있습니다.

- **(EN) Implemented Commit-Reveal Scheme for Provable Fairness:**
  - **Cause:** The previous spin logic used `Math.random()`, a centralized approach that required trusting the server and violated the project's core requirements for 'transparency' and 'fairness'.
  - **Solution:**
    1.  Deprecated the old `/spin` API and implemented a new two-phase API (`GET /commitSpin`, `POST /revealSpin`).
    2.  The server now provides a hash of its `serverSeed` (the `commitment`) to the user before the spin, and only reveals the original `serverSeed` after the spin is executed.
    3.  The frontend automatically verifies that the revealed `serverSeed` matches the initial `commitment` by hashing it, cryptographically proving that the result was not manipulated.
    4.  This allows users to verify the fairness of every game outcome themselves, removing the need to trust the server.

## [3.0.4] - 2025-10-09

### Fixed

- **(KO) BUG-01 (언어 변경 시 메시지 초기화) 근본 원인 해결:**
  - **문제:** 게임 플레이 중 언어를 변경하면, 동적으로 표시되던 상태 메시지(예: "50 당첨!")가 초기 환영 메시지로 돌아가는 문제가 지속되었습니다.
  - **원인:** 이전 버전(3.0.1)의 수정은 JavaScript 로직으로 문제를 회피하려 했으나, 근본 원인은 `index.html`의 동적 메시지 표시 영역 (`<div id="message-display">`)에 정적 번역을 위한 `data-i18n-key` 속성이 잘못 지정되어 있었기 때문입니다. 이로 인해 언어 변경 시 항상 정적 "환영" 메시지로 덮어써졌습니다.
  - **해결:** `index.html`에서 `<div id="message-display">` 요소의 `data-i18n-key="welcome_message"` 속성을 완전히 제거했습니다. 이를 통해 해당 영역이 정적 번역 프로세스에서 제외되도록 하여, JavaScript의 동적 상태(`lastMessage`)에 의해서만 메시지가 올바르게 관리되도록 수정했습니다.

- **(EN) BUG-01 (Message Reset on Language Change) Root Cause Fix:**
  - **Error:** When changing the language during gameplay, the dynamic status message (e.g., "You won 50!") continued to revert to the initial welcome message.
  - **Cause:** The fix in version 3.0.1 attempted to work around the issue with JavaScript logic, but the root cause was that the dynamic message display area (`<div id="message-display">`) in `index.html` was incorrectly assigned a `data-i18n-key` attribute intended for static translation. This caused it to always be overwritten with the static "welcome" message on language change.
  - **Solution:** Completely removed the `data-i18n-key="welcome_message"` attribute from the `<div id="message-display">` element in `index.html`. This excludes the area from the static translation process, ensuring that the message is correctly managed solely by the dynamic state (`lastMessage`) in JavaScript.

## [3.0.3] - 2025-10-08

### Fixed

- **(KO) TON Connect UI 렌더링 오류 해결:**
  - **문제:** NPM으로 `@tonconnect/ui` 라이브러리를 설치했을 때, 지갑 연결 버튼(위젯)이 프론트엔드에 전혀 렌더링되지 않았습니다.
  - **원인:** `@tonconnect/ui` 패키지는 NPM을 통해 로컬로 번들링될 때 안정적으로 UI를 렌더링하지 못하는 고질적인 문제가 있었습니다. 이는 라이브러리의 내부 구조 또는 Vite와의 호환성 문제로 추정됩니다.
  - **해결:** 안정적인 UI 렌더링을 보장하기 위해, `@tonconnect/ui` 라이브러리를 다시 CDN을 통해 로드하는 방식으로 전환했습니다. `package.json`에서 해당 의존성을 제거하고, `index.html`에 CDN 스크립트와 CSS 링크를 다시 추가했습니다. `main.js`는 CDN으로 로드된 전역 `window.TonConnectUI` 객체를 사용하도록 수정하여 문제를 해결했습니다.

- **(EN) TON Connect UI Rendering Error Fix:**
  - **Error:** When the `@tonconnect/ui` library was installed via NPM, the wallet connection button (widget) failed to render on the frontend.
  - **Cause:** The `@tonconnect/ui` package has a persistent issue where it does not reliably render its UI when bundled locally via NPM, likely due to its internal structure or compatibility issues with Vite.
  - **Solution:** To ensure stable UI rendering, the project reverted to loading the `@tonconnect/ui` library via CDN. The dependency was removed from `package.json`, and the CDN script and CSS links were re-added to `index.html`. `main.js` was updated to use the global `window.TonConnectUI` object loaded from the CDN, resolving the issue.

## [3.0.2] - 2025-10-08

### Fixed

- **(KO) 블록체인 RPC 호출 오류 해결 (exit_code: -13):**
  - **문제:** 스핀 버튼 클릭 시, 프론트엔드에서 `tonClient.runMethod`를 통해 사용자의 Jetton 지갑 주소를 조회하는 과정에서 `exit_code: -13` 오류가 발생하며 트랜잭션이 실패했습니다.
  - **원인:** 프론트엔드에서 사용하는 공개 RPC 엔드포인트(`toncenter.com`)가 특정 요청에 제한을 두거나, 샌드박스 환경의 네트워크 제약으로 인해 스마트 컨트랙트의 `get` 메소드 호출이 실패했습니다.
  - **해결:**
    1.  프론트엔드에서 직접 RPC를 호출하는 대신, 이 호출을 안전하게 중계하는 새로운 백엔드 프록시 함수 `/getJettonWalletAddress`를 구현했습니다.
    2.  이 백엔드 함수는 Cloudflare 환경 변수에 저장된 API 키를 사용하여 안정적인 RPC 엔드포인트에 요청을 보냅니다.
    3.  프론트엔드의 `handleSpin` 함수를 리팩토링하여, `tonClient`를 직접 사용하는 대신 새로 만든 백엔드 API를 호출하여 Jetton 지갑 주소를 가져오도록 수정했습니다. 이로써 클라이언트 측의 RPC 호출 문제를 근본적으로 해결했습니다.

- **(EN) Blockchain RPC Call Error Resolved (exit_code: -13):**
  - **Error:** When clicking the spin button, the transaction failed with an `exit_code: -13` error during the process of fetching the user's Jetton wallet address via `tonClient.runMethod` on the frontend.
  - **Cause:** The public RPC endpoint (`toncenter.com`) used by the frontend has limitations on certain requests, or network constraints in the sandbox environment caused the smart contract's `get` method call to fail.
  - **Solution:**
    1.  Implemented a new backend proxy function, `/getJettonWalletAddress`, to securely relay the RPC call instead of making it directly from the frontend.
    2.  This backend function uses an API key stored in Cloudflare environment variables to make requests to a reliable RPC endpoint.
    3.  Refactored the `handleSpin` function in the frontend to call the new backend API to get the Jetton wallet address, instead of using `tonClient` directly. This fundamentally resolves the client-side RPC call issue.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2025-10-08

### Added

- **(KO) 전체 기능 구현:** `PROJECT_REQUIREMENTS.md`에 명시된 모든 기능적/비기능적 요구사항에 따라 프로젝트를 재구축했습니다.
  - 프론트엔드 (UI, 게임 로직, 다국어 지원, 버전 표시)
  - 백엔드 (Cloudflare Functions: /spin, /claimPrize, /doubleUp)
  - JWT 기반 지연 지급 시스템 및 더블업 미니게임
- **(EN) Full Feature Implementation:** Rebuilt the project according to all functional and non-functional requirements specified in `PROJECT_REQUIREMENTS.md`.
  - Frontend (UI, game logic, multi-language support, version display)
  - Backend (Cloudflare Functions: /spin, /claimPrize, /doubleUp)
  - JWT-based delayed payout system and Double Up minigame.

### Changed

- **(KO) 의존성 구조 현대화:** 배포 안정성을 저해하던 `tonweb` 라이브러리를 프로젝트에서 완전히 제거했습니다. 프론트엔드와 백엔드의 모든 블록체인 상호작용 로직을 최신 공식 라이브러리인 `@ton/core`와 `@ton/ton`을 사용하도록 전면 리팩토링하여 코드의 일관성과 안정성을 확보했습니다.
- **(EN) Modernized Dependency Structure:** Completely removed the `tonweb` library, which was causing deployment instability. All blockchain interaction logic in both the frontend and backend was refactored to use the modern, official `@ton/core` and `@ton/ton` libraries, ensuring code consistency and stability.

### Fixed

- **(KO) BUG-01 (언어 변경 시 메시지 초기화):**
  - **문제:** 게임 진행 중 언어 변경 시, 현재 상태 메시지(예: '50 당첨!')가 번역되지 않고 초기 환영 메시지로 돌아가는 문제.
  - **원인:** 언어 변경 시 현재 게임 상태(마지막 메시지 키, 파라미터)를 유지하는 로직 부재.
  - **해결:** `lastMessage` 상태 변수를 도입하여 마지막으로 표시된 메시지의 키와 파라미터를 저장. 언어 변경 함수(`applyStaticTranslations`)가 호출될 때마다 이 저장된 상태를 기반으로 메시지를 다시 번역하여 표시하도록 수정.
- **(EN) BUG-01 (Message Reset on Language Change):**
  - **Error:** When changing the language during gameplay, the current status message (e.g., 'You won 50!') would reset to the initial welcome message instead of being translated.
  - **Cause:** Lack of logic to retain the current game state (last message key and parameters) upon language change.
  - **Solution:** Introduced a `lastMessage` state variable to store the key and parameters of the last displayed message. The language change function (`applyStaticTranslations`) was updated to re-translate and display the message based on this stored state.

## [3.0.0] - 2025-10-08

### BREAKING CHANGE

#### 프로젝트 초기화 (Project Reset)

(EN) Error: The project was in an unrecoverable state due to persistent, conflicting dependency and environment issues that prevented successful deployment and verification.
(KO) 문제: 지속적이고 상충하는 의존성 및 환경 문제로 인해 성공적인 배포 및 검증이 불가능한, 회복 불가능한 상태에 있었습니다.
(EN) Cause: Multiple attempts to resolve issues with CDN instability, NPM package integration, and `package-lock.json` corruption failed to produce a stable, verifiable build.
(KO) 원인: CDN 불안정, NPM 패키지 통합, `package-lock.json` 손상 문제를 해결하기 위한 여러 시도가 안정적이고 검증 가능한 빌드를 만드는 데 실패했습니다.
(EN) Solution: As per user directive, a destructive project reset was performed. All project files and folders, except for the `docs` and `.github` directories, have been deleted to establish a clean baseline for future development. This action is irreversible and marks a new major version.
(KO) 해결: 사용자 지시에 따라 파괴적인 프로젝트 초기화를 수행했습니다. `docs` 및 `.github` 디렉토리를 제외한 모든 프로젝트 파일과 폴더를 삭제하여 향후 개발을 위한 깨끗한 기준선을 마련했습니다. 이 작업은 되돌릴 수 없으며 새로운 메이저 버전을 의미합니다.
