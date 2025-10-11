---
document_type: Standard Operating Procedures
version: 1.0
last_updated: 2025-10-11
status: final
ai_optimized: true
estimated_read_time: 10 min
priority_sections:
  - section_1: immediate_checks (must read first)
  - section_7: forbidden_actions (must never violate)
---

# AI 개발 표준 운영 절차 (SOP)
(AI Development Standard Operating Procedures)

## 1. 즉시 확인 사항 (CRITICAL: Read This First)

**AI 에이전트는 작업 시작 전 다음을 반드시 확인해야 합니다:**

- [ ] **현재 Active Issue 확인:** `PROJECT_REQUIREMENTS.md` Section 2
- [ ] **금지 조항 7개 확인:** 이 문서 Section 7 (표 형식)
- [ ] **설계 규칙 5개 확인:** `PROJECT_ARCHITECTURE.MD` Section 3
- [ ] **관련 ADR 확인:** `PROJECT_ARCHITECTURE.MD` Section 8

---

## 2. 핵심 원칙 (Core Principles)

AI 에이전트는 모든 코드 관련 작업을 수행할 때 다음 핵심 원칙을 반드시 준수해야 합니다.

- **실시간 문서화 (Real-time Documentation)**
  코드의 변경(생성, 수정, 삭제)이 발생하는 풀 리퀘스트(Pull Request) 내에는 반드시 관련된 문서의 변경사항이 함께 포함되어야 합니다. 코드와 문서는 항상 동일한 버전을 유지해야 합니다.

- **2개 국어 작성 의무 (Bilingual Mandate)**
  NFR-CODE-01 요구사항에 따라, 모든 문서와 코드 내 주석은 한국어와 영어를 병기하여 작성해야 합니다.

- **요구사항 기반 작업 (Requirement-Driven Work)**
  모든 작업은 `docs/PROJECT_REQUIREMENTS.md`에 명시된 요구사항에 근거해야 하며, 아키텍처는 `docs/PROJECT_ARCHITECTURE.MD`를 따라야 합니다. 모든 커밋, PR, 관련 문서(ADR, CHANGELOG)에서는 관련 요구사항 ID(예: `[FR-UI-01]`, `[BUG-003]`)를 의무적으로 참조해야 합니다.

- **문서 우선 원칙 (Documentation-First Principle)**
  명세서에 없는 신규 기능 개발 요청 시, 코드보다 문서 작업을 우선합니다. AI는 요구사항, 아키텍처 등 관련 문서의 변경 초안을 먼저 사용자에게 제출하여 '작업 계약'으로 삼습니다. 사용자가 문서 변경안을 최종 승인하기 전까지 코드 개발을 시작하지 않습니다.

---

## 3. 문서 저장 위치 (Document Storage Location)

- 본 가이드라인에서 명시하는 모든 산출물 문서는 프로젝트 최상위 경로(root)에 위치한 `docs/` 폴더 내에서 생성하고 관리해야 합니다.
- ADR(아키텍처 결정 기록)은 `docs/adr/` 과 같이 하위 폴더를 만들어 체계적으로 관리합니다.
- Reports는 `docs/reports/` 폴더에 저장합니다.

---

## 4. 작업 워크플로우 (Work Workflow)

> 모든 개발 작업은 아래 3단계 절차를 엄격히 따릅니다.

### 4.1. Phase 1: 설계 확인 (Design Phase - Human 작업)

- **주체 (Owner):** Human
- **AI 역할:** 대기 (Standby)
- **책임 (Responsibilities):**
  * 새로운 기능 또는 버그 수정에 대한 요구사항을 `PROJECT_REQUIREMENTS.md`의 Section 2 'Active Issues'에 ID와 함께 등록합니다.
  * 요구사항을 충족시키기 위한 기술적 변경 사항을 `PROJECT_ARCHITECTURE.MD`에 반영합니다.
  * 중요한 아키텍처 변경이 필요할 경우, `docs/adr`에 새로운 ADR 초안을 작성합니다.

### 4.2. Phase 2: 코드 구현 (Implementation Phase - AI 작업)

- **주체 (Owner):** AI (Jules)
- **입력 (Input):** Phase 1에서 업데이트된 `PROJECT_REQUIREMENTS.md`, `PROJECT_ARCHITECTURE.MD`, ADR
- **작업 전 체크리스트:**
  - [ ] 금지 조항 7개 검토 완료 (Section 7)
  - [ ] 관련 ADR 읽기 완료 (PROJECT_ARCHITECTURE.MD Section 8)
  - [ ] 설계 규칙 5개 확인 완료 (PROJECT_ARCHITECTURE.MD Section 3)
  - [ ] Active Issue의 요구 작업 목록 확인 완료
