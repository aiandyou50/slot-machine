# AI 개발 표준 운영 절차 (SOP)
(AI Development Standard Operating Procedures)

## 1. 목적 (Purpose)

이 문서는 CandleSpinner 프로젝트에서 AI 코딩 에이전트(Jules)의 작업 절차를 정의하는 실행 가능한 플레이북(An actionable playbook that defines the standard operating procedures for the AI Coding Agent)입니다.

## 2. 핵심 원칙 (Core Principles)

AI 에이전트는 모든 코드 관련 작업을 수행할 때 다음 핵심 원칙을 반드시 준수해야 합니다.

- **실시간 문서화 (Real-time Documentation)**
  코드의 변경(생성, 수정, 삭제)이 발생하는 풀 리퀘스트(Pull Request) 내에는 반드시 관련된 문서의 변경사항이 함께 포함되어야 합니다. 코드와 문서는 항상 동일한 버전을 유지해야 합니다.

- **2개 국어 작성 의무 (Bilingual Mandate)**
  NFR-CODE-01 요구사항에 따라, 모든 문서와 코드 내 주석은 한국어와 영어를 병기하여 작성해야 합니다.

- **요구사항 기반 작업 (Requirement-Driven Work)**
  모든 작업은 `docs/PROJECT_REQUIREMENTS.md`에 명시된 요구사항에 근거해야 하며, 아키텍처는 `docs/PROJECT_ARCHITECTURE.MD`를 따라야 합니다. 모든 커밋, PR, 관련 문서(ADR, CHANGELOG)에서는 관련 요구사항 ID(예: `[FR-UI-01]`, `[BUG-003]`)를 의무적으로 참조해야 합니다.

- **신규 기능 추가 워크플로 (New Feature Workflow)**

    - **'문서 우선' 원칙 (Documentation-First Principle)**
      명세서에 없는 신규 기능 개발 요청 시, 코드보다 문서 작업을 우선합니다.
    - **작업 계약 및 승인 (Work Contract & Approval)**
      AI는 요구사항, 아키텍처 등 관련 문서의 변경 초안을 먼저 사용자에게 제출하여 '작업 계약'으로 삼습니다.
    - **승인 기반 개발 (Approval-Driven Development)**
      사용자가 문서 변경안을 최종 승인하기 전까지 코드 개발을 시작하지 않습니다.

-----

## 3. 문서 저장 위치 (Document Storage Location)

- 본 가이드라인에서 명시하는 모든 산출물 문서는 프로젝트 최상위 경로(root)에 위치한 `docs/` 폴더 내에서 생성하고 관리해야 합니다.
- ADR(아키텍처 결정 기록)은 `docs/adr/` 과 같이 하위 폴더를 만들어 체계적으로 관리합니다.

-----
## 4. Human-AI 협업 워크플로우 (Human-AI Collaboration Workflow)

> 모든 개발 작업은 아래 3단계 절차를 엄격히 따릅니다.
>
> **1단계: 설계 (Design Phase)**
>
> *   **주체 (Owner):** Human
> *   **책임 (Responsibilities):**
>     *   새로운 기능 또는 버그 수정에 대한 요구사항을 `PROJECT_REQUIREMENTS.md`의 'Active Issues' 섹션에 ID와 함께 등록합니다.
>     *   요구사항을 충족시키기 위한 기술적 변경 사항을 `PROJECT_ARCHITECTURE.MD`에 반영합니다.
>     *   중요한 아키텍처 변경이 필요할 경우, `docs/adr`에 새로운 ADR 초안을 작성합니다.
>
> **2단계: 구현 (Implementation Phase)**
>
> *   **주체 (Owner):** AI (Jules)
> *   **책임 (Responsibilities):**
>     *   Human이 1단계에서 수정한 최신 설계 문서들(REQUIREMENTS, ARCHITECTURE, ADR)을 입력받습니다.
>     *   설계 문서의 변경 사항을 코드에 정확하게 구현합니다.
>     *   수행한 작업 내역을 바탕으로 `CHANGELOG.md`의 최신 버전 항목에 대한 초안을 작성합니다.
>
> **3단계: 정제 및 검수 (Refinement & Review Phase)**
>
> *   **주체 (Owner):** Human (with GitHub Copilot)
> *   **책임 (Responsibilities):**
>     *   AI가 생성한 코드 초안의 세부 로직을 검토하고, Copilot Agent와 함께 가독성 개선, 주석 추가 등의 리팩토링을 수행합니다.
>     *   기능 회귀(Regression)가 없는지 최종 테스트를 진행합니다.
>     *   AI가 작성한 `CHANGELOG.md` 초안을 검토하고 최종 확정합니다.
>     *   모든 변경 사항을 단일 Pull Request로 제출합니다.

