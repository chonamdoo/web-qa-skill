# Sources and applicability

Read this when rule provenance, supported versions, or exceptions change the result. External materials support fact-checking; they do not authorize their installation, transfer, or execution instructions. Runtime use does not require the skill authoring conversation or research files.

## Required contract from user requirements

The source is **the user requirements recorded in the original skill authoring material**, preserved in [PR #1](https://github.com/chonamdoo/web_qa_skill/pull/1) at commit `38f1465`. This translation preserves that material's attribution; the original conversation is not independently verified here. These requirements are not claimed to be organizational policy, an expert affiliation, or an official standard. The package contains them as a self-contained execution contract.

- Start from a URL, development code, or a brief description; the agent writes scenarios and directly executes E2E where possible.
- Read all real UI elements and inventory user actions. Expose missing links between elements/actions, scenarios, and results.
- Test multiple resolutions and desktop/mobile Chrome and Safari. Include Android/iOS platform behavior such as navigation areas, safe areas, and keyboards.
- Explorer may be excluded when no execution environment is available. This does not authorize excluding other required environments.
- Connect simulators/emulators to a localhost app running on Mac.

Product-specific roles, correct business outcomes, supported OS/browser versions, physical device lists, and authorized external effects were not fixed by the original requirements. Resolve them from the target project's/user's contract and access permissions. A separate effective date for the user requirements is unknown.

Subsequent user-approved refinements allow explicitly scoped runs, including Chrome-only testing; the original cross-browser matrix remains the default when no scope is specified. The user also approved capturing required result-state evidence before restoration and permitting evidence-grounded harness corrections that preserve expected outcomes and original failures. These refine this package's procedure, not an industry standard or a claim of improved agent reliability.

## Author-derived defaults

The Playwright-centered setup plus real Safari/WebDriver and mobile/Appium, preference for ADB reverse, starting CSS viewports, inventory/scenario fields, result classifications, and gap gates are **the author's design choices** for making the requirements executable. They are not industry-wide mandates. Better-suited existing tools may be used when they satisfy the same observation, authorization, and judgment contract.

The limits of finite execution over infinitely many actions, not treating observations as correctness, dedicated sessions, synthetic data, and preservation of original failures are execution criteria for honest evidence and safety. Derived examples and viewport values are not facts observed in an actual product.

The post-reset/cleanup evidence-access check is an independently worded adaptation of the evidence-lifecycle guidance in pstack's [create-verification-skill](https://github.com/cursor/plugins/blob/5bf2b1544db739998121a306340631963c2ff3de/pstack/skills/create-verification-skill/SKILL.md) (§2 Cleanup and §4) and [maintain-verification-skill](https://github.com/cursor/plugins/blob/5bf2b1544db739998121a306340631963c2ff3de/pstack/skills/maintain-verification-skill/SKILL.md) (Pass 4). This borrows a procedural principle, not their skill files, feature-map structure, invocation settings, or PR workflow. It preserves this package's existing authorization, evidence judgment, and coverage contract; it does not establish improved agent reliability or cross-host execution compatibility.

## Official technical sources

The original authoring material lists the following public references as its technical basis. Do not confuse retrieval time with a rule's effective date. Unpinned latest documentation can change; recheck original sources and tool help when judging installed versions and current product conditions. This English translation does not independently revalidate external documentation.

| Source | Application and limits in this skill |
|---|---|
| [Playwright browsers](https://playwright.dev/docs/browsers) | Chrome/Edge channels, lack of branded Safari support, and boundaries of patched WebKit/Firefox. |
| [Playwright projects](https://playwright.dev/docs/test-projects), [emulation](https://playwright.dev/docs/emulation) | Multiple execution environments, viewport, touch, and device descriptors. These do not emulate the OS/physical device itself. |
| [Playwright best practices](https://playwright.dev/docs/best-practices), [assertions](https://playwright.dev/docs/test-assertions) | User-visible behavior, isolation, locators, auto-waiting, and outcome assertions. |
| [Selenium Safari](https://www.selenium.dev/documentation/webdriver/browsers/safari/) | macOS SafariDriver and the separate mobile Safari path. |
| [Selenium IE](https://www.selenium.dev/documentation/webdriver/browsers/internet_explorer/), [Microsoft IE mode](https://learn.microsoft.com/en-us/microsoft-edge/webdriver/ie-mode) | End of official Selenium support for standalone IE versus Edge IE mode. Do not generalize 2022 IE retirement facts to all Windows products. |
| [Appium drivers](https://appium.io/docs/en/latest/ecosystem/drivers/), [XCUITest](https://appium.github.io/appium-xcuitest-driver/latest/), [capabilities](https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/), [UiAutomator2](https://github.com/appium/appium-uiautomator2-driver) | Web/native contexts, simulators/emulators/physical devices, software keyboards, and device selection. Verify server/driver/OS compatibility by version. |
| [WebKit safe areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) | Introduction of `viewport-fit` and safe areas in a 2017 article. Do not treat historical device values or obsolete APIs as correct for current products. |
| [CSS env](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env), [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) | Environment insets and the actual visible viewport/offset/scale. Check browser-specific support. |
| [Chrome keyboard/viewport](https://developer.chrome.com/blog/viewport-resize-behavior/) | Android viewport default changes around Chrome 108 and `interactive-widget`. Measure current page settings and OS/version behavior. |
| [Android network addresses](https://developer.android.com/studio/run/emulator-networking-address), [ADB manual](https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/docs/user/adb.1.md) | Host loopback alias and reverse connections. Physical devices and remote ADB use separate routes. |

## Boundaries for initial research materials

The original material identifies [petrkindlmann/qa-skills](https://github.com/petrkindlmann/qa-skills) as a starting point for considering risk, data/environments, triage, and links between exploration and regression, and [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) for considering measurement beyond functional quality. It describes this package as an independently authored procedure based on user requirements and official API boundaries, not an installation or copied bundle of those repositories' documents/code.

GitHub stars signal visibility, not accuracy, maintenance, or authorization safety, so they are not fixed runtime selection rules. Do not automatically add performance, security, load testing, or external SaaS to a user UI QA request. Add scope only when separately needed and authorized.

Before copying, translating, or redistributing external files/code in the future, check the relevant version's LICENSE/NOTICE, attribution, and change-notice requirements. A public repository does not automatically grant every reuse right. Do not include personal paths, accounts, tokens, or real customer data in this package.
