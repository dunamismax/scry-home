# MOBILE-RUNBOOK.md — Builder Mobile

Practical default playbook for React Native + Expo delivery work.

## 1) First 5 Minutes: Repo Intake
Inspect before changing code:
- `package.json`
- `app.json` / `app.config.*`
- `eas.json` if present
- navigation entrypoints
- state/query/auth setup
- test setup (`jest`, `vitest`, Detox/Maestro if present)
- native directories (`ios/`, `android/`) and whether they are generated or hand-maintained

Questions to answer immediately:
- Is this Expo managed, prebuild, or bare?
- What SDK / React Native version is in play?
- What is the current source of truth for server state, client state, and persisted state?
- What exact platforms/build profiles does this feature or bug affect?
- Is the bug JS-only, config-level, native-level, or environment-specific?

## 2) Architecture Defaults
- Prefer existing app conventions over greenfield purity.
- Keep screen containers thin and move reusable UI into focused components.
- Keep side effects near the boundary that owns them.
- Separate server state from local interaction state.
- Avoid global state for ephemeral screen concerns.
- Prefer explicit data flow over clever abstractions.
- Centralize platform-specific logic in helpers/components when possible.
- Treat offline storage, auth, and background behavior as explicit system design, not incidental code.

## 3) Expo / Dependency Rules
- Prefer `npx expo install <pkg>` for package adds/updates.
- Check Expo SDK compatibility before adding libraries with native code.
- Avoid dependency churn unless it solves the actual problem.
- If a library increases native surface area, call out rebuild/prebuild implications.
- Ask before triggering prebuilds, native project regeneration, or store-facing build actions.

## 4) UI / UX Checklist
Before calling a UI change "done," think through:
- Safe area handling
- Keyboard avoidance and input focus flow
- Loading, empty, error, offline, and retry states
- Accessibility labels/roles, contrast, and touch target size
- Reduced-motion implications for heavy animation
- Dark mode / theming if the app supports it
- Large text / dynamic type pressure on layout
- Scroll performance, list virtualization, and image sizing

## 5) Platform Difference Checklist
For anything touching device capabilities or app lifecycle, check:
- Permissions copy and timing
- iOS vs Android deep-link behavior
- Push notification foreground/background behavior
- Background task / app resume behavior
- File picker, camera, microphone, and photo-library permission nuances
- Android back behavior
- Status bar / navigation bar appearance
- Gesture conflicts and keyboard dismissal behavior

## 6) Debugging Ladder
Use the fastest cheap checks first:
1. Reproduce with exact steps.
2. Confirm platform/build/profile/environment.
3. Clear Metro cache only when the symptoms fit (`npx expo start --clear`).
4. Run lint/type/test targets relevant to the broken path.
5. Run `npx expo-doctor` for SDK/config/dependency suspicion.
6. Inspect logs/stack traces before editing broad areas.
7. Isolate whether the issue is UI state, network/auth, config, native build, or environment drift.
8. Validate the fix on the original failure path and one nearby regression path.

## 7) Verification Ladder
Minimum acceptable verification is contextual, but the default order is:
1. Lint / typecheck
2. Affected tests
3. `npx expo-doctor` when dependencies/config/native surface changed
4. Manual smoke of the changed flow on a real target environment
5. Cross-platform check when the change touches shared behavior
6. Build/export verification when app/build config changed

Record the exact evidence:
- command run
- result
- platform/device/emulator
- OS/app version if relevant
- what remains unverified

## 8) Release / Build Assumptions
- Never imply App Store / Play Store / EAS readiness without an actual build or explicit evidence.
- OTA-safe is not the same as native-build-safe.
- Config/plugin/icon/splash/asset/permission changes often need broader verification than UI-only changes.
- A fix proven in Expo Go is not automatically proven in a dev build or production binary.

## 9) Communication Standard
Keep updates concise and structured:
- Decision
- Evidence
- Risks/Blockers
- Next Action

Prefer concrete statements like:
- "Verified on iOS simulator, not yet on Android."
- "Typecheck passed; no device validation performed."
- "This likely needs a native rebuild because the dependency adds native code."

Avoid vague status like:
- "Should be fixed"
- "Probably works on both"
- "Looks good"
