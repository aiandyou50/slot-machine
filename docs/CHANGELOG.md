# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.4] - 2025-10-08

### Fixed
- **Jetton 모듈 오류 및 CSPIN 전송 오류 수정 (Jetton Module & CSPIN Transfer Error Fix):**
  - (EN) **Error:** A runtime error `Cannot read properties of undefined (reading 'jetton')` occurred when clicking the "Spin" button, even though the CSPIN contract and wallet addresses were correct and the token was present on the TON network.
  - (KO) **오류:** CSPIN 컨트랙트 및 게임 지갑 주소가 모두 올바르고, TON 네트워크에 토큰이 정상적으로 존재함에도 "스핀" 버튼 클릭 시 `Cannot read properties of undefined (reading 'jetton')` 오류가 발생함.
  - (EN) **Cause:** TonWeb library's Jetton module was not properly loaded in the Vite browser environment due to ESM import issues and possible tree-shaking or bundling problems. The Jetton module was undefined when imported via npm, but worked when loaded via CDN and accessed through `window.TonWeb`.
  - (KO) **원인:** Vite 브라우저 환경에서 TonWeb 라이브러리의 Jetton 모듈이 ESM import 및 번들링 문제로 인해 정상적으로 로드되지 않아, npm import 시 Jetton 모듈이 undefined가 되었음. CDN 방식으로 로드하고 `window.TonWeb`을 통해 접근할 때 정상 동작함을 확인함.
  - (EN) **Solution:** Updated `index.html` to load TonWeb via CDN and refactored `main.js` to use `window.TonWeb` instead of importing from npm. This ensures the Jetton module is available and resolves the runtime error.
  - (KO) **해결:** `index.html`에서 TonWeb을 CDN 방식으로 로드하고, `main.js`에서 npm import 대신 `window.TonWeb`을 사용하도록 리팩토링하여 Jetton 모듈이 정상적으로 동작하도록 수정함. 이로써 런타임 오류가 해결됨.
 
## [2.0.3] - 2025-10-08

### Fixed
- **프론트엔드 런타임 오류 수정 (Frontend Runtime Error Fix):**
  - (EN) **Error:** A runtime error `Cannot read properties of undefined (reading 'jetton')` occurred when clicking the "Spin" button.
  - (KO) **오류:** "스핀" 버튼 클릭 시 `Cannot read properties of undefined (reading 'jetton')` 런타임 오류 발생.
  - (EN) **Cause:** The `TonWeb` instance was created without an `HttpProvider`. This resulted in the instance not being connected to the TON network, making properties like `tonweb.token` undefined.
  - (KO) **원인:** `TonWeb` 인스턴스가 `HttpProvider` 없이 생성되었습니다. 이로 인해 인스턴스가 TON 네트워크에 연결되지 않아 `tonweb.token`과 같은 속성이 `undefined`가 되었습니다.
  - (EN) **Solution:** After researching the library's documentation, the `TonWeb` constructor in `src/main.js` was updated to include an `HttpProvider` pointing to the public Toncenter API for the testnet (`new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'))`).
  - (KO) **해결:** 라이브러리 문서 조사를 통해, `src/main.js`의 `TonWeb` 생성자를 테스트넷용 Toncenter 공개 API를 가리키는 `HttpProvider`를 포함하도록 업데이트했습니다 (`new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'))`).

## [2.0.2] - 2025-10-08

### Fixed
- **프론트엔드 런타임 오류 수정 (Frontend Runtime Error Fix):**
  - (EN) **Error:** A runtime error `TonWeb$1.token.jetton.JettonWallet.createTransferBody is not a function` occurred when clicking the "Spin" button.
  - (KO) **오류:** "스핀" 버튼 클릭 시 `TonWeb$1.token.jetton.JettonWallet.createTransferBody is not a function` 런타임 오류 발생.
  - (EN) **Cause:** The `createTransferBody` method was incorrectly called as if it were a static method. Correct usage requires creating an instance of the `JettonWallet` class and calling the method on that instance.
  - (KO) **원인:** `createTransferBody` 메소드가 정적 메소드인 것처럼 잘못 호출되었습니다. 올바른 사용법은 `JettonWallet` 클래스의 인스턴스를 생성하고 해당 인스턴스에서 메소드를 호출하는 것입니다.
  - (EN) **Solution:** After researching the library's documentation, the code in `src/main.js` was refactored to first create an instance of `tonweb`, get the user's jetton wallet address, create a `JettonWallet` instance for that address, and finally call `createTransferBody` on the instance.
  - (KO) **해결:** 라이브러리 문서 조사를 통해, `src/main.js`의 코드를 리팩토링하여 먼저 `tonweb` 인스턴스를 생성하고 사용자의 제튼 지갑 주소를 가져온 뒤, 해당 주소에 대한 `JettonWallet` 인스턴스를 생성하여 최종적으로 그 인스턴스에서 `createTransferBody`를 호출하도록 수정했습니다.

