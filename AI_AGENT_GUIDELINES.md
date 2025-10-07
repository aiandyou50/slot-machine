# AI 코딩 에이전트 작업 가이드라인 (AI Coding Agent Work Guidelines)
1. 핵심 원칙 (Core Principles)
AI 에이전트는 모든 코드 관련 작업을 수행할 때 다음 핵심 원칙을 반드시 준수해야 합니다.
 * 실시간 문서화 (Real-time Documentation): 코드의 변경(생성, 수정, 삭제)이 발생하는 풀 리퀘스트(Pull Request) 내에는 반드시 관련된 문서의 변경사항이 함께 포함되어야 합니다. 코드와 문서는 항상 동일한 버전을 유지해야 합니다.
 * 2개 국어 작성 의무 (Bilingual Mandate): NFR-CODE-01 요구사항에 따라, 모든 문서와 코드 내 주석은 한국어와 영어를 병기하여 작성해야 합니다.
 * 요구사항 기반 작업 (Requirement-Driven Work): 모든 작업은 docs/PROJECT_REQUIREMENTS.md에 명시된 요구사항에 근거해야 하며, 아키텍처는 docs/PROJECT_ARCHITECTURE.MD를 따라야 합니다.
 * 신규 기능 추가 워크플로 (New Feature Workflow)
   * '문서 우선' 원칙 (Documentation-First Principle): 명세서에 없는 신규 기능 개발 요청 시, 코드보다 문서 작업을 우선합니다.
   * 작업 계약 및 승인 (Work Contract & Approval): AI는 요구사항, 아키텍처 등 관련 문서의 변경 초안을 먼저 사용자에게 제출하여 '작업 계약'으로 삼습니다.
   * 승인 기반 개발 (Approval-Driven Development): 사용자가 문서 변경안을 최종 승인하기 전까지 코드 개발을 시작하지 않습니다.
2. 문서 저장 위치 (Document Storage Location)
 * 본 가이드라인에서 명시하는 모든 산출물 문서는 프로젝트 최상위 경로(root)에 위치한 docs/ 폴더 내에서 생성하고 관리해야 합니다.
 * ADR(아키텍처 결정 기록)은 docs/adr/ 과 같이 하위 폴더를 만들어 체계적으로 관리합니다.
3. 필수 산출 문서 목록 및 작성 지침 (Required Documents & Instructions)
AI 에이전트는 아래 명시된 문서들을 생성하고, 코드 변경 시 실시간으로 유지보수할 책임이 있습니다.
3.1. 요구사항 명세서 (Requirements Specification)
 * 파일명 (Filename): docs/PROJECT_REQUIREMENTS.md
 * 목적 (Purpose): 프로젝트의 모든 기능적/비기능적 요구사항을 정의하는 단일 진실 공급원(Single Source of Truth)입니다.
 * 작성 지침 (Instructions):
   * 이 문서는 AI 에이전트 작업의 가장 최상위 근거가 됩니다.
   * 요구사항의 변경이나 추가가 필요한 경우, 코드 작업에 앞서 이 문서에 대한 수정 제안(PR)을 먼저 생성해야 합니다.
3.2. 소프트웨어 아키텍처 문서 (Software Architecture Document)
 * 관련 요구사항 (Related Requirement): NFR-DOC-03
 * 파일명 (Filename): docs/PROJECT_ARCHITECTURE.MD
 * 목적 (Purpose): 시스템의 구조, 구성 요소, 기술 스택 및 설계 원칙을 설명하여 모든 팀원이 일관된 이해를 갖도록 합니다.
 * 작성 지침 (Instructions):
   * 아키텍처에 영향을 주는 코드 변경 시 반드시 함께 업데이트해야 합니다.
   * 포함 내용:
     * 기술 스택 및 선택 이유 (Tech Stack & Rationale): 왜 해당 기술을 채택했는지 명시합니다.
     * 시스템 구성도 (System Diagram): 사용자, 프론트엔드, 백엔드, 블록체인 간의 상호작용을 시각적으로 표현합니다.
     * 핵심 로직 흐름 (Key Logic Flow): '스핀 요청 -> 당첨 티켓 발급 -> 상금 수령'과 같은 주요 비즈니스 로직의 흐름을 설명합니다.
     * 디렉터리 구조 (Directory Structure): 각 폴더와 파일의 역할을 정의합니다.
     * API 엔드포인트 명세 (API Endpoint Specification): 아래 내용을 포함하여 /spin, /claimPrize, /doubleUp 엔드포인트를 상세히 기술합니다.
       * Request / Response 데이터 구조 (JSON)
       * 메서드 (e.g., POST)
       * 성공 및 실패 시의 시나리오
3.3. 아키텍처 결정 기록 (Architecture Decision Records)
 * 관련 요구사항 (Related Requirement): NFR-DOC-04
 * 파일명 (Filename): docs/adr/YYYYMMDD-decision-title.md
 * 목적 (Purpose): "왜" 그렇게 설계했는지에 대한 중요한 아키텍처 결정의 배경과 결과를 기록하여 향후 기술적 혼란을 방지합니다.
 * 작성 지침 (Instructions):
   * 새로운 라이브러리 도입, 핵심 알고즘 변경 등 중요한 기술적 결정을 내릴 때마다 새로운 ADR 파일을 생성합니다.
   * 템플릿: 모든 ADR은 다음 구조를 따라야 합니다.
     * 상태 (Status): 제안됨(Proposed), 채택됨(Accepted), 기각됨(Rejected) 등
     * 배경 (Context): 어떤 문제나 요구사항 때문에 이 결정이 필요했는지 설명합니다.
     * 결정 (Decision): 최종적으로 내린 결정의 내용을 명확하게 기술합니다.
     * 결과 (Consequences): 이 결정으로 인해 발생하는 긍정적, 부정적 결과를 모두 기록합니다. (예: "새로운 라이브러리 도입으로 개발 속도는 빨라지지만, 번들 사이즈가 10% 증가함.")
3.4. 변경 이력 (Changelog)
 * 관련 요구사항 (Related Requirement): NFR-DOC-01
 * 파일명 (Filename): docs/CHANGELOG.md
 * 목적 (Purpose): 모든 버전 릴리즈에 대한 사용자 중심의 변경사항을 추적하고 기록합니다.
 * 작성 지침 (Instructions):
   * NFR-CODE-02의 시맨틱 버저닝(MAJOR.MINOR.PATCH) 규칙에 따라 버전을 관리합니다.
   * 새로운 기능을 추가하거나 버그를 수정하는 모든 PR에는 이 파일에 변경사항을 기록하는 내용이 포함되어야 합니다.
   * 형식: 'Keep a Changelog' 형식을 따르며, Added, Changed, Fixed 등의 태그를 사용합니다.
3.5. 로드맵 (Roadmap)
 * 관련 요구사항 (Related Requirement): NFR-DOC-02
 * 파일명 (Filename): docs/roadmap.md
 * 목적 (Purpose): 프로젝트의 장기적인 비전과 개발 목표를 공유합니다.
 * 작성 지침 (Instructions):
   * 주요 마일스톤이나 에픽(Epic) 단위의 기능 개발이 완료되거나 계획될 때 업데이트합니다.
   * 현재 개발 현황과 향후 계획을 시각적으로 파악할 수 있도록 유지합니다.
