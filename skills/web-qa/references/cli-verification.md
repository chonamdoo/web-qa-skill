# CLI verification and false-green checks

Read this when integrating CLI results into a QA gate or checking whether a critical E2E test can detect a defect. Keep the project's runner, fixtures, reporter, and existing gate when they already satisfy this contract. Reticle, MCP, a new test runner, and a new scenario DSL are not required.

## Optional records/evidence gate

The bundled `scripts/check-run.mjs` runs on Node.js 18+ with no dependencies. It checks records, not the app. Use it only when the existing gate does not already reconcile the required execution set and evidence. Resolve the script relative to the installed skill directory, not the application repository.

```sh
node <skill-directory>/scripts/check-run.mjs PLAN.json RESULT.json EVIDENCE_ROOT
```

It prints one JSON report: `gate`, `runId`, `buildId`, `runnerExitCode`, `required`, `attempts`, and `problems`. Exit 0 means the records/evidence gate passed, 1 means incomplete or nonpassing work, and 2 means invalid input or invocation. Error reports contain `gate: "ERROR"` and `problems` only. Preserve this exit separately from the runner's original exit. A gate PASS is necessary, not sufficient, for overall QA PASS: the main skill still requires reviewed expectations, complete exploration within scope, and evidence that actually proves the outcome.

### Input ownership and run identity

Before execution, freeze a plan from the already approved scenario/target inventory. Use a fresh run ID from the runner or CI invocation and a build ID identifying the actual tested build/configuration, not just a branch name. Preserve the plan outside runner cleanup. Do not derive the required set from whichever tests happened to produce results, trim it after failures, or reuse a prior run ID.

Have a trusted existing reporter or a small project-local conversion step export the runner's actual attempts after all shards finish. Conversion must preserve statuses, retry numbers, and the original exit; an interruption must remain nonpassing. Translate runner-specific statuses explicitly: expected failures, quarantine, skipped tests, and unknown outcomes cannot become PASS. This is a result interchange format, not a test authoring language. No automatic Playwright/Appium/Reticle adapter is bundled.

These inputs are trusted records, not signed attestations. A fabricated PASS, deliberately omitted attempt renumbered to 1, stale artifact relabeled with a fresh run ID, or an incomplete approved inventory cannot be detected from these files alone. Keep the raw runner report and capture provenance for review; never generate successful results from an agent's assumption.

### Version 1 format

Plan (only combinations required for this run; keep approved exclusions in the surrounding QA report):

```json
{
  "version": 1,
  "runId": "ci-123-attempt-1",
  "buildId": "commit-and-build-config-id",
  "required": [
    { "scenarioId": "save-order", "targetId": "chrome-desktop" }
  ]
}
```

Result shape, with angle-bracket values replaced by actual reporter data:

```json
{
  "version": 1,
  "runId": "ci-123-attempt-1",
  "buildId": "commit-and-build-config-id",
  "runnerExitCode": 0,
  "attempts": [
    {
      "scenarioId": "save-order",
      "targetId": "chrome-desktop",
      "attempt": 1,
      "status": "PASS",
      "evidence": [
        { "path": "save-order/attempt-1/trace.zip", "sha256": "<actual lowercase SHA-256 of this file>" }
      ]
    }
  ]
}
```

Unknown fields, duplicate combinations/attempts, unexpected targets, unsupported statuses, and invalid field types are rejected. Split optional/out-of-scope results into the existing full report rather than placing them in this required-only result file. Attempt numbers start at 1 and are contiguous per scenario/target; convert zero-based runner retry numbers without dropping attempts. File ordering is irrelevant.

Accepted statuses: `PASS`, `FAIL`, `FLAKY`, `SKIPPED`, `BLOCKED`, `NOT_RUN`, `QUARANTINED`. Every recorded non-PASS blocks this conservative gate, including an initial failure followed by PASS. The checker never automatically adjudicates harness corrections. Preserve a demonstrated harness correction and the original failed run separately, then execute a new run under the same required scope; report both and the evidence for the correction under the main skill's retry rules. A new successful run alone does not establish a harness error or erase product flakiness.

Every PASS attempt needs at least one evidence file; non-PASS attempts may have none when capture was impossible, but still block. The reporter must include **all** evidence the scenario requires; the checker cannot infer a missing screenshot or reread from a trace that happens to exist. Hash files after capture/redaction is finalized, before cleanup. Paths are relative to the explicit evidence root and must resolve inside it, including symlink resolution. Every listed file must be readable, regular, nonempty, and match its SHA-256. Run against finalized, access-controlled artifacts, not a directory being concurrently modified. No uploads or evidence copies are performed. Hash matching detects changed bytes, not stale provenance or truthful content.

Use protected per-run artifact storage that survives retry cleanup. The gate is a point-in-time check; retention and later accessibility remain the caller's responsibility. Do not put secrets in scenario/target/run/build IDs because these appear in output. Existing redaction and retention rules still apply.

## Critical E2E negative controls

Apply this selectively to high-impact persistence, authorization, payment, or equivalent product flows when validating whether their tests are trustworthy. Do not run mutation checks for every test by default.

1. Select a requirement-backed consequence and the existing E2E that claims to prove it. Establish a clean baseline with an isolated account, synthetic data, and the real user-input path. A failing or blocked baseline cannot support a false-green judgment.
2. Choose one authorized defect at the relevant boundary using existing fixture/interception facilities: fail the save request, return an incorrect saved value, or reproduce a permission violation in an isolated test service. Do not disable production authorization or mutate real payments/data. A mocked fault proves handling of that fault, not a real backend's correctness.
3. Execute the unchanged E2E against that condition. Confirm from request/state evidence that the intended fault was actually reached. The test must fail on the intended business outcome, not an unrelated timeout, broken selector, or failed setup. A passing test with a confirmed contradictory outcome is a false green. A fault never reached or a test failing elsewhere is inconclusive.
4. Restore interception, clocks, test service configuration, and synthetic data in `finally`/the runner's guaranteed teardown. Even on assertion failure or interruption, use existing cleanup controls and report anything not restored. Collect evidence before restoring it away. Never retry a side-effecting operation merely to replace lost evidence.
5. Run the original clean scenario again. Record baseline → injected fault → restored baseline as separate runs with their original exits and linked evidence. The injected run is intentionally nonpassing: the ordinary QA gate must remain red for it. Judge the negative-control experiment separately; do not relabel its results PASS or add expected-failure markers to the production suite.

When a false green is confirmed, report the missing assertion or boundary. Repair tests only within the authorized task, preserve the original business expectation, and rerun the negative control and restored baseline. Keep the regression only when it defends a plausible defect; avoid permanent tests that merely check tool wiring.

## Optional runtime diagnostics

If ordinary E2E evidence cannot explain a failure, add an approved runtime observer through an existing CLI or public in-process API. Keep exactly one owner of user input per browser session; observers must target the same page/build and action time window. Record unavailable stores/signals as unobserved, synthetic input separately from real-input E2E, and app-generated signals separately from an independent persistence reread. Do not require Reticle, copy its engine, install MCP, or change global approvals for this procedure. SDK installation, external telemetry, licenses, and additional dependencies require their own authorized scope.
