# 1. 아키텍처 개요 (Architecture Overview)
## 1.1. 핵심 사상 (Core Philosophy)
- **서버리스 (Serverless-first):** Cloudflare 인프라를 최대한 활용하여 별도의 서버 관리 없이 높은 확장성과 낮은 유지보수 비용을 달성한다.
- **탈중앙화 (Decentralized):** 사용자의 자산 통제권을 보장하기 위해 비수탁형(Non-Custodial) 지갑 연동 방식을 채택하고, 모든 베팅과 상금 지급은 온체인(On-chain)에서 투명하게 이루어진다.
- **Vite 기반 순수 JS (Vanilla JS with Vite):** React/Vue와 같은 프레임워크 없이 순수 JavaScript, HTML, CSS를 사용하여 가볍고 빠른 사용자 경험을 제공하며, Vite를 통해 모던 웹 개발 환경을 구축한다.

## 1.2. 시스템 구성도 (System Diagram)
```
+------------------+      (1. Send TX)      +--------------------+
|                  | ---------------------> |                    |
|   User's Browser |      (User Signs)      |   TON Blockchain   |
| (Frontend on     | <--------------------- | (User -> Game Wallet) |
| Cloudflare Pages)|      (2. TX Boc)       |                    |
+------------------+                        +--------------------+
       |  ^ (WalletConnect)                          |
       |  |                                          | (3. API Call with Boc)
       v  |                                          v
+------------------+      (5. On-chain Payout)  +-------------------------+
|                  | <------------------------- |                         |
|   User's TON     |     (Game -> User Wallet)  |  Cloudflare Functions   |
|   Wallet         |                            |  (/spin, /claim, /double) |
|                  |                            |                         |
+------------------+                            +-------------------------+
                                                       ^
                                                       | (4. Read Blockchain Data)
                                                       v
                                                +--------------------+
                                                |   TON RPC Node     |
                                                +--------------------+
```

# 2. 프론트엔드 아키텍처 (Frontend Architecture)
## 2.1. 기술 스택 (Tech Stack)
- **빌드 도구 (Build Tool):** Vite
- **언어 (Language):** HTML, CSS, JavaScript (ESM, 순수 JS)
- **핵심 라이브러리 (Core Libraries):**
  - `@tonconnect/ui`: TON 지갑 연결 및 트랜잭션 서명 요청 UI 제공.
  - `tonweb` 또는 `@ton/ton`: Jetton 전송을 위한 트랜잭션 메시지(body) 구성.
  - `jose`: JWT(당첨 티켓) 디코딩 및 검증 (클라이언트에서는 주로 디코딩에 사용).

## 2.2. 디렉터리 구조 (Directory Structure)
- `src/`: 모든 프론트엔드 소스 코드가 위치한다.
  - `main.js`: 애플리케이션의 메인 진입점. UI 렌더링, 이벤트 리스너 설정, 상태 관리 등 핵심 로직 포함.
  - `style.css`: 애플리케이션의 모든 스타일 시트.
- `public/`: 정적 에셋(이미지, `favicon.ico`, `lang/*.json` 등)이 위치한다.
- `index.html`: 애플리케이션의 기본 HTML 템플릿. Vite가 빌드 시 `src/main.js`를 자동으로 삽입한다.
- `vite.config.js`: Vite 개발 서버 및 빌드 관련 설정. 특히 Node.js 폴리필 설정을 포함한다.
- `dist/`: `npm run build` 실행 시 생성되는 프로덕션 빌드 결과물 디렉터리.

## 2.3. 주요 로직 흐름 (Key Logic Flow)
1.  **초기화 (`main.js`):**
    - `TonConnectUI` 객체를 초기화하고, `onStatusChange` 콜백을 등록하여 지갑 연결/해제 상태를 감지하고 UI(뷰 전환, 주소 표시)를 업데이트한다.
2.  **스핀 (Spin):**
    - 사용자가 '스핀' 버튼을 클릭하면, 프론트엔드는 Jetton 전송 메시지를 생성한다.
    - `tonConnectUI.sendTransaction`을 호출하여 사용자에게 CSPIN 토큰을 게임 지갑으로 전송하는 트랜잭션 서명을 요청한다.
    - 사용자가 서명하면, 프론트엔드는 트랜잭션의 `boc` (Bag of Cells)를 받아 백엔드 `/spin` API로 전송한다.
3.  **상태 관리:**
    - 지갑 주소, 현재 베팅 금액 등 기본 상태 외에, **마지막으로 표시된 메시지의 키와 파라미터 (`{key, params}`)**를 변수에 저장한다.
    - 언어 변경 시, 이 저장된 상태를 이용해 메시지를 다시 번역하여 표시함으로써 UI의 일관성을 유지한다.

