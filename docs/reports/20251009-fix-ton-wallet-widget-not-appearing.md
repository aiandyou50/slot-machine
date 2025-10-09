# 코드 진단 및 개선 계획: TON 월렛 위젯 미표시 버그 (BUG-02) 해결
# Code Diagnostics and Improvement Plan: TON Wallet Widget Not Appearing (BUG-02) Fix

- **날짜 (Date):** 2025년 10월 9일
- **작성자 (Author):** Gemini AI Agent

---

## 1. 문제점 (Problem)

- **(KO)** 웹사이트 접속은 가능하지만, 사용자가 TON 지갑을 연결하는 데 필요한 `@tonconnect/ui` 위젯(버튼)이 화면에 전혀 나타나지 않는 버그가 발생했습니다.
- **(EN)** A bug was identified where the `@tonconnect/ui` widget (button), which is required for users to connect their TON wallet, was not appearing on the screen, although the website itself was accessible.

## 2. 근거 (Rationale / Root Cause)

- **(KO)** `@tonconnect/ui` 라이브러리는 초기화 시 `manifestUrl` 파라미터에 명시된 경로에서 `tonconnect-manifest.json` 파일을 로드해야 합니다. 진단 결과, 이 필수 매니페스트 파일이 프로젝트에 존재하지 않아 라이브러리가 초기화에 실패하고 위젯을 렌더링하지 못했습니다.
- **(EN)** The `@tonconnect/ui` library requires a `tonconnect-manifest.json` file to be loaded from the path specified in the `manifestUrl` parameter during initialization. The diagnosis confirmed that this essential manifest file was missing from the project, causing the library to fail its initialization and not render the widget.

## 3. 해결 전략 (Solution Strategy)

- **(KO)** Vite의 정적 파일 처리 규칙에 따라 `public/` 디렉토리에 `tonconnect-manifest.json` 파일을 생성했습니다. 이 파일에는 `url`, `name`, `iconUrl` 등 TON Connect 명세에 필요한 필드를 포함하여, 라이브러리가 정상적으로 초기화될 수 있도록 조치했습니다.
- **(EN)** A `tonconnect-manifest.json` file was created in the `public/` directory, following Vite's static file handling rules. This file includes the fields required by the TON Connect specification, such as `url`, `name`, and `iconUrl`, allowing the library to initialize correctly.

## 4. 예상 결과 (Expected Outcome)

- **(KO)** 이제 `@tonconnect/ui` 라이브러리가 초기화에 필요한 매니페스트 파일을 성공적으로 로드할 수 있으므로, 지갑 연결 위젯이 정상적으로 화면에 표시됩니다.
- **(EN)** The wallet connection widget will now display correctly on the screen, as the `@tonconnect/ui` library can successfully load its required manifest file for initialization.
