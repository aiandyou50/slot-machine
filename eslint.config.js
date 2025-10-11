// (KO) AI 에이전트 가이드라인: 2개 국어 주석 필수
// (EN) AI Agent Guideline: Bilingual comments are mandatory.

import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    // (KO) 전역적으로 무시할 패턴을 지정합니다.
    // (EN) Specify patterns to be ignored globally.
    ignores: [
      "dist/",
      ".vite/",
      "node_modules/",
      "functions/", // (KO) 백엔드 함수는 별도의 린팅 규칙을 가질 수 있으므로 제외합니다. (EN) Exclude backend functions as they may have separate linting rules.
      "docs/", // (KO) 문서 파일은 린트 대상이 아닙니다. (EN) Documentation files are not a target for linting.
      "jules-scratch/", // (KO) 임시 검증 스크립트 폴더는 제외합니다. (EN) Exclude temporary verification script folder.
    ],
  },

  // (KO) ESLint에서 권장하는 기본 규칙 세트를 적용합니다.
  // (EN) Apply the base recommended ruleset from ESLint.
  js.configs.recommended,

  // (KO) Prettier와 충돌하는 스타일 관련 ESLint 규칙을 비활성화합니다.
  // (EN) Disable ESLint rules related to style that conflict with Prettier.
  prettierConfig,

  {
    // (KO) 프로젝트의 특정 규칙과 환경을 설정합니다.
    // (EN) Configure project-specific rules and environments.
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      // (KO) console.log 사용 시 경고를 표시하지만, console.warn과 console.error는 허용합니다.
      // (EN) Warn on `console.log` but allow `console.warn` and `console.error`.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // (KO) 사용되지 않는 변수에 대해 경고합니다 (함수 인수는 제외).
      // (EN) Warn on unused variables (except for function arguments).
      'no-unused-vars': ['warn', { args: 'none' }],
    },
  },
];