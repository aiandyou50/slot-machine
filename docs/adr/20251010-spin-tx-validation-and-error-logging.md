# ADR: 20251010-spin-tx-validation-and-error-logging.md

## 상태 (Status)
채택됨 (Accepted)

## 배경 (Context)
- (KO) 스핀 트랜잭션 생성 시 'Invalid CRC32C' 오류가 빈번하게 발생함.
- (EN) Frequent 'Invalid CRC32C' errors during spin transaction creation.
- (KO) 기존 로직에서 입력값(지갑 주소, 베팅 금액) 검증이 부족하여 블록체인에 잘못된 데이터가 전송될 수 있음.
- (EN) Lack of input validation (wallet address, bet amount) in previous logic led to sending incorrect data to the blockchain.

## 결정 (Decision)
- (KO) 트랜잭션 생성 시 TON 주소 형식 및 베팅 금액에 대한 유효성 검증 로직을 추가한다.
- (EN) Add validation logic for TON address format and bet amount during transaction creation.
- (KO) 오류 발생 시 상세 로그와 사용자 안내 메시지를 출력하도록 개선한다.
- (EN) Improve error logging and user-facing error messages on failure.

## 결과 (Consequences)
- (KO) 잘못된 입력값으로 인한 블록체인 오류 발생 가능성이 크게 감소함.
- (EN) Significantly reduces the likelihood of blockchain errors due to invalid input values.
- (KO) 사용자와 개발자가 오류 원인을 빠르게 파악할 수 있음.
- (EN) Enables users and developers to quickly identify the cause of errors.
- (KO) 실시간 문서화 및 버전 관리 원칙을 준수함.
- (EN) Adheres to real-time documentation and versioning principles.