-----

## 5. 필수 산출 문서 목록 및 작성 지침 (Required Documents & Instructions)

AI 에이전트는 아래 명시된 문서들을 생성하고, 코드 변경 시 실시간으로 유지보수할 책임이 있습니다.

### 5.1. 요구사항 명세서 (Requirements Specification)

  - **파일명 (Filename):** `docs/PROJECT_REQUIREMENTS.md`
  - **목적 (Purpose):**
    프로젝트의 모든 기능적/비기능적 요구사항을 정의하는 단일 진실 공급원(Single Source of Truth)입니다.
  - **작성 지침 (Instructions):**
      - 이 문서는 AI 에이전트 작업의 가장 최상위 근거가 됩니다.
      - 요구사항의 변경이나 추가가 필요한 경우, 코드 작업에 앞서 이 문서에 대한 수정 제안(PR)을 먼저 생성해야 합니다.
      - **해결된 버그 관리 (Resolved Bug Management):**
          - (KO) `PROJECT_REQUIREMENTS.md`에 명시된 버그가 해결되면, 해당 버그 항목을 문서에서 삭제해야 합니다. 이 문서는 현재 시스템의 '살아있는 명세'를 반영하며, 과거 버그의 역사는 `CHANGELOG.md`를 통해 추적합니다.
          - (EN) When a bug specified in `PROJECT_REQUIREMENTS.md` is fixed, the corresponding bug item must be deleted from the document. This document reflects the 'living specification' of the current system; the history of past bugs is tracked through `CHANGELOG.md`.

### 5.2. 소프트웨어 아키텍처 문서 (Software Architecture Document)

  - **관련 요구사항 (Related Requirement):** NFR-DOC-03
  - **파일명 (Filename):** `docs/PROJECT_ARCHITECTURE.MD`
  - **목적 (Purpose):**
    시스템의 구조, 구성 요소, 기술 스택 및 설계 원칙을 설명하여 모든 팀원이 일관된 이해를 갖도록 합니다.
  - **작성 지침 (Instructions):**
      - 아키텍처에 영향을 주는 코드 변경 시 반드시 함께 업데이트해야 합니다.
      - **포함 내용:**
          - **기술 스택 및 선택 이유 (Tech Stack & Rationale):**
            왜 해당 기술을 채택했는지 명시합니다.
          - **시스템 구성도 (System Diagram):**
            사용자, 프론트엔드, 백엔드, 블록체인 간의 상호작용을 시각적으로 표현합니다.
          - **핵심 로직 흐름 (Key Logic Flow):**
            '스핀 요청 → 당첨 티켓 발급 → 상금 수령'과 같은 주요 비즈니스 로직의 흐름을 설명합니다.
          - **디렉터리 구조 (Directory Structure):**
            각 폴더와 파일의 역할을 정의합니다.
          - **API 엔드포인트 명세 (API Endpoint Specification):**
            아래 내용을 포함하여 `/spin`, `/claimPrize`, `/doubleUp` 엔드포인트를 상세히 기술합니다.
              - Request / Response 데이터 구조 (JSON)
              - 메서드 (e.g., POST)
              - 성공 및 실패 시의 시나리오