# 3. 백엔드 아키텍처 (Backend Architecture)
## 3.1. 기술 스택 (Tech Stack)
- **런타임 (Runtime):** Cloudflare Functions (Node.js 호환 모드)
- **핵심 라이브러리 (Core Libraries):**
  - `@ton/ton`, `@ton/core`, `@ton/crypto`: TON 블록체인 상호작용, 트랜잭션 생성/전송, `boc` 파싱.
  - `jose`: JWT("당첨 티켓") 서명 및 검증.

## 3.2. API 엔드포인트 (API Endpoints)
- **`POST /spin` (`functions/spin.js`):**
  - **역할:** 사용자의 베팅 트랜잭션을 검증하고, 스핀 결과를 생성하며, 당첨 시 JWT 티켓을 발급한다.
  - **입력:** `{ boc: string }`
  - **로직:**
    1.  수신된 `boc`를 파싱하여, 트랜잭션이 올바른 수신자(게임 지갑)에게 올바른 금액(베팅액)의 CSPIN 토큰을 전송했는지 검증한다.
    2.  검증 성공 시, 가중치 기반으로 슬롯 릴 결과를 무작위 생성한다.
    3.  당첨 여부와 당첨금을 계산하고, 당첨 시 JWT("당첨 티켓")를 생성하여 서명한다.
    4.  슬롯 결과 데이터와 JWT 티켓(당첨 시)을 응답으로 반환한다.
- **`POST /claimPrize` (`functions/claimPrize.js`):**
  - **역할:** JWT 티켓을 검증하고 실제 온체인 상금을 지급한다.
  - **입력:** `{ winTicket: string }`
  - **로직:**
    1.  `jose`를 사용해 `winTicket`을 검증한다.
    2.  티켓이 유효하면, payload에서 사용자 주소와 상금 금액을 추출한다.
    3.  `GAME_WALLET_MNEMONIC` 환경 변수를 사용하여 게임 지갑을 초기화한다.
    4.  `@ton/ton` 라이브러리를 사용해 게임 지갑에서 사용자 지갑으로 CSPIN 토큰을 전송하는 실제 트랜잭션을 생성하고 브로드캐스트한다.
- **`POST /doubleUp` (`functions/doubleUp.js`):**
  - **역할:** 사용자의 선택을 반영하여 더블업 미니게임을 처리한다.
  - **입력:** `{ winTicket: string, choice: 'black' | 'red' }`
  - **로직:**
    1.  `winTicket`을 검증한다.
    2.  50% 확률로 성공/실패를 결정한다. (사용자의 `choice`는 현재 로직에 영향을 주지 않지만, 향후 확장성을 위해 받음)
    3.  성공 시, 두 배의 상금이 걸린 새로운 JWT 티켓을 발급하여 반환한다.
    4.  실패 시, 당첨금이 0이 되었음을 알리는 응답을 반환한다.

# 4. 배포 및 운영 (Deployment & Operations)
## 4.1. 배포 프로세스 (Deployment Process)
- **플랫폼:** Cloudflare Pages
- **트리거:** GitHub `main` 브랜치에 푸시(Push) 발생 시 자동 배포
- **빌드 설정:**
  - **프레임워크 프리셋:** Vite
  - **빌드 명령어:** `npm run build`
  - **출력 디렉터리:** `dist`
- **환경 변수:**
  - `GAME_WALLET_MNEMONIC`: (필수) 상금 지급용 게임 핫월렛의 24단어 니모닉.
  - `JWT_SECRET`: (필수) JWT 서명 및 검증에 사용될 비밀 키.
  - `TON_RPC_ENDPOINT`: (필수) TON 네트워크와 통신하기 위한 RPC 엔드포인트 URL (예: Toncenter API).
  - `DEV_KEY`: (선택사항) 개발 및 테스트 시 특정 게임 결과를 강제하기 위한 비밀 키.

## 4.2. 설정 파일 (Configuration Files)
- **`wrangler.toml`:** (현재 사용 안함. 향후 로컬 테스트 환경 구성 시 사용될 수 있음)
- **`vite.config.js`:** Vite 개발 서버 및 빌드 관련 설정을 포함한다. 특히 `vite-plugin-node-polyfills`를 사용하여 `Buffer` 등 Node.js 모듈 호환성 문제를 해결한다.
- **`package.json`:** 프로젝트 의존성 및 실행 스크립트(`dev`, `build`)를 정의한다.
- **`package-lock.json`:** 정확한 의존성 버전을 고정하여 일관된 빌드를 보장한다.