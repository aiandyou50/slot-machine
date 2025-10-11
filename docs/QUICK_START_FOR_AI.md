---
document_type: Quick Start Guide
version: 1.0
last_updated: 2025-10-11
status: final
ai_optimized: true
estimated_read_time: 5 min
---

# 🤖 AI 에이전트 빠른 시작 가이드
> 5분 만에 프로젝트 규칙 파악하기

## 1️⃣ 즉시 확인 (30초)

**다음 3개 항목을 가장 먼저 확인하세요:**

1. **현재 작업:** `PROJECT_REQUIREMENTS.md` Section 2 (Active Issues)
2. **금지 조항:** `AI_AGENT_GUIDELINES.md` Section 7 (표 형식 7개)
3. **설계 규칙:** `PROJECT_ARCHITECTURE.MD` Section 3 (5개 규칙)

---

## 2️⃣ 현재 진행 중인 작업 (1분)

> **중요:** `PROJECT_REQUIREMENTS.md` Section 2를 확인하세요.

현재 진행 중인 Active Issues가 없습니다. 새로운 작업이 등록되면 이 섹션에 다음 형식으로 표시됩니다:

**예시:**
- **[BUG-003] doubleUp 기능의 불공정성** `우선순위: P0` `상태: 🚧 진행중`
  - **파일:** `functions/doubleUp.js:121`
  - **작업:** Math.random() → Commit-Reveal
  - **마감:** YYYY-MM-DD

---

## 3️⃣ 절대 하지 말아야 할 것 (2분)

> **중요:** `AI_AGENT_GUIDELINES.md` Section 7을 확인하세요.

| # | 금지 | 대안 | 검증 |
|---|------|------|------|
| 1 | Math.random() | Commit-Reveal | `grep -r "Math.random()" functions/` |
| 2 | 환경 변수 하드코딩 | env.XXX 또는 실패 | `grep -rE "(JWT_SECRET\|GAME_WALLET_SEED).*=.*['\"]" functions/` |
| 3 | @tonconnect CDN | NPM 번들링 | `grep "unpkg.com/@tonconnect" index.html` |
| 4 | 폐기된 RPC 호출 | 클라이언트 측 계산 | `grep -r "/getJettonWalletAddress" src/` |
| 5 | 요구사항 ID 누락 | [BUG-XXX] 형식 필수 | PR 제목 확인 |
| 6 | CHANGELOG 3단계 구조 위반 | Error-Cause-Solution | `CHANGELOG.md` 템플릿 사용 |
| 7 | 문서 없는 코드 변경 | 코드+문서 동시 커밋 | PR diff에 /docs 있는지 확인 |

**자동 검증 스크립트:**
```bash
# AI_AGENT_GUIDELINES.md Section 7.1 또는
# PROJECT_ARCHITECTURE.MD Section 3.5 참조
```

---

## 4️⃣ 작업 절차 (2분)

> **중요:** `AI_AGENT_GUIDELINES.md` Section 4를 확인하세요.

### Phase 1: 설계 확인 (Human 작업)
- **주체:** Human
- **AI 역할:** 대기
- Human이 `PROJECT_REQUIREMENTS.md` Section 2에 새로운 Issue를 등록하고, 관련 문서를 업데이트합니다.

### Phase 2: 코드 구현 (AI 작업)
- **주체:** AI (Jules)
- **입력:** 업데이트된 `PROJECT_REQUIREMENTS.md`, `PROJECT_ARCHITECTURE.MD`, ADR
- **작업 전 체크리스트:**
  - [ ] 금지 조항 7개 검토 완료
  - [ ] 관련 ADR 읽기 완료
  - [ ] 설계 규칙 5개 확인 완료
  - [ ] Active Issue의 요구 작업 목록 확인
- **출력:**
  - 코드 구현
  - CHANGELOG.md 초안 (Error-Cause-Solution 구조)
- **검증 기준:**
  - [ ] Math.random() 0회
  - [ ] 환경 변수 하드코딩 0회
  - [ ] 모든 함수에 한/영 주석
  - [ ] 요구사항 ID 참조
  - [ ] CHANGELOG 3단계 구조 준수

### Phase 3: 정제 및 검수 (Human + Copilot)
- **주체:** Human
- **AI 역할:** 리뷰 대기

---

