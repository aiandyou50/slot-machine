---
document_type: Implementation Report
version: 1.0
last_updated: 2025-10-12
status: draft
ai_optimized: true
estimated_read_time: 6 min
---

# FR-DEV-03 Debugging: Implementation and Actions Summary (2025-10-12)

요청: [FR-DEV-03] 개발자 모드 BOC 로깅 요구사항에 따라, `Invalid magic` 이슈([BUG-005]) 조사용으로 안전한 디버깅 훅을 프로덕션에서 재배포 없이 사용할 수 있게 구현 및 배포 준비를 진행했습니다.

## 1) 요약 / Summary

- (KO) 현재 상태: `Invalid magic`(BUG-005) 조사용으로 BOC(Base64) 캡처·검증 기능을 안전하게 확보하기 위한 임시 디버그 훅을 구현하고, 브랜치(`fr/dev-03-debug-boc`)로 원격에 푸시했습니다. 변경은 개발자 토글(`localStorage.BOC_DEBUG === '1'`)이 켜진 경우에만 동작합니다.
- (EN) Current state: Implemented temporary debug hooks to capture and expose the Base64 BOC for diagnosing `Invalid magic` (BUG-005). Changes are gated by a developer toggle (`localStorage.BOC_DEBUG === '1'`) and were pushed to branch `fr/dev-03-debug-boc`.

## 2) 변경된 파일 (Files changed)

- `src/services/blockchain.js`
  - 목적: Jetton 전송 메시지를 BOC로 직렬화한 직후 Base64 문자열을 전역에 노출하고(`window.__LAST_BASE64_BOC`) 더 눈에 띄게 로그 출력하도록 변경했습니다. 또한 `payload` 필드는 미리 계산된 `base64Boc` 값을 사용하도록 수정했습니다.
  - 변경 위치: BOC 직렬화 후 로그 블록(개발자 로그 분기 내부).

- `src/main.js`
  - 목적: 개발자 토글(`BOC_DEBUG`)이 켜졌을 때 하단 우측에 간단한 디버그 패널을 표시하도록 추가했습니다. 패널은 `window.__LAST_BASE64_BOC`를 표시하고 `window.__LAST_DEEP_LINK`에 대한 앵커를 제공합니다. 패널은 로컬 전용이며 비영구적입니다.
  - 변경 위치: 애플리케이션 초기화(마지막 섹션) 직후 디버그 감시자 추가.

- `docs/PR_FR-DEV-03_debug_boc.md`
  - 목적: PR 초안 문서로 변경 내용, 사용법, 보안/롤백 절차를 기술했습니다.

- Git 브랜치: `fr/dev-03-debug-boc` (원격에 푸시 완료)

## 3) 문제 / Error (KO + EN)

