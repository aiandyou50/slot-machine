---

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
  - 언어 선택 기능(드롭다운 등)이 **'게임 뷰'**에 제공되어야 한다.

- **FR-UI-04: 버전 정보 표시 (Version Display)**
  - 현재 애플리케이션의 버전을 시맨틱 버저닝 (`MAJOR.MINOR.PATCH`) 형식으로 **'게임 뷰'**의 특정 위치(예: 푸터)에 항상 표시해야 한다.

## 2.2. 게임 플레이 (Game Play)

- **FR-GAME-01: 슬롯머신 (Slot Machine)**
  - 5릴(Reel), 3행(Row) 형식의 비디오 슬롯머신이어야 한다.
  - 20개의 고정된 페이라인(Payline)을 가진다.

- **FR-GAME-02: 베팅 (Betting)**
  - 사용자는 **'게임 뷰'**에서 베팅 금액을 조절할 수 있어야 한다 (증가/감소 버튼).
  - 스핀 시, 사용자의 지갑에서 베팅 금액만큼의 **CSPIN** (프로젝트 Jetton 토큰)이 게임 지갑으로 전송되어야 한다.  
    이 과정은 사용자의 명시적인 승인을 거쳐야 한다.

- **FR-GAME-03: 스핀 실행 (Spin Execution)**
  - 사용자가 **'스핀'** 버튼을 누르면, 백엔드 `/spin` API가 호출되어야 한다.
  - API는 가중치가 적용된 릴 결과를 무작위로 생성하고, 당첨 여부와 당첨금을 계산하여 반환해야 한다.

- **FR-GAME-04: 지연 지급 시스템 (Delayed Payout System)**
  - 스핀 결과 당첨 시, 백엔드는 상금을 즉시 지급하는 대신, 당첨 정보(사용자 주소, 당첨금 등)가 포함된 **JWT**(JSON Web Token) 형식의 **"당첨 티켓"**을 발급해야 한다.
  - 프론트엔드는 이 티켓을 수신하여 **'상금 수령'** 또는 **'더블업'** 옵션을 사용자에게 제공해야 한다.

- **FR-GAME-05: 상금 수령 (Claim Prize)**
  - 사용자가 **'상금 수령'** 버튼을 누르면, 프론트엔드는 백엔드 `/claimPrize` API를 **"당첨 티켓"**과 함께 호출해야 한다.
  - 백엔드는 티켓을 검증한 후, 유효한 경우 게임 지갑에서 사용자의 지갑으로 해당 상금을 **CSPIN 토큰**으로 전송해야 한다.

- **FR-GAME-06: 더블업 미니게임 (Double Up Minigame)**
  - 사용자가 **'더블업'** 버튼을 누르면, 프론트엔드는 백엔드 `/doubleUp` API를 **"당첨 티켓"**과 함께 호출해야 한다.
  - 백엔드는 50% 확률의 도박 결과를 생성한다.
    - 성공 시, 기존 당첨금의 두 배에 해당하는 새로운 **"당첨 티켓"**을 발급한다.
    - 실패 시, 당첨금은 0이 되며 티켓은 무효화된다.
  - 더블업은 최대 **5회**까지만 가능하다.

## 2.3. 개발 및 테스트 (Development & Testing)

- **FR-DEV-01: 개발자 모드 (결과 강제) (Developer Mode (Force Result))**
  - 백엔드는 특정 `DEV_KEY` 환경 변수와 일치하는 키가 API 요청에 포함될 경우, 특정 결과(예: 잭팟)를 강제로 반환하는 개발자 모드를 지원해야 한다.

- **FR-DEV-02: 개발자 모드 (무료 플레이) (Developer Mode (Free Play))**
  - 이 모드가 활성화되었을 때, 개발자가 웹 기능 테스트를 위해 실제 토큰을 소비하지 않고 슬롯머신 게임을 플레이할 수 있도록 허용해야 한다.

## 2.4. 게임 경제 (Game Economy)

- **FR-ECON-01: 공식 게임 화폐 (Official Game Currency)**
  - **블록체인:** TON  
  - **토큰명:** CandleSpinner (CSPIN)  
  - **토큰 컨트랙트 주소 (Token Contract Address):**  
    `EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV`

---

# 3. 비기능 요구사항 (Non-Functional Requirements)

- **NFR-SYS-01: 서버리스 아키텍처 (Serverless Architecture)**  
  프론트엔드는 Cloudflare Pages, 백엔드는 Cloudflare Functions를 사용하여 완전한 서버리스 환경으로 구축되어야 한다.

- **NFR-SYS-02: 탈중앙성 (Decentralization)**  
  사용자의 자산은 항상 사용자 자신의 지갑에 보관되어야 하며, 게임 플레이 과정은 비수탁형(Non-Custodial)으로 이루어져야 한다.

