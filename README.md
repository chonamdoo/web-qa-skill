# web-qa

An AI agent skill that takes a URL, development code, or a brief feature description and guides the agent through **real UI exploration, user-action scenarios, environment-specific E2E execution, and evidence-based reporting**.

This is a procedure for coding agents with browser, file, and command execution tools, not a standalone test runner. Users do not need to write test cases or selectors in advance: the agent investigates UI elements and states, then connects scenarios, tests, and evidence.

## Install with npx (recommended)

**Node.js, npm (including `npx`), and Git** are required. The [skills CLI](https://github.com/vercel-labs/skills) installs the skill directly from this GitHub repository; no separate `web-qa` npm package or Homebrew installation is needed.

Choose **one** installation scope below. You can select the target agent during installation.

### Project — use in the current project

Run from the **root of the project** where you want to use the skill.

```sh
npx skills@latest add chonamdoo/web-qa-skill --skill web-qa
```

### Global — use across projects

```sh
npx skills@latest add chonamdoo/web-qa-skill --skill web-qa --global
```

To target a particular agent, use its CLI agent ID. For example, to install for Codex in the current project:

```sh
npx skills@latest add chonamdoo/web-qa-skill --skill web-qa --agent codex
```

To list skills without installing:

```sh
npx skills@latest add chonamdoo/web-qa-skill --list
```

These GitHub commands become usable after the skill files are published to the repository's default branch. To inspect local sources, run `npx skills@latest add . --list` from this repository root.

> Installing the skill does not automatically install Playwright, SafariDriver, Appium, Android SDK, or Xcode, or deploy an app. Prepare actual test tools and execution permissions separately.

## Capabilities

| Capability | Coverage |
|---|---|
| Three input paths | Explore real screens from a URL, investigate routes/state/execution configuration from code, or draft scenarios from a brief description. |
| Real UI investigation | Combine DOM, accessibility tree, and screen observations; inspect below-the-fold content, menus, tabs, modals, bottom sheets, errors, loading, and permission-dependent states. |
| User-action scenarios | Organize discovered clicks, taps, input, editing, selection, cancellation, submission, retries, and back navigation into normal, error, boundary, and sequential flows. |
| Appearance and interaction | Check text, images, icons, and controls for clipping, obstruction, overflow, keyboard access, focus, scrolling, and actual tap outcomes. |
| Browser/screen matrix | Test desktop Chrome/Safari, multiple CSS viewports, product breakpoint boundaries, and orientation changes. |
| Android/iOS behavior | Check system navigation areas, safe areas/home indicators, browser toolbars, software keyboards, rotation, and back behavior. |
| Mac localhost connections | Verify iOS Simulator host access, Android `adb reverse`, and separate API, authentication, and WebSocket connections. |
| Traceable results | Link UI elements → actions → scenarios → environment-specific results/evidence; expose unwritten, unexecuted, and missing combinations. |

A small smoke subset does not replace discovered actions. The skill also does not promise exhaustive verification of infinitely many inputs, repetitions, and action sequences. Reports disclose investigated scope, boundary selection, inaccessible screens, and remaining work.

## Usage examples

Ask the agent where the skill is installed using prompts such as these. Skill invocation and selection interfaces vary by host.

### Chrome-only execution

```text
Use web-qa to test https://example.test on desktop Chrome only.
Report the Chrome results; Safari and mobile are outside this run's scope.
```

### Web app running on localhost

```text
Use the web-qa skill to QA http://localhost:3000.
Explore real UI elements and states, write scenarios for user actions,
and execute them on desktop Chrome/Safari and Android/iOS.
Report bottom-area, keyboard, and rotation issues, plus unexecuted items.
```

### Project with development code

```text
Use the web-qa skill to find how to run this project and prepare the app.
Inspect the real UI, then write and execute scenarios and E2E tests.
Follow the project's existing test tools and execution rules.
```

### Feature described without an app

```text
Use the web-qa skill to draft QA scenarios for an event registration screen.
Capacity is four people, and duplicate registration by one person is prohibited.
Confirming cancellation must free one place. There is no runnable app yet.
```

With only a description and no runnable app, produce **scenario drafts only** and leave real UI observation and E2E unexecuted. Distinguish observed current behavior from expected results grounded in requirements.

## Environment requirements for actual testing

Prefer the project's existing test tools. Defaults for a new setup are:

| Target | Default path |
|---|---|
| Desktop Chrome | Playwright Test with the actual Chrome channel |
| Desktop Safari | macOS Safari + `safaridriver`/WebDriver |
| Android Chrome | Android Emulator or device + Appium UiAutomator2 |
| iOS Safari | iOS Simulator or device + Appium XCUITest |
| Internet Explorer | Test in an available legacy environment; otherwise exclude with a reason. |

**Playwright WebKit does not replace actual Safari testing, and mobile viewport settings do not replace Android/iOS OS testing.** Distinguish Simulator/Emulator results from physical-device results. Verify specific browser, OS, device, and driver versions in the target project and installed environment.

- Prepare test accounts, synthetic data, and an authorized workspace. Follow the project's worktree and build/test rules when executing code.
- Payments, sending, publishing, real data changes, and external transfers require an explicitly authorized scope.
- Cloud devices, public tunnels, and additional tool installation are not automatically authorized.
- Judge PASS against the explicitly requested scope, or the default matrix when none is specified. Chrome-only runs do not require Safari or mobile execution. Missing required targets still prevent PASS; tool unavailability alone does not authorize excluding them.

See [Browser and mobile testing](skills/web-qa/references/mobile-and-browsers.md) and [Localhost connections](skills/web-qa/references/localhost.md) for preparation details.

## Deliverables and judgments

Use the project's existing formats for UI element/action inventories, scenarios, executable tests, environment-specific results, reproduction steps, and screen/log evidence.

Distinguish `PASS`, `FAIL`, `FLAKY`, `SKIPPED`, `BLOCKED`, and `NOT_RUN`. Generated test code, successful click commands, or a successful final retry alone do not establish an overall pass. Separate product defects, environment issues, missing information, and approved exclusions.

## Repository structure

```text
skills/web-qa/
├── SKILL.md
└── references/
    ├── mobile-and-browsers.md
    ├── localhost.md
    └── sources.md
```

- [SKILL.md](skills/web-qa/SKILL.md): shared execution procedure and completion criteria.
- [sources.md](skills/web-qa/references/sources.md): user requirements, author-derived defaults, official technical sources, and applicability limits.

## Validation scope

The original PR #1 material at commit `38f1465` reports checks of frontmatter, internal references, and package boundaries, plus synthetic evaluations by a separate executor for **description-based scenario drafting** and **failure/gap judgments from execution records**.

That material also reports running the actual `skills` CLI `add … --list` against the local repository and finding one skill, `web-qa`. Listing is not installation or verification of publication to the remote default branch.

Those historical reports are preserved as provenance, not claimed as fresh execution of this English revision. They do not establish real browser interaction, execution of generated tests, Appium/device connectivity, or automatic discovery on every host. Verify the actual tools and environments when using the skill on a product.
