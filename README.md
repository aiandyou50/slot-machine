# CandleSpinner: The Galactic Casino

**(KO)**
CandleSpinner는 TON(The Open Network) 블록체인 기반의 완전 탈중앙화 서버리스 Web3 슬롯머신 게임입니다. 사용자는 자신의 암호화폐 지갑을 통해 자산을 완벽하게 통제하면서, 투명하고 공정한 게임 플레이를 경험할 수 있습니다.

**(EN)**
CandleSpinner is a fully decentralized, serverless Web3 slot machine game built on the TON (The Open Network) blockchain. It allows users to experience transparent and fair gameplay while maintaining complete control over their assets through their own cryptocurrency wallets.

---

## 🚀 주요 기능 (Key Features)

- **(KO) 비수탁형 지갑 연결:** `@tonconnect/ui`를 통해 안전하게 자신의 TON 지갑을 연결합니다.
- **(EN) Non-Custodial Wallet Connection:** Securely connect your own TON wallet via `@tonconnect/ui`.
- **(KO) 온체인 토큰 베팅:** 게임의 공식 화폐인 `CSPIN` 토큰을 사용하여 실제 블록체인 트랜잭션을 통해 베팅합니다.
- **(EN) On-Chain Token Betting:** Place bets using the official game currency, `CSPIN` tokens, through real on-chain transactions.
- **(KO) JWT 기반 지연 지급:** 스핀 당첨 시, 즉시 상금을 지급하는 대신 안전한 JWT "당첨 티켓"을 발급받아 원할 때 수령하거나 더블업 게임에 도전할 수 있습니다.
- **(EN) JWT-Based Delayed Payout:** Upon winning a spin, receive a secure JWT "win ticket" instead of an immediate payout, allowing you to claim it or challenge the double-up game at your convenience.
- **(KO) 다국어 지원:** 영어와 한국어를 완벽하게 지원합니다.
- **(EN) Multi-language Support:** Full support for English and Korean.
- **(KO) 100% 서버리스 아키텍처:** Cloudflare Pages와 Functions를 기반으로 구축되어 확장성이 뛰어나고 안정적입니다.
- **(EN) 100% Serverless Architecture:** Built on Cloudflare Pages and Functions for excellent scalability and reliability.

---

## 🛠️ 기술 스택 (Technology Stack)

| 구분 (Category) | 기술 (Technology) | 목적 (Purpose) |
| :--- | :--- | :--- |
| **Frontend** | Vite, Vanilla JS, CSS | (KO) 가볍고 빠른 사용자 경험 제공<br/>(EN) Provide a lightweight and fast user experience |
| **Backend** | Cloudflare Functions | (KO) 서버리스 API 구현<br/>(EN) Implement serverless APIs |
| **Hosting** | Cloudflare Pages | (KO) 프론트엔드 및 함수 통합 배포<br/>(EN) Integrated deployment of frontend and functions |
| **Blockchain** | TON (The Open Network) | (KO) 게임의 기반이 되는 블록체인<br/>(EN) The underlying blockchain for the game |
| **Libraries** | `@ton/core`, `@ton/ton`, `@tonconnect/ui`, `jose` | (KO) 지갑 연결, 트랜잭션, JWT 처리<br/>(EN) Wallet connection, transactions, JWT handling |

상세한 아키텍처는 [PROJECT_ARCHITECTURE.MD](./docs/PROJECT_ARCHITECTURE.MD) 문서를 참고하십시오.
For a detailed architecture, please refer to the [PROJECT_ARCHITECTURE.MD](./docs/PROJECT_ARCHITECTURE.MD) document.

---

## ⚙️ 로컬 환경 설정 및 실행 (Local Setup & Running)

### 1. 사전 요구사항 (Prerequisites)
- Node.js (v18 or higher)
- npm

### 2. 의존성 설치 (Install Dependencies)
(KO) 프로젝트 루트 디렉토리에서 다음 명령을 실행하여 모든 의존성을 설치합니다.
(EN) In the project root directory, run the following command to install all dependencies.
```bash
npm install
```

### 3. 환경 변수 설정 (Set Up Environment Variables)
(KO) `.dev.vars` 파일을 프로젝트 루트에 생성하고, Cloudflare 환경 변수를 설정합니다. 이 파일은 Git에 의해 무시됩니다.
(EN) Create a `.dev.vars` file in the project root and set the Cloudflare environment variables. This file is ignored by Git.

```
# .dev.vars

# (KO) JWT 서명을 위한 256비트 이상의 강력한 비밀 키
# (EN) A strong secret key of at least 256 bits for JWT signing
JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY_HERE"

# (KO) 게임 지갑의 24개 단어 니모닉 시드 구문
# (EN) The 24-word mnemonic seed phrase for the game wallet
GAME_WALLET_SEED="your 24-word game wallet seed phrase here ..."

# (KO) Toncenter API 키 (선택 사항이지만 권장)
# (EN) Toncenter API Key (optional but recommended)
TONCENTER_API_KEY="YOUR_TONCENTER_API_KEY_HERE"

# (KO) 개발자 모드 활성화 키 (선택 사항)
# (EN) Developer mode activation key (optional)
DEV_KEY="YOUR_SECRET_DEV_KEY"
```

### 4. 개발 서버 실행 (Run Development Server)
(KO) 다음 명령을 실행하여 Vite 개발 서버와 Cloudflare Functions 에뮬레이터를 함께 시작합니다.
(EN) Run the following command to start the Vite development server and the Cloudflare Functions emulator together.
```bash
npm run dev
```

(KO) 이제 브라우저에서 `http://localhost:5173`으로 접속하여 애플리케이션을 확인할 수 있습니다.
(EN) You can now access the application in your browser at `http://localhost:5173`.