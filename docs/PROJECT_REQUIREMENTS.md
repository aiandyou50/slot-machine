# 1. 개요 (Overview)

## 1.1. 프로젝트 명칭 (Project Name)

- **CandleSpinner: The Galactic Casino**

## 1.2. 프로젝트 목표 (Project Goal)

- TON (The Open Network) 블록체인 위에서 동작하는 완전 탈중앙화 서버리스 Web3 슬롯머신 게임을 개발한다.
- 사용자는 자신의 암호화폐 지갑을 통해 자산을 완벽하게 통제하면서, 투명하고 공정한 게임 플레이를 경험할 수 있어야 한다.

---

# 2. 기능 요구사항 (Functional Requirements)

## 2.1. 사용자 인터페이스 (User Interface)

- **FR-UI-01: 뷰 상태 관리 (View State Management)**
  - 애플리케이션은 두 가지 주요 뷰(View) 상태를 가진다: **'랜딩 뷰'**와 **'게임 뷰'**.
  - 지갑이 연결되지 않았을 때는 **'랜딩 뷰'**가 표시되어야 한다.
  - 지갑이 성공적으로 연결되면 **'게임 뷰'**로 전환되어야 한다.

- **FR-UI-02: 지갑 연결 (Wallet Connection)**
  - `@tonconnect/ui` 라이브러리를 사용하여 TON 지갑 연결 기능을 제공해야 한다.
  - 라이브러리가 제공하는 공식 **'지갑 연결' 버튼**이 **'랜딩 뷰'**에 표시되어야 한다.

- **FR-UI-03: 다국어 지원 (Multi-language Support)**
  - 영어(en), 한국어(ko), 일본어(ja), 중국어(간체, zh-CN), 중국어(번체, zh-TW)를 지원해야 한다.
  - UI 텍스트는 `data-i18n-key` 속성을 통해 관리되며, 언어 변경 시 해당 키에 맞는 텍스트로 교체되어야 한다.
  - 다국어 JSON 파일은 **ICU MessageFormat 또는 템플릿 문자열**을 사용해야 하며, 동적 값(예: `{amount}`)은 **지역화된 숫자 형식**으로 렌더링되어야 한다.
  - 언어 선택 기능(드롭다운 등)이 **'게임 뷰'**에 제공되어야 한다.

- **FR-UI-04: 버전 정보 표시 (Version Display)**
  - 현재 애플리케이션의 버전을 시맨틱 버저닝 (`MAJOR.MINOR.PATCH`) 형식으로 **'게임 뷰'**의 특정 위치(예: 푸터)에 항상 표시해야 한다.
  - 버전 정보는 빌드 시 `package.json`의 `version` 값을 `import.meta.env.VITE_APP_VERSION` 또는 `public/version.json`을 통해 동적으로 참조해야 한다.

- **FR-UI-05: 지갑 정보 표시 및 연결 해제 (Wallet Info Display & Disconnect)**
  - (EN) The currently connected wallet address (full or abbreviated) must always be displayed in the game view.
  - (KO) 현재 연결된 지갑 주소(전체 또는 축약형)가 게임 뷰에 항상 표시되어야 합니다.
  - (EN) A button or feature must be provided for the user to disconnect their wallet.
  - (KO) 사용자가 지갑 연결을 해제할 수 있는 버튼이나 기능이 제공되어야 합니다.

## 2.2. 게임 플레이 (Game Play)

- **FR-GAME-01: 슬롯머신 (Slot Machine)**
  - 5릴(Reel), 3행(Row) 형식의 비디오 슬롯머신이어야 한다.
  - 20개의 고정된 페이라인(Payline)을 가진다.

- **FR-GAME-02: 실제 토큰 베팅 (Real Token Betting)**
  - (EN) Users must be able to adjust the bet amount in the 'Game View'.
  - (KO) 사용자는 **'게임 뷰'**에서 베팅 금액을 조절할 수 있어야 합니다.
  - (EN) Upon spinning, an on-chain transaction must be initiated to transfer the bet amount of **CSPIN** tokens from the user's wallet to the **Game Wallet**. This process must be explicitly approved by the user.
  - (KO) 스핀 시, 사용자의 지갑에서 **게임 지갑**으로 베팅 금액만큼의 **CSPIN 토큰**을 전송하는 실제 온체인 트랜잭션이 발생해야 합니다. 이 과정은 사용자의 명시적인 승인을 거쳐야 합니다.
  - (EN) The frontend must wait for the transaction to be included on-chain before calling the `/spin` API.
  - (KO) 프론트엔드는 `/spin` API 호출 전, 트랜잭션이 블록체인에 포함되었음을 확인해야 합니다.