- (KO) 문제: 스핀 동작 시 외부 핸들러(tg://resolve...)에 전달되는 deep-link의 payload가 Wallet/핸들러에서 `Invalid magic`로 거부되어 스핀 플로우가 중단됩니다. 이 문제의 원인을 파악하기 위해 프런트엔드에서 생성되는 Base64 BOC를 확보해야 합니다.

- (EN) Error: The deep-link payload sent to an external handler (tg://resolve...) during spin is rejected by the wallet/handler with `Invalid magic`, interrupting the spin flow. To diagnose, we need to capture the generated Base64 BOC on the frontend.

## 4) 원인 (Cause) — 조사 시점 가설 (KO + EN)

- (KO) 가설:
  1. BOC 직렬화 또는 Base64 인코딩/URL 이스케이프 과정에서 형식이 손상되었을 수 있음.
  2. deep-link를 감싸는 외부 핸들러(예: Telegram startapp) 단계에서 `%` 등 인코딩 문자가 변형되어 payload가 망가지는 경로 문제가 있을 수 있음.
  3. (덜 가능성) manifest 접근성(CORS/HTTPS) 또는 manifest 내용 검증 실패로 Wallet이 연결이나 payload 처리를 거부했을 수 있음.

- (EN) Hypothesis:
  1. The BOC serialization or Base64 encoding / URL-escaping step may produce malformed data.
  2. An intermediary (e.g., Telegram startapp) may be transforming percent-encoded sequences, corrupting the payload in transit.
  3. (Less likely) Manifest accessibility or validation issues (CORS/HTTPS) could cause the wallet to reject the flow.

## 5) 수행한 조치 및 해결 (Solution) — 단계별 (KO + EN)

1. (KO) `src/services/blockchain.js`에 개발자 전용 로그를 추가: BOC 직렬화 직후 `base64Boc`를 계산하고 `console.error`로 출력하며 `window.__LAST_BASE64_BOC`/`window.__LAST_DEEP_LINK`에 저장하도록 구현했습니다. 이 로그은 `import.meta.env.DEV` 또는 `localStorage.BOC_DEBUG === '1'`가 활성화된 경우에만 실행됩니다.
   (EN) Added developer logs in `src/services/blockchain.js`: compute `base64Boc` immediately after serialization, print via `console.error`, and expose to `window.__LAST_BASE64_BOC` / `window.__LAST_DEEP_LINK`. This is gated by `import.meta.env.DEV` or `localStorage.BOC_DEBUG === '1'`.

2. (KO) `src/main.js`에 디버그 패널 추가: 브라우저에서 `BOC_DEBUG` 토글을 켜고 페이지를 새로고침하면, 하단 우측에 디버그 패널이 뜨며 마지막 Base64 BOC와 deep-link를 보여줍니다. 이 패널은 로컬에서만 표시됩니다.
   (EN) Added a debug panel in `src/main.js`: when the `BOC_DEBUG` toggle is set, the page displays a local-only panel showing the last Base64 BOC and deep-link.

3. (KO) PR 초안 문서(`docs/PR_FR-DEV-03_debug_boc.md`)를 작성하여 변경 목적, 사용법, 롤백/보안 지침을 기록했습니다.
   (EN) Drafted a PR document recording rationale, usage, rollback and security guidance (`docs/PR_FR-DEV-03_debug_boc.md`).

4. (KO) 변경사항을 `fr/dev-03-debug-boc` 브랜치로 커밋하고 원격에 푸시했습니다. (원격 PR 링크가 GitHub에서 생성 가능함)
   (EN) Committed changes and pushed branch `fr/dev-03-debug-boc` to remote (a PR can be created on GitHub).

## 6) 사용법(검증 절차) / How to reproduce & collect debug data

- (KO) 브라우저에서 다음을 실행:

```javascript
localStorage.setItem('BOC_DEBUG','1');
location.reload();
// 페이지가 reload된 뒤 Spin 클릭
```

- (KO) 확인 방법:
  1. 우측 하단의 Debug 패널이 나타나면 `Base64 BOC` 값을 복사합니다.
  2. 또는 Console에서 아래를 실행:

```javascript
console.log(window.__LAST_BASE64_BOC);
console.log(window.__LAST_DEEP_LINK);
```

- (EN) Browser reproduction:

```javascript
localStorage.setItem('BOC_DEBUG','1');
location.reload();
// after reload, click Spin
```

- (EN) Verification:
  1. If the debug panel appears, copy the Base64 BOC shown.
  2. Alternatively run:

```javascript
console.log(window.__LAST_BASE64_BOC);
console.log(window.__LAST_DEEP_LINK);
```

- (KO) TonConnect 인터셉트(옵션) — TonConnect가 전역에 노출된 경우:
```javascript
// 콘솔에서 실행하면 sendTransaction 호출을 가로챌 수 있습니다.
if (window.TonConnectUI && window.TonConnectUI.prototype && !window.__TON_SEND_PATCHED) {
  const orig = window.TonConnectUI.prototype.sendTransaction;
  window.TonConnectUI.prototype.sendTransaction = async function(tx) {
    try { console.error('[INTERCEPT] sendTransaction tx:', tx); window.__INTERCEPT_TX = tx; } catch(e){}
    return orig.call(this, tx);
  };
  window.__TON_SEND_PATCHED = true;
  console.log('TonConnect sendTransaction patched — click Spin to intercept');
}
```

## 7) 검증 체크리스트 (Documentation rules compliance)

- [x] Error / Cause / Solution 3단계 구조 포함 (KO+EN)
- [x] 요구사항 ID 참조: [BUG-005], [FR-DEV-03]
- [x] 한/영 병기
- [x] 변경 파일 및 위치 명시 (`src/services/blockchain.js`, `src/main.js`)
- [x] 사용법(검증 단계) 및 보안 주의사항 포함
- [x] 롤백/보안(임시 디버그이므로 제거 필요) 언급

## 8) 다음 단계 (Next actions)

1. (우선) 배포된 브랜치에서 디버그 패널로 Base64 BOC 확보 — 사용자가 `window.__LAST_BASE64_BOC` 값을 제공해야 분석 가능.
2. Base64 BOC 확보 후 분석:
   - BOC가 올바른 구조(CBOR/TON cell 구조)인지 검증
   - Base64 값과 배포된 deep-link의 percent-encoded 값(예: `--7B--22` 등) 사이 변형 비교
   - 만약 BOC가 정상이라면 deep-link 래퍼(예: Telegram startapp)가 인코딩을 변형하는 것으로 판단하고, URL-safe base64 래핑 또는 JSON을 직접 Base64로 전달하는 방안 적용 검토
3. (임시) 디버그 훅 제거 PR 준비: 문제 원인 분석 완료 후 모든 디버그 코드를 제거하는 PR을 만들어 코드 청소.

---

Prepared by: Development AI agent (documentation draft)
Date: 2025-10-12

Notes: 이 문서는 `CHANGELOG.md` 및 `PROJECT_REQUIREMENTS.md`의 기록과 일치하도록 구성되었습니다. 배포 환경에서 수집된 실제 Base64 BOC가 확보되면 본 문서를 업데이트하여 최종 원인과 영구 해결책(코드 패치 및 ADR)을 첨부하겠습니다.