- **책임 (Responsibilities):**
  * Human이 1단계에서 수정한 최신 설계 문서들을 입력받습니다.
  * 설계 문서의 변경 사항을 코드에 정확하게 구현합니다.
  * 수행한 작업 내역을 바탕으로 `CHANGELOG.md`의 최신 버전 항목에 대한 초안을 작성합니다.
- **출력 (Output):**
  * 코드 구현 (10개 이상 파일)
  * CHANGELOG.md 초안 (Error-Cause-Solution 구조)
- **검증 기준 (Verification Criteria):**
  - [ ] Math.random() 사용 0회
  - [ ] 환경 변수 하드코딩 0회
  - [ ] 모든 함수에 한/영 주석
  - [ ] 요구사항 ID 참조 (PR 제목, CHANGELOG)
  - [ ] CHANGELOG 3단계 구조 준수

### 4.3. Phase 3: 정제 및 검수 (Refinement & Review Phase - Human + Copilot)

- **주체 (Owner):** Human (with GitHub Copilot)
- **AI 역할:** 리뷰 대기 (Review Standby)
- **책임 (Responsibilities):**
  * AI가 생성한 코드 초안의 세부 로직을 검토하고, Copilot Agent와 함께 가독성 개선, 주석 추가 등의 리팩토링을 수행합니다.
  * 기능 회귀(Regression)가 없는지 최종 테스트를 진행합니다.
  * AI가 작성한 `CHANGELOG.md` 초안을 검토하고 최종 확정합니다.
  * 모든 변경 사항을 단일 Pull Request로 제출합니다.

---

## 5. 필수 산출 문서 목록 및 작성 지침 (Required Documents & Instructions)

AI 에이전트는 아래 명시된 문서들을 생성하고, 코드 변경 시 실시간으로 유지보수할 책임이 있습니다.

### 5.1. 요구사항 명세서 (Requirements Specification)

- **파일명 (Filename):** `docs/PROJECT_REQUIREMENTS.md`
- **목적 (Purpose):**
  프로젝트의 모든 기능적/비기능적 요구사항을 정의하는 단일 진실 공급원(Single Source of Truth)입니다.
- **작성 지침 (Instructions):**
  * 이 문서는 AI 에이전트 작업의 가장 최상위 근거가 됩니다.
  * Section 2 "Active Issues"가 최상단에 위치하며, AI는 이 섹션을 가장 먼저 확인해야 합니다.
  * 요구사항의 변경이나 추가가 필요한 경우, 코드 작업에 앞서 이 문서에 대한 수정 제안(PR)을 먼저 생성해야 합니다.
  * **해결된 버그 관리 (Resolved Bug Management):**
    - (KO) `PROJECT_REQUIREMENTS.md`에 명시된 버그가 해결되면, 해당 버그 항목을 Section 2에서 삭제하고 Section 5 "완료된 버그 아카이브"로 이동해야 합니다.
    - (EN) When a bug specified in `PROJECT_REQUIREMENTS.md` is fixed, move it from Section 2 to Section 5 "Resolved Issues Archive".

### 5.2. 소프트웨어 아키텍처 문서 (Software Architecture Document)

- **관련 요구사항 (Related Requirement):** NFR-DOC-03
- **파일명 (Filename):** `docs/PROJECT_ARCHITECTURE.MD`
- **목적 (Purpose):**
  시스템의 구조, 구성 요소, 기술 스택 및 설계 원칙을 설명하여 모든 팀원이 일관된 이해를 갖도록 합니다.
- **작성 지침 (Instructions):**
  * Section 3 "설계 규칙"이 명확하게 정의되어 있으며, AI는 이를 절대적으로 준수해야 합니다.
  * 아키텍처에 영향을 주는 코드 변경 시 반드시 함께 업데이트해야 합니다.

### 5.3. 아키텍처 결정 기록 (Architecture Decision Records)

- **관련 요구사항 (Related Requirement):** NFR-DOC-04
- **파일명 (Filename):** `docs/adr/YYYYMMDD-decision-title.md`
- **목적 (Purpose):**
  "왜" 그렇게 설계했는지에 대한 중요한 아키텍처 결정의 배경과 결과를 기록합니다.

### 5.4. 변경 이력 (Changelog)

