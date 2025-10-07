### **공식 프로젝트 실행 계획 보고서 (Official Project Execution Plan Report)**

**TO:** 프로젝트 책임자
**FROM:** AI 수석 개발자
**DATE:** 2025-10-07
**SUBJECT:** CandleSpinner: The Galactic Casino 프로젝트 실행 계획

---

#### **1. 프로젝트 목표 및 기술 요약 (Project Objective & Tech Stack Summary)**

*   **핵심 목표 (Core Objective):**
    TON 블록체인 위에서 동작하는 완전 탈중앙화 및 서버리스 Web3 슬롯머신 게임 'CandleSpinner'를 개발합니다. 사용자는 자신의 암호화폐 지갑을 통해 자산을 완벽하게 통제하며, 투명하고 공정한 게임 플레이를 경험하게 하는 것이 최종 목표입니다.

*   **주요 기능 및 최종 결과물 (Key Features & Final Product):**
    최종 결과물은 `https://aiandyou.me/` 도메인을 통해 접근 가능한 반응형 웹 애플리케이션입니다. 주요 기능은 다음과 같습니다.
    *   `@tonconnect/ui`를 통한 간편한 TON 지갑 연결
    *   프로젝트 고유 토큰(CSPIN)을 사용한 베팅 및 스핀 실행
    *   보안과 사용자 경험을 고려한 JWT 기반의 '지연 지급 시스템' (당첨 티켓 발급)
    *   당첨금 수령 또는 50% 확률의 '더블업' 미니게임 선택 기능
    *   글로벌 사용자를 위한 다국어(한/영/일/중) 지원
    *   'Cosmic Gemstone' 테마를 적용한 미려한 사용자 인터페이스

*   **핵심 기술 스택 (Core Tech Stack):**
    *   **프론트엔드 (Frontend):** Vite, 순수 JavaScript (ESM), HTML5, CSS3, `@tonconnect/ui`
    *   **백엔드 (Backend):** Cloudflare Functions, Node.js, `jose` (JWT), `@ton/ton` (TON 블록체인 상호작용)
    *   **블록체인 (Blockchain):** TON (The Open Network)

---

#### **2. AI 개발 가이드라인 준수 서약 (Adherence to AI Development Guidelines)**

본 AI 개발자는 `AI_AGENT_GUIDELINES.md`에 명시된 아래 원칙들을 프로젝트의 최우선 가치로 삼을 것을 서약합니다.

*   **핵심 원칙 리스트업:**
    1.  **실시간 문서화 (Real-time Documentation):** 코드 변경 시 관련 문서를 항상 함께 업데이트합니다.
    2.  **2개 국어 작성 의무 (Bilingual Mandate):** 모든 주석과 문서는 한국어와 영어를 병기합니다.
    3.  **요구사항 기반 작업 (Requirement-Driven Work):** 모든 개발은 `PROJECT_REQUIREMENTS.md`와 `PROJECT_ARCHITECTURE.MD`에 근거합니다.
    4.  **'문서 우선' 원칙 (Documentation-First Principle):** 명세에 없는 신규 기능 개발 요청 시, 코드보다 문서(요구사항, 아키텍처) 변경안을 먼저 작성하여 사용자에게 승인받습니다.

*   **준수 방안:**
    향후 모든 개발 과정에서 코드 변경이 포함된 Pull Request는 반드시 관련 문서(`PROJECT_ARCHITECTURE.MD`, `CHANGELOG.md` 등)의 수정 사항을 포함할 것입니다. 사용자로부터 명세에 없는 새로운 기능 요청을 받을 경우, 코드 개발에 앞서 `PROJECT_REQUIREMENTS.md` 및 `PROJECT_ARCHITECTURE.MD`의 변경 초안을 작성하여 먼저 제출하고, 승인을 받은 후에만 개발을 시작하겠습니다. 이는 코드와 문서 간의 불일치를 원천적으로 방지하고, 명확한 '작업 계약'에 기반하여 프로젝트를 진행하기 위함입니다.

---

#### **3. 프로젝트 완성 실행 전략 (Execution Strategy for Project Completion)**

'문서화 우선' 원칙에 입각하여, 프로젝트를 아래와 같이 단계별로 완성해 나가겠습니다.

*   **1단계: 프로젝트 구조 및 문서 설정 (Phase 1: Scaffolding & Documentation Setup)**
    *   **활동:** `docs` 디렉토리 생성 및 기존 문서 이동. `package.json`, `vite.config.js`, `wrangler.toml` 등 기본 설정 파일 생성. `src`, `public`, `functions` 디렉토리 구조 생성.
    *   **산출물:** 초기 프로젝트 구조, 버전 관리 시스템(Git) 초기화.

