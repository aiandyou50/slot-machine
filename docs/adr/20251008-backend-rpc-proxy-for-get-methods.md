# ADR-002: 백엔드 RPC 프록시 패턴 도입 (Introduce Backend RPC Proxy Pattern)

- **상태 (Status):** 채택됨 (Accepted)
- **날짜 (Date):** 2025-10-08

## 배경 (Context)

(KO)
`handleSpin` 함수를 실행하는 과정에서, 프론트엔드가 `@ton/ton`의 `TonClient`를 사용하여 공개 RPC 엔드포인트(`toncenter.com`)에 직접 스마트 컨트랙트의 `get_wallet_address` 메소드를 호출할 때, `exit_code: -13` 오류가 발생하며 트랜잭션이 실패했습니다. 이 문제는 공개 RPC의 속도 제한(rate limiting)이나, 특정 샌드박스 환경의 네트워크 제약으로 인해 발생하는 것으로 분석되었습니다. 프론트엔드가 외부 인프라에 직접 의존하는 것은 시스템의 안정성을 심각하게 저해하는 단일 실패점(Single Point of Failure)이었습니다.

(EN)
During the execution of the `handleSpin` function, the transaction failed with an `exit_code: -13` error when the frontend directly called the `get_wallet_address` method of a smart contract on the public RPC endpoint (`toncenter.com`) using `@ton/ton`'s `TonClient`. This issue was analyzed to be caused by rate limiting on the public RPC or network constraints within the sandbox environment. The frontend's direct dependency on this external infrastructure created a single point of failure that severely compromised system stability.

## 결정 (Decision)

(KO)

1.  **백엔드 프록시 패턴 (Backend for Frontend)을 도입합니다.** 프론트엔드에서 직접 블록체인의 `get` 메소드를 호출하는 모든 로직을 제거합니다.
2.  이러한 호출을 안전하게 중계하는 새로운 백엔드 API 엔드포인트 `/getJettonWalletAddress`를 생성합니다.
3.  이 백엔드 함수는 Cloudflare 환경 변수를 통해 보호되는 API 키를 사용하여, 더 안정적이고 속도 제한이 없는 RPC 엔드포인트에 요청을 보냅니다.
4.  프론트엔드는 이제 블록체인에 직접 요청하는 대신, 이 백엔드 프록시 API를 호출하여 필요한 데이터를 가져옵니다.

(EN)

1.  **Introduce a Backend for Frontend (BFF) / Proxy Pattern.** Remove all logic from the frontend that directly calls blockchain `get` methods.
2.  Create a new backend API endpoint, `/getJettonWalletAddress`, to securely proxy these calls.
3.  This backend function will use a protected API key, sourced from Cloudflare environment variables, to make requests to a more reliable, non-rate-limited RPC endpoint.
4.  The frontend will now fetch the required data by calling this backend proxy API instead of directly querying the blockchain.

## 결과 (Consequences)

### 긍정적 (Positive)

- **(KO) 안정성 및 신뢰성 향상:** 공개 RPC의 불안정성이나 속도 제한 문제로부터 프론트엔드를 분리하여, 핵심 기능의 성공률을 크게 높였습니다.
- **(EN) Improved Stability and Reliability:** Decoupling the frontend from the volatility and rate limits of public RPCs significantly increases the success rate of core functions.
- **(KO) 보안 강화:** 민감한 `TONCENTER_API_KEY`와 같은 자격 증명을 클라이언트 측에 노출하지 않고, 안전하게 서버 측에서만 관리할 수 있게 되었습니다.
- **(EN) Enhanced Security:** Sensitive credentials like `TONCENTER_API_KEY` are no longer exposed on the client-side and are securely managed on the server-side.
- **(KO) 중앙 집중식 로직 관리:** 블록체인과의 상호작용 로직이 백엔드에 중앙화되어, 향후 RPC 엔드포인트 변경이나 관련 로직 수정이 필요할 때 유지보수가 용이해졌습니다.
- **(EN) Centralized Logic Management:** Blockchain interaction logic is centralized in the backend, simplifying future maintenance, such as changing RPC endpoints or modifying related logic.

### 부정적 (Negative)

- **(KO) 아키텍처 복잡성 증가:** 새로운 백엔드 함수가 추가되어 전체 시스템의 구성 요소가 늘어났습니다.
- **(EN) Increased Architectural Complexity:** The addition of a new backend function increases the number of components in the overall system.
- **(KO) 약간의 지연 시간 추가:** 프론트엔드 → 백엔드 → 블록체인으로 이어지는 추가적인 네트워크 홉(hop)으로 인해, 데이터 조회에 미세한 지연 시간이 추가될 수 있습니다. 하지만 이는 안정성 확보의 대가로 감수할 수 있는 수준입니다.
- **(EN) Minor Latency Increase:** An additional network hop from frontend to backend to blockchain may introduce minimal latency in data retrieval. However, this is an acceptable trade-off for the significant gain in reliability.