## [2.0.1] - 2025-10-08

### Fixed
- **프론트엔드 런타임 오류 수정 (Frontend Runtime Error Fix):**
  - (EN) **Error:** A runtime error `Cannot read properties of undefined (reading 'token')` occurred when clicking the "Spin" button.
  - (KO) **오류:** "스핀" 버튼 클릭 시 `Cannot read properties of undefined (reading 'token')` 런타임 오류 발생.
  - (EN) **Cause:** The `tonweb` library was used as a global variable (`window.TonWeb`) even though it was installed via npm. It needed to be explicitly imported into `src/main.js`.
  - (KO) **원인:** `tonweb` 라이브러리가 npm으로 설치되었음에도 불구하고, `src/main.js`에서 명시적으로 `import`하지 않고 전역 변수(`window.TonWeb`)로 잘못 사용되었습니다.
  - (EN) **Solution:** Added `import TonWeb from 'tonweb';` at the top of `src/main.js` and replaced all instances of `window.TonWeb` with `TonWeb` to correctly reference the imported module.
  - (KO) **해결:** `src/main.js` 파일 상단에 `import TonWeb from 'tonweb';` 구문을 추가하고, 모든 `window.TonWeb` 참조를 `TonWeb`으로 변경하여 모듈을 올바르게 사용하도록 수정했습니다.

## [2.0.0] - 2025-10-08

### Added
- **실제 토큰 베팅 기능 (Real Token Betting):**
  - (EN) Implemented the full-stack flow for real token betting. The frontend now creates a Jetton transfer transaction for the user to sign, and the backend receives the resulting `boc` to broadcast to the TON network.
  - (KO) 실제 토큰 베팅을 위한 전체 스택 플로우를 구현했습니다. 프론트엔드는 이제 사용자가 서명할 제튼 전송 트랜잭션을 생성하고, 백엔드는 결과 `boc`를 받아 TON 네트워크에 브로드캐스트합니다.
- **실제 토큰 상금 지급 (Real Token Prize Payout):**
  - (EN) The `/claimPrize` function now executes a real on-chain transaction to send CSPIN tokens from the game wallet to the user's wallet.
  - (KO) `/claimPrize` 함수는 이제 게임 지갑에서 사용자 지갑으로 CSPIN 토큰을 보내는 실제 온체인 트랜잭션을 실행합니다.
- **더블업 미니게임 개선 (Double Up Minigame Enhancement):**
  - (EN) Added an interactive UI with 'Red Card' and 'Black Card' choice buttons.
  - (KO) '레드 카드'와 '블랙 카드' 선택 버튼이 있는 대화형 UI를 추가했습니다.
  - (EN) The backend logic now uses the user's choice and a deterministic hash (based on `spinId`) to decide the outcome, ensuring provable fairness.
  - (KO) 백엔드 로직은 이제 사용자의 선택과 결정론적 해시(`spinId` 기반)를 사용하여 결과를 결정하므로, 증명 가능한 공정성을 보장합니다.

### Changed
- **지갑 UI 개선 (Wallet UI Improvement):**
  - (EN) The wallet connection button (`@tonconnect/ui`) has been moved to a persistent top bar, allowing users to view their address and disconnect at any time, fulfilling requirement `FR-UI-05`.
  - (KO) 지갑 연결 버튼(`@tonconnect/ui`)을 상시 표시되는 상단 바로 이동하여, 사용자가 언제든지 주소를 확인하고 연결을 해제할 수 있도록 개선했습니다 (요구사항 `FR-UI-05` 충족).
  - (EN) The frontend version display is updated to `2.0.0`.
  - (KO) 프론트엔드 버전 표시를 `2.0.0`으로 업데이트했습니다.

