# CandleSpinner: 코드 진단 및 개선 계획
**(EN) CandleSpinner: Code Diagnostics and Improvement Plan**

**작성자 (Author):** 줄스 AI (Jules AI)
**작성일 (Date):** 2025년 10월 09일
**상태 (Status):** 제안됨 (Proposed)

---

## 1. 백엔드 보안 강화: JWT 시크릿 키 관리 (Backend Security Hardening: JWT Secret Key Management)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 백엔드 함수들은 `JWT_SECRET` 환경 변수가 없을 경우, 소스 코드에 하드코딩된 예측 가능한 기본값을 폴백(fallback)으로 사용하고 있습니다. 이는 배포 환경에서 환경 변수 설정이 누락될 경우, 누구나 JWT를 위조할 수 있는 심각한 보안 취약점(OWASP A05:2021 - Security Misconfiguration)으로 이어집니다.
  (EN) The backend functions currently use a predictable, hardcoded fallback value for `JWT_SECRET` if the environment variable is missing. This constitutes a critical security vulnerability (OWASP A05:2021 - Security Misconfiguration) if the environment variable is not set in a production environment, as anyone could forge JWTs.

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

## 4. 사용자 경험(UX) 및 오류 처리: 불명확한 오류 피드백 (User Experience & Error Handling: Ambiguous Error Feedback)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 백엔드 API는 실패 시 `INTERNAL_SERVER_ERROR` 또는 `INVALID_TICKET`과 같은 일반적인 문자열 메시지만 반환합니다. 이는 프론트엔드에서 오류의 원인을 정확히 파악하여 사용자에게 구체적인 안내(예: "티켓이 만료되었습니다" 또는 "게임 지갑의 잔액이 부족합니다")를 제공하기 어렵게 만듭니다.
  (EN) The backend API currently returns generic string messages like `INTERNAL_SERVER_ERROR` or `INVALID_TICKET` upon failure. This makes it difficult for the frontend to determine the exact cause of the error and provide specific, helpful guidance to the user (e.g., "Your ticket has expired" or "The game wallet has insufficient funds").

- **근거 및 원칙 (Rationale & Principles):**
  - **사용자 중심 설계 (User-Centered Design):** 시스템은 사용자에게 현재 상태와 발생한 문제에 대해 명확하고 이해하기 쉬운 피드백을 제공해야 합니다.
  - **견고한 API 설계 (Robust API Design):** 잘 설계된 API는 예측 가능한 오류 코드와 메시지를 반환하여, 클라이언트가 오류 상태를 효과적으로 처리하고 적절한 UX를 구현할 수 있도록 지원해야 합니다.

- **해결 전략 (Solution Strategy):**
  (KO) 백엔드 API의 오류 응답 구조를 표준화합니다. 모든 오류 응답에 `success: false`와 함께, 기계가 읽을 수 있는 `errorCode`와 사람이 읽을 수 있는 `message`를 포함시킵니다. 프론트엔드에서는 이 `errorCode`를 기반으로, 사전에 정의된 다국어 오류 메시지를 사용자에게 표시합니다.
  (EN) Standardize the error response structure for the backend API. All error responses will include `success: false`, a machine-readable `errorCode`, and a human-readable `message`. The frontend will then use this `errorCode` to display a predefined, internationalized error message to the user.

- **코드 예시 (Code Example):**
  ```javascript
  // functions/claimPrize.js (After)
  // ...
  // (KO) 티켓 만료 시
  // (EN) On ticket expiration
  // return new Response(JSON.stringify({ success: false, errorCode: "TICKET_EXPIRED", message: "The prize ticket has expired." }), { status: 401 });

  // src/main.js (After)
  // const data = await response.json();
  // if (!data.success) {
  //   // (KO) 'error_ticket_expired'와 같은 키를 사용하여 다국어 오류 메시지 표시
  //   // (EN) Use a key like 'error_ticket_expired' to show a localized error message
  //   showMessage(`error_${data.errorCode.toLowerCase()}`, { default: data.message });
  // }
  ```

