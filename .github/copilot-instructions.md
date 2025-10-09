# AI 에이전트 지침

이 문서는 AI 코딩 에이전트가 이 코드베이스에서 효과적으로 작업하는 데 도움이 되는 지침을 제공합니다. 모든 작업을 수행하기 전에 이 문서를 반드시 읽고 숙지해야 합니다.

## 1. 핵심 원칙 및 워크플로

- **문서 우선 개발 (Documentation-First)**: 새로운 기능을 추가하거나 기존 로직을 변경하기 전에, `docs/PROJECT_REQUIREMENTS.md`와 `docs/PROJECT_ARCHITECTURE.MD`를 먼저 수정하여 사용자에게 승인받아야 합니다. **사용자 승인 없이는 코드 작성을 시작하지 마십시오.**
- **2개 국어 작성 의무 (Bilingual Mandate)**: 모든 주석, 문서, 커밋 메시지, PR 설명은 **한국어(KO)와 영어(EN)를 병기**해야 합니다. 이는 필수 사항입니다.
- **변경 이력(Changelog) 동시 업데이트**: 버그를 수정하거나 기능을 추가하는 모든 PR에는 `docs/CHANGELOG.md` 파일에 변경 내역을 기록하는 내용이 반드시 포함되어야 합니다.
  - **형식 준수**: 변경 이력은 `Error/Cause/Solution` 또는 `Added`/`Changed`/`Fixed` 구조를 따라야 합니다.
- **시맨틱 버저닝 (Semantic Versioning)**: 버그 수정 시 `package.json`의 `PATCH` 버전을 1 증가시키고, 이 버전이 `index.html`을 통해 프론트엔드에 표시되도록 업데이트해야 합니다.

## 2. 아키텍처 개요

이 프로젝트는 Vite로 빌드된 프런트엔드와 Cloudflare Functions에서 실행되는 서버리스 백엔드를 갖춘 웹 기반 슬롯 머신 게임입니다.

- **프런트엔드 (`src/`)**: 순수 JavaScript, HTML, CSS로 구축되었습니다. `src/main.js`가 기본 진입점입니다.

  # AI 에이전트 지침 / AI agent instructions

  이 파일은 `docs/AI_AGENT_GUIDELINES.md`의 규칙을 준수해 간결하게 정리한 작업 규약입니다.
  - (EN) Documentation-first: Before implementing new features or changing core flows, update `docs/PROJECT_REQUIREMENTS.md` and `docs/PROJECT_ARCHITECTURE.MD` and obtain user approval.
     (KO) 문서 우선: 신규 기능 또는 핵심 변경은 우선 `docs/PROJECT_REQUIREMENTS.md`와 `docs/PROJECT_ARCHITECTURE.MD`를 수정하고 사용자 승인을 받아야 합니다.

  - (EN) Bilingual mandate: All code comments, docs, commit messages and PR descriptions must include both English (EN) and Korean (KO).
     (KO) 2개 국어 의무: 코드 주석, 문서, 커밋, PR 설명은 EN/KO 병기로 작성합니다.

  - (EN) PR contents rule: Every PR that changes behavior must include both code changes AND corresponding documentation updates (requirements, architecture, ADR or changelog).
     (KO) PR 규칙: 동작 변경 PR은 코드 변경과 함께 관련 문서(요구사항/아키텍처/ADR/CHANGELOG) 수정을 포함해야 합니다.

  - (EN) Changelog format: `docs/CHANGELOG.md` entries must follow bilingual Error/Cause/Solution or Keep-a-Changelog tags (Added/Changed/Fixed).
     (KO) 변경이력 형식: `docs/CHANGELOG.md`는 영/한 Error/Cause/Solution 또는 Added/Changed/Fixed 형식을 준수합니다.

  - (EN) ADRs: Place ADRs under `docs/adr/` using `YYYYMMDD-decision-title.md` and include Status/Context/Decision/Consequences. Link ADRs in PRs affecting architecture.
     (KO) ADR: `docs/adr/`에 `YYYYMMDD-decision-title.md` 형식으로 저장하고 Status/Context/Decision/Consequences 템플릿을 따릅니다. 아키텍처 영향 PR에 ADR을 링크하세요.

  - (EN) Semantic versioning: For bug fixes increment the PATCH in `package.json`, and update the frontend-visible version (e.g. `index.html` or `import.meta.env.VITE_APP_VERSION`).
     (KO) 시맨틱 버저닝: 버그 수정 시 `package.json`의 PATCH를 1 증가시키고 프론트엔드에 동일 버전을 표시합니다.

  - (EN) PR naming: Bugfix PRs should use `[FIX]` or `[PATCH]` prefix. New features should reference the updated requirements doc in the PR description.
     (KO) PR 명명: 버그 수정 PR은 `[FIX]` 또는 `[PATCH]` 접두사를 사용하세요. 신규 기능 PR은 수정된 요구사항 문서를 참조해야 합니다.

  - (EN) Wrangler & build notes: `wrangler.toml` must contain `name = "candlespinner-functions"`, `compatibility_flags = ["nodejs_compat"]`, `compatibility_date` and `pages_build_output_dir = "dist"`.
     (KO) Wrangler 설정: `wrangler.toml`은 name/compatibility_flags(nodejs_compat)/compatibility_date/pages_build_output_dir를 포함해야 합니다.

  - (EN) Ton libraries: TonWeb/Jetton had CDN vs npm issues — prefer loading TonWeb via CDN in `index.html` and use `window.TonWeb`. Use `functions/rpcProxy.js` for reliable RPC calls.
     (KO) Ton 라이브러리: TonWeb는 CDN 로드 후 `window.TonWeb` 사용을 권장합니다. RPC는 `functions/rpcProxy.js`를 경유하세요.

  - (EN) Comment policy: Key code areas must have bilingual comments. Minor comments may be single-line but prefer EN/KO for public functions.
     (KO) 주석 정책: 주요 로직에는 EN/KO 주석을 필수로 작성합니다.

  If anything in this summary is unclear or you want a different format (short checklist, PR template, or GH action), tell me which one and I will update the file.
