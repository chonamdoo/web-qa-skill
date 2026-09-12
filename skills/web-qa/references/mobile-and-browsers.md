# 브라우저와 모바일 검사

브라우저·화면 매트릭스를 정하거나 실제 모바일 UI를 검사할 때 읽는다. 필수 범위·통과 판정은 [SKILL.md](../SKILL.md)의 실행 계약을 따른다. 아래 도구 구성과 viewport 값은 작성자 기본안이며 제품 지원 버전·기기·breakpoint를 조사해 구체화한다.

## 1. 엔진·브랜드·OS·실기기를 구별한다

| 대상 | 기본 실행 경로 | 표시할 증거 범위 |
|---|---|---|
| 데스크톱 Chrome | Playwright Test, 명시적 `channel: 'chrome'` | 해당 OS의 실제 설치 Chrome/버전. 기본 Chromium을 Chrome으로 부르지 않는다. |
| 데스크톱 Safari | macOS Safari + `safaridriver`/WebDriver client | 실제 macOS Safari. Playwright WebKit은 별도 엔진 회귀다. |
| Android Chrome | Android Emulator 또는 기기 + Appium UiAutomator2 + Chrome | Android OS의 모바일 브라우저·시스템 UI. emulator/physical device를 명시한다. |
| iOS Safari | iOS Simulator 또는 기기 + Appium XCUITest + Safari | iOS Safari·시스템 UI. simulator/physical device를 명시한다. |
| Explorer | 검증 가능한 격리 Windows legacy 환경 | 가용 환경이 없으면 허용된 제외. standalone IE·Edge IE mode·현대 Edge를 서로 바꾸어 표기하지 않는다. |

Playwright는 자체 패치 WebKit을 사용하며 branded Safari를 제어하지 않는다. 기기 descriptor는 user agent·viewport·touch 등의 에뮬레이션이지 iOS/Android OS가 아니다. Firefox를 추가할 때도 Playwright의 패치 Firefox와 실제 배포 Firefox의 차이를 기록한다. Edge를 추가하면 명시적 `msedge` channel 또는 검증된 동등 경로를 사용한다.

Selenium은 standalone IE 지원을 종료했으며 IEDriver의 Edge IE mode 지원은 별개다. 사용 가능한 legacy 경로의 OS/버전/모드를 확인하고 미지원 스택 설치를 기본값으로 강요하지 않는다. 제품 실패를 보고 난 뒤 ‘환경 없음’으로 재분류해 제외하지 않는다.

## 2. 도구 준비와 격리

사용 가능한 도구를 먼저 조사한다. Mac에서는 Xcode 선택 경로·설치 runtime/Simulator 목록, Android SDK·AVD·Chrome 가용성, Appium과 각 driver의 설치 버전·요구 Node/JDK/Xcode, Safari 자동화 준비를 확인한다. 명령이 PATH에 없으면 프로젝트 설정과 SDK 위치를 확인한 뒤 미설치 여부를 판단한다.

설치된 버전의 도움말/공식 문서에 맞춰 session capabilities를 구성한다. 대표 구분은 iOS `platformName: iOS`, `appium:automationName: XCUITest`, `browserName: safari`와 Android `platformName: Android`, `appium:automationName: UiAutomator2`, `browserName: chrome`이다. 정확한 기기 ID·OS·driver 호환성을 별도로 정한다. 존재하지 않는 버전/UDID를 예시에서 복사하지 않는다.

- 웹 요소는 web context, 키보드·시스템 뒤로가기·브라우저 툴바 등은 native context와 해당 driver 명령으로 조작한다. 전환 후 현재 context와 관측 대상을 확인한다.
- 실제 iPhone의 WebDriverAgent 서명·기기 신뢰/Developer Mode 등은 Simulator와 별도 준비다. 권한이나 developer 계정이 준비됐다고 추정하지 않는다.
- 병렬 실행은 기기 ID·driver/WDA/system port·계정·seed를 분리한다. 남의 Simulator 종료·초기화, 전체 ADB 해제, 개인 기기의 설정 변경을 기본 경로로 삼지 않는다.
- 기기 부팅과 driver session 생성 후 브라우저에서 앱을 열어야 실행 준비를 확인한 것이다. missing SDK/driver/기기는 BLOCKED이며 viewport 에뮬레이션으로 그 결과를 채우지 않는다.

## 3. 화면 크기와 환경 조합

지원 가능한 `OS + browser/version + device/runtime + viewport/DPR + orientation` tuple을 만든다. Android Safari처럼 존재하지 않는 조합은 만들지 않는다. 역할·데이터 상태와 플랫폼 UI 상태는 해당 시나리오의 적용 조건으로 붙인다. 적용 제외는 실패를 보기 전에 근거를 남긴다.

제품 기준이 없을 때의 **CSS viewport 시작안**:

| 구분 | width × height |
|---|---|
| 휴대폰 | 360×800, 390×844, 412×915 |
| 태블릿 | 768×1024, 820×1180 |
| 데스크톱 | 1024×768, 1280×800, 1440×900, 1920×1080 |

코드/CSS에서 찾은 breakpoint `b`의 `b-1`, `b`, `b+1`과 세로↔가로 전환도 검사한다. 화면 확대·글자 크기 설정은 제품 지원 범위와 실제 브라우저 반영 여부를 확인한다. 제안값을 모든 실기기의 화면 크기나 하드웨어 pixel 수라고 부르지 않는다.