## 5. 코드 품질 및 유지보수성: 프론트엔드의 거대 함수 (Code Quality & Maintainability: Frontend God Function)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 `src/main.js`의 `handleSpin` 함수는 너무 많은 책임을 가지고 있습니다. Jetton 지갑 주소 조회(RPC 호출), 트랜잭션 페이로드 생성, 지갑으로 트랜잭션 전송 요청, 백엔드 API 호출, 그리고 UI 상태(로딩, 메시지) 업데이트까지 모두 한 곳에서 처리하고 있습니다. 이는 단일 책임 원칙(SRP)을 명백히 위반하며, 코드를 이해하고 테스트하며 유지보수하기 어렵게 만듭니다.
  (EN) The `handleSpin` function in `src/main.js` currently has too many responsibilities. It handles fetching the Jetton wallet address (RPC call), creating the transaction payload, requesting the transaction from the wallet, calling the backend API, and updating UI states (loading, messages). This is a clear violation of the Single Responsibility Principle (SRP), making the code difficult to understand, test, and maintain.

- **근거 및 원칙 (Rationale & Principles):**
  - **단일 책임 원칙 (Single Responsibility Principle - SRP):** 하나의 모듈(또는 함수)은 단 하나의 책임만을 가져야 합니다.
  - **모듈성 (Modularity):** 코드를 기능 단위로 분리하면 재사용성이 높아지고, 각 부분에 대한 독립적인 테스트가 가능해지며, 변경의 영향 범위를 최소화할 수 있습니다.

- **해결 전략 (Solution Strategy):**
  (KO) `src/` 디렉토리 내에 서비스 모듈을 생성하여 책임을 분리합니다.
  1.  **`src/services/blockchain.js`**: 블록체인과 직접 상호작용하는 모든 로직(페이로드 생성, Jetton 지갑 주소 조회 API 호출 등)을 이관합니다.
  2.  **`src/services/api.js`**: `/spin`, `/claimPrize` 등 백엔드 API를 호출하는 모든 `fetch` 로직을 이관합니다.
  3.  **`src/main.js`**: UI 이벤트를 수신하고, 각 서비스 모듈의 함수를 조립하여 호출하며, 그 결과에 따라 UI를 업데이트하는 '컨트롤러' 또는 '오케스트레이터'의 역할만 수행하도록 리팩토링합니다.
  (EN) Create service modules within the `src/` directory to separate responsibilities.
  1.  **`src/services/blockchain.js`**: Move all logic that directly interacts with the blockchain (e.g., payload creation, calling the API to get Jetton wallet address).
  2.  **`src/services/api.js`**: Move all `fetch` logic for calling backend APIs like `/spin` and `/claimPrize`.
  3.  **`src/main.js`**: Refactor to act solely as a 'controller' or 'orchestrator' that listens for UI events, composes and calls functions from the service modules, and updates the UI based on the results.

- **코드 예시 (Code Example):**
  ```javascript
  // src/services/api.js (New)
  // export async function callSpinApi(boc, userAddress, betAmount) { /* ... fetch logic ... */ }

  // src/services/blockchain.js (New)
  // export async function createSpinTransaction(walletInfo, betAmount) { /* ... get jetton address, create payload ... */ }

  // src/main.js (Refactored handleSpin)
  // async function handleSpin() {
  //   setControlsLoading(true);
  //   try {
  //     const transaction = await blockchain.createSpinTransaction(walletInfo, currentBet);
  //     const resultBoc = await tonConnectUI.sendTransaction(transaction);
  //     const data = await api.callSpinApi(resultBoc.boc, walletInfo.account.address, currentBet);
  //     updateGameWithResult(data);
  //   } catch (error) {
  //     handleError(error);
  //   } finally {
  //     setControlsLoading(false);
  //   }
  // }
  ```

## 6. 핵심 로직 무결성: 블록체인 트랜잭션 검증 (Core Logic Integrity: Blockchain Transaction Verification)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 `/spin` API는 프론트엔드에서 `boc` 데이터를 받지만, 이 데이터가 실제로 어떤 트랜잭션인지 서버 측에서 검증하는 로직이 없습니다. 악의적인 사용자가 실제로는 1 CSPIN만 베팅하고, 프론트엔드에서는 100 CSPIN을 베팅한 것처럼 `betAmount`를 조작하여 API를 호출하면, 서버는 이를 인지하지 못하고 100 CSPIN에 대한 당첨금을 계산하여 지급할 수 있습니다. 이는 게임 경제를 파괴할 수 있는 심각한 결함입니다.
  (EN) The `/spin` API currently receives `boc` data from the frontend but lacks server-side logic to verify what transaction this `boc` actually represents. A malicious user could bet only 1 CSPIN on-chain but manipulate the API call to report a `betAmount` of 100. The server would fail to detect this discrepancy and could potentially pay out winnings based on the fraudulent amount, destroying the game's economy.

