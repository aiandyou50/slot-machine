# CandleSpinner 개발 로드맵

이 문서는 CandleSpinner 프로젝트의 개발 계획과 마일스톤을 정의합니다.

## v2.2: Lucky Gemstone Slot 업데이트

- **목표:** 기존 단일 라인 슬롯머신을 5릴, 3행, 20 페이라인의 'Lucky Gemstone Slot' 규칙을 따르는 동적인 비디오 슬롯으로 전면 개편합니다.
- **상태:** `진행 중 (In Progress)`

### 주요 마일스톤

1.  **[완료] 프로젝트 문서 및 환경 설정 (Project Scaffolding)**
    -   `AI_rule.md` 가이드라인 수립
    -   `roadmap.md`, `roadmap.html` 생성
    -   `CHANGELOG.md` 버전 업데이트

2.  **[진행 중] 백엔드 핵심 로직 구현 (Backend Core Logic)**
    -   5릴, 3행, 20 페이라인 구조 구현
    -   새로운 심볼 및 배당률 적용
    -   Wild, Scatter, 잭팟 로직 구현

3.  **[예정] 프론트엔드 UI/UX 변경 (Frontend UI/UX Rework)**
    -   릴 그리드를 5x3으로 확장
    -   보석 테마 디자인 적용
    -   UI에 앱 버전 표시

4.  **[예정] 프론트엔드 로직 연결 (Frontend Logic Integration)**
    -   5릴 스핀 애니메이션 구현
    -   백엔드 응답 처리 로직 수정

5.  **[예정] 고급 기능 구현 (Advanced Features)**
    -   프리스핀 보너스 (3x 멀티플라이어, 리트리거)
    -   더블업 미니게임

6.  **[예정] 테스트 및 안정화 (Testing & Stabilization)**
    -   단위 및 통합 테스트
    -   RTP(Return to Player) 시뮬레이션 및 밸런스 조정

7.  **[예정] v2.2.0 정식 릴리즈 (Official Release)**
    -   최종 검토 및 배포