*   **2단계: 백엔드 API 명세 구체화 및 개발 (Phase 2: Backend API Specification & Development)**
    *   **활동:** `PROJECT_ARCHITECTURE.MD` 내 API 명세(Request/Response JSON 구조 등)를 상세히 기술합니다. Cloudflare Functions를 사용하여 `/spin`, `/claimPrize`, `/doubleUp` API를 개발하고, 로컬 환경에서 단위 테스트를 수행합니다.
    *   **산출물:** 상세 API 명세가 업데이트된 `PROJECT_ARCHITECTURE.MD`, 실제 작동하는 백엔드 함수 코드.

*   **3단계: 프론트엔드 UI 및 지갑 연동 개발 (Phase 3: Frontend UI & Wallet Integration)**
    *   **활동:** `index.html`에 기본 뷰(랜딩/게임) 구조를 작성합니다. `main.js`에서 `@tonconnect/ui`를 이용한 지갑 연결 및 뷰 전환 로직을 구현합니다.
    *   **산출물:** 지갑 연결 기능이 구현된 초기 프론트엔드.

*   **4단계: 프론트엔드-백엔드 연동 및 핵심 기능 완성 (Phase 4: Full-Stack Integration & Core Feature Completion)**
    *   **활동:** 프론트엔드에서 스핀, 상금 수령, 더블업 버튼 클릭 시 백엔드 API를 호출하고, 그 결과를 UI에 정확히 반영하는 로직을 완성합니다.
    *   **산출물:** 주요 게임 플로우가 완성된 애플리케이션. `CHANGELOG.md`에 `Added` 항목으로 핵심 기능 구현 내용을 기록합니다.

*   **5단계: 부가 기능 구현 및 최종화 (Phase 5: Ancillary Features & Finalization)**
    *   **활동:** 다국어 지원, 'Cosmic Gemstone' 시각적 테마 적용, 버전 정보 표시 등 부가 기능을 구현합니다. 전체 시스템 통합 테스트를 수행합니다.
    *   **산출물:** 모든 요구사항이 반영된 최종 애플리케이션. `CHANGELOG.md`에 해당 버전 릴리즈 노트를 최종 정리합니다. 만약 이 과정에서 새로운 라이브러리 도입 등 중요한 아키텍처 결정이 있었다면 `docs/adr/` 폴더에 **ADR(아키텍처 결정 기록)** 파일을 작성하여 기록을 남깁니다.

---

#### **4. Cloudflare 배포 전제 조건 체크리스트 (Pre-Deployment Checklist for Cloudflare)**

`PROJECT_ARCHITECTURE.md`를 근거로, 첫 배포 전에 Cloudflare Pages 대시보드에서 반드시 설정해야 할 항목들의 체크리스트입니다.

*   **✅ 환경 변수 (Environment Variables):**
    *   `Settings > Environment variables`에서 다음 변수들을 설정해야 합니다. (Production과 Preview 환경 모두에 적용)
    *   **`GAME_WALLET_MNEMONIC`**: 게임의 상금 지급용 핫월렛의 24개 니모닉 단어. (값: "실제 24개 단어 니모닉 구문")
    *   **`JWT_SECRET`**: "당첨 티켓" JWT를 서명하고 검증하기 위한 비밀 키. (값: "충분히 길고 무작위적인 보안 문자열")
    *   **`DEV_KEY`**: (선택사항, Preview 환경에만 설정 권장) 개발 및 테스트 시 특정 게임 결과를 강제하기 위한 비밀 키. (값: "개발자용 비밀 키")

*   **✅ 빌드 설정 (Build Settings):**
    *   **Framework preset:** `Vite`
    *   **Build command:** `npm run build`
    *   **Build output directory:** `dist`

*   **✅ 사용자 정의 도메인 (Custom Domain):**
    1.  Cloudflare Pages 프로젝트의 `Custom domains` 탭으로 이동합니다.
    2.  `Set up a custom domain` 버튼을 클릭하고 `aiandyou.me`를 입력합니다.
    3.  Cloudflare가 제시하는 DNS 레코드(보통 CNAME 레코드)를 도메인의 DNS 설정에 추가합니다.
    4.  DNS 전파가 완료되면 Cloudflare가 자동으로 SSL 인증서를 발급하고 도메인 활성화를 완료합니다.