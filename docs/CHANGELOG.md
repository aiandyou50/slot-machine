# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2025-10-07

### Added
- **Initial Project Setup:**
  - (EN) Set up project structure with Vite, Cloudflare Functions, and required dependencies.
  - (KO) Vite, Cloudflare Functions 및 필수 의존성을 포함한 프로젝트 구조 설정.
  - (EN) Created initial `index.html`, `main.js`, `style.css` and backend function stubs.
  - (KO) 초기 `index.html`, `main.js`, `style.css` 및 백엔드 함수 스텁 생성.
- **Frontend Wallet Connection:**
  - (EN) Implemented wallet connection using `@tonconnect/ui`.
  - (KO) `@tonconnect/ui`를 사용한 지갑 연결 기능 구현.
  - (EN) Added view switching between 'Landing View' and 'Game View' based on connection status.
  - (KO) 연결 상태에 따라 '랜딩 뷰'와 '게임 뷰' 간의 뷰 전환 기능 추가.
- **Backend Core APIs:**
  - (EN) Implemented `/spin` API with basic slot logic and JWT "win ticket" generation.
  - (KO) 기본 슬롯 로직과 JWT "당첨 티켓" 생성을 포함한 `/spin` API 구현.
  - (EN) Implemented `/claimPrize` API with JWT validation and simulated payout.
  - (KO) JWT 검증 및 모의 상금 지급 기능을 포함한 `/claimPrize` API 구현.
  - (EN) Implemented `/doubleUp` API with 50/50 chance logic and new ticket issuance.
  - (KO) 50/50 확률 로직과 새 티켓 발급 기능을 포함한 `/doubleUp` API 구현.
- **Full-Stack Integration:**
  - (EN) Connected frontend controls (spin, claim, double up) to their respective backend APIs.
  - (KO) 프론트엔드 컨트롤(스핀, 수령, 더블업)을 각각의 백엔드 API에 연결.
  - (EN) Implemented full game loop from betting to winning and claiming.
  - (KO) 베팅부터 당첨, 상금 수령까지의 전체 게임 루프 구현.
- **Features & Refinements:**
  - (EN) Implemented multi-language support (English, Korean) with dynamic JSON loading.
  - (KO) 동적 JSON 로딩을 통한 다국어 지원(영어, 한국어) 기능 구현.
  - (EN) Applied "Cosmic Gemstone" visual theme with dynamic starfield background and neon UI elements.
  - (KO) 동적 별 배경과 네온 UI 요소를 포함한 "Cosmic Gemstone" 시각적 테마 적용.
  - (EN) Added version display in the UI.
  - (KO) UI에 버전 정보 표시 기능 추가.