### Fixed
- **배포 의존성 문제 해결 (Deployment Dependency Issues):**
  - (EN) Fixed a series of Cloudflare Pages deployment failures. The root cause was identified as a corrupted dependency tree in `package-lock.json`, likely caused by a previous branch merge containing obsolete `expo` dependencies.
  - (KO) 여러 차례 발생한 Cloudflare Pages 배포 실패 문제를 해결했습니다. 근본 원인은 이전 브랜치 병합으로 인해 `package-lock.json`에 사용되지 않는 `expo` 의존성이 포함되어 의존성 트리가 손상된 것으로 파악되었습니다.
  - (EN) Fixed a subsequent build failure by adding the missing `@orbs-network/ton-access` package to `package.json`.
  - (KO) 누락되었던 `@orbs-network/ton-access` 패키지를 `package.json`에 추가하여 후속 빌드 실패를 해결했습니다.
  - (EN) The final solution involved completely removing `node_modules` and `package-lock.json`, updating `package.json` with the correct version and all required dependencies, and regenerating a clean `package-lock.json` from scratch.
  - (KO) 최종 해결책으로 `node_modules`와 `package-lock.json`을 완전히 삭제하고, `package.json`을 올바른 버전과 모든 필수 의존성으로 업데이트한 후, 처음부터 깨끗한 `package-lock.json`을 다시 생성했습니다.

## [0.0.1] - 2025-10-07

### Added
- **Initial Project Setup:**
  - (EN) Set up project structure with Vite, Cloudflare Functions, and required dependencies.
  - (KO) Vite, Cloudflare Functions 및 필수 의존성을 포함한 프로젝트 구조 설정.
  - (EN) Created initial `index.html`, `main.js`, `style.css` and backend function stubs.
  - (KO) 초기 `index.html`, `main.js`, `style.css` 및 백엔드 함수 스텁 생성.
- **Frontend Wallet Connection:**
  - (EN) Implemented wallet connection using `@tonconnect/ui`.
  - (KO) `@tonconnect/ui`를 사용한 지갑 연결 기능 구현.
  - (EN) Added view switching between 'Landing View' and 'Game View' based on connection status.
  - (KO) 연결 상태에 따라 '랜딩 뷰'와 '게임 뷰' 간의 뷰 전환 기능 추가.
- **Backend Core APIs:**
  - (EN) Implemented `/spin` API with basic slot logic and JWT "win ticket" generation.
  - (KO) 기본 슬롯 로직과 JWT "당첨 티켓" 생성을 포함한 `/spin` API 구현.
  - (EN) Implemented `/claimPrize` API with JWT validation and simulated payout.
  - (KO) JWT 검증 및 모의 상금 지급 기능을 포함한 `/claimPrize` API 구현.
  - (EN) Implemented `/doubleUp` API with 50/50 chance logic and new ticket issuance.
  - (KO) 50/50 확률 로직과 새 티켓 발급 기능을 포함한 `/doubleUp` API 구현.
- **Full-Stack Integration:**
  - (EN) Connected frontend controls (spin, claim, double up) to their respective backend APIs.
  - (KO) 프론트엔드 컨트롤(스핀, 수령, 더블업)을 각각의 백엔드 API에 연결.
  - (EN) Implemented full game loop from betting to winning and claiming.
  - (KO) 베팅부터 당첨, 상금 수령까지의 전체 게임 루프 구현.
- **Features & Refinements:**
  - (EN) Implemented multi-language support (English, Korean) with dynamic JSON loading.
  - (KO) 동적 JSON 로딩을 통한 다국어 지원(영어, 한국어) 기능 구현.
  - (EN) Applied "Cosmic Gemstone" visual theme with dynamic starfield background and neon UI elements.
  - (KO) 동적 별 배경과 네온 UI 요소를 포함한 "Cosmic Gemstone" 시각적 테마 적용.
  - (EN) Added version display in the UI.
  - (KO) UI에 버전 정보 표시 기능 추가.