## 5️⃣ 완료 조건 체크리스트

코드 작성 후 다음을 확인:

### 자동 검증 항목
- [ ] Math.random() 사용 없음 (규칙 1)
- [ ] 환경 변수 하드코딩 없음 (규칙 2)
- [ ] @tonconnect/ui CDN 사용 없음 (규칙 3)
- [ ] 폐기된 RPC 호출 없음 (규칙 4)
- [ ] 트랜잭션 발신자 검증 있음 (규칙 5)

### 문서 검증 항목
- [ ] CHANGELOG.md 3단계 구조 준수
- [ ] 요구사항 ID 참조 ([BUG-XXX] 또는 [FR-XXX])
- [ ] 모든 주석에 한/영 병기
- [ ] 관련 문서 업데이트 완료

### PR 제출 전 확인
- [ ] PR 제목에 요구사항 ID 포함
- [ ] PR 설명에 관련 문서 링크 포함
- [ ] 자동 검증 통과 여부 체크리스트 작성
- [ ] 코드 + 문서 변경 동시 포함

---

## 6️⃣ 주요 문서 위치

| 문서 | 위치 | 읽는 순서 |
|------|------|----------|
| **빠른 시작** (이 문서) | `docs/QUICK_START_FOR_AI.md` | 1 (5분) |
| **작업 절차** | `docs/AI_AGENT_GUIDELINES.md` | 2 (10분) |
| **현재 작업** | `docs/PROJECT_REQUIREMENTS.md` Section 2 | 3 (즉시) |
| **설계 규칙** | `docs/PROJECT_ARCHITECTURE.MD` Section 3 | 4 (5분) |
| **금지 조항** | `docs/AI_AGENT_GUIDELINES.md` Section 7 | 5 (2분) |
| **API 명세** | `docs/PROJECT_ARCHITECTURE.MD` Section 7 | 6 (필요시) |
| **ADR** | `docs/adr/` | 7 (필요시) |
| **변경 이력** | `docs/CHANGELOG.md` | 8 (참조) |

---

## 7️⃣ 문제 해결 (Troubleshooting)

### Q: 새로운 작업을 시작하려면?
**A:** `PROJECT_REQUIREMENTS.md` Section 2 "Active Issues"를 확인하세요. 작업이 없으면 Human에게 문의하세요.

### Q: 규칙을 어떻게 확인하나요?
**A:** 
1. 금지 조항: `AI_AGENT_GUIDELINES.md` Section 7
2. 설계 규칙: `PROJECT_ARCHITECTURE.MD` Section 3
3. 자동 검증: Section 3.5 또는 7.1의 스크립트 실행

### Q: CHANGELOG 작성이 어렵습니다
**A:** `CHANGELOG.md` 하단의 "자동 생성 템플릿" 섹션을 복사하여 사용하세요. Error-Cause-Solution 3단계 구조를 반드시 따르세요.

### Q: ADR이 뭔가요?
**A:** Architecture Decision Record입니다. `PROJECT_ARCHITECTURE.MD` Section 8에서 목록을 확인하고, `docs/adr/` 폴더에서 상세 내용을 읽을 수 있습니다.

### Q: 코드 변경 시 문서도 꼭 수정해야 하나요?
**A:** 네, 반드시 해야 합니다. 코드만 변경한 PR은 자동으로 거부됩니다. 관련 문서(`PROJECT_REQUIREMENTS.md`, `PROJECT_ARCHITECTURE.MD`, `CHANGELOG.md`)를 함께 업데이트하세요.

---

## 8️⃣ 다음 단계

이 가이드를 읽은 후:

1. ✅ **`AI_AGENT_GUIDELINES.md`** 전체 읽기 (12분 소요)
2. ✅ **`PROJECT_REQUIREMENTS.md` Section 2** 확인하여 현재 작업 파악
3. ✅ **`PROJECT_ARCHITECTURE.MD` Section 3** 읽고 설계 규칙 숙지
4. ✅ 작업 시작 시 금지 조항 다시 확인
5. ✅ 코드 작성 후 자동 검증 스크립트 실행
6. ✅ PR 제출 전 체크리스트 확인

---

**다음 읽을 문서:** [`AI_AGENT_GUIDELINES.md`](./AI_AGENT_GUIDELINES.md) (12분 소요)
