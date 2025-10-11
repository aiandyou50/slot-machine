# [FIX] 20251010-invalid-crc32c-error-diagnosis-and-solution.md

---

## 🧑‍💻 코드 진단 및 개선 계획 보고서 (Code Diagnostics and Improvement Plan)

### 1. 문제점 (Problem)
- (KO) 스핀 버튼 클릭 시 "오류가 발생했습니다: Invalid CRC32C" 메시지가 출력됨.
- (EN) When clicking the spin button, the message "Error occurred: Invalid CRC32C" is displayed.

### 2. 근거 및 원인 분석 (Rationale & Cause Analysis)
- (KO) 이 오류는 블록체인에 전송되는 트랜잭션 데이터가 TON 명세와 불일치하거나, Jetton 메시지에 불필요한 필드가 포함되어 발생함.
- (EN) This error occurs when the transaction data sent to the blockchain does not comply with the TON specification, or the Jetton message includes unnecessary fields.

#### 주요 원인 (Root Causes)
- (KO) Jetton 전송 메시지에 `forward_payload`, `forward_ton_amount` 등 불필요하거나 잘못된 필드가 포함됨.
- (EN) Jetton transfer message contains unnecessary or malformed fields such as `forward_payload`, `forward_ton_amount`.
- (KO) 트랜잭션의 BOC 구조가 TON 명세와 불일치.
- (EN) The BOC (Bag of Cells) structure of the transaction does not match the TON specification.
- (KO) 블록체인 연동 코드(`src/services/blockchain.js`)에서 데이터 인코딩/직렬화 오류.
- (EN) Data encoding/serialization error in blockchain integration code (`src/services/blockchain.js`).

### 3. 해결 가설 및 전략 (Solution Hypothesis & Strategy)
- (KO) 트랜잭션 생성 로직을 점검하여 필수 필드만 포함되도록 리팩토링.
- (EN) Refactor the transaction creation logic to include only required fields.
- (KO) Jetton 전송 메시지에서 불필요한 필드(`forward_payload`, `forward_ton_amount`)를 완전히 제거.
- (EN) Remove unnecessary fields (`forward_payload`, `forward_ton_amount`) from the Jetton transfer message.
- (KO) BOC 구조 및 직렬화 방식이 TON 공식 명세와 일치하는지 검증.
- (EN) Validate that the BOC structure and serialization match the official TON specification.
- (KO) 블록체인에 전달되는 데이터의 로그 또는 단위 테스트 추가로 실제 전송값을 확인.
- (EN) Add logging or unit tests to verify the actual data sent to the blockchain.

---

### 4. 참고 문서 (Reference Documents)
- `docs/PROJECT_REQUIREMENTS.md` (기능 및 오류 요구사항)
- `docs/PROJECT_ARCHITECTURE.MD` (아키텍처 및 데이터 흐름)
- `docs/CHANGELOG.md` (과거 오류 및 해결 내역)
- TON 공식 명세 및 Jetton 전송 구조

---

### 5. 다음 단계 (Next Steps)
- 위 가설에 따라 코드 점검 및 수정 작업을 진행하고, 모든 변경 사항을 실시간 문서화 원칙에 따라 기록합니다.