- **관련 요구사항 (Related Requirement):** NFR-DOC-01
- **파일명 (Filename):** `docs/CHANGELOG.md`
- **목적 (Purpose):**
  모든 버전 릴리즈에 대한 사용자 중심의 변경사항을 추적하고 기록합니다.
- **작성 지침 (Instructions):**
  * NFR-CODE-02의 시맨틱 버저닝(MAJOR.MINOR.PATCH) 규칙에 따라 버전을 관리합니다.
  * **모든 항목은 Error-Cause-Solution 3단계 구조를 반드시 따라야 합니다.**
  * 한국어(KO)와 영어(EN) 모두 작성해야 합니다.

### 5.5. 로드맵 (Roadmap)

- **관련 요구사항 (Related Requirement):** NFR-DOC-02
- **파일명 (Filename):** `docs/roadmap.md`
- **목적 (Purpose):**
  프로젝트의 장기적인 비전과 개발 목표를 공유합니다.

---

## 6. 버전 관리 자동화 (Version Management Automation)

### 6.1. 자동 PATCH 버전 증가 조건

다음 조건을 **모두** 충족하는 경우, `package.json`의 PATCH 버전을 자동으로 1 증가시켜야 합니다:

- [ ] 파일 수정이 10개 미만 AND
- [ ] API 변경 없음 AND
- [ ] 하위 호환성 유지

### 6.2. CHANGELOG 작성 규칙

패치 버전 업데이트 시, `docs/CHANGELOG.md` 파일에 해당 버전 릴리즈 노트를 작성해야 합니다.
**모든 항목은 영문과 한국문 모두 동일한 3단계 구조를 반드시 따라야 합니다**:

```
- **(KO) [REQ-ID] {한글 요약}:**
  - **문제 (Error):** {구체적인 오류 메시지, 파일명:줄번호 포함}
  - **원인 (Cause):** {기술적 근본 원인, 왜 발생했는지}
  - **해결 (Solution):**
    1. {수행한 작업 1}
    2. {수행한 작업 2}
    3. {영향받은 문서 업데이트}
- **(EN) [REQ-ID] {English Summary}:**
  - **Error:** {Specific error message, include file:line}
  - **Cause:** {Technical root cause, why it happened}
  - **Solution:**
    1. {Action taken 1}
    2. {Action taken 2}
    3. {Document updates}
```

**이 구조를 따르지 않은 PR은 자동으로 리뷰 대상에서 제외됩니다.**

### 6.3. 프론트엔드 버전 표시

- `package.json`의 버전이 업데이트되면, `index.html` 또는 관련 UI 스크립트를 수정하여 사용자가 보는 화면에도 반드시 동일한 버전(예: `v3.1.13`)이 표시되도록 업데이트해야 합니다.
- 프론트엔드는 빌드 시점에 `import.meta.env.VITE_APP_VERSION`을 통해 버전을 참조해야 하며, 이 값은 Vite 설정에서 `package.json`의 `version`으로 주입됩니다.

### 6.4. 자동화 실행 원칙

- 모든 PR은 **문서 변경 + 코드 변경**을 반드시 포함해야 하며, 분리된 PR은 무효 처리됩니다.
- 버그 수정 PR은 제목에 `[FIX]` 또는 `[PATCH]` 접두사를 붙여야 합니다.
- `wrangler.toml`은 반드시 다음 속성을 포함해야 합니다:
  ```toml
  name = "candlespinner-functions"
  compatibility_flags = ["nodejs_compat"]
  compatibility_date = "2025-10-08"
  pages_build_output_dir = "dist"
  ```

---

## 7. 금지 조항 (CRITICAL: Never Do This)

**AI 에이전트는 다음 행동을 절대 수행해서는 안 됩니다.**

