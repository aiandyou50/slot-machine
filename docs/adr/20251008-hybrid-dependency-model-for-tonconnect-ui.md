# ADR-003: @tonconnect/ui를 위한 하이브리드 의존성 모델 채택 (Adoption of Hybrid Dependency Model for @tonconnect/ui)

- **상태 (Status):** 채택됨 (Accepted)
- **날짜 (Date):** 2025-10-08

## 배경 (Context)

(KO)
프로젝트의 모든 외부 라이브러리를 NPM 패키지로 전환하여 로컬에서 번들링하는 시도를 했을 때, 다른 문제는 모두 해결되었지만 `@tonconnect/ui` 라이브러리의 핵심 기능인 지갑 연결 버튼 위젯이 프론트엔드에 렌더링되지 않는 문제가 지속적으로 발생했습니다. Playwright 테스트 결과, 버튼을 담는 `div`는 생성되지만 그 내부에 `iframe`이 주입되지 않아 UI가 보이지 않는 현상이 확인되었습니다. 이는 Vite 환경에서 `@tonconnect/ui`를 NPM으로 설치하여 사용할 때 발생하는 고질적인 렌더링 또는 초기화 문제로 분석되었습니다.

(EN)
When attempting to switch all external libraries to NPM packages for local bundling, a persistent issue arose where the core wallet connection button widget from the `@tonconnect/ui` library failed to render on the frontend, even though all other issues were resolved. Playwright tests confirmed that while the container `div` for the button was created, the necessary `iframe` was not injected into it, resulting in an invisible UI element. This was analyzed as a persistent rendering or initialization issue when using `@tonconnect/ui` as an NPM package within a Vite environment.

## 결정 (Decision)

(KO)

1.  **하이브리드 의존성 모델을 채택합니다.**
2.  UI 렌더링 안정성을 최우선으로 고려하여, **`@tonconnect/ui` 라이브러리(CSS 포함)는 검증된 방식인 CDN을 통해 로드**하도록 `index.html`에서 직접 참조합니다.
3.  `@tonconnect/ui`를 제외한 다른 모든 라이브러리(`@ton/core`, `jose` 등)는 **NPM을 통해 설치하고 Vite 번들에 포함**시켜, `tonweb`이 야기했던 유령 의존성 문제를 방지하고 안정적인 의존성 관리를 유지합니다.
4.  프론트엔드 `main.js`의 초기화 로직은, `DOMContentLoaded` 이벤트 발생 후 CDN 스크립트가 `window.TonConnectUI` 객체를 생성할 때까지 안전하게 기다린 후 애플리케이션을 시작하도록 구현합니다.

(EN)

1.  **Adopt a hybrid dependency model.**
2.  To prioritize UI rendering stability, the **`@tonconnect/ui` library (including its CSS) will be loaded directly via CDN** by referencing it in `index.html`, which is the proven stable method.
3.  All other libraries (e.g., `@ton/core`, `jose`), excluding `@tonconnect/ui`, will be **installed via NPM and included in the Vite bundle**. This maintains stable dependency management and prevents the phantom dependency issues previously caused by `tonweb`.
4.  The initialization logic in the frontend `main.js` will be implemented to safely wait for the CDN script to create the global `window.TonConnectUI` object after the `DOMContentLoaded` event fires, before starting the application.

## 결과 (Consequences)

### 긍정적 (Positive)

- **(KO) UI 렌더링 안정성 확보:** `@tonconnect/ui`의 고질적인 NPM 통합 문제를 회피하고, 지갑 연결 버튼이 항상 안정적으로 표시되도록 보장합니다.
- **(EN) Ensured UI Rendering Stability:** Bypasses the persistent NPM integration issues with `@tonconnect/ui`, ensuring the wallet connection button renders reliably.
- **(KO) 의존성 관리 개선:** `tonweb`과 같은 핵심 라이브러리는 NPM으로 관리하여, 유령 의존성 문제를 방지하고 대부분의 의존성을 통제된 환경에 둡니다.
- **(EN) Improved Dependency Management:** Core libraries like `tonweb`'s replacements are managed via NPM, preventing phantom dependency issues and keeping most dependencies in a controlled environment.
- **(KO) 명확한 역할 분리:** 라이브러리의 특성에 따라 로드 방식을 분리하는 실용적인 접근법을 채택하여, 두 방식의 장점을 모두 활용합니다.
- **(EN) Clear Separation of Concerns:** Adopts a pragmatic approach by separating loading strategies based on library characteristics, leveraging the benefits of both methods.

### 부정적 (Negative)

- **(KO) 외부 의존성 잔존:** `@tonconnect/ui` 라이브러리에 대한 외부 CDN 의존성이 남아있어, CDN 서비스 장애 시 잠재적인 단일 실패점이 될 수 있습니다.
- **(EN) Remaining External Dependency:** An external CDN dependency for `@tonconnect/ui` remains, which could be a single point of failure if the CDN service experiences an outage.
- **(KO) 아키텍처의 비일관성:** 모든 의존성을 단일 방식으로 관리하지 않아, 아키텍처의 일관성이 다소 저하됩니다. 하지만 이는 안정성을 위한 의도적인 기술적 트레이드오프입니다.
- **(EN) Architectural Inconsistency:** The architecture loses some consistency by not managing all dependencies in a single manner. However, this is a deliberate technical trade-off for stability.
