# Changelog (변경 이력)

All notable changes to this project will be documented in this file.
(이 프로젝트의 모든 주요 변경 사항은 이 파일에 문서화됩니다.)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.
(이 문서의 형식은 "Keep a Changelog"를 따르며, 이 프로젝트는 시맨틱 버저닝을 준수합니다.)

---

## [1.3.0] - 2025-10-05

This version marks the completion of the core gameplay loop, including betting and on-chain payouts.
(베팅과 온체인 상금 지급을 포함한 핵심 게임플레이 루프의 완성을 기념하는 버전입니다.)

### Added (추가된 기능)

- **Developer Mode via UI Button:** Added a settings button to the UI. Clicking it and entering the correct secret key activates a developer mode that guarantees a win for testing purposes.
  **(UI 버튼을 통한 개발자 모드):** UI에 설정 버튼을 추가했습니다. 클릭 후 올바른 비밀 키를 입력하면 테스트를 위해 승리를 보장하는 개발자 모드가 활성화됩니다.
- **Copy Address Button:** Added a button next to the connected wallet address that copies the full address to the clipboard.
  **(주소 복사 버튼):** 연결된 지갑 주소 옆에 전체 주소를 클립보드로 복사하는 버튼을 추가했습니다.
- **Comprehensive Backend Error Reporting:** The backend now catches errors during the payout process and reports them to the frontend, making debugging on mobile possible.
  **(백엔드 오류 보고 기능):** 이제 백엔드가 상금 지급 중 발생하는 오류를 잡아 프론트엔드로 보고하여, 모바일 환경에서의 디버깅이 가능해졌습니다.

### Fixed (수정된 버그)

- **Backend Stability:** Resolved a series of critical server errors (`Server error:`) caused by a complex interaction between Cloudflare's secure runtime and the `TonWeb` library's import method. The fix involved several stages of debugging, culminating in a stable static import.
  **(백엔드 안정성):** Cloudflare 보안 런타임과 `TonWeb` 라이브러리의 import 방식 간의 복잡한 상호작용으로 인해 발생하던 여러 치명적인 서버 오류를 해결했습니다. 안정적인 정적 import 방식을 최종 적용하여 디버깅을 완료했습니다.
- **Recurring "Locked" Fee:** Fixed a bug where a one-time wallet creation fee ("locked" fee) was being charged on every spin. The issue was resolved by replacing manual transaction payload creation with the standard `tonweb` library helper functions (`JettonWallet.createTransferBody`).
  **(반복적인 "Locked" 비용):** 일회성 지갑 생성 비용("locked" fee)이 매 스핀마다 청구되던 버그를 수정했습니다. 수동으로 트랜잭션 페이로드를 생성하던 방식에서 `tonweb` 라이브러리의 표준 헬퍼 함수를 사용하도록 변경하여 해결했습니다.
- **Frontend `is not a function` Errors:** Resolved a series of frontend errors caused by API changes between different versions of the `tonweb` library. The code was updated to use the correct objects (`JettonWallet` instead of `JettonMinter`) and methods for the latest library version.
  **(프론트엔드 `is not a function` 오류):** `tonweb` 라이브러리의 여러 버전 간 API 변경으로 인해 발생하던 프론트엔드 오류들을 해결했습니다. 최신 라이브러리 버전에 맞는 올바른 객체와 메서드를 사용하도록 코드를 업데이트했습니다.

---

## [1.0.0] - 2025-10-04

Initial version of the CandleSpinner slot machine.
(CandleSpinner 슬롯머신의 초기 버전입니다.)

### Added (추가된 기능)

- **Core Game UI:** Implemented the main game interface including a 3x3 reel grid, spin button, and bet controls.
  **(핵심 게임 UI):** 3x3 릴 그리드, 스핀 버튼, 베팅 조절 기능을 포함한 메인 게임 인터페이스를 구현했습니다.
- **TON Wallet Connection:** Integrated `@tonconnect/ui` to allow users to connect their TON wallets.
  **(TON 지갑 연결):** 사용자가 자신의 TON 지갑을 연결할 수 있도록 `@tonconnect/ui`를 통합했습니다.
- **On-chain Betting:** Implemented the frontend logic for creating and sending a `CSPIN` Jetton transfer transaction when the user clicks "Spin".
  **(온체인 베팅):** 사용자가 "Spin"을 클릭했을 때 `CSPIN` 젯톤 전송 트랜잭션을 생성하고 보내는 프론트엔드 로직을 구현했습니다.
- **Backend Win Calculation:** Created a Cloudflare Function (`/spin`) that calculates a random slot result and determines win/loss status based on payout lines.
  **(백엔드 당첨 계산):** 무작위 슬롯 결과를 계산하고 페이라인에 따라 승패를 결정하는 Cloudflare Function (`/spin`)을 생성했습니다.

