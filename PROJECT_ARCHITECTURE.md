# 1. 아키텍처 개요 (Architecture Overview)
## 1.1. 핵심 사상 (Core Philosophy)
- **서버리스 (Serverless-first):** Cloudflare 인프라를 최대한 활용하여 별도의 서버 관리 없이 높은 확장성과 낮은 유지보수 비용을 달성한다.
- **탈중앙화 (Decentralized):** 사용자의 자산 통제권을 보장하기 위해 비수탁형(Non-Custodial) 지갑 연동 방식을 채택하고, 모든 베팅과 상금 지급은 온체인(On-chain)에서 투명하게 이루어진다.
- **단일 페이지 애플리케이션 (Single Page Application, SPA):** Vite를 사용하여 효율적인 개발 경험과 최적화된 빌드 결과물을 생성하는 모던 웹 표준을 따른다.

## 1.2. 시스템 구성도 (System Diagram)
```
+------------------+      (HTTPS)       +-------------------------+      (On-chain)      +-----------------+
|                  | <----------------> |                         | <------------------> |                 |
|   User's Browser |      API Calls     |  Cloudflare Functions   |   Jetton Transfer    |   TON Blockchain  |
| (Cloudflare Pages)|                    |  (/spin, /claim, /double) |                      | (Game & User Wallets) |
|                  | <----------------> |                         | <------------------> |                 |
+------------------+      (UI)          +-------------------------+                      +-----------------+
       ^  |
       |  | Wallet Connect
       v  |
+------------------+
|                  |
|   User's TON     |
|   Wallet         |
|                  |
+------------------+
```

# 2. 프론트엔드 아키텍처 (Frontend Architecture)
## 2.1. 기술 스택 (Tech Stack)
- **빌드 도구 (Build Tool):** Vite
- **언어 (Language):** HTML, CSS, JavaScript (ESM, 순수 JS)
- **핵심 라이브러리 (Core Libraries):**
  - `@tonconnect/ui`: TON 지갑 연결 및 상호작용 UI 제공
  - `tonweb`: TON 블록체인과의 저수준 상호작용 및 트랜잭션 구성
  - `jose`: JWT(당첨 티켓) 생성 및 검증 (클라이언트 사이드에서는 주로 디코딩에 사용될 수 있음)

## 2.2. 디렉터리 구조 (Directory Structure)
- `src/`: 모든 프론트엔드 소스 코드가 위치한다.
  - `main.js`: 애플리케이션의 메인 진입점. UI 렌더링, 이벤트 리스너 설정, 상태 관리 등 핵심 로직 포함.
  - `style.css`: 애플리케이션의 모든 스타일 시트.
- `public/`: 정적 에셋(이미지, `favicon.ico`, `lang/*.json` 등)이 위치한다.
- `index.html`: 애플리케이션의 기본 HTML 템플릿. Vite가 빌드 시 `src/main.js`를 자동으로 삽입한다.
- `dist/`: `npm run build` 실행 시 생성되는 프로덕션 빌드 결과물 디렉터리.

## 2.3. 주요 로직 흐름 (Key Logic Flow)
1.  **초기화 (`main.js`):**
    - `TonConnectUI` 객체를 `buttonRootId` 옵션과 함께 초기화하여 지정된 `div`에 지갑 연결 버튼을 자동 렌더링한다.
    - `onStatusChange` 콜백을 등록하여 지갑 연결/해제 상태 변화를 감지하고 UI(뷰 전환)를 업데이트한다.
2.  **지갑 연결:**
    - 사용자가 라이브러리가 제공하는 버튼을 클릭하면, `@tonconnect/ui`가 모달을 통해 지갑 연결 과정을 처리한다.
3.  **상태 관리:**
    - 지갑 주소, CSPIN 토큰 잔액, 현재 베팅 금액 등 주요 상태는 `main.js` 내의 변수로 관리된다.
    - 뷰 전환은 `landing-view`와 `game-view` 요소에 `.active` 클래스를 토글하는 방식으로 제어된다. (`display: none` <-> `display: flex`)

