## Project and scope

- Cross-platform desktop app: Windows, macOS, Linux. Keep paths, shortcuts, shell commands, and native integrations compatible with all three.
- TypeScript; Electron (Node.js and Chromium/Web APIs); React; Redux and Redux Saga; SCSS; Webpack; electron-builder. Use npm only.
- Sources: `src/`; tests: `test/`. Ignore `.flox/`, `.git/`, and `pi/` unless explicitly instructed otherwise.
- Read/write only within the project directory.
- Prefer `undefined` over `null` for optional values where existing contracts allow it.

## Dependencies and SBOM

Use Socket Security Firewall (`sfw`) for npm install/ci/update to block known malicious packages. Keep npm's minimum release age and Taze's maturity period at 2 days.

Install missing dependencies, or refresh `package-lock.json` and `node_modules/` after approved `package.json` edits, with:

```sh
sfw --verbose npm install --ignore-scripts --min-release-age=2 --allow-git=root --foreground-scripts
```

Replace `install` with `ci` to respect the existing lockfile; `install` may update it within declared version ranges. Alternatively, use the same flags with `update [PACKAGE_NAME]`.

For dependency reports, run these commands verbatim, minor first, then major:

```sh
npm exec --no --offline -- taze --maturity-period 2 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .
npm exec --no --offline -- taze major --maturity-period 2 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .
```

Summarize reports and wait for user instructions before editing `package.json` or installing updates. The user must assess upgrade safety: majors may break compatibility; minors can carry supply-chain risks. `npm audit` reports known vulnerabilities; published artifacts can be compared at `https://npmx.dev/diff/react/v/19.2.8...19.3.0` (substitute package/versions).

Never use `npx` or allow implicit tool installation. Prefer existing `npm run` scripts; otherwise verify the tool is installed locally and use `npm exec --no --offline -- <tool>`. If missing, ask the user before installing it through the dependency workflow above.

If dependency install scripts are blocked, run `npm install-scripts ls` and summarize which packages need them and why. Ask the user before running `npm install-scripts approve <package>` or `npm install-scripts deny <package>`. Approval does not override `--ignore-scripts`; obtain user authorization before rerunning an installation or rebuild with scripts enabled.

Troubleshooting:

- Full lockfile refresh: run `rm -rf ./node_modules/`, then `rm -f ./package-lock.json`, then the install command above.
- Rare cache issues: `npm cache clear --force`; normally unnecessary.

## Build and run

- Fast whole-project type check: `npm run typescript-check-GO` (TypeScript 7, Go). Use `npm run typescript-check` (TypeScript 6, JavaScript) only to compare output/performance; capabilities are at parity.
- Before committing, run `npm run build` (all bundles) and `npm run lint` (whole source tree). During development, lint may be deferred; compilation must pass.
- A full build is required after changes in `src/common`, `src/utils`, `src/typings`, `src/third_party`, or `src/resources`.
- For runtime-specific compilation, use `./node_modules/.bin/webpack-cli --config <config>` with the table below. Shared `src/renderer/common` or `src/renderer/assets` changes affect both library and reader. Ask the user if the required compilation command is unclear.
- After CSS/SCSS edits, run `npm run style-typed` to regenerate CSS class typings before compilation.
- Prefer `npm run start:dev:quick` for development/troubleshooting: debugging and Webpack renderer/CSS hot reload. Restart the app after main-process changes.
- `npm run start` uses slower production-like bundling with full type checks/lint and no fast dev server.

## Runtime boundaries and builds

Each Webpack/Electron bundle is isolated: no direct imports from another runtime, including type-only imports. Move shared contracts, types, actions, and utilities into an appropriate shared area first.