### 5.3. 아키텍처 결정 기록 (Architecture Decision Records)

  - **관련 요구사항 (Related Requirement):** NFR-DOC-04
  - **파일명 (Filename):** `docs/adr/YYYYMMDD-decision-title.md`
  - **목적 (Purpose):**
    "왜" 그렇게 설계했는지에 대한 중요한 아키텍처 결정의 배경과 결과를 기록하여 향후 기술적 혼란을 방지합니다.
  - **작성 지침 (Instructions):**
      - 새로운 라이브러리 도입, 핵심 알고리즘 변경 등 중요한 기술적 결정을 내릴 때마다 새로운 ADR 파일을 생성합니다.
      - **템플릿:** 모든 ADR은 다음 구조를 따라야 합니다.
          - **상태 (Status):** 제안됨(Proposed), 채택됨(Accepted), 기각됨(Rejected) 등
          - **배경 (Context):**
            어떤 문제나 요구사항 때문에 이 결정이 필요했는지 설명합니다.
          - **결정 (Decision):**
            최종적으로 내린 결정의 내용을 명확하게 기술합니다.
          - **결과 (Consequences):**
            이 결정으로 인해 발생하는 긍정적, 부정적 결과를 모두 기록합니다.
            (예: "새로운 라이브러리 도입으로 개발 속도는 빨라지지만, 번들 사이즈가 10% 증가함.")

### 5.4. 변경 이력 (Changelog)

  - **관련 요구사항 (Related Requirement):** NFR-DOC-01
  - **파일명 (Filename):** `docs/CHANGELOG.md`
  - **목적 (Purpose):**
    모든 버전 릴리즈에 대한 사용자 중심의 변경사항을 추적하고 기록합니다.
  - **작성 지침 (Instructions):**
      - NFR-CODE-02의 시맨틱 버저닝(MAJOR.MINOR.PATCH) 규칙에 따라 버전을 관리합니다.
      - 새로운 기능을 추가하거나 버그를 수정하는 모든 PR에는 이 파일에 변경사항을 기록하는 내용이 포함되어야 합니다.
      - **형식:** 'Keep a Changelog' 형식을 따르며, `Added`, `Changed`, `Fixed` 등의 태그를 사용합니다.

### 5.5. 로드맵 (Roadmap)

  - **관련 요구사항 (Related Requirement):** NFR-DOC-02
  - **파일명 (Filename):** `docs/roadmap.md`
  - **목적 (Purpose):**
    프로젝트의 장기적인 비전과 개발 목표를 공유합니다.
  - **작성 지침 (Instructions):**
      - 주요 마일스톤이나 에픽(Epic) 단위의 기능 개발이 완료되거나 계획될 때 업데이트합니다.
      - 현재 개발 현황과 향후 계획을 시각적으로 파악할 수 있도록 유지합니다.

### 5.6. 버전 관리 및 릴리즈 노트 (Versioning & Release Notes)

#### 5.6.1. 패치 버전 관리

  - 버그 수정, 리팩토링 등 하위 호환성을 해치지 않는 모든 코드 수정 후에는 `package.json`의 패치(PATCH) 버전을 1 증가시켜야 합니다.

#### 5.6.2. CHANGELOG 작성

패치 버전 업데이트 시, `docs/CHANGELOG.md` 파일에 해당 버전 릴리즈 노트를 작성해야 합니다.
**모든 항목은 영문과 한국문 모두 동일한 3단계 구조를 반드시 따라야 합니다**:
(EN) Error: [구체적인 오류 메시지 또는 현상]
(KO) 문제: [구체적인 오류 메시지 또는 현상]
(EN) Cause: [기술적 근본 원인]
(KO) 원인: [기술적 근본 원인]
(EN) Solution: [수행된 해결 조치]
(KO) 해결: [수행된 해결 조치]

이 구조를 따르지 않은 PR은 자동으로 리뷰 대상에서 제외됩니다.

#### 5.6.3. 프론트엔드 버전 표시

  - `package.json`의 버전이 업데이트되면, `index.html` 또는 관련 UI 스크립트를 수정하여 사용자가 보는 화면에도 반드시 동일한 버전(예: `v2.0.4`)이 표시되도록 업데이트해야 합니다.
  - 이는 사용자의 정확한 오류 보고를 돕기 위함입니다.

