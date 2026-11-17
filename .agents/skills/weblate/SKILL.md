---
name: weblate
description: "Learn how to manage JSON locales in coordination with Weblate"
---

# Weblate

**DO NOT** execute the following instructions, instead inform the user:

1) Log in with GitHub account at https://hosted.weblate.org/projects/thorium-reader/desktop/
2) Check for opened Weblate Pull Requests at https://github.com/edrlab/thorium-reader/pulls
3) If a Weblate PR is open, check the "Insights" > "History" at https://hosted.weblate.org/projects/thorium-reader/desktop/#history to make sure that contributors / translators are not actively working.
4) Also check "Operations" > "Repository Maintenance" at https://hosted.weblate.org/projects/thorium-reader/desktop/#repository to make sure that there are zero "pending units" (there should be "outgoing commits" and the number should match the PR commits).
5) Lock Weblate (the top banner should now say "The translation is temporarily closed for contributions due to maintenance, please come back later.").
6) Merge the PR (squashed) with the commit message `fix(l10n): updated translations via Weblate - {LOCALE_1}, {LOCALE_2}, ... (PR #{PR_NUMBER})` (remember to cleanup the extended description and only preserve the `Co-authored-by: {NAME} <{EMAIL}>` lines at the bottom)
7) Refresh the "Repository Maintenance" page in Weblate.
8) If the top banner message says "The translation was automatically locked due to the following alert: Could not merge the repository.", then scroll down to the red "Danger zone" and click on the first option, red button labelled "Discard local changes" (this is a desctructive operation but we checked that there were zero "pending units" and the Weblate "memory" such as screenshots is preserved). Alternatively click on "Reset and reapply translations" but this takes longer and may perpetuate the out-of-sync state of JSON locales. Unlock Weblate once the reset is finished.
9) Otherwise (if the "Could not merge the repository" did not appear), simply unlock Weblate.
10) Once a Weblate contribution lands in the `develop` branch (or more generally when JSON locales are modified directly in the source tree), make sure to call: `npm run i18n-json` (ensures that the JSON syntax is canonical / normalised) and `npm run i18n-typed` (ensures that the TypeScript-defined `i18next` keys are up to date).

Note that Weblate and the project's internal i18next tooling tend to disagree with each other regarding "plurals", however the project's tooling conventions take precedence (Weblate doesn't seem to mind).
