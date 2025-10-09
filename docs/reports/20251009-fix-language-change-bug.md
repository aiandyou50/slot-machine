# 코드 진단 및 개선 계획: BUG-01 해결
# Code Diagnostics and Improvement Plan: BUG-01 Fix

- **날짜 (Date):** 2025년 10월 9일
- **작성자 (Author):** Gemini AI Agent

---

## 1. 문제점 (Problem)

- **(KO)** `PROJECT_REQUIREMENTS.md`에 명시된 `BUG-01`에 따르면, 게임 진행 중(예: 스핀 후 당첨 메시지가 표시된 상태) 언어를 변경할 경우, 현재 상태 메시지가 해당 언어로 번역되지 않고 초기 환영 메시지로 초기화되는 버그가 발생합니다.
- **(EN)** According to `BUG-01` specified in `PROJECT_REQUIREMENTS.md`, when the language is changed during gameplay (e.g., while a win message is displayed after a spin), the current status message resets to the initial welcome message instead of being translated into the selected language.

## 2. 근거 (Rationale / Root Cause)

- **(KO)** 근본 원인은 `index.html` 파일 내 `message-display` `<div>` 요소에 정적 번역을 위한 `data-i18n-key="welcome_message"` 속성이 잘못 적용되어 있었기 때문입니다. 이 요소는 게임 상태에 따라 동적으로 메시지를 표시해야 하는 영역이지만, 정적 속성으로 인해 언어 변경 시 항상 "환영 메시지"로 강제 초기화되었습니다.
- **(EN)** The root cause was the incorrect application of the `data-i18n-key="welcome_message"` attribute to the `message-display` `<div>` element in `index.html`. This element is intended for displaying dynamic messages based on game state, but the static attribute caused it to be forcibly reset to the "welcome message" whenever the language was changed.

## 3. 해결 전략 (Solution Strategy)

- **(KO)** `index.html` 파일에서 `message-display` 요소의 `data-i18n-key` 속성을 완전히 제거합니다. 이를 통해 해당 요소가 정적 번역 프로세스에서 제외되도록 하고, `src/main.js`에 이미 구현된 동적 메시지 관리 로직(`showMessage` 및 `lastMessage` 상태)에 의해서만 제어되도록 합니다.
- **(EN)** Completely remove the `data-i18n-key` attribute from the `message-display` element in `index.html`. This excludes the element from the static translation process, ensuring it is controlled solely by the dynamic message management logic already implemented in `src/main.js` (using the `showMessage` function and `lastMessage` state).

## 4. 예상 결과 (Expected Outcome)

- **(KO)** 이 수정으로 `BUG-01`이 해결될 것입니다. 이제 게임 중 언어를 변경하면, `lastMessage` 상태에 저장된 마지막 동적 메시지(예: 당첨 메시지)가 선택된 언어로 올바르게 번역되어 표시됩니다.
- **(EN)** This fix will resolve `BUG-01`. Now, when the language is changed during the game, the last dynamic message stored in the `lastMessage` state (e.g., a win message) will be correctly translated and displayed in the selected language.