| # | 금지 행위 | 감지 방법 | 대안 | 관련 규칙 |
|---|----------|----------|------|----------|
| 1 | Math.random() 사용 | `grep -r "Math.random()" functions/ src/` | crypto.getRandomValues() + Commit-Reveal | PROJECT_ARCHITECTURE.MD Section 3.1 |
| 2 | 환경 변수 하드코딩 | `grep -rE "(JWT_SECRET\|GAME_WALLET_SEED).*=.*['\"]" functions/` | env.JWT_SECRET 또는 즉시 실패 | PROJECT_ARCHITECTURE.MD Section 3.2 |
| 3 | 문서 없는 코드 변경 | PR diff에 /docs 없음 | 코드와 문서 동시 커밋 | 이 문서 Section 2 |
| 4 | CHANGELOG 3단계 구조 위반 | "Error:", "Cause:", "Solution:" 부재 | Section 6.2 템플릿 강제 사용 | CHANGELOG.md 상단 규칙 |
| 5 | 요구사항 ID 누락 | PR 제목에 [XXX-XXX] 없음 | [BUG-003] 또는 [FR-UI-01] 형식 필수 | 이 문서 Section 2 |
| 6 | @tonconnect/ui CDN 사용 | `grep "unpkg.com/@tonconnect" index.html` | NPM 번들링 (`npm install`) | PROJECT_ARCHITECTURE.MD Section 3.3, ADR-003 |
| 7 | 외부 API 의존 (폐기된 RPC) | `/getJettonWalletAddress` 호출 검색 | 클라이언트 측 계산 (`@ton/core`) | PROJECT_ARCHITECTURE.MD Section 3.4, ADR-002 |

### 7.1. 금지 조항 자동 검증 스크립트

다음 스크립트를 실행하여 금지 조항 위반 여부를 확인할 수 있습니다:

```bash
#!/bin/bash

echo "🔍 설계 규칙 검증 중..."

# 규칙 1: Math.random() 검사
if grep -r "Math.random()" functions/ src/ 2>/dev/null; then
  echo "❌ 규칙 1 위반: Math.random() 사용 금지"
  exit 1
fi

# 규칙 2: 환경 변수 하드코딩 검사
if grep -rE "(JWT_SECRET|GAME_WALLET_SEED).*=.*['\"]" functions/ 2>/dev/null; then
  echo "❌ 규칙 2 위반: 비밀 키 하드코딩 금지"
  exit 1
fi

# 규칙 3: CDN 사용 검사
if grep "unpkg.com/@tonconnect" index.html 2>/dev/null; then
  echo "❌ 규칙 3 위반: @tonconnect/ui CDN 사용 금지"
  exit 1
fi

# 규칙 4: RPC 프록시 호출 검사
if grep -r "/getJettonWalletAddress" src/ 2>/dev/null; then
  echo "❌ 규칙 4 위반: 폐기된 RPC 프록시 사용 금지"
  exit 1
fi

echo "✅ 모든 설계 규칙 준수 확인"
```

---

## 8. Pull Request(PR) 체크리스트

모든 Pull Request의 설명문은 아래 템플릿을 사용하여 작성해야 합니다.

```markdown
## 📝 작업 내용 (Description)
[BUG-XXX] 또는 [FR-XXX]: {한 줄 요약}

(KO) 이 PR의 목적과 주요 변경 사항을 요약합니다.
(EN) Summarize the purpose and main changes of this PR.

## 🔗 관련 문서 (Related Documents)
- **Related Requirement ID:** [e.g., BUG-003, FR-UI-01]
- **요구사항:** PROJECT_REQUIREMENTS.md Section X.X
- **아키텍처:** PROJECT_ARCHITECTURE.MD Section X.X
- **관련 ADR:** ADR-00X
- **개선 계획서:** docs/reports/YYYYMMDD-xxx.md (if any)

## ✅ 자동 검증 통과 여부
- [x] Math.random() 사용 없음 (검증 완료)
- [x] 환경 변수 하드코딩 없음 (검증 완료)
- [x] CHANGELOG 3단계 구조 준수 (검증 완료)
- [x] 모든 파일에 한/영 주석 (검증 완료)
- [x] 요구사항 ID 참조 (검증 완료)

## 🧪 수동 검증 필요
- [ ] 기능 회귀 테스트 (Human)
- [ ] ADR 검토 (Human)

## 📋 체크리스트 (Checklist)
- [ ] 코드 변경 사항을 구현했는가? (Code changes implemented?)
- [ ] 관련 문서(요구사항, 아키텍처)를 모두 업데이트했는가? (All related documents updated?)
- [ ] `docs/CHANGELOG.md`에 변경 이력을 기록했는가? (Changelog entry added?)
- [ ] 모든 주석과 문서에 2개 국어(KO/EN)를 적용했는가? (Bilingual comments/docs applied?)
```

---

## 9. 프론트엔드 UI/UX 원칙 (UI/UX Principles)

- (KO) 모든 프론트엔드 페이지에는 사용자가 현재 버전을 확인할 수 있는 버전 표시 기능이 포함되어야 한다. 버전 정보는 package.json의 버전을 동적으로 참조하여 표시해야 한다.
- (EN) All frontend pages must include a version display feature so users can check the current version. The version info must be dynamically referenced from package.json.
