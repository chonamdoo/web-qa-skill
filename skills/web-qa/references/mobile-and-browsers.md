# Browser and mobile testing

Read this when defining the browser/screen matrix or inspecting real mobile UI. Required scope and pass criteria follow the execution contract in [SKILL.md](../SKILL.md). Tool configurations and viewport values below are author-proposed defaults; refine them using the product's supported versions, devices, and breakpoints.

## 1. Distinguish engines, brands, operating systems, and physical devices

| Target | Default execution path | Evidence scope to report |
|---|---|---|
| Desktop Chrome | Playwright Test with explicit `channel: 'chrome'` | Actual installed Chrome/version on that OS. Do not call default Chromium Chrome. |
| Desktop Safari | macOS Safari + `safaridriver`/WebDriver client | Actual macOS Safari. Playwright WebKit is a separate engine regression check. |
| Android Chrome | Android Emulator or device + Appium UiAutomator2 + Chrome | Mobile browser and system UI on Android OS. Specify emulator/physical device. |
| iOS Safari | iOS Simulator or device + Appium XCUITest + Safari | iOS Safari and system UI. Specify simulator/physical device. |
| Explorer | Verifiable isolated Windows legacy environment | Permitted exclusion if no environment is available. Do not interchange standalone IE, Edge IE mode, and modern Edge labels. |

Playwright uses its own patched WebKit and does not control branded Safari. Device descriptors emulate user agent, viewport, touch, and related settings, not iOS/Android OS. When adding Firefox, record the distinction between Playwright's patched Firefox and a distributed Firefox build. When adding Edge, use an explicit `msedge` channel or a verified equivalent path.

Selenium has ended support for standalone IE; IEDriver support for Edge IE mode is separate. Verify the available legacy path's OS/version/mode, and do not force installation of unsupported stacks by default. Do not reclassify a product failure as an unavailable environment to exclude it after observing the failure.

## 2. Tool readiness and isolation

Inspect available tools first. On Mac, check the selected Xcode path, installed runtimes/Simulators, Android SDK, AVDs, Chrome availability, installed Appium/driver versions and their Node/JDK/Xcode requirements, and Safari automation readiness. If a command is not on PATH, inspect project configuration and SDK locations before declaring it uninstalled.

Configure session capabilities using help/official documentation for installed versions. Typical distinctions are iOS `platformName: iOS`, `appium:automationName: XCUITest`, `browserName: safari`, and Android `platformName: Android`, `appium:automationName: UiAutomator2`, `browserName: chrome`. Establish actual device IDs, OS versions, and driver compatibility separately. Do not copy nonexistent versions/UDIDs from examples.

- Operate web elements in web context; use native context and driver commands for keyboards, system back, browser toolbars, and similar controls. After switching, verify the current context and observation target.
- Physical iPhone WebDriverAgent signing, device trust, and Developer Mode require preparation separate from Simulator setup. Do not assume permissions or a developer account are ready.
- Isolate device IDs, driver/WDA/system ports, accounts, and seeds for parallel execution. Do not default to stopping/resetting someone else's Simulator, removing all ADB mappings, or changing personal device settings.
- Readiness requires opening the app in the browser after device boot and driver session creation. A missing SDK, driver, or device is BLOCKED; do not fill its result with viewport emulation.

## 3. Screen sizes and environment combinations

Build supported `OS + browser/version + device/runtime + viewport/DPR + orientation` tuples. Do not create nonexistent combinations such as Android Safari. Attach roles, data states, and platform UI states as scenario applicability conditions. Record evidence for exclusions before observing failures.

**Starting CSS viewports** when product criteria are absent:

| Category | width × height |
|---|---|
| Phone | 360×800, 390×844, 412×915 |
| Tablet | 768×1024, 820×1180 |
| Desktop | 1024×768, 1280×800, 1440×900, 1920×1080 |

Also test `b-1`, `b`, and `b+1` around breakpoints `b` found in code/CSS, plus portrait ↔ landscape transitions. Check product support and actual browser effects for zoom/text-size settings. Do not describe proposed values as all physical devices' screen sizes or hardware pixel counts.