- **FR-GAME-03: 스핀 실행 (Spin Execution)**
  - (EN) After the betting transaction is confirmed, the frontend calls the backend `/spin` API with the transaction details (e.g., BOC).
  - (KO) 베팅 트랜잭션이 확인된 후, 프론트엔드는 백엔드 `/spin` API를 트랜잭션 상세 정보(예: BOC)와 함께 호출해야 합니다.
  - (EN) The API generates weighted random reel results, calculates winnings, and returns them.
  - (KO) API는 가중치가 적용된 릴 결과를 무작위로 생성하고, 당첨 여부와 당첨금을 계산하여 반환해야 한다.

- **FR-GAME-04: 지연 지급 시스템 (Delayed Payout System)**
  - 스핀 결과 당첨 시, 백엔드는 상금을 즉시 지급하는 대신, 당첨 정보(사용자 주소, 당첨금 등)가 포함된 **JWT**(JSON Web Token) 형식의 **"당첨 티켓"**을 발급해야 한다.
  - JWT 티켓은 **5분 이내 유효**해야 하며, **한 번만 사용 가능**하다.
  - 백엔드는 사용된 티켓 ID를 **Cloudflare KV 또는 메모리 캐시**에 저장하여 재사용을 차단해야 한다.
  - 프론트엔드는 이 티켓을 수신하여 **'상금 수령'** 또는 **'더블업'** 옵션을 사용자에게 제공해야 한다.

- **FR-GAME-05: 실제 토큰 상금 지급 (Real Token Prize Payout)**
  - (EN) When the user clicks the 'Claim Prize' button, the backend must validate the "win ticket" and, if valid, initiate an on-chain transaction to send the prize amount in **CSPIN** tokens from the **Game Wallet** to the user's wallet.
  - (KO) 사용자가 **'상금 수령'** 버튼을 누르면, 백엔드는 **"당첨 티켓"**을 검증한 후, 유효한 경우 **게임 지갑**에서 사용자의 지갑으로 해당 상금을 **CSPIN 토큰**으로 전송하는 실제 온체인 트랜잭션을 실행해야 합니다.
  - (EN) If the Game Wallet has insufficient CSPIN balance, the backend must return `{"error": "INSUFFICIENT_FUNDS"}` and the frontend must display a user-friendly message.
  - (KO) 게임 지갑의 CSPIN 잔액이 부족할 경우, 백엔드는 `{"error": "INSUFFICIENT_FUNDS"}` 응답을 반환해야 하며, 프론트엔드는 이를 사용자에게 알림으로 표시해야 한다.

- **FR-GAME-06: 더블업 미니게임 개선 (Double Up Minigame Enhancement)**
  - (EN) Instead of a simple button, an interactive minigame is implemented. When 'Double Up' is selected, two buttons, **'Black Card'** and **'Red Card'**, are displayed.
  - (KO) 단순한 버튼 대신, 인터랙티브한 미니게임을 구현합니다. '더블업' 선택 시, **'검은색 카드'**와 **'빨간색 카드'**를 선택할 수 있는 두 개의 버튼이 표시됩니다.
  - (EN) When the user makes a choice, the backend `/doubleUp` API is called with the selection. The backend generates a 50% success/failure result.
  - (KO) 사용자가 둘 중 하나를 선택하면, 백엔드 `/doubleUp` API가 해당 선택과 함께 호출됩니다. 백엔드는 50% 확률의 성공/실패 결과를 생성합니다.
  - (EN) On success, a new "win ticket" with double the payout is issued. On failure, the prize is lost. Max 5 double-ups.
  - (KO) 성공 시, 기존 당첨금의 두 배에 해당하는 새로운 **"당첨 티켓"**을 발급합니다. 실패 시, 당첨금은 0이 되며 티켓은 무효화됩니다. 더블업은 최대 **5회**까지만 가능합니다.
  - (EN) During card selection, the UI must disable interaction until the result is received to prevent duplicate requests.
  - (KO) 카드 선택 중에는 결과 수신 전까지 버튼을 비활성화하여 중복 요청을 방지해야 합니다.

