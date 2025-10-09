# (KO) 코드 진단 및 개선 계획 보고서: 검증 가능한 공정성(Provable Fairness) 구현
# (EN) Code Diagnostics and Improvement Plan: Provable Fairness Implementation

- **작성일 (Date):** 2025-10-09
- **작성자 (Author):** Jules, AI Lead Developer
- **상태 (Status):** 제안됨 (Proposed)

---

## 1. 진단 결과 (Diagnostics)

### 1.1. 문제점 (Problem)

(KO) 현재 백엔드 API (`functions/spin.js`)는 `Math.random()` 함수를 사용하여 슬롯머신의 스핀 결과를 생성하고 있습니다. 이는 다음과 같은 심각한 문제를 야기합니다.

- **프로젝트 요구사항 위반:** "NFR-GAME-01: 검증 가능한 공정성" 요구사항과 "Math.random() 사용 금지" 가이드라인을 정면으로 위반합니다.
- **신뢰성 부족:** 게임 결과가 중앙화된 서버의 예측 불가능한 랜덤 소스에 전적으로 의존하므로, 사용자는 결과가 조작되지 않았음을 신뢰할 수 없습니다.
- **투명성 부재:** 사용자가 게임 결과의 생성 과정을 검증할 수 있는 어떠한 암호학적 수단도 제공되지 않습니다.

(EN) The current backend API (`functions/spin.js`) uses the `Math.random()` function to generate slot machine spin results. This creates several critical issues:

- **Violation of Project Requirements:** It directly violates the "NFR-GAME-01: Provable Fairness" requirement and the "Do not use Math.random()" guideline.
- **Lack of Trust:** Game outcomes are entirely dependent on a non-deterministic random source from a centralized server, meaning users cannot trust that the results are not manipulated.
- **Absence of Transparency:** No cryptographic method is provided for users to verify the integrity of the game result generation process.

### 1.2. 근본 원인 (Root Cause)

(KO) 초기 개발 단계에서 검증 가능한 공정성 메커니즘이 구현되지 않았고, 기능의 빠른 프로토타이핑을 위해 `Math.random()`이 임시방편으로 사용된 것으로 분석됩니다. 이 구현은 프로젝트의 핵심 목표인 '탈중앙화되고 투명한 Web3 게임'의 가치와 상충합니다.

(EN) It is analyzed that a provable fairness mechanism was not implemented in the initial development phase, and `Math.random()` was used as a temporary measure for rapid prototyping. This implementation conflicts with the project's core value of being a 'decentralized and transparent Web3 game'.

---

## 2. 개선 전략 (Improvement Strategy)

### 2.1. 제안 해결책 (Proposed Solution)

(KO) `Math.random()`을 완전히 제거하고, **Commit-Reveal 스킴**을 도입하여 검증 가능한 공정성을 구현할 것을 제안합니다. 이 방식은 사용자와 서버가 결과 생성에 모두 참여하게 하여, 어느 한쪽도 결과를 조작할 수 없도록 보장합니다.

(EN) It is proposed to completely remove `Math.random()` and implement provable fairness by introducing a **Commit-Reveal scheme**. This method ensures that neither the server nor the user can manipulate the outcome by having both parties participate in the result generation.

### 2.2. 아키텍처 변경 계획 (Architectural Change Plan)

(KO) 기존의 단일 `/spin` API를 폐기하고, 다음의 2단계 API로 대체하는 아키텍처 변경을 제안합니다.

1.  **`GET /commitSpin` (Commit Phase):**
    - 서버가 암호학적으로 안전한 `serverSeed`를 생성합니다.
    - 서버는 `serverSeed`를 직접 반환하는 대신, 그것의 해시(SHA-256) 값인 `commitment`를 생성하여 사용자에게 반환합니다.
    - 이 `commitment`는 "나는 이 해시를 만드는 원본 값을 이미 결정했으며, 바꿀 수 없다"는 서버의 약속 역할을 합니다.

2.  **`POST /revealSpin` (Reveal Phase):**
    - 사용자는 스핀을 실행하기 위해 `commitment`와 함께 자신이 생성한 `clientSeed`를 서버에 전송합니다.
    - 서버는 `commitment`에 해당하는 원본 `serverSeed`를 조회하고, 이를 사용자가 보낸 `clientSeed`와 조합하여 최종 랜덤 결과를 결정론적으로 생성합니다.
    - API 응답으로, 서버는 최종 결과와 함께 원본 `serverSeed`를 사용자에게 공개(Reveal)합니다.

### 2.3. 사용자 측 검증 프로세스 (User-side Verification Process)

(KO) 사용자는 게임이 끝난 후, 서버로부터 받은 `serverSeed`를 직접 해시하여, 게임 시작 전에 받았던 `commitment`와 일치하는지 확인할 수 있습니다. 이 검증을 통해 서버가 약속을 지켰으며 결과를 조작하지 않았음을 수학적으로 증명할 수 있습니다.

(EN) After the game, the user can verify the integrity of the outcome by hashing the `serverSeed` received from the server and checking if it matches the `commitment` they received before the game started. This process mathematically proves that the server kept its promise and did not manipulate the result.

---

## 3. 기대 효과 (Expected Outcomes)

- **투명성 및 신뢰성 확보:** 사용자는 모든 게임 결과를 스스로 검증할 수 있게 되어, 플랫폼에 대한 신뢰가 크게 향상됩니다.
- **프로젝트 목표 달성:** '검증 가능한 공정성'을 구현하여 프로젝트의 핵심 요구사항을 충족하고, 진정한 Web3 게임으로서의 가치를 실현합니다.
- **보안 강화:** 예측 불가능한 `Math.random()` 대신, 암호학적 원리를 기반으로 한 안전한 난수 생성 파이프라인을 구축합니다.