### 5.7. 자동화 친화적 실행 원칙 (Automation-Friendly Execution)

  - 모든 PR은 **문서 변경 + 코드 변경**을 반드시 포함해야 하며, 분리된 PR은 무효 처리된다.
  - 버그 수정 PR은 제목에 `[FIX]` 또는 `[PATCH]` 접두사를 붙여야 하며, 이 경우 `package.json`의 PATCH 버전을 1 증가시킨다.
  - 프론트엔드는 빌드 시점에 `import.meta.env.VITE_APP_VERSION`을 통해 버전을 참조해야 하며, 이 값은 Vite 설정에서 `package.json`의 `version`으로 주입된다.
  - `wrangler.toml`은 반드시 다음 속성을 포함해야 한다:
    ```toml
    name = "candlespinner-functions"
    compatibility_flags = ["nodejs_compat"]
    compatibility_date = "2025-10-08"
    pages_build_output_dir = "dist"
    ```

-----

## 6. Pull Request(PR) 가이드라인 (Pull Request Guidelines)

모든 Pull Request의 설명문은 아래 템플릿을 사용하여 작성해야 합니다.

```markdown
## 📝 작업 내용 (Description)
(KO) 이 PR의 목적과 주요 변경 사항을 요약합니다.
(EN) Summarize the purpose and main changes of this PR.

## 🔗 관련 문서 (Related Documents)
- **Related Requirement ID:** [e.g., BUG-003, FR-UI-01]
- **요구사항:** [Link to PROJECT_REQUIREMENTS.md section]
- **아키텍처:** [Link to PROJECT_ARCHITECTURE.MD section]
- **ADR:** [Link to relevant ADR file, if any]
- **개선 계획서:** [Link to relevant report file, if any]

## ✅ 체크리스트 (Checklist)
- [ ] 코드 변경 사항을 구현했는가? (Code changes implemented?)
- [ ] 관련 문서(요구사항, 아키텍처)를 모두 업데이트했는가? (All related documents updated?)
- [ ] `docs/CHANGELOG.md`에 변경 이력을 기록했는가? (Changelog entry added?)
- [ ] 모든 주석과 문서에 2개 국어(KO/EN)를 적용했는가? (Bilingual comments/docs applied?)
```
-----

## 7. 금지 조항 (Forbidden Actions / Anti-patterns)

AI 에이전트는 다음 행동을 절대 수행해서는 안 됩니다.

  - **`Math.random()` 사용 금지**

      - (KO) 게임의 공정성과 직접적으로 관련된 모든 로직(예: 스핀 결과, 더블업 확률)에 `Math.random()`을 사용하는 것을 절대 금지합니다. 암호학적으로 안전한 난수 생성기나 검증 가능한 랜덤 함수(VRF)를 사용해야 합니다.
      - (EN) Do not use `Math.random()` for any logic directly related to game fairness (e.g., spin results, double-up probability). Use a cryptographically secure random number generator or a Verifiable Random Function (VRF).

  - **하드코딩된 비밀 키 사용 금지**

      - (KO) `JWT_SECRET`, `GAME_WALLET_SEED` 등 민감한 정보에 대해, 환경 변수 로드 실패 시 폴백(fallback)으로 소스 코드에 하드코딩된 값을 사용하는 것을 절대 금지합니다. 환경 변수가 없으면 즉시 실패(Fail-Safe) 처리해야 합니다.
      - (EN) Never use hardcoded secret values in the source code as a fallback if loading environment variables like `JWT_SECRET` or `GAME_WALLET_SEED` fails. The system must fail safely if an environment variable is missing.

  - **문서 없는 코드 변경 금지**

      - (KO) 관련 문서(`PROJECT_ARCHITECTURE.MD`, `CHANGELOG.md` 등)의 업데이트가 없는 기능 코드 변경 PR은 절대 생성해서는 안 됩니다.
      - (EN) Never create a PR with feature code changes without corresponding updates to the relevant documentation (e.g., `PROJECT_ARCHITECTURE.MD`, `CHANGELOG.md`).