## 2.3. 개발 및 테스트 (Development & Testing)

- **FR-DEV-01: 개발자 모드 (결과 강제) (Developer Mode (Force Result))**
  - 백엔드는 특정 `DEV_KEY` 환경 변수와 일치하는 키가 API 요청에 포함될 경우, 특정 결과(예: 잭팟)를 강제로 반환하는 개발자 모드를 지원해야 한다.

- **FR-DEV-02: 개발자 모드 (무료 플레이) (Developer Mode (Free Play))**
  - 이 모드가 활성화되었을 때, 개발자가 웹 기능 테스트를 위해 실제 토큰을 소비하지 않고 슬롯머신 게임을 플레이할 수 있도록 허용해야 한다.
  - 무료 플레이 모드에서는 CSPIN 잔액을 **가상 값**(예: 1000)으로 표시하며, 실제 지갑 잔액과는 무관하게 동작해야 한다.

## 2.4. 게임 경제 (Game Economy)

- **FR-ECON-01: 공식 게임 화폐 (Official Game Currency)**
  - (EN) **Blockchain:** TON
  - (KO) **블록체인:** TON
  - (EN) **Token Name:** CandleSpinner (CSPIN)
  - (KO) **토큰명:** CandleSpinner (CSPIN)
  - (EN) **Token Contract Address:** `EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV`
  - (KO) **토큰 컨트랙트 주소:** `EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV`
  - (EN) **Game Wallet Address:** `UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd`
  - (KO) **게임 지갑 주소:** `UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd`

---

# 3. 비기능 요구사항 (Non-Functional Requirements)

- **NFR-SYS-01: 서버리스 아키텍처 (Serverless Architecture)**
  프론트엔드는 Cloudflare Pages, 백엔드는 Cloudflare Functions를 사용하여 완전한 서버리스 환경으로 구축되어야 한다.

- **NFR-SYS-02: 탈중앙성 (Decentralization)**
  사용자의 자산은 항상 사용자 자신의 지갑에 보관되어야 하며, 게임 플레이 과정은 비수탁형(Non-Custodial)으로 이루어져야 한다.

- **NFR-SEC-01: 보안 (Security)**
  게임 지갑의 니모닉, JWT 비밀 키 등 민감 정보는 Cloudflare 환경 변수를 통해 안전하게 관리되어야 한다.

- **NFR-GAME-01: 검증 가능한 공정성 (Provable Fairness) `[신규 추가]`**
    - (KO) 모든 게임 결과(예: 스핀, 더블업)는 중앙화된 서버의 신뢰에만 의존해서는 안 되며, 사용자가 그 결과가 조작되지 않았음을 암호학적으로 검증할 수 있어야 한다.
    - (EN) All game outcomes (e.g., spins, double-ups) must not rely solely on the trust of a centralized server; users must be able to cryptographically verify that the results have not been manipulated.
    - (KO) 이를 위해 `Math.random()`과 같은 예측 불가능한 랜덤 소스 사용을 지양하고, 장기적으로 Commit-Reveal 스킴 또는 온체인 VRF(검증 가능한 랜덤 함수)와 같은 기술 도입을 목표로 한다.
    - (EN) To achieve this, the use of non-deterministic random sources like `Math.random()` shall be avoided, with the long-term goal of adopting techniques such as a Commit-Reveal scheme or an on-chain Verifiable Random Function (VRF).

- **NFR-CODE-01: 주석 정책 (Commenting Policy)**
  모든 코드의 주요 기능 및 복잡한 로직에는 한국어와 영어를 병기하여 주석을 작성해야 한다.

- **NFR-CODE-02: 버전 관리 (Versioning)**
  모든 릴리즈는 시맨틱 버저닝 (`MAJOR.MINOR.PATCH`) 규칙을 엄격히 준수해야 한다.

- **NFR-DOC-01: 변경 이력 관리 (Changelog Management)**
  모든 버전에 대한 변경 사항은 `CHANGELOG.md` 파일에 **'Keep a Changelog'** 형식에 따라 상세히 기록해야 한다.
  특히, **문제 현상**(Error) → **근본 원인**(Cause) → **해결 방안**(Solution) 구조로 작성해야 한다.

