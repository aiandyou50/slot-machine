# ADR-001: TON 라이브러리 스택 현대화 (Modernize TON Library Stack)

- **상태 (Status):** 채택됨 (Accepted)
- **날짜 (Date):** 2025-10-08

## 배경 (Context)

(KO)
프로젝트 초기 버전은 `tonweb` 라이브러리를 사용하여 TON 블록체인과 상호작용했습니다. 그러나 Cloudflare Pages 배포 과정에서 `tonweb`이 `isomorphic-webcrypto`를, 그리고 이 라이브러리가 다시 `expo` 프레임워크 전체를 간접 의존성(transitive dependency)으로 가져오는 심각한 문제가 발견되었습니다. 이 "유령 의존성"은 `package.json`과 `package-lock.json` 간의 불일치를 야기하여 `npm ci` 명령을 사용하는 CI/CD 환경에서 반복적인 빌드 실패를 유발했습니다. 또한, `tonweb`은 2년 이상 업데이트되지 않아 최신 TON 기능을 지원하지 못할 잠재적 위험이 있었습니다.

(EN)
The initial version of the project used the `tonweb` library for interacting with the TON blockchain. However, during Cloudflare Pages deployment, a critical issue was discovered where `tonweb` introduced a transitive dependency on the entire `expo` framework through `isomorphic-webcrypto`. This "phantom dependency" caused inconsistencies between `package.json` and `package-lock.json`, leading to repeated build failures in the CI/CD environment which uses the `npm ci` command. Furthermore, `tonweb` has not been updated in over two years, posing a potential risk of not supporting the latest TON features.

## 결정 (Decision)

(KO)
1.  **`tonweb` 라이브러리를 프로젝트에서 완전히 제거합니다.**
2.  모든 블록체인 상호작용(주소 변환, 트랜잭션 페이로드 생성, 컨트랙트 `get` 메소드 호출 등) 로직을 최신 공식 라이브러리인 **`@ton/core`**와 **`@ton/ton`**을 사용하여 전면 재작성합니다.
3.  이를 통해 불필요하고 거대한 유령 의존성을 제거하고, 프로젝트의 의존성 트리를 깨끗하고 예측 가능하게 만듭니다.

(EN)
1.  **Completely remove the `tonweb` library from the project.**
2.  Refactor all blockchain interaction logic (address conversion, transaction payload creation, contract `get` method calls, etc.) to exclusively use the modern, official libraries: **`@ton/core`** and **`@ton/ton`**.
3.  This will eliminate the unnecessary and large phantom dependency, resulting in a clean and predictable dependency tree for the project.

## 결과 (Consequences)

### 긍정적 (Positive)
- **(KO) 배포 안정성 확보:** `package-lock.json` 불일치 문제를 근본적으로 해결하여, CI/CD 환경에서 안정적인 배포가 가능해졌습니다.
- **(EN) Deployment Stability:** Fundamentally resolves the `package-lock.json` inconsistency, enabling stable deployments in the CI/CD environment.
- **(KO) 의존성 최소화:** 프로젝트에 불필요한 `expo` 관련 패키지들이 모두 제거되어 번들 사이즈가 감소하고 의존성 관리가 용이해졌습니다.
- **(EN) Minimized Dependencies:** All unnecessary `expo`-related packages are removed, reducing bundle size and simplifying dependency management.
- **(KO) 코드 현대화:** 최신 공식 라이브러리를 사용함으로써, 프로젝트의 기술 스택을 현대화하고 향후 TON 네트워크의 새로운 기능을 활용하기 용이해졌습니다.
- **(EN) Code Modernization:** By using the latest official libraries, the project's tech stack is modernized, making it easier to leverage new features of the TON network in the future.

### 부정적 (Negative)
- **(KO) 초기 리팩토링 비용:** 기존 `tonweb` 기반 코드를 `@ton/core` 기반으로 전환하는 데 초기 개발 시간이 소요되었습니다.
- **(EN) Initial Refactoring Cost:** Initial development time was spent refactoring the existing `tonweb`-based code to the `@ton/core`-based implementation.
- **(KO) 학습 곡선:** 팀원들이 새로운 라이브러리의 API에 익숙해져야 할 수 있습니다. (현재는 AI 단독 개발이므로 영향 없음)
- **(EN) Learning Curve:** Team members may need to become familiar with the new library's API. (No impact currently, as development is handled solely by the AI).