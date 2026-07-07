# Development Guidelines — Moment Keeper

*This document is the standing reference for all development on this project. Any AI coding agent (Cursor, etc.) working on this repo should read and follow this before generating code, and should re-check it when a task touches an area it governs.*

## 1. Guiding Principles (read first)
- **Minimal, surgical changes.** When implementing a feature or fix, change only what's necessary. Do not refactor unrelated code, rename things "while you're in there," or restructure files as a side effect of an unrelated task.
- **No invented scope.** Do not add features, abstractions, config options, or "nice to haves" that weren't asked for. If something seems missing, flag it and ask — don't silently build it.
- **Prefer boring, proven solutions.** Use well-established libraries and patterns over clever or novel ones. This is a solo-maintained project — cleverness is a liability, not a virtue.
- **Every change should be explainable in one sentence.** If a change can't be summarized simply, it's probably doing too much.
- **Working software over exhaustive upfront design.** Build the smallest working version of a feature first, verify it works, then extend — don't over-engineer for hypothetical future needs.

## 2. Documentation Standards
- **README.md** at the repo root must always reflect current setup steps (install, run locally, environment variables, deploy). Update it in the same PR/commit as any change that affects setup or usage.
- **Inline comments**: only where the *why* isn't obvious from the code itself. Don't narrate what the code obviously does.
- **API/data model docs**: any change to the data model (new field, new table, changed relationship) must be reflected in a `/docs/data-model.md` file — this is the source of truth for entities and their fields.
- **Decision log**: significant technical decisions (e.g., choice of library, architecture change) get a short entry in `/docs/decisions.md` — date, decision, one-line reasoning. This prevents relitigating settled questions.
- Documentation updates are **part of the task**, not an afterthought — a task isn't done until relevant docs are updated.

## 3. Testing Standards
- Every new feature ships with tests covering its core behavior — not exhaustive edge cases for MVP, but the main happy path plus obvious failure cases.
- Every bug fix includes a test that would have caught the bug, where practical.
- Tests must be **kept in sync** with code changes — if a change breaks or invalidates a test, update the test in the same change, don't leave it failing or delete it without replacement.
- Before considering a task complete: existing test suite must pass, not just the new tests.
- Test types to maintain as the project grows:
  - Unit tests for core logic (data validation, tagging, search filtering, etc.)
  - Integration tests for key flows (create a moment → appears in timeline → is searchable)
  - Manual test checklist for UI flows until E2E test automation is worth the investment (not required at MVP stage)

## 4. Change Management / AI Agent Behavior
- **Small, reviewable increments.** Prefer several small, focused changes over one large one. Each change should map to one issue/story.
- **No unrequested back-and-forth churn.** Don't repeatedly rewrite the same code across iterations without a clear reason tied to a specific requirement or bug. If revisiting previous work, state clearly why.
- **Ask before large structural changes.** Changing folder structure, renaming core modules, switching libraries, or altering the data model requires explicit confirmation — these are not to be done opportunistically.
- **Show, don't assume.** When a request is ambiguous, state the assumption being made and proceed with the smallest reasonable interpretation, rather than guessing at a bigger scope.
- **No dead code.** Don't leave commented-out code, unused functions, or placeholder stubs in the codebase. If something's not ready, it doesn't get merged.

## 5. Repository Structure
Keep the structure predictable and shallow — a solo maintainer should be able to find anything within a few seconds. There should be one clearly designated location each for: UI components, routes/screens, shared utilities and API clients, global styles/theme, documentation (including the data model and decision log described above), and tests (organized by unit vs. integration). A README and an up-to-date `.env.example` belong at the repo root.

- One clear place for each type of thing — no duplicate or competing folders for the same purpose.
- `.env.example` must always list every environment variable the app needs, kept up to date.
- No secrets, API keys, or credentials ever committed — environment variables only.

## 6. Package & Dependency Management
Outdated or incompatible packages are one of the most common sources of wasted time in AI-assisted development — guard against this explicitly:
- Before adding any new package, verify it is a currently maintained, actively used library (not deprecated or abandoned) and check that its version is compatible with the existing dependencies already in the project (framework version, other libraries it interacts with).
- Always install the latest stable version of a package unless there's a specific, stated reason to pin an older one (e.g., a known breaking change or compatibility requirement) — and if pinning, note the reason in a comment or in `/docs/decisions.md`.
- Avoid adding a new package for something a currently installed dependency (or a few lines of code) can already handle. Every new dependency is a future maintenance cost for a solo maintainer.
- After adding or updating packages, confirm the app still builds and the existing test suite still passes before considering the change complete — dependency changes are a common source of silent breakage.
- Keep a lockfile (`package-lock.json`, `yarn.lock`, or equivalent) committed to the repo at all times so installs are reproducible and not subject to drift between environments.
- Periodically (not on every task) check for outdated dependencies and update them deliberately in their own change, rather than bundling dependency bumps into unrelated feature work.

## 7. Git & Commit Practices
- Small, atomic commits with clear messages describing *what* and *why*.
- One feature/fix per branch and PR — avoid bundling unrelated changes together.
- Commit messages should be specific: `Add tag filtering to timeline search` not `updates` or `fixes`.

## 8. CI/CD (introduce once a working skeleton exists)
Once the MVP skeleton (basic app structure + at least one working feature end-to-end) is in place, add:
- **Automated test run on every push/PR** — block merging if tests fail.
- **Linting/formatting checks** (e.g., ESLint + Prettier) run automatically — consistent code style without manual nitpicking.
- **Automated deploy to a staging environment** on merge to main, before promoting to production.
- Keep the pipeline simple at first — test + lint + deploy. Add complexity (e.g., preview environments, automated E2E tests) only when it earns its keep.

## 9. Definition of Done (per feature/issue)
A task is not complete until:
- [ ] Code implements only what the issue describes — nothing extra
- [ ] Tests written and passing (new + existing suite)
- [ ] Relevant docs updated (README, data-model.md, decisions.md if applicable)
- [ ] No leftover dead code, TODOs without context, or commented-out blocks
- [ ] Change is reviewed/self-reviewed against this document before considered finished

## 10. Speed Without Sloppiness (AI-assisted development)
Since AI coding agents will be doing much of the implementation, speed comes from **clear, narrow instructions and short feedback loops** — not from skipping steps:
- Give the agent one clear issue/story at a time rather than broad, multi-part requests.
- Have the agent state its plan briefly before large changes, so misunderstandings are caught before code is written, not after.
- Review AI-generated diffs before accepting — especially checking for unrequested changes outside the stated task.
- If the agent's output drifts from this document, correct it immediately rather than letting the pattern continue across future tasks.