| Runtime / owned source | Entry point | Webpack config | Outputs under `dist/` |
| --- | --- | --- | --- |
| Main: `src/main.ts`, `src/main/**` | `src/main.ts` | `webpack.config.main.js` | `main.js` |
| Library: `src/renderer/library/**` | `src/renderer/library/index_library.ts` | `webpack.config.renderer-library.js` | `index_library.js`, `index_library.html` |
| Reader: `src/renderer/reader/**`, except PDF webview/shared code | `src/renderer/reader/index_reader.ts` | `webpack.config.renderer-reader.js` | `index_reader.js`, `index_reader.html` |
| PDF webview: `src/renderer/reader/pdf/webview/**` | `src/renderer/reader/pdf/webview/index_pdf.ts` | `webpack.config.renderer-pdf.js` | `index_pdf.js` |
| PDF extraction: same PDF webview source | `src/renderer/reader/pdf/webview/index_pdf_extract.ts` | `webpack.config.renderer-pdf-extract.js` | `index_pdf_extract.js` |
| Preload: entrypoint only | `src/r2-xxx-js/r2-navigator-js/electron/renderer/webview/preload.ts` | `webpack.config.preload.js` | `preload.js` |

Allowed imports beyond each runtime's owned source:

| Runtime | Allowed shared/support imports and restrictions |
| --- | --- |
| Main | `src/common/**`, `src/utils/**`, vendored/support dependencies; no `src/renderer/**`. |
| Library / reader | `src/common/**`, `src/renderer/common/**`, `src/utils/**`, assets/styles/resources, vendored/support dependencies. No main or opposite renderer imports; reader must not import PDF webview code. |
| PDF webview / extraction | PDF webview-owned code, PDF-specific shared code, vendored/support dependencies. No app React/Redux, main, or general Thorium common modules unless scope rules are intentionally changed. |
| Preload | Stay isolated from Thorium app runtimes: no main, library, reader React/Redux, or Thorium common/resources/typings unless preload scope rules are intentionally changed. Other `src/r2-xxx-js/**` files are vendored/shared dependencies, not preload-owned code. |

Shared areas:

- `src/common/**`: runtime-neutral contracts, models, IPC, Redux action/state types, utilities; no DOM, React, or Electron renderer APIs.
- `src/renderer/common/**`: renderer-only shared React, DOM, keyboard, hooks, components, Redux glue.
- `src/utils/**`: small runtime-safe generic helpers.
- `src/renderer/reader/pdf/common/**`: PDF-specific code shared by the reader PDF host and PDF webview.
- `src/r2-xxx-js/**`, `src/third_party/**`: vendored/support dependencies; never add Thorium runtime glue to bypass boundaries.
- Resources, typings, and assets/styles may be shared only where the relevant Webpack config allows.

`scripts/webpack-loader-scope-checker.js` enforces boundaries during Webpack builds. After runtime-adjacent import changes, build affected runtimes. When changing boundaries, update the relevant Webpack configs and this file together.

## Localization

- Use explicit single- or double-quoted translation keys, e.g. `__("catalog.userProfile.loans")`; `scripts/translate-scan.js` cannot discover dynamic keys.
- Before synchronization, run `node scripts/translate-scan.js <temporary-json-path>` and verify changed keys. Empty values form a key inventory, never replacement translations; English plural siblings come from `src/resources/locales/en.json`.
- Use only the required synchronization; all commands below mutate locales and run `i18n-sort`:
  - `npm run i18n-scan`: scanned keys → English; then supply meaningful English values.
  - `npm run i18n-check`: English → other locales.
  - `npm run i18n-json`: scanned keys → all locales; required after locale JSON edits for canonical tabs, key ordering, and missing keys with empty values.
- Preserve translations, plural forms, and runtime-used keys even when scanning misses them. Review `src/resources/locales/*.json` diffs for accidental deletions/overwrites.
- After locale edits, including English key changes, run `npm run i18n-typed`; review `src/typings/en.translation.d.ts` and `src/typings/en.translation-keys.d.ts`.
- Verify changed labels in English and one translated locale, including missing/empty translations. `src/common/services/translator.ts` uses English fallback and explicitly retries English for empty results; labels must resolve to meaningful text, never raw keys or blanks.