- **근거 및 원칙 (Rationale & Principles):**
  - **제로 트러스트 (Zero Trust):** 절대 클라이언트로부터의 입력을 신뢰하지 마라(Never trust user input). 모든 중요한 데이터는 서버 측에서 반드시 검증해야 합니다.
  - **블록체인 DApp 보안:** 모든 온체인 상호작용의 결과는 서버 측에서 검증 가능한 상태(verifiable state)를 통해 확인되어야 합니다.

- **해결 전략 (Solution Strategy):**
  (KO) `/spin` 함수 내에서 수신된 `boc`를 서버 측에서 직접 파싱하는 `verifyTransaction` 함수를 구현합니다. 이 함수는 다음을 검증합니다:
  1.  **수신자 주소:** 트랜잭션의 수신자가 올바른 `GAME_WALLET_ADDRESS`인지 확인합니다.
  2.  **전송된 금액:** 트랜잭션에 기록된 실제 토큰 양이 API 요청에 포함된 `betAmount`와 일치하는지 확인합니다.
  3.  **토큰 종류:** (선택적이지만 권장) 트랜잭션이 올바른 Jetton(CSPIN)에 대한 것인지 확인합니다.
  이 검증을 통과한 경우에만 스핀 로직을 실행하고, 검증 실패 시 `INVALID_TRANSACTION` 오류를 반환합니다.
  (EN) Implement a `verifyTransaction` function within the `/spin` function to parse the received `boc` on the server-side. This function will verify:
  1.  **Recipient Address:** Ensure the transaction recipient is the correct `GAME_WALLET_ADDRESS`.
  2.  **Transferred Amount:** Confirm that the actual token amount in the transaction matches the `betAmount` included in the API request.
  3.  **Token Type:** (Optional but recommended) Verify the transaction is for the correct Jetton (CSPIN).
  Only if this verification passes should the spin logic be executed. Otherwise, return an `INVALID_TRANSACTION` error.

- **코드 예시 (Code Example):**
  ```javascript
  // functions/spin.js (New verifyTransaction function)
  // async function verifyTransaction(boc, expectedBetAmount) {
  //   const messageCell = Cell.fromBoc(Buffer.from(boc, 'base64'))[0];
  //   const message = loadMessage(messageCell);
  //   const bodySlice = message.body.beginParse();
  //
  //   const op = bodySlice.loadUint(32); // op-code
  //   if (op !== 0x0f8a7ea5) throw new Error('Invalid op-code');
  //
  //   bodySlice.loadUint(64); // query_id
  //   const jettonAmount = fromNano(bodySlice.loadCoins());
  //   const toAddress = bodySlice.loadAddress();
  //
  //   if (jettonAmount !== expectedBetAmount.toString() || toAddress.toString() !== Address.parse(GAME_WALLET_ADDRESS).toString()) {
  //     throw new Error('Transaction verification failed.');
  //   }
  //   return true;
  // }
  ```

## 7. DApp의 핵심 가치: 게임 결과의 투명성 및 공정성 (DApp Core Value: Transparency & Fairness)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 스핀 결과는 `Math.random()`을 사용하는 중앙화된 백엔드에서 전적으로 생성됩니다. 이는 사용자가 게임 운영자를 신뢰해야만 하는 '블랙박스' 구조이며, 결과가 조작될 수 있다는 의심을 낳을 수 있습니다. 이것은 Web3 DApp이 추구하는 투명성과 탈중앙성 원칙에 정면으로 위배됩니다.
  (EN) The spin result is currently generated entirely on a centralized backend using `Math.random()`. This is a 'black box' structure that requires users to trust the game operator and can lead to suspicions of result manipulation. This directly contradicts the principles of transparency and decentralization that Web3 DApps aim to uphold.

- **근거 및 원칙 (Rationale & Principles):**
  - **탈중앙성 (Decentralization):** 신뢰가 필요 없는(trustless) 시스템을 구축하여, 중앙화된 주체에 대한 의존을 최소화해야 합니다.
  - **검증 가능한 공정성 (Provable Fairness):** 사용자는 게임 결과가 조작되지 않았음을 스스로 검증할 수 있어야 합니다.

