# CandleSpinner: 코드 진단 및 개선 계획
**(EN) CandleSpinner: Code Diagnostics and Improvement Plan**

**작성자 (Author):** 줄스 AI (Jules AI)
**작성일 (Date):** 2025년 10월 08일
**상태 (Status):** 채택됨 (Accepted)

---

## 1. 백엔드 보안 강화: JWT 시크릿 키 관리 (Backend Security Hardening: JWT Secret Key Management)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 백엔드 함수들(`spin.js`, `claimPrize.js` 등)은 `process.env.JWT_SECRET` 환경 변수가 없을 경우, 소스 코드에 하드코딩된 예측 가능한 기본값(`'your-default-super-secret-key-for-local-dev'`)을 폴백(fallback)으로 사용하고 있습니다. 이는 배포 환경에서 환경 변수 설정이 누락될 경우, 누구나 JWT를 위조할 수 있는 심각한 보안 취약점(OWASP A05:2021 - Security Misconfiguration)으로 이어집니다.
  (EN) The backend functions (`spin.js`, `claimPrize.js`, etc.) currently use a predictable, hardcoded fallback value (`'your-default-super-secret-key-for-local-dev'`) if the `process.env.JWT_SECRET` environment variable is missing. This constitutes a critical security vulnerability (OWASP A05:2021 - Security Misconfiguration) if the environment variable is not set in a production environment, as anyone could forge JWTs.

- **근거 및 원칙 (Rationale & Principles):**
  - **Fail-Safe 원칙:** 설정 오류는 조용한 실패(silent failure)가 아닌, 즉각적이고 명시적인 실패(loud failure)로 이어져야 합니다. 특히 보안과 관련된 설정은 더욱 그렇습니다.
  - **보안 모범사례:** 프로덕션 환경에서는 절대 하드코딩된 시크릿을 사용해서는 안 되며, 시크릿 관리 솔루션(이 경우, Cloudflare 환경 변수)을 통해 안전하게 주입해야 합니다.

- **해결 전략 (Solution Strategy):**
  (KO) 각 함수의 시작 부분에서 `JWT_SECRET` 환경 변수의 존재 여부를 명시적으로 확인합니다. 만약 변수가 없다면, 즉시 오류를 발생시켜 함수 실행을 중단시킵니다. 이를 통해 개발자가 환경 변수 설정을 누락하는 실수를 방지하고, 안전하지 않은 상태로 서비스가 실행되는 것을 원천 차단합니다. 로컬 개발 편의성을 위해, `.dev.vars` 파일을 사용하도록 가이드라인을 강화합니다.
  (EN) Explicitly check for the existence of the `JWT_SECRET` environment variable at the beginning of each function. If the variable is not present, immediately throw an error to halt execution. This prevents the service from running in an insecure state and forces developers to configure environment variables correctly. For local development convenience, the guidelines should enforce the use of a `.dev.vars` file.

- **코드 예시 (Code Example):**
  ```javascript
  // (KO) 개선 전: 하드코딩된 폴백 존재
  // (EN) Before: Hardcoded fallback exists
  // const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-default-super-secret-key-for-local-dev');

  // (KO) 개선 후: Fail-Safe 로직 적용
  // (EN) After: Applying Fail-Safe logic
  export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET environment variable is not set.");
      return new Response(JSON.stringify({ error: "CONFIGURATION_ERROR" }), { status: 500 });
    }
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

    // ... (rest of the function logic)
  }
  ```

## 2. 의존성 관리 전략: 취약한 의존성 트리 (Dependency Management Strategy: Fragile Dependency Tree)

- **문제 진단 (Problem Diagnosis):**
  (KO) 프로젝트는 `tonweb` 라이브러리의 간접(transitive) 의존성인 `expo` 프레임워크 때문에 지속적인 배포 실패를 겪었습니다. 이는 `package.json`에 명시되지 않은 "유령 의존성"이 `package-lock.json`에 포함되어 `npm ci` 명령의 무결성 검사를 통과하지 못하게 만들었습니다. 이는 의존성 트리가 매우 취약하고 예측 불가능함을 의미합니다.
  (EN) The project suffered from continuous deployment failures due to a transitive dependency on the `expo` framework, introduced by the `tonweb` library. This "phantom dependency," not specified in `package.json`, appeared in `package-lock.json`, causing the `npm ci` integrity check to fail. This indicates a highly fragile and unpredictable dependency tree.

- **근거 및 원칙 (Rationale & Principles):**
  - **공급망 보안 (Supply Chain Security):** 프로젝트는 최소한의 필요 의존성만 가져야 하며, 모든 의존성과 그 하위 의존성을 명확히 파악하고 통제해야 합니다. 불필요하고 오래된 라이브러리는 잠재적인 보안 위협과 빌드 실패의 원인이 됩니다.
  - **유지보수성 (Maintainability):** 깨끗하고 예측 가능한 의존성 트리는 새로운 개발자가 프로젝트에 합류하거나, 라이브러리를 업데이트할 때 발생하는 문제를 최소화합니다.

