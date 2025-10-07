# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-07

### Fixed
- **배포 빌드 오류 수정 (Deployment Build Error):** Cloudflare Pages 배포 환경에서 `@tonconnect/ui` 라이브러리의 `import` 방식이 올바르지 않아 발생하던 빌드 오류를 수정했습니다. (`Default Import` -> `Named Import`)
- **설정 파일 호환성 개선 (Configuration File Compatibility):** `wrangler.toml` 파일에 `pages_build_output_dir` 속성을 추가하여 Cloudflare Pages와의 호환성을 명시적으로 개선했습니다.

## [1.0.0] - 2025-10-07

### Added
- **초기 애플리케이션 기능 구현 (Initial Application Feature Implementation):**
  - 프론트엔드 UI/UX: '랜딩 뷰', '게임 뷰', "Cosmic Gemstone" 테마 적용.
  - 지갑 연결: `@tonconnect/ui`를 사용한 TON 지갑 연결 및 뷰 전환 기능 구현.
  - 핵심 게임 흐름: 스핀, 상금 수령, 더블업 기능의 프론트엔드 및 백엔드 로직 구현.
  - 부가 기능: 다국어 지원(ko, en) 및 베팅 컨트롤 기능 구현.
- **프로젝트 초기 구조 설정 (Initial Project Structure Setup):**
  - Vite 기반의 확장 가능한 다중 페이지 아키텍처를 위한 디렉터리 및 파일 구조 설정.
  - `package.json`, `vite.config.js`, `wrangler.toml` 등 핵심 설정 파일 추가.