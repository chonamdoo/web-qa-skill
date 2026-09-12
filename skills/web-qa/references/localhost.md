# Mac localhost와 모바일 연결

로컬 앱을 모바일 브라우저에 연결하거나 API·인증·HMR 연결을 진단할 때 읽는다. 포트는 프로젝트 설정에서 찾는다. 아래 `3000`과 `8080`은 설명용 예시이며 실제 설정으로 바꾼다. 서비스 실행·종료는 호스트의 supervisor와 작업 공간 규칙을 따른다.

## 연결을 선택한다

| 실행 환경 | 브라우저가 사용할 주소 | 준비 |
|---|---|---|
| Mac Chrome/Safari | 앱의 `http://localhost:3000` | 호스트 서버 readiness |
| 같은 Mac의 iOS Simulator Safari | `http://localhost:3000` | Simulator 브라우저에서 실제 접속 확인. 호스트 네트워크/포트를 공유한다. |
| 로컬 Android Emulator Chrome | `http://localhost:3000` | 해당 기기에 ADB reverse 설정 |
| Android Emulator 대안 | `http://10.0.2.2:3000` | 호스트 IPv4 loopback 별칭. origin/Host 정책 차이 확인 |
| USB 연결 Android 실기기 | `http://localhost:3000` | 승인된 USB debugging·ADB 연결과 reverse |
| 실제 iPhone/iPad | 맥의 LAN 주소 또는 승인된 개발 hostname | 기기 접근 가능한 server bind·방화벽·DNS·필요한 HTTPS 신뢰 |
| 원격 기기/클라우드 | 승인된 접근 URL | 그 기기의 localhost는 맥이 아니다. 승인된 private 연결/터널이 필요할 수 있다. |

로컬 Simulator/Emulator 때문에 기본 서버를 외부에 공개할 필요는 없다. 실제 기기 LAN/원격 경로를 사용할 때만 필요한 bind·방화벽·접근 범위를 설정한다. `0.0.0.0`은 서버 bind 주소이지 기기에 입력할 웹사이트 주소가 아니다.

## ADB reverse 절차

1. SDK 설정에서 ADB를 찾는다. PATH에 없으면 `ANDROID_HOME` 등 프로젝트 설정과 SDK의 `platform-tools/adb`를 확인한다.
2. 연결된 기기 목록에서 이 작업의 기기를 선택하고 상태를 확인한다. 여러 기기일 때 첫 기기를 임의 선택하지 않는다.
3. `reverse --list`로 기존 mapping을 확인한다. 필요한 포트만 만들고 소유권을 기록한다.
4. 기기 브라우저에서 앱·API·필요한 WebSocket 연결을 확인한다.
5. 재부팅/재연결 뒤 mapping과 실제 접근을 재확인한다. 종료 시 이번 작업이 만든 mapping만 제거한다.

명령 형식 예시 — `DEVICE_SERIAL`은 관측한 전용 테스트 기기 ID로 치환하고 ADB 실행 경로·포트를 실제 설정에 맞춘다:

```sh
adb devices -l
adb -s DEVICE_SERIAL reverse --list
adb -s DEVICE_SERIAL reverse --no-rebind tcp:3000 tcp:3000
adb -s DEVICE_SERIAL reverse --no-rebind tcp:8080 tcp:8080
```

기기의 TCP 포트를 **ADB 호스트의 TCP 포트**로 연결한다. 이 설명은 ADB 서버와 앱 서버가 같은 맥에서 실행되는 기본 구성이다. ADB가 원격 호스트에서 실행된다면 실제 경로를 먼저 확인한다.

기존 동일 mapping이 이 작업 소유이고 유효하면 재사용할 수 있다. 충돌은 먼저 조사하며 `--no-rebind` 실패를 무시하지 않는다. `adb reverse --remove-all`이나 공유 ADB 서버 종료로 해결하지 않는다. 종료 예시는 `adb -s DEVICE_SERIAL reverse --remove tcp:3000`이며 소유한 mapping에만 적용한다.

## API·인증·WebSocket

- frontend와 API가 별도 localhost 포트면 각각 연결한다. 기존 same-origin dev proxy를 쓰면 필요한 연결만 유지한다.
- HMR/WebSocket이 다른 포트나 hostname을 광고하면 그 주소도 기기에서 접근 가능한지 확인한다. 초기 HTML 로딩 성공만으로 완료하지 않는다.
- 같은 URL이어도 브라우저별 쿠키·storage·로그인 세션은 별도다. 각 환경의 테스트 계정·세션을 준비한다.
- reverse는 TCP 경로다. CORS, CSP, Host allowlist, OAuth redirect URI, Secure/SameSite 쿠키, HTTPS 인증서 신뢰를 자동 해결하지 않는다.
- `localhost`, `127.0.0.1`, `10.0.2.2`, LAN 주소를 혼용하면 host/origin·secure-context 조건이 달라질 수 있다. 로그인·API·서비스 워커 등의 실제 영향을 확인한다.
- `10.0.2.2`는 호스트의 IPv4 loopback 별칭이다. IPv6 loopback에만 bind한 서버, VPN·방화벽·proxy·인증서 문제가 있으면 현재 설정에 맞게 진단한다. 접근 불가를 보안 기능 전체 해제로 우회하지 않는다.

## 실행 전 연결 증거

순서대로 확인한다:

1. 지정한 작업 공간의 서버가 준비되고 예상 build를 제공한다.
2. **각 기기 브라우저에서** 실제 페이지와 필요한 asset이 로딩된다.
3. API·인증·필요한 WebSocket과 테스트 데이터가 해당 기기에서 동작한다.
4. 실제 URL·origin·build·기기/브라우저·연결 방식·준비 결과가 기록돼 있다.
5. 그다음 UI 목록을 만들고 시나리오를 실행한다.

호스트 `curl`만 성공, mapping 명령만 성공, 브라우저 실행만 성공한 상태는 연결 완료가 아니다. 연결 실패는 환경 `BLOCKED`이며 제품 UI `FAIL` 또는 `PASS`로 바꾸지 않는다. 실행하지 못한 필수 환경을 다른 엔진의 성공으로 대체하지 않는다.

## 근거

- [Android Emulator network addresses](https://developer.android.com/studio/run/emulator-networking-address): `10.0.2.2`와 기기 loopback의 차이.
- [ADB manual](https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/docs/user/adb.1.md): reverse·serial·no-rebind·해제 명령. 실제 설치된 `adb help`도 대조한다.
- [XCUITest capabilities](https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/): Simulator와 호스트 포트 공유. 실제 iOS 기기는 별개다.