- **해결 전략 (Solution Strategy):**
  1.  **(단기) 의존성 제거 및 교체:** 문제가 된 `tonweb` 라이브러리를 프로젝트에서 완전히 제거하고, 모든 관련 기능을 최신 공식 라이브러리인 `@ton/core`와 `@ton/ton`을 사용하여 재작성합니다.
  2.  **(장기) 의존성 검토 프로세스 도입:**
      - `npm ls <package>` 명령어를 사용하여 의존성 트리를 시각적으로 분석하는 방법을 ADR(아키텍처 결정 기록)에 문서화합니다.
      - `npm-check-updates` 또는 `Dependabot`과 같은 도구를 도입하여 의존성을 정기적으로 최신 상태로 유지하고, 오래되거나 취약한 패키지를 식별하는 프로세스를 수립합니다.
      - `package-lock.json`이 손상될 경우, `rm -rf node_modules package-lock.json && npm install`을 통해 깨끗한 상태에서 재설치하는 절차를 표준 복구 절차로 문서화합니다.

- **코드 예시 (Code Example):**
  ```bash
  # (KO) 유령 의존성 트리 확인 명령어
  # (EN) Command to check for phantom dependency trees
  npm ls expo

  # (KO) package.json에서 tonweb 제거
  # (EN) Remove tonweb from package.json
  # "dependencies": {
  #   ...
  #   "tonweb": "^0.0.66" // <-- 이 라인을 삭제 (remove this line)
  # }

  # (KO) 깨끗한 의존성 트리 재생성
  # (EN) Regenerate a clean dependency tree
  rm -rf node_modules package-lock.json
  npm install
  ```

## 3. 아키텍처 신뢰성: 클라이언트 측 RPC 호출 (Architectural Reliability: Client-Side RPC Calls)

- **문제 진단 (Problem Diagnosis):**
  (KO) 프론트엔드가 `tonClient.runMethod`를 사용하여 공개 RPC 엔드포인트(`toncenter.com`)에 직접 스마트 컨트랙트의 `get` 메소드를 호출하고 있습니다. 이는 `exit_code: -13` 오류에서 확인되었듯이, RPC 엔드포인트의 속도 제한(rate limiting), 일시적인 불안정성, 또는 샌드박스 환경의 네트워크 제약으로 인해 실패할 가능성이 매우 높습니다.
  (EN) The frontend directly calls smart contract `get` methods on a public RPC endpoint (`toncenter.com`) using `tonClient.runMethod`. As seen with the `exit_code: -13` error, this is highly prone to failure due to rate limiting, temporary instability of the public endpoint, or network constraints in the sandbox environment.

- **근거 및 원칙 (Rationale & Principles):**
  - **관심사 분리 (Separation of Concerns):** 프론트엔드는 사용자 인터페이스와 상호작용에 집중해야 하며, 외부 인프라(특히 신뢰성이 보장되지 않는)와의 직접적인 통신은 최소화해야 합니다.
  - **견고성 (Robustness):** 시스템의 핵심 기능(사용자 Jetton 지갑 주소 조회)이 외부의 단일 실패점(public RPC)에 의존해서는 안 됩니다.

- **해결 전략 (Solution Strategy):**
  (KO) **백엔드 프록시 패턴**을 도입합니다. 블록체인에서 데이터를 읽어오는 모든 `get` 메소드 호출은 프론트엔드에서 직접 수행하는 대신, 이를 중계하는 전용 백엔드 함수(예: `/getJettonWalletAddress`)를 통해 이루어지도록 아키텍처를 변경합니다. 이 백엔드 함수는 환경 변수에 저장된 API 키를 사용하여 더 안정적인 RPC 엔드포인트에 요청을 보내고, 그 결과를 프론트엔드에 반환합니다.
  (EN) Introduce a **Backend-for-Frontend (BFF) / Proxy Pattern**. All `get` method calls that read data from the blockchain will be routed through a dedicated backend function (e.g., `/getJettonWalletAddress`) instead of being made directly from the frontend. This backend function will use a protected API key (from environment variables) to query a more reliable RPC endpoint and return the result to the frontend.

- **코드 예시 (Code Example):**
  ```javascript
  // src/main.js (Before)
  // const { stack } = await tonClient.runMethod(jettonMinterAddress, 'get_wallet_address', ...);
  // const userJettonWalletAddress = stack.readAddress();

  // src/main.js (After)
  const response = await fetch('/getJettonWalletAddress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          ownerAddress: walletInfo.account.address,
          jettonMinterAddress: CSPIN_JETTON_ADDRESS
      }),
  });
  const { jettonWalletAddress } = await response.json();

  // functions/getJettonWalletAddress.js (New)
  // ... (code to initialize TonClient with API_KEY from env)
  // const { stack } = await client.runMethod(jettonMinterAddr, 'get_wallet_address', ...);
  // return new Response(JSON.stringify({ jettonWalletAddress: stack.readAddress().toString() }));
  ```

---
*(... 나머지 7개 항목에 대한 상세 분석 및 해결 계획이 이어집니다 ...)*
*(... The detailed analysis and solution plans for the remaining 7 items follow ...)*