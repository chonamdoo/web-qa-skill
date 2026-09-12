# web-qa

URL·개발 코드·간단한 기능 설명을 받아 **실제 UI를 탐색하고, 사용자 행동을 테스트 시나리오로 작성한 뒤, 환경별 E2E 실행과 결과 보고까지 진행하도록 안내하는 AI 에이전트 스킬**입니다.

독립적인 테스트 실행 프로그램이 아니라 브라우저·파일·명령 실행 도구를 가진 coding agent용 절차입니다. 사용자가 테스트 케이스나 selector를 미리 작성할 필요 없이, 에이전트가 UI 요소와 상태를 조사하고 시나리오·테스트·증거를 연결하도록 설계했습니다.

## Install with npx (recommended)

**Node.js, npm(`npx` 포함), Git**이 필요합니다. [skills CLI](https://github.com/vercel-labs/skills)가 이 GitHub 저장소에서 스킬을 직접 설치하므로, `web-qa`용 별도 npm 패키지나 Homebrew 설치는 필요하지 않습니다.

아래 설치 범위 중 **하나를 선택**하세요. 설치 과정에서 사용할 에이전트를 선택할 수 있습니다.

### Project — 현재 프로젝트에서 사용

스킬을 사용할 **프로젝트의 루트**에서 실행합니다.

```sh
npx skills@latest add chonamdoo/web_qa_skill --skill web-qa
```

### Global — 여러 프로젝트에서 사용

```sh
npx skills@latest add chonamdoo/web_qa_skill --skill web-qa --global
```

특정 에이전트만 지정하려면 해당 CLI의 agent ID를 사용합니다. 예를 들어 Codex의 프로젝트 범위 설치는 다음과 같습니다.

```sh
npx skills@latest add chonamdoo/web_qa_skill --skill web-qa --agent codex
```

설치 없이 저장소의 스킬 목록을 확인하려면:

```sh
npx skills@latest add chonamdoo/web_qa_skill --list
```

위 GitHub 명령은 스킬 파일이 저장소의 기본 브랜치에 게시된 뒤 사용할 수 있습니다. 로컬 소스를 확인할 때는 이 저장소 루트에서 `npx skills@latest add . --list`를 사용할 수 있습니다.

> 스킬 설치는 Playwright·SafariDriver·Appium·Android SDK·Xcode를 자동 설치하거나 앱을 배포하지 않습니다. 실제 테스트 도구와 실행 권한은 별도로 준비해야 합니다.

## 주요 기능

| 기능 | 수행 내용 |
|---|---|
| 세 가지 입력 방식 | URL에서 실제 화면 탐색, 코드에서 라우트·상태·실행 설정 조사, 짧은 설명에서 시나리오 초안 작성 |
| 실제 UI 조사 | DOM·접근성 트리·화면을 함께 확인하고 스크롤 아래, 메뉴·탭·모달·바텀시트, 오류·로딩·권한별 상태까지 조사 |
| 사용자 행동 시나리오 | 클릭·터치·입력·수정·선택·취소·제출·재시도·뒤로가기 등 발견한 행동을 정상·오류·경계·연속 흐름으로 구성 |
| 표시·조작 검사 | 텍스트·이미지·아이콘과 조작 요소의 잘림·가림·overflow, 키보드·포커스·스크롤·실제 탭 결과 확인 |
| 브라우저·화면 매트릭스 | 데스크톱 Chrome·Safari와 여러 CSS viewport, 제품 breakpoint 전후·방향 전환 검사 |
| Android·iOS 특성 | 시스템 내비게이션 영역, safe area·홈 인디케이터, 브라우저 툴바, 소프트웨어 키보드, 회전·back 동작 검사 |
| Mac localhost 연결 | iOS Simulator의 호스트 접근, Android `adb reverse`, 별도 API·인증·WebSocket 연결 점검 |
| 추적 가능한 결과 | UI 요소 → 행동 → 시나리오 → 환경별 실행 결과와 증거를 연결하고 미작성·미실행·누락 조합 표시 |

발견한 행동을 일부 smoke 테스트로 대체하지 않습니다. 다만 무한한 입력·반복·행동 순서를 모두 검증했다고 보장하지도 않습니다. 조사한 범위, 경계값 선택, 접근하지 못한 화면과 남은 작업을 보고합니다.

## 사용 예시

설치한 에이전트에 다음처럼 요청하세요. 스킬 호출·선택 UI는 호스트마다 다릅니다.

### localhost에서 실행 중인 웹앱

```text
web-qa 스킬로 http://localhost:3000을 QA해줘.
실제 UI 요소와 상태를 탐색하고 사용자 행동별 시나리오를 작성한 뒤,
데스크톱 Chrome·Safari와 Android·iOS에서 실행해줘.
하단 영역·키보드·회전 문제와 미실행 항목도 보고해줘.
```

### 개발 코드가 있는 프로젝트

```text
web-qa 스킬로 이 프로젝트의 실행 방법을 찾아 앱을 준비하고,
실제 UI를 확인해 시나리오와 E2E 테스트를 작성·실행해줘.
기존 테스트 도구와 프로젝트의 실행 규칙을 따라줘.
```

### 설명만 있는 기능

```text
web-qa 스킬로 이벤트 참가 신청 화면의 QA 시나리오를 작성해줘.
정원은 4명이고, 같은 사람의 중복 신청은 금지해.
취소를 확정하면 자리가 하나 늘어나야 해. 아직 실행할 앱은 없어.
```

설명만 있고 실행할 앱이 없다면 **시나리오 초안까지만 작성**하고, 실제 UI 관찰과 E2E는 미실행으로 남깁니다. 현재 앱의 관측 결과와 요구사항의 기대 결과도 구분합니다.

## 실제 테스트에 필요한 환경

기존 프로젝트의 테스트 도구를 우선 사용하며, 신규 구성의 기본 경로는 다음과 같습니다.

| 대상 | 기본 경로 |
|---|---|
| 데스크톱 Chrome | Playwright Test와 실제 Chrome channel |
| 데스크톱 Safari | macOS Safari + `safaridriver`/WebDriver |
| Android Chrome | Android Emulator 또는 기기 + Appium UiAutomator2 |
| iOS Safari | iOS Simulator 또는 기기 + Appium XCUITest |
| Internet Explorer | 가용한 legacy 환경이 있을 때 검사. 환경이 없으면 사유와 함께 제외 |

**Playwright WebKit은 실제 Safari 검증을, 모바일 viewport 설정은 Android·iOS OS 검증을 대신하지 않습니다.** Simulator/Emulator 결과와 실기기 결과도 구분합니다. 브라우저·OS·기기·driver의 구체적인 버전은 대상 프로젝트와 설치 환경에서 확인합니다.

- 테스트 계정·합성 데이터·허용된 작업 공간을 준비합니다. 코드 실행은 프로젝트의 worktree·build/test 규칙을 따릅니다.
- 결제·발송·게시·실제 데이터 변경·외부 전송은 명시적으로 허용된 범위에서만 진행합니다.
- cloud 기기·공개 터널·추가 도구 설치는 자동으로 허용되지 않습니다.
- Chrome·Safari·Android·iOS의 필수 실행을 완료하지 못하면 전체 QA 통과로 표시하지 않습니다. Explorer의 환경 부재 예외를 다른 대상에 확대하지 않습니다.

자세한 준비 절차는 [브라우저·모바일 검사](skills/web-qa/references/mobile-and-browsers.md)와 [localhost 연결](skills/web-qa/references/localhost.md)을 참고하세요.

## 산출물과 판정

에이전트는 기존 프로젝트 형식에 맞춰 UI 요소·행동 목록, 시나리오, 실행 가능한 테스트, 환경별 결과, 재현 단계와 화면·로그 등의 증거를 작성합니다.

결과는 `PASS`, `FAIL`, `FLAKY`, `SKIPPED`, `BLOCKED`, `NOT_RUN`을 구분합니다. 테스트 코드를 생성했다는 사실, 클릭 명령 성공, 마지막 재시도 성공만으로 전체 통과를 선언하지 않습니다. 제품 결함·환경 문제·정보 부족·승인된 제외를 분리합니다.

## 저장소 구성

```text
skills/web-qa/
├── SKILL.md
└── references/
    ├── mobile-and-browsers.md
    ├── localhost.md
    └── sources.md
```

- [SKILL.md](skills/web-qa/SKILL.md): 공통 실행 절차와 완료 조건
- [sources.md](skills/web-qa/references/sources.md): 사용자 요구, 작성자가 도출한 기본안, 공식 기술 근거와 적용 한계

## 검증 범위

스킬 frontmatter·내부 참조·패키지 경계를 검사했고, 별도 실행자에게 합성 입력을 제공해 **설명 기반 시나리오 작성**과 **실행 기록의 실패·누락 판정**을 확인했습니다.

로컬 저장소를 대상으로 실제 `skills` CLI의 `add … --list`를 실행해 `web-qa` 한 개가 검색되는 것도 확인했습니다. 이 목록 조회는 스킬 설치나 원격 저장소 게시 검증이 아닙니다.

이는 실제 브라우저 조작·테스트 코드 실행·Appium·기기 연결·모든 호스트의 자동 스킬 발견까지 검증했다는 뜻이 아닙니다. 실제 제품에서 사용할 때 해당 도구와 환경의 동작을 확인해야 합니다.