- Record fast Playwright layout checks separately from actual OS device checks. On real devices, select available profiles and use measured values.
- Where possible, record `innerWidth/innerHeight`, `visualViewport.width/height/offsetTop/offsetLeft/scale`, DPR, and orientation. Do not confuse configured outer window size or Simulator window zoom with the CSS viewport.
- Remeasure when browser toolbars, keyboards, or rotation change the visible area. If the requested condition was not reproduced, it cannot be PASS.
- Verify the same functional, permission, and data outcomes without requiring pixel identity for hamburger menus, native pickers, or font differences. Scope visual baselines to the browser/OS/device/viewport.

## 4. Scenarios for Android and iOS behavior

Recheck the UI inventory on each platform and combine applicable elements with these states.

| Test dimension | Android Chrome | iOS Safari |
|---|---|---|
| System areas | Gesture/three-button navigation, status bar/cutout, edge-to-edge | Notch/home indicator, safe areas on all four sides, `viewport-fit` |
| Browser areas | Expanded/collapsed address bar, visible area after scrolling | Top/bottom toolbar changes, visible area after scrolling |
| Keyboard | Open/close, input types, IME/Korean composition, back to dismiss keyboard | Open/close, input types, autocomplete, Korean composition, focus movement |
| Input/navigation | Tap/swipe/scroll/zoom, system back, rotation | Tap/swipe/scroll/zoom, supported back gestures, rotation |
| Combined states | Keyboard + fixed CTA/modal/bottom sheet | Keyboard + fixed CTA/modal/bottom sheet + home indicator/toolbar |

The required check is **whether content and controls remain unobscured, readable, scrollable, focusable, and tappable**. OS navigation bars, browser toolbars, app bottom navigation, safe-area insets, and keyboards are different regions. Do not judge every device using fixed values such as `34px`/`48px`. Do not use safe-area insets as keyboard height. A zero inset can be valid if the browser already excludes that region.

Align coordinates/scales across DOM bounding rectangles, visual viewport, and native screen observations. Page screenshots or DOM hit-tests alone do not prove absence of system UI obstruction. Check **the full device screen and the outcome after an actual tap** together. If screen capture is unavailable, report that observation limit.

For keyboard checks, verify that the software keyboard actually appears. XCUITest's `appium:connectHardwareKeyboard: false` and `appium:forceSimulatorSoftwareKeyboardPresence: true` may be used after confirming installed-driver behavior. Do not pass obstruction checks merely by entering text with Android keyboard-hiding options or an artificial IME. Automatic alert acceptance or permission grants must not remove the branch a scenario is intended to test.

### Derived example — adapt to the discovered product UI

Focus a bottom input → confirm keyboard appearance → enter Korean text/validate → perform necessary normal scrolling or dismiss the keyboard → actually tap submit → verify the required screen/data outcome. Check whether the same user goal remains achievable after rotation, toolbar collapse, and opening a modal.

If explicitly specified behavior hides a CTA while the keyboard is open, hiding alone is not a failure. Instead, test whether users can normally reach the submission path. When exact business outcomes of cancel/back are unclear, separate current behavior from the basis for expected results.

Include installed PWA mode, WebViews, and camera/file pickers when they are actual product surfaces. Simulators/emulators do not replace every OEM UI, physical sensor, or hardware performance condition. Test such conditions on approved physical devices/device clouds or leave them unverified. Do not automatically purchase cloud access, create public tunnels, or upload artifacts externally.

## 5. Judge results after execution

Connect each planned combination to scenario results and the conditions actually reproduced. Success on another device cannot offset a missing required device/mode. Aggregate results for the same build; if session, keyboard, or setting states are mixed, correct reproduction conditions first. Follow step 6 of [SKILL.md](../SKILL.md) for final pass criteria, evidence, and cleanup.

Official references for API/support facts are listed in [Sources](sources.md).