- **NFR-SEC-01: 보안 (Security)**  
  게임 지갑의 니모닉, JWT 비밀 키 등 민감 정보는 Cloudflare 환경 변수를 통해 안전하게 관리되어야 한다.

- **NFR-CODE-01: 주석 정책 (Commenting Policy)**  
  모든 코드의 주요 기능 및 복잡한 로직에는 한국어와 영어를 병기하여 주석을 작성해야 한다.

- **NFR-CODE-02: 버전 관리 (Versioning)**  
  모든 릴리즈는 시맨틱 버저닝 (`MAJOR.MINOR.PATCH`) 규칙을 엄격히 준수해야 한다.

- **NFR-DOC-01: 변경 이력 관리 (Changelog Management)**  
  모든 버전에 대한 변경 사항은 `CHANGELOG.md` 파일에 **'Keep a Changelog'** 형식에 따라 상세히 기록해야 한다.

- **NFR-DOC-02: 로드맵 관리 (Roadmap Management)**  
  프로젝트의 장기적인 개발 목표는 `roadmap.md`에 문서화하고, `roadmap.html`을 통해 시각적으로 표현해야 한다.

- **NFR-DOC-03: 살아있는 아키텍처 문서 관리 (Living Architecture Documentation Management)**
  - **목표 (Goal):**  
    프로젝트의 기술적 방향성에 대한 **단일 진실 공급원**(Single Source of Truth)을 유지하고, 신규 참여자의 적응을 돕고, 코드와 문서 간의 불일치를 최소화하는 것을 목표로 한다.
  - **문서 범위 (Scope):**  
    `PROJECT_ARCHITECTURE.MD` 문서는 다음 내용을 반드시 포함해야 한다:
    - 핵심 아키텍처 사상 (Core Philosophy)
    - 시스템 구성도 (System Diagram)
    - 각 기술 스택을 선택한 이유 (Rationale for Tech Stack Choices)
    - 주요 데이터 흐름도 (Key Data Flow Diagram, 예: 스핀 요청부터 상금 수령까지)
    - 디렉터리 구조와 각 모듈의 역할 (Directory Structure and Module Responsibilities)
  - **업데이트 프로세스 (Update Process):**
    - 아키텍처에 영향을 미치는 변경사항(예: 신규 라이브러리 도입, API 엔드포인트 구조 변경, 핵심 데이터 흐름 수정 등)이 포함된 풀 리퀘스트(Pull Request)는 반드시 `PROJECT_ARCHITECTURE.MD` 문서의 관련 내용 수정을 포함해야 한다.
    - 코드 리뷰 시, 리뷰어는 코드 변경사항뿐만 아니라 아키텍처 문서가 함께 업데이트되었는지 확인할 의무를 가진다.

- **NFR-DOC-04: 아키텍처 결정 기록 관리 (Architecture Decision Record Management)**
  - **목표 (Goal):**  
    중요한 아키텍처 결정의 **"이유"**와 **"결과"**를 명시적으로 기록하여, 기술 부채의 발생을 추적하고, 과거의 의사결정 과정을 투명하게 공유하며, 향후 발생할 실수를 예방하는 것을 목표로 한다.
  - **기록 대상 (Targets for Recording):**  
    다음을 포함하되 이에 국한되지 않는 중요한 기술적 결정이 내려질 때마다 ADR을 작성해야 한다:
    - 새로운 기술, 프레임워크, 라이브러리의 도입 또는 제거
    - 핵심적인 디자인 패턴 또는 코딩 표준의 채택
    - API의 공개 인터페이스에 대한 중대한 변경
    - 데이터 지속성, 캐싱, 보안 정책 등 비기능적 요구사항에 영향을 미치는 결정
  - **프로세스 및 형식 (Process & Format):**
    - 모든 ADR은 `/docs/adr` 디렉터리 내에 `YYYYMMDD-decision-title.md` 형식의 파일로 생성한다.
    - 각 ADR 파일은 **상태**(Status), **배경**(Context), **결정**(Decision), **결과**(Consequences) 항목을 포함하는 표준화된 템플릿을 따라야 한다.
    - 새로운 ADR의 작성 및 기존 ADR의 상태 변경(예: '제안됨'에서 '채택됨'으로)은 팀의 논의를 거쳐야 하며, 관련 풀 리퀘스트에 해당 ADR이 링크되어야 한다.

- **NFR-UI-01: 시각적 테마 (Visual Theme)**  
  애플리케이션은 **"Cosmic Gemstone"** 테마를 가지며, 네온 스타일 UI 요소와 동적인 별 배경 효과를 포함해야 한다.

- **NFR-LANG-01: 커뮤니케이션 언어 (Communication Language)**  
  사용자와의 모든 소통은 **한국어**로 진행해야 한다.

---