- **NFR-DOC-02: 로드맵 관리 (Roadmap Management)**
  프로젝트의 장기적인 개발 목표는 `roadmap.md`에 문서화하고, `roadmap.html`을 통해 시각적으로 표현해야 한다.

- **NFR-DOC-03: 살아있는 아키텍처 문서 관리 (Living Architecture Documentation Management)**
  - **목표 (Goal):** 프로젝트의 기술적 방향성에 대한 **단일 진실 공급원**(Single Source of Truth)을 유지하고, 코드와 문서 간의 불일치를 최소화하는 것을 목표로 한다.
  - **문서 범위 (Scope):** `PROJECT_ARCHITECTURE.MD` 문서는 시스템 구성도, 기술 스택, 데이터 흐름, API 명세 등을 포함해야 한다.
  - **업데이트 프로세스 (Update Process):**
    - (KO) 아키텍처에 영향을 미치는 모든 변경사항은 **반드시 `PROJECT_ARCHITECTURE.MD` 문서의 관련 내용 수정을 포함**하는 단일 Pull Request로 제출되어야 한다.
    - (EN) All changes affecting the architecture **must be submitted as a single Pull Request that includes corresponding updates to the `PROJECT_ARCHITECTURE.MD` document**.
    - (KO) 코드 리뷰 시, 리뷰어는 코드 변경사항뿐만 아니라 아키텍처 문서가 함께 업데이트되었는지 확인할 의무를 가진다.
    - (EN) During code review, reviewers are responsible for ensuring that the architecture document is updated along with the code changes.

- **NFR-DOC-04: 아키텍처 결정 기록 관리 (Architecture Decision Record Management)**
  - **목표 (Goal):** 중요한 아키텍처 결정의 **"이유"**와 **"결과"**를 명시적으로 기록하여, 기술 부채의 발생을 추적하고, 과거의 의사결정 과정을 투명하게 공유한다.
  - **기록 대상 (Targets for Recording):** 새로운 기술 도입, 핵심 디자인 패턴 변경, API 인터페이스의 중대한 변경 등 중요한 기술적 결정이 내려질 때마다 ADR을 작성해야 한다.
  - **프로세스 및 형식 (Process & Format):**
    - (KO) 모든 ADR은 `/docs/adr` 디렉터리 내에 `YYYYMMDD-decision-title.md` 형식의 파일로 생성하며, 표준화된 템플릿(상태, 배경, 결정, 결과)을 따라야 한다.
    - (EN) All ADRs shall be created in the `/docs/adr` directory using the format `YYYYMMDD-decision-title.md` and must follow a standardized template (Status, Context, Decision, Consequences).
    - (KO) 새로운 ADR의 작성 및 기존 ADR의 상태 변경은 **반드시 팀의 논의를 거쳐야 하며, 관련 Pull Request에 해당 ADR이 링크**되어야 한다.
    - (EN) The creation of a new ADR or a status change to an existing one **must be discussed by the team and linked in the relevant Pull Request**.

- **NFR-UI-01: 시각적 테마 (Visual Theme)**
  애플리케이션은 "Cosmic Gemstone" 테마를 가지며, 네온 스타일 UI 요소와 동적인 별 배경 효과를 포함해야 한다.

- **NFR-LANG-01: 커뮤니케이션 언어 (Communication Language)**
  사용자와의 모든 소통은 한국어로 진행해야 한다.


---

# 4. v2 수정 및 개선사항 (v2 Fixes & Enhancements)

## 4.1. 식별된 버그 (Identified Bugs)

- **BUG-01: 스핀 후 언어 변경 시 메시지 초기화 (Message Reset on Language Change After Spin)**
  - (EN) **Problem:** When changing the language during gameplay, the current status message (e.g., 'You won 50!') resets to the initial welcome message instead of being translated.
  - (KO) **문제:** 게임 진행 중 언어 변경 시, 현재 상태 메시지(예: '50 당첨!')가 번역되지 않고 초기 환영 메시지로 돌아갑니다.
  - (EN) **Requirement:** The system must be modified to retain the current game state (last message key and its parameters) and display the correctly translated message when the language is changed.
  - (KO) **개선 요구사항:** 언어를 변경하더라도 현재 게임 상태(마지막 메시지 키와 파라미터)를 유지하고, 해당 상태에 맞는 메시지가 올바른 언어로 번역되어 표시되도록 수정해야 합니다.