- Playwright의 빠른 레이아웃 검사와 실제 OS 기기 검사를 따로 기록한다. 실제 기기에서는 가능한 프로필을 선택하고 측정값을 사용한다.
- `innerWidth/innerHeight`, `visualViewport.width/height/offsetTop/offsetLeft/scale`, DPR·방향을 가능한 범위에서 기록한다. 설정한 outer window 크기나 Simulator 창 확대 비율을 CSS viewport로 혼동하지 않는다.
- 브라우저 툴바/키보드/회전으로 표시 영역이 바뀌면 다시 측정한다. 요청한 조건이 재현되지 않았으면 해당 조건 PASS가 아니다.
- 같은 기능·권한·데이터 결과를 확인하되 햄버거 메뉴·native picker·글꼴 차이까지 동일 픽셀을 강요하지 않는다. visual baseline은 해당 browser/OS/device/viewport에 귀속한다.

## 4. Android·iOS 특성별 시나리오

각 플랫폼에서 UI 목록을 다시 확인하고 적용 가능한 요소에 다음 상태를 결합한다.

| 검사 축 | Android Chrome | iOS Safari |
|---|---|---|
| 시스템 영역 | 제스처/3버튼 내비게이션, 상태 바·cutout, edge-to-edge | 노치·홈 인디케이터, 네 방향 safe area·`viewport-fit` |
| 브라우저 영역 | 주소창 펼침/접힘, 스크롤 후 표시 영역 | 상단/하단 툴바 변화, 스크롤 후 표시 영역 |
| 키보드 | 열기/닫기, 입력 종류·IME/한글 조합, back으로 키보드 닫기 | 열기/닫기, 입력 종류·자동완성·한글 조합, 포커스 이동 |
| 입력·이동 | tap/swipe/scroll/확대, 시스템 back, 회전 | tap/swipe/scroll/확대, 지원되는 뒤로가기 제스처, 회전 |
| 복합 상태 | keyboard + fixed CTA/modal/bottom sheet | keyboard + fixed CTA/modal/bottom sheet + home indicator/toolbar |

필요한 검사는 **내용과 조작 대상이 가리지 않고 읽기·스크롤·포커스·탭이 가능한가**다. OS 내비게이션 바, 브라우저 툴바, 앱 bottom navigation, safe-area inset, 키보드는 다른 영역이다. `34px`/`48px` 같은 전 기기 고정값으로 판정하지 않는다. safe-area inset을 키보드 높이로 사용하지 않는다. 브라우저가 영역을 이미 제외했다면 inset 0도 정상일 수 있다.

DOM bounding rect·visual viewport·native 화면의 좌표/scale을 맞춰 관찰한다. 페이지 screenshot이나 DOM hit-test만으로 시스템 UI 가림을 증명하지 않는다. **기기 전체 화면과 실제 탭 이후 결과**를 함께 확인한다. 화면 수집이 불가능하면 그 관찰 한계를 보고한다.

키보드 검사에서는 소프트웨어 키보드의 실제 출현을 확인한다. XCUITest의 `appium:connectHardwareKeyboard: false`, `appium:forceSimulatorSoftwareKeyboardPresence: true`는 설치 driver의 동작을 확인해 사용할 수 있다. Android의 키보드 숨김 옵션/인공 IME로 입력만 성공시켜 가림 검사를 통과시키지 않는다. 자동 alert 수락·권한 자동 허용도 해당 시나리오가 검사할 분기를 지워 버리지 않게 한다.

### 도출 예시 — 발견한 제품 UI에 맞춰 구체화

하단 입력창에 포커스 → 키보드 출현 확인 → 한글 입력/validation → 필요한 정상 스크롤 또는 키보드 닫기 → 제출 버튼 실제 탭 → 요구된 화면/데이터 결과 확인. 회전·툴바 접힘·열린 모달에서 같은 사용자 목표가 가능한지 검사한다.

키보드 동안 CTA를 숨기는 것이 명시된 정상 설계라면 숨김 자체를 실패로 단정하지 않는다. 대신 사용자가 제출 경로에 정상적으로 도달할 수 있는지를 검사한다. 취소·back의 정확한 업무 결과가 불명확하면 현재 동작과 기대 결과 근거를 분리한다.

PWA 설치 모드·WebView·카메라/파일 picker가 실제 제품 표면이면 포함한다. Simulator/Emulator는 특정 OEM UI·실기기 센서·하드웨어 성능을 모두 대체하지 않는다. 그런 조건은 승인된 실기기/device cloud에서 검사하거나 미검증으로 남긴다. 자동으로 클라우드 구매·공개 터널·외부 artifact 업로드를 하지 않는다.

## 5. 실행 후 판정

계획한 각 조합에 scenario별 결과와 실제 재현된 조건을 연결한다. 필수 기기/모드가 없으면 다른 기기 성공으로 상쇄하지 않는다. 같은 build의 결과를 모으고 세션/키보드/설정 상태가 섞인 결과는 재현 조건부터 바로잡는다. 최종 통과와 증거·정리는 [SKILL.md](../SKILL.md)의 6단계를 따른다.

API/지원 사실을 확인할 링크는 [근거 문서](sources.md)의 공식 자료 목록에 있다.