- **해결 전략 (Solution Strategy):**
  (KO) **장기적 개선 과제**로, 검증 가능한 랜덤 함수(Verifiable Random Function - VRF)를 도입하는 것을 제안합니다.
  1.  **(1단계) Commit-Reveal 스킴 도입:**
      -   **Commit:** `/spin` API는 랜덤 결과를 즉시 반환하는 대신, `hash(결과 + 서버 시크릿)` 형태의 '결과 해시'와 '트랜잭션 ID'를 먼저 반환합니다.
      -   **Reveal:** 프론트엔드는 블록체인에서 해당 트랜잭션이 포함된 블록의 `blockhash`를 가져옵니다.
      -   **Verification:** 프론트엔드는 '결과 해시', '서버 시크릿' (서버가 나중에 공개), 그리고 `blockhash`를 모두 사용하여 결과가 유효한지 클라이언트 측에서 검증할 수 있습니다.
  2.  **(2단계) 완전한 온체인 VRF 도입:** 더 나아가, Chainlink VRF와 같은 온체인 랜덤 소스를 사용하여 게임 결과를 생성하는 방식으로 아키텍처를 발전시킬 수 있습니다.

- **코드 예시 (Conceptual Flow):**
  ```
  // Conceptual Flow for Commit-Reveal
  // 1. User calls /spin
  //    - Server generates result, stores HASH = hash(result + server_secret).
  //    - Server returns { commitmentHash: HASH, txId: ... }
  // 2. Frontend waits for transaction confirmation.
  // 3. Frontend calls /getResult(txId).
  //    - Server retrieves blockhash for txId.
  //    - Server uses seed = hash(blockhash + server_secret) to derive final result.
  //    - Server returns { result, server_secret }
  // 4. Frontend verifies hash(result + server_secret) === HASH.
  ```

## 8. 확장성: 경직된 다국어 처리 로직 (Scalability: Inflexible i18n Logic)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 `t()` 함수는 `{key}` 형태의 단순 문자열 치환만 지원합니다. 이는 `FR-UI-03` 요구사항에 명시된, 동적 값을 **지역화된 숫자 형식**으로 표현(예: 1000을 영어권에서는 '1,000'으로, 독일에서는 '1.000'으로 표시)하거나, 수량에 따른 복수형 처리(pluralization)를 하지 못해 확장성이 매우 낮습니다.
  (EN) The current `t()` function only supports simple string replacement for `{key}`. It cannot handle pluralization or format dynamic values into **localized number formats** (e.g., displaying 1000 as '1,000' in English and '1.000' in German), as required by `FR-UI-03`, making it highly unscalable.

- **근거 및 원칙 (Rationale & Principles):**
  - **국제화(i18n) 모범사례:** 좋은 i18n 시스템은 단순 번역을 넘어, 각 언어권의 숫자, 날짜, 복수형 규칙 등 문화적 차이를 모두 고려해야 합니다.
  - **ICU MessageFormat 표준:** 복잡한 번역 규칙을 처리하기 위한 업계 표준으로, 다수의 i18n 라이브러리에서 채택하고 있습니다.

- **해결 전략 (Solution Strategy):**
  (KO) `Intl` 객체를 활용하여 `t()` 함수를 개선합니다. `Intl.NumberFormat`을 사용하여 숫자 파라미터를 현재 설정된 언어(`currentLang`)의 로케일에 맞게 자동으로 형식화하는 로직을 추가합니다.
  (EN) Enhance the `t()` function by leveraging the `Intl` object. Add logic to automatically format numeric parameters using `Intl.NumberFormat` according to the currently set language's locale (`currentLang`).

- **코드 예시 (Code Example):**
  ```javascript
  // src/main.js (Improved t() function)
  // function t(key, params = {}) {
  //   let str = translations[key] || key;
  //   for (const [pKey, pValue] of Object.entries(params)) {
  //     let value = pValue;
  //     if (typeof pValue === 'number') {
  //       value = new Intl.NumberFormat(currentLang).format(pValue);
  //     }
  //     str = str.replace(`{${pKey}}`, value);
  //   }
  //   return str;
  // }
  //
  // // Usage:
  // // showMessage('spin_win_message', { payout: 10000 });
  // // -> "Congratulations! You won 10,000 CSPIN!" (for en-US)
  // // -> "축하합니다! 10,000 CSPIN에 당첨되었습니다!" (for ko-KR)
  ```

## 9. 테스트 자동화 부재: 회귀 위험성 (Lack of Test Automation: Regression Risk)

- **문제 진단 (Problem Diagnosis):**
  (KO) 프로젝트에 자동화된 테스트 케이스가 전무합니다. 모든 변경 사항은 수동으로 검증해야 하며, 이는 비효율적이고 실수를 유발하기 쉽습니다. 새로운 기능을 추가하거나 코드를 리팩토링할 때, 의도치 않게 기존 기능이 손상될(회귀) 위험이 매우 높습니다.
  (EN) The project has zero automated test cases. All changes must be verified manually, which is inefficient and error-prone. There is a very high risk of unintentionally breaking existing functionality (regression) when adding new features or refactoring code.

