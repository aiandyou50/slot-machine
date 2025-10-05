# AI 개발 가이드라인 (AI Development Guidelines)

이 문서는 AI 어시스턴트가 "CandleSpinner" 프로젝트 개발 시 준수해야 할 핵심 가이드라인을 정의합니다.

### 1. 소프트웨어 공학 원칙 준수 (Adherence to Software Engineering Principles)
모든 코드 작성, 수정, 리팩터링 및 배포 과정은 체계적인 소프트웨어 공학 방법론에 따라 수행합니다. 코드의 품질, 유지보수성, 확장성을 최우선으로 고려합니다.

### 2. 주석 작성 규칙 (Commenting Policy)
코드의 가독성과 이해도를 높이기 위해 주석을 적극적으로 활용합니다. 모든 주석은 주요 기능 및 복잡한 로직을 설명하며, **한국어와 영어를 병기하여 작성**하는 것을 원칙으로 합니다.
- **Korean:** 이 함수는 사용자의 베팅을 처리합니다.
- **English:** This function processes the user's bet.

### 3. 버전 관리 및 릴리즈 (Versioning and Releases)
- **버전 표기:** 모든 코드 업데이트는 시맨틱 버저닝(Semantic Versioning, `MAJOR.MINOR.PATCH`) 규칙을 엄격히 따릅니다.
- **릴리즈 날짜:** 버전 업데이트 시점의 한국 표준시(KST)를 기준으로 릴리즈 날짜를 명시합니다.
- **프론트엔드 버전 표시:** 사용자가 적용된 업데이트를 명확히 인지할 수 있도록, 웹사이트 UI의 특정 위치(예: 푸터, 사이드바)에 현재 애플리케이션의 버전을 항상 표시합니다.

### 4. 변경 이력 관리 (Changelog Management)
모든 버전에 대한 변경 사항은 `CHANGELOG.md` 파일에 상세히 기록합니다. 각 항목은 소프트웨어 공학 모범 사례에 따라 다음 형식으로 작성합니다:
- `Added`: 새로운 기능 추가
- `Changed`: 기존 기능 변경
- `Fixed`: 버그 수정
- `Removed`: 기능 삭제

### 5. 로드맵 시각화 (Roadmap Visualization)
- **문서화:** `roadmap.md` 파일을 생성하여 프로젝트의 장기적인 개발 목표와 마일스톤을 명확하게 문서화합니다.
- **시각화:** `roadmap.html` 파일을 생성하여 `roadmap.md`의 내용을 시각적으로 표현합니다. 개발이 진행됨에 따라 이 웹페이지를 실시간으로 업데이트하여 사용자가 현재 개발 상황과 향후 계획을 한눈에 파악할 수 있도록 합니다.