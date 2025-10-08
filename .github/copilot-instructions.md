# AI 에이전트 지침

이 문서는 AI 코딩 에이전트가 이 코드베이스에서 효과적으로 작업하는 데 도움이 되는 지침을 제공합니다. 모든 작업을 수행하기 전에 이 문서를 반드시 읽고 숙지해야 합니다.

## 1. 핵심 원칙 및 워크플로

-   **문서 우선 개발 (Documentation-First)**: 새로운 기능을 추가하거나 기존 로직을 변경하기 전에, `docs/PROJECT_REQUIREMENTS.md`와 `docs/PROJECT_ARCHITECTURE.MD`를 먼저 수정하여 사용자에게 승인받아야 합니다. **사용자 승인 없이는 코드 작성을 시작하지 마십시오.**
-   **2개 국어 작성 의무 (Bilingual Mandate)**: 모든 주석, 문서, 커밋 메시지, PR 설명은 **한국어(KO)와 영어(EN)를 병기**해야 합니다. 이는 필수 사항입니다.
-   **변경 이력(Changelog) 동시 업데이트**: 버그를 수정하거나 기능을 추가하는 모든 PR에는 `docs/CHANGELOG.md` 파일에 변경 내역을 기록하는 내용이 반드시 포함되어야 합니다.
    -   **형식 준수**: 변경 이력은 `Error/Cause/Solution` 또는 `Added`/`Changed`/`Fixed` 구조를 따라야 합니다.
-   **시맨틱 버저닝 (Semantic Versioning)**: 버그 수정 시 `package.json`의 `PATCH` 버전을 1 증가시키고, 이 버전이 `index.html`을 통해 프론트엔드에 표시되도록 업데이트해야 합니다.

## 2. 아키텍처 개요

이 프로젝트는 Vite로 빌드된 프런트엔드와 Cloudflare Functions에서 실행되는 서버리스 백엔드를 갖춘 웹 기반 슬롯 머신 게임입니다.

-   **프런트엔드 (`src/`)**: 순수 JavaScript, HTML, CSS로 구축되었습니다. `src/main.js`가 기본 진입점입니다.
    -   **주요 라이브러리**:
        -   `@tonconnect/ui`: 지갑 연결 및 트랜잭션 서명 요청.
        -   `tonweb`: 클라이언트 측에서 TON 트랜잭션 메시지(BOC)를 생성.
-   **백엔드 (`functions/`)**: Cloudflare Functions로 배포된 JavaScript 서버리스 함수입니다.
    -   `spin.js`: 사용자의 베팅 트랜잭션을 검증하고, 스핀 결과를 생성하며, 당첨 시 **JWT 기반 "당첨 티켓"**을 발급합니다.
    -   `claimPrize.js`: "당첨 티켓"을 검증하고 실제 온체인 상금을 지급합니다.
    -   `doubleUp.js`: 더블업 미니게임을 처리하고 성공 시 새로운 티켓을 발급합니다.
    -   `rpcProxy.js`: 클라이언트 측의 CORS 및 불안정한 RPC 응답 문제를 해결하기 위해 TON JSON-RPC 요청을 안정적으로 프록시합니다.
-   **TON 블록체인 통합**:
    -   **게임 화폐**: CSPIN 토큰 (`EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV`)
    -   **게임 지갑**: `UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd`
    -   **핵심 로직**: 베팅과 상금 지급은 모두 온체인에서 이루어집니다. 백엔드는 `GAME_WALLET_MNEMONIC` 환경 변수를 사용하여 트랜잭션을 서명합니다.

## 3. 주요 구성 파일

-   `vite.config.js`: Vite 빌드 구성입니다. `@ton/core`와 같은 라이브러리에 필요한 `Buffer` 폴리필을 위해 `vite-plugin-node-polyfills`를 사용합니다.
-   `wrangler.toml`: Cloudflare Pages 및 Functions에 대한 구성입니다. TON 라이브러리 구동에 필수적인 `nodejs_compat` 플래그가 포함되어 있습니다.
-   `_routes.json`: Cloudflare Pages의 라우팅 규칙을 정의하여 `/api/*` 요청을 `functions` 디렉토리로 전달합니다.

## 4. 코드베이스 규칙 및 주의사항

-   **주석**: 모든 코드에는 영어(EN)와 한국어(KO) 주석이 모두 있어야 합니다.
    ```javascript
    // (EN) This is an example comment.
    // (KO) 이것은 예시 주석입니다.
    ```
-   **상태 관리**: 전역 변수는 `src/main.js`의 상단에서 상태를 관리하는 데 사용됩니다. 특히 언어 변경 시 메시지가 초기화되지 않도록 마지막 메시지 키와 파라미터를 저장하는 로직(`lastMessage`)을 따라야 합니다.
-   **국제화 (i18n)**: 텍스트 문자열은 `public/lang/*.json`에 저장됩니다. `src/main.js`의 `translate` 함수를 사용하여 UI 텍스트를 동적으로 업데이트합니다.
-   **TON 라이브러리 사용**: 과거 `TonWeb` 라이브러리는 npm으로 설치 시 일부 모듈(Jetton)이 제대로 동작하지 않는 문제가 있었습니다. 현재는 CDN을 통해 `index.html`에서 직접 로드하고 `window.TonWeb`을 사용하는 방식으로 안정화되었습니다. 이 구조를 유지하십시오.
-   **RPC 상호작용**: 클라이언트에서 TON RPC 엔드포인트와 직접 통신하는 것은 불안정할 수 있습니다. `functions/rpcProxy.js`를 통해 요청을 라우팅하는 것이 선호됩니다.
