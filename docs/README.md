# 📚 CandleSpinner Documentation

Welcome to the CandleSpinner project documentation. This folder contains all project documentation optimized for both human developers and AI agents.

---

## 🚀 Quick Start (For AI Agents)

**Start here if you're an AI agent:**

1. **First:** Read [`QUICK_START_FOR_AI.md`](./QUICK_START_FOR_AI.md) (5 minutes)
2. **Second:** Check [`PROJECT_REQUIREMENTS.md` Section 2](./PROJECT_REQUIREMENTS.md#2-현재-진행-중인-작업-active-issues---ai-start-here) for current work
3. **Third:** Review [`AI_AGENT_GUIDELINES.md` Section 7](./AI_AGENT_GUIDELINES.md#7-금지-조항-critical-never-do-this) for forbidden actions

---

## 📖 Core Documentation (5 files)

### 1. [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) (9.7KB)
**Purpose:** Standard Operating Procedures for AI agents  
**Read time:** 10 minutes  
**Key sections:**
- Section 1: Immediate Checks (30 seconds)
- Section 4: 3-Phase Workflow
- Section 7: Forbidden Actions (7 rules in table format)
- Section 8: PR Checklist

**When to use:** Before starting any work

### 2. [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md) (11.2KB)
**Purpose:** All functional and non-functional requirements  
**Read time:** 15 minutes (Section 2: Instant)  
**Key sections:**
- Section 2: 🚨 Active Issues (AI START HERE)
- Section 3: Functional Requirements (31 IDs)
- Section 4: Non-Functional Requirements
- Section 5: Resolved Issues Archive

**When to use:** To check current work and requirements

### 3. [PROJECT_ARCHITECTURE.MD](./PROJECT_ARCHITECTURE.MD) (14.4KB)
**Purpose:** Technical architecture and design rules  
**Read time:** 20 minutes  
**Key sections:**
- Section 3: Design Rules (5 rules with verification)
- Section 3.5: Auto-verification Script
- Section 7: API Specifications + curl examples
- Section 8: ADR Table with rule mappings

**When to use:** When making architectural decisions or code changes

### 4. [CHANGELOG.md](./CHANGELOG.md) (10.9KB)
**Purpose:** Version history with Error-Cause-Solution structure  
**Read time:** 8 minutes  
**Key sections:**
- Top: Writing Rules (4 mandatory rules)
- Middle: Version entries (6 items, 3-stage structure)
- Bottom: Auto-generation Template

**When to use:** When documenting changes or creating releases

### 5. [QUICK_START_FOR_AI.md](./QUICK_START_FOR_AI.md) (4.3KB)
**Purpose:** 5-minute onboarding guide for AI agents  
**Read time:** 5 minutes  
**Key sections:**
- Section 1: Immediate Checks (30 seconds)
- Section 3: Forbidden Actions Quick Reference
- Section 7: Troubleshooting Q&A

**When to use:** First time working on this project

---

## 📊 Analysis & Verification (3 files)

### 6. [comparison_analysis.md](./comparison_analysis.md) (7.0KB)
**Purpose:** Version A vs B vs Final comparison  
**Read time:** 10 minutes  
**Contents:**
- Detailed comparison of all 4 documents
- Improvement metrics (quantitative & qualitative)
- Risk assessment
- Final approval recommendation

**When to use:** To understand why final versions were chosen

### 7. [verification_report.md](./verification_report.md) (7.3KB)
**Purpose:** Complete verification and testing results  
**Read time:** 8 minutes  
**Contents:**
- Automated verification results (11/11 passed)
- AI readability test results (3 scenarios)
- Improvement effect measurements
- Final approval status

**When to use:** To verify document quality and consistency

### 8. [SUMMARY.md](./SUMMARY.md) (6.9KB)
**Purpose:** Project overview and final achievements  
**Read time:** 6 minutes  
**Contents:**
- Project goals and deliverables
- Quality metrics (98/100, A+)
- Success criteria achievement
- Next steps

**When to use:** For project overview and status

---

## 🗂️ Document Reading Order

### For AI Agents (First Time)
```
1. QUICK_START_FOR_AI.md          (5 min)
   ↓
2. PROJECT_REQUIREMENTS.md Sec 2  (instant)
   ↓
3. AI_AGENT_GUIDELINES.md Sec 1,7 (2 min)
   ↓
4. PROJECT_ARCHITECTURE.MD Sec 3  (5 min)
   ↓
5. Ready to work! ✅
```

### For Human Developers (First Time)
```
1. SUMMARY.md                      (6 min)
   ↓
2. PROJECT_REQUIREMENTS.md         (15 min)
   ↓
3. PROJECT_ARCHITECTURE.MD         (20 min)
   ↓
4. AI_AGENT_GUIDELINES.md          (10 min)
   ↓
5. Ready to work! ✅
```

### For Code Review
```
1. PR description → Check requirement ID
   ↓
2. AI_AGENT_GUIDELINES.md Sec 8   (PR checklist)
   ↓
3. PROJECT_ARCHITECTURE.MD Sec 3  (design rules)
   ↓
4. CHANGELOG.md bottom             (verify 3-stage structure)
```

---

## 🔍 Quick Reference

### Requirement IDs (31 total)
- **FR-\*** : Functional Requirements (13)
- **NFR-\***: Non-Functional Requirements (14)
- **BUG-\***: Bug Reports (4)

### Design Rules (5 total)
1. **Fairness:** Commit-Reveal only (no Math.random)
2. **Security:** Environment variables only (no hardcoding)
3. **Dependencies:** @tonconnect/ui NPM (no CDN)
4. **Blockchain:** Client-side calculation (no RPC)
5. **Transaction:** Sender verification (always)

### Forbidden Actions (7 total)
1. Math.random() usage
2. Environment variable hardcoding
3. Code without documentation
4. CHANGELOG structure violation
5. Missing requirement ID
6. @tonconnect/ui CDN usage
7. External API dependency (deprecated)

### ADRs (4 total)
- **ADR-001:** Commit-Reveal scheme (✅ Accepted)
- **ADR-002:** Backend RPC proxy (❌ Superseded)
- **ADR-003:** @tonconnect/ui hybrid (✅ Accepted)
- **ADR-004:** Transaction verification (✅ Accepted)

---

## ✅ Verification

### Automated Verification
Run the verification script:
```bash
bash /tmp/verify_docs.sh
```

Expected result:
```
✅ 모든 검증 통과!
성공: 11
경고: 0
오류: 0
```

### Manual Verification Checklist
- [ ] All documents have metadata headers
- [ ] Requirement IDs are consistent across documents
- [ ] CHANGELOG follows Error-Cause-Solution structure
- [ ] Design rules match forbidden actions
- [ ] ADR table includes "Affected Rules" column

---

## 📈 Quality Metrics

| Metric | Score | Grade |
|--------|-------|-------|
| Clarity | 20/20 | A+ |
| Priority | 20/20 | A+ |
| Traceability | 20/20 | A+ |
| Actionability | 19/20 | A |
| Maintainability | 19/20 | A |
| **Overall** | **98/100** | **A+** |

---

## 🎯 Document Status

| Document | Status | Last Updated | AI Optimized |
|----------|--------|--------------|--------------|
| AI_AGENT_GUIDELINES.md | ✅ Final | 2025-10-11 | ✅ Yes |
| PROJECT_REQUIREMENTS.md | ✅ Final | 2025-10-11 | ✅ Yes |
| PROJECT_ARCHITECTURE.MD | ✅ Final | 2025-10-11 | ✅ Yes |
| CHANGELOG.md | ✅ Final | 2025-10-11 | ✅ Yes |
| QUICK_START_FOR_AI.md | ✅ Final | 2025-10-11 | ✅ Yes |

---

## 🔗 External Links

- **GitHub Repository:** [aiandyou50/slot-machine](https://github.com/aiandyou50/slot-machine)
- **Production Site:** https://aiandyou.me
- **ADR Location:** [`docs/adr/`](./adr/)
- **Reports Location:** [`docs/reports/`](./reports/)

---

## 📝 Version History

### Version 1.0 (2025-10-11) - Current
- ✅ Created final versions of all core documents
- ✅ Added AI-optimized structures (immediate checks, active issues, etc.)
- ✅ Implemented automated verification
- ✅ Achieved 98/100 quality score
- ✅ All verification checks passed (11/11)

### Previous Versions
- **Version A:** Original version (reference in `*_A.*` files)
- **Version B:** AI-improved version (reference in `*_B.*` files)

---

## 🚨 Important Notes

### For AI Agents
1. **ALWAYS** start with `PROJECT_REQUIREMENTS.md` Section 2
2. **NEVER** violate the 7 forbidden actions in `AI_AGENT_GUIDELINES.md` Section 7
3. **MUST** follow 3-phase workflow: Design → Implementation → Review
4. **ALWAYS** include requirement ID in PR titles
5. **MUST** update CHANGELOG with Error-Cause-Solution structure

### For Human Developers
1. Phase 1 (Design) is **human responsibility** - update requirements before AI work
2. Phase 3 (Review) requires **human validation** - never skip this step
3. ADR creation needs **team discussion** - don't create alone
4. Version changes require **package.json update** - keep in sync

---

## 🆘 Need Help?

### AI Agents
- **Quick help:** See `QUICK_START_FOR_AI.md` Section 7 (Troubleshooting)
- **Work procedures:** See `AI_AGENT_GUIDELINES.md` Section 4
- **Rule questions:** See `PROJECT_ARCHITECTURE.MD` Section 3

### Human Developers
- **Project overview:** Read `SUMMARY.md`
- **Current issues:** Check `PROJECT_REQUIREMENTS.md` Section 2
- **Architecture questions:** Read `PROJECT_ARCHITECTURE.MD`

---

## 📞 Contact

**Project:** CandleSpinner  
**Repository:** github.com/aiandyou50/slot-machine  
**Documentation Version:** 1.0  
**Last Updated:** 2025-10-11  
**Status:** ✅ Production Ready

---

**Next Review:** 2025-11-11 (1 month from completion)
