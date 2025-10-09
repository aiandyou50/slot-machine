// (KO) AI 에이전트 가이드라인: 2개 국어 주석 필수
// (EN) AI Agent Guideline: Bilingual comments are mandatory.

module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'prettier', // (KO) Prettier와 충돌하는 ESLint 규칙을 비활성화합니다. (EN) Disables ESLint rules that conflict with Prettier.
  ],
  ignorePatterns: [
    'dist',
    '.vite',
    'node_modules',
    'functions', // (KO) 백엔드 함수는 별도의 린팅 규칙을 가질 수 있으므로 제외합니다. (EN) Exclude backend functions as they may have separate linting rules.
    'docs', // (KO) 문서 파일은 린트 대상이 아닙니다. (EN) Documentation files are not a target for linting.
    'jules-scratch', // (KO) 임시 검증 스크립트 폴더는 제외합니다. (EN) Exclude temporary verification script folder.
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }], // (KO) console.log 사용 시 경고를 표시하지만, console.warn과 console.error는 허용합니다. (EN) Warn on `console.log` but allow `console.warn` and `console.error`.
    'no-unused-vars': ['warn', { args: 'none' }], // (KO) 사용되지 않는 변수에 대해 경고합니다 (함수 인수는 제외). (EN) Warn on unused variables (except for function arguments).
  },
};