- **근거 및 원칙 (Rationale & Principles):**
  - **지속적인 통합 (Continuous Integration - CI):** 코드 변경 시마다 자동으로 테스트를 실행하여, 버그를 조기에 발견하고 소프트웨어의 품질을 안정적으로 유지해야 합니다.
  - **테스트 피라미드 (Test Pyramid):** 빠르고 저렴한 단위 테스트를 기반으로, 통합 테스트, 그리고 소수의 E2E 테스트를 통해 시스템의 여러 계층을 효과적으로 검증해야 합니다.

- **해결 전략 (Solution Strategy):**
  1.  **테스트 프레임워크 도입:**
      -   `vitest`: Vite와 완벽하게 통합되는 단위/통합 테스트 프레임워크를 도입합니다.
      -   `Playwright`: 최종 사용자 관점의 E2E(End-to-End) 테스트를 위해 도입합니다.
  2.  **기본 테스트 작성:**
      -   **Unit Tests:** 순수 함수(예: `calculatePayoutMultiplier`, `createJettonTransferPayload`)에 대한 단위 테스트를 작성합니다.
      -   **Integration Tests:** 백엔드 함수가 예상된 요청에 대해 올바른 응답(성공/실패)을 반환하는지 테스트합니다.
      -   **E2E Tests:** '지갑 연결 → 스핀 → 결과 확인'으로 이어지는 핵심 사용자 시나리오에 대한 Playwright 테스트를 작성합니다.

- **코드 예시 (File Structure):**
  ```
  .
  ├── tests/
  │   ├── e2e/
  │   │   └── main_flow.spec.js   # (KO) Playwright E2E 테스트 (EN) Playwright E2E test
  │   ├── integration/
  │   │   └── api.test.js         # (KO) API 통합 테스트 (EN) API integration test
  │   └── unit/
  │       └── logic.test.js       # (KO) 순수 함수 단위 테스트 (EN) Pure function unit test
  └── ...
  ```

## 10. 개발 생산성: 코딩 표준 강제화 부재 (Developer Productivity: Lack of Coding Standard Enforcement)

- **문제 진단 (Problem Diagnosis):**
  (KO) 현재 프로젝트는 `AI_AGENT_GUIDELINES.md`라는 문서에만 의존하여 코드 스타일과 품질을 유지하고 있습니다. 이는 개발자의 주의력에 전적으로 의존하는 방식으로, 실수가 발생하기 쉽고 코드 스타일의 불일치를 야기할 수 있습니다.
  (EN) The project currently relies solely on the `AI_AGENT_GUIDELINES.md` document to maintain code style and quality. This approach is entirely dependent on developer diligence, making it prone to errors and inconsistencies in code style.

- **근거 및 원칙 (Rationale & Principles):**
  - **자동화 (Automation):** 반복적이고 중요한 작업(코드 포매팅, 린팅)은 자동화하여 인간의 실수를 줄이고, 개발자가 비즈니스 로직에 더 집중할 수 있도록 해야 합니다.
  - **DevOps 문화:** 개발(Dev)과 운영(Ops)의 경계를 허물고, 개발 파이프라인 초기에 품질 검사를 통합하여 전체적인 생산성과 안정성을 높입니다.

- **해결 전략 (Solution Strategy):**
  (KO) **정적 분석 및 자동화 도구**를 도입하여 코드 품질을 강제합니다.
  1.  `ESLint`: 잠재적인 버그나 안티패턴을 찾아내는 린팅 도구를 설정합니다.
  2.  `Prettier`: 모든 코드의 스타일을 일관되게 유지하는 코드 포맷터를 설정합니다.
  3.  `Husky`와 `lint-staged`: Git 커밋 전(`pre-commit` 훅)에, 변경된 파일에 대해 자동으로 `ESLint`와 `Prettier`를 실행하도록 설정합니다. 이를 통해 품질 기준을 만족하지 못하는 코드가 저장소에 커밋되는 것을 원천적으로 방지합니다.

- **코드 예시 (package.json scripts):**
  ```json
  // "scripts": {
  //   ...
  //   "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
  //   "format": "prettier --write .",
  //   "prepare": "husky install"
  // },
  // ".lintstagedrc.json": {
  //   "*.{js,jsx,ts,tsx}": [
  //     "eslint --fix",
  //     "prettier --write"
  //   ]
  // }
  ```