# 3. 백엔드 아키텍처 (Backend Architecture)
## 3.1. 기술 스택 (Tech Stack)
- **런타임 (Runtime):** Cloudflare Functions (Node.js 호환 모드)
- **핵심 라이브러리 (Core Libraries):**
  - `@ton/ton`, `@ton/core`, `@ton/crypto`: TON 블록체인과의 상호작용, 트랜잭션 생성 및 전송
  - `jose`: JWT("당첨 티켓") 서명 및 검증

## 3.2. API 엔드포인트 (API Endpoints)
- 모든 백엔드 함수는 `functions/` 디렉터리 내에 위치한다.
- **`POST /spin` (`functions/spin.js`):**
  - **역할:** 스핀 결과를 생성하고, 당첨 시 JWT 티켓을 발급한다.
  - **입력:** `{ boc, betAmount, userAddress, (optional) devKey }`
  - **로직:**
    1. 가중치 기반으로 슬롯 릴 결과를 무작위 생성한다.
    2. 페이라인을 기준으로 당첨 여부와 당첨금을 계산한다.
    3. 당첨된 경우, `jose` 라이브러리를 사용하여 `{ userAddress, payout, ... }` 정보가 담긴 JWT("당첨 티켓")를 생성하고 서명한다.
    4. 슬롯 결과 데이터와 JWT 티켓(당첨 시)을 응답으로 반환한다.
- **`POST /claimPrize` (`functions/claimPrize.js`):**
  - **역할:** JWT 티켓을 검증하고 최종 상금을 지급한다.
  - **입력:** `{ winTicket }`
  - **로직:**
    1. `jose`를 사용해 수신된 `winTicket`의 서명을 검증하고 유효기간을 확인한다.
    2. 티켓이 유효하면, payload에서 사용자 주소와 상금 금액을 추출한다.
    3. `@ton/ton` 라이브러리를 사용해 게임 지갑에서 사용자 지갑으로 CSPIN 토큰을 전송하는 트랜잭션을 생성하고 브로드캐스트한다.
- **`POST /doubleUp` (`functions/doubleUp.js`):**
  - **역할:** 더블업 미니게임을 처리한다.
  - **입력:** `{ winTicket }`
  - **로직:**
    1. `winTicket`을 검증한다.
    2. 50% 확률로 성공/실패를 결정한다.
    3. 성공 시, 기존 당첨금의 두 배에 해당하는 새로운 JWT 티켓을 발급하여 반환한다.
    4. 실패 시, 당첨금이 0이 되었음을 알리는 응답을 반환한다.

# 4. 배포 및 운영 (Deployment & Operations)
## 4.1. 배포 프로세스 (Deployment Process)
- **플랫폼:** Cloudflare Pages
- **트리거:** GitHub `main` 브랜치에 푸시(Push) 발생 시 자동 배포
- **빌드 설정:**
  - **프레임워크 프리셋:** Vite
  - **빌드 명령어:** `npm run build`
  - **출력 디렉터리:** `dist`
- **환경 변수:**
  - `GAME_WALLET_MNEMONIC`: 상금 지급용 게임 핫월렛의 24단어 니모닉
  - `JWT_SECRET`: JWT 서명 및 검증에 사용될 비밀 키
  - `DEV_KEY`: 개발자 모드 활성화를 위한 비밀 키

## 4.2. 설정 파일 (Configuration Files)
- **`wrangler.toml`:** Cloudflare Functions의 로컬 개발 및 배포 설정을 포함한다. 반드시 `compatibility_flags = ["nodejs_compat"]` 플래그가 포함되어야 한다.
- **`vite.config.js`:** Vite 개발 서버 및 빌드 관련 설정을 포함한다.
- **`package.json`:** 프로젝트 의존성 및 실행 스크립트(`dev`, `build`)를 정의한다.