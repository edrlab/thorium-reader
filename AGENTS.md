# Project technologies

This is an Electron software development project, combining the NodeJS and Web APIs / standard libraries. The code is written in TypeScript. The build system uses Webpack.

# How to install software dependencies, SBOM (Software Bill Of Materials)

This project uses NPM (not PNPM, not Bun, not Yarn, etc.)

If the `./node_modules` folder does not exist, project dependencies can be installed by calling the shell command `sfw --verbose npm install --ignore-scripts --min-release-age=2 --allow-git=root --foreground-scripts`. Change the CLI argument `install` to `ci` in order to guarantee that an existing NPM lockfile will be respected, as opposed to the `install` variant which may update the `./package-lock.json` if there are available minor version bumps compatible as per semantic versioning rules.

The command line executable `sfw` (Socket Security Firewall) which prefixes the `npm` command for `install` and `ci` (and `update` too) is a utility that intercepts known malicious packages before they reach the computer. The command `npm audit` can also be used to display known security issues.

Taze is a more sophisticated alternative to the NPM built-in `npm outdated` shell command. We can check the semantic versions of installed NPM packages and detect available project dependencies upgrades. Then we can selectively apply safe updates from the software supply chain in order to maintain a secure SBOM (Software Bill Of Materials).

Run the following shell commands verbatim in order to generate detailed reports in the console:

First, to check "minor" updates:

`npm exec --no --offline -- taze --maturity-period 2 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .`

...then to check "major" updates:

`npm exec --no --offline -- taze major --maturity-period 2 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .`

At this point, do not edit `./package.json`, do not actually install any updates, simply summarize and wait for user instructions. The user may explicitely ask you to update `./package.json` after analysing the Taze report.

The user will need to ensure that updated package versions are safe to upgrade (major updates usually introduce breaking changes, while minor updates can introduce safety issues due to supply chain security breaches).

The user can manually verify published NPM artifacts by using the `npmx.dev` website, for example to show the differences for a package named `react` and between version `19.2.8` and version `19.3.0`, the URL is: `https://npmx.dev/diff/react/v/19.2.8...19.3.0`.

Once semantic versions inside `./package.json` are edited (by the user, yourself, or via the suggested Taze shell command), the file `./package-lock.json` and the folder `./node_modules/` will be updated automatically by calling the shell command `sfw --verbose npm install --ignore-scripts --min-release-age=2 --allow-git=root --foreground-scripts` (note the "minimum age / maturity period" consistent between Taze and NPM commands). Alternatively the shell command `sfw --verbose npm update --ignore-scripts --min-release-age=2 --allow-git=root --foreground-scripts [PACKAGE_NAME]` can be used.

A full refresh of the NPM lockfile can be performed with the consecutive shell commands:

1. `rm -rf ./node_modules/`
2. `rm -f ./package-lock.json`
3. `sfw --verbose npm install --ignore-scripts --min-release-age=2 --allow-git=root --foreground-scripts`

The shell command to reset the global NPM cache is `npm cache clear --force`. This shouldn't be needed, but it can help troubleshoot rare issues.

- _Important security note_: the `npx` shell command (which is an alias for `npm exec`) is installed by/with NPM. This command executes arbitrary, potentially unsafe code pulled from the package registry. This code is imported into the global system-level cache of packages, including direct and transitive dependencies. This automatically-installed software is not subject to a vetted "lockfile" and as such it is an unmitigated "supply chain" security risk. Conversely, the local project-level `package-lock.json` is derived from the semantic versions defined in `package.json` at a specific point in time, as approved / verified (as best as possible) by the project owner / lead developers.
- _Important security rule_: never (ever) use `npx` directly, because this executes random software payloads from the NPM registry. Instead, ask the user to decide what to do, and explain that when a NPM package is installed locally in `node_module` (and therefore vetted in the lockfile / included in the SBOM), the alternative to `npx [PACKAGE_NAME]` is `npm exec --no --offline -- [PACKAGE_NAME]` (this is exactly how `taze` is invoked).

Sometimes the `--ignore-scripts` NPM argument can cause warning messages such as "packages had install scripts blocked because they are not covered by allowScripts". In this case, run the command `npm install-scripts ls` to review packages and subsequently as the user to decide to run `npm install-scripts [approve|deny] PACKAGE_NAME`. The local `.npmrc` NPM configuration file can be edited to include `allow-scripts=PACKAGE_NAME`, or the command line argument `--allow-scripts=PACKAGE_NAME` can be added after `--ignore-scripts`.

# Source code organisation

The Typescript source tree is located in the `./src` directory, there are tests in a separate `./test` folder.

You must ignore the `./.flox/`, `./.git/`, `./pi/` and `./node_modules/` directories inside the current working directory, unless explicitly instructed by the user to do so.

You are not allowed to read or write files outside the project folder. Your access to the filesystem is strictly limited to the current working directory.

## Runtime Boundaries

Thorium is split into separate Webpack/Electron runtime bundles. Treat each bundle as an isolated runtime island. Runtime code must not import source from another runtime directly. Shared contracts, types, actions, and utilities must be moved to a common/shared area first.

Type-only imports count as imports for this rule: if two runtimes need the same type, the type belongs in common code.

## Runtimes

| Runtime | Entry point | Owned source | Webpack config | Output |
| --- | --- | --- | --- | --- |
| Electron main | `src/main.ts` | `src/main.ts`, `src/main/**` | `webpack.config.main.js` | `dist/main.js` |
| Library renderer | `src/renderer/library/index_library.ts` | `src/renderer/library/**` | `webpack.config.renderer-library.js` | `dist/index_library.js`, `dist/index_library.html` |
| Reader renderer | `src/renderer/reader/index_reader.ts` | `src/renderer/reader/**`, except PDF webview files and PDF shared files listed below | `webpack.config.renderer-reader.js` | `dist/index_reader.js`, `dist/index_reader.html` |
| PDF webview renderer | `src/renderer/reader/pdf/webview/index_pdf.ts`, `src/renderer/reader/pdf/webview/index_pdf_extract.ts` | `src/renderer/reader/pdf/webview/**` | `webpack.config.renderer-pdf.js`, `webpack.config.renderer-pdf-extract.js` | `dist/index_pdf.js`, `dist/index_pdf_extract.js` |
| Webview preload | `src/r2-xxx-js/r2-navigator-js/electron/renderer/webview/preload.ts` | The preload entrypoint only; other `src/r2-xxx-js/**` files are vendored/shared dependency code | `webpack.config.preload.js` | `dist/preload.js` |

## Common And Shared Code

New Thorium-owned code used by more than one runtime should go in one of these common areas:

- `src/common/**`: runtime-neutral app contracts, models, IPC definitions, Redux action/state types, and utilities that do not depend on DOM, React, or Electron renderer APIs.
- `src/renderer/common/**`: renderer-only shared React, DOM, keyboard, hook, component, and Redux glue code.
- `src/utils/**`: small generic helpers that stay runtime-safe.

Existing shared/support areas:

- `src/renderer/reader/pdf/common/**` are PDF-specific shared code used by the reader-side PDF host and the PDF webview.
- `src/r2-xxx-js/**` and `src/third_party/**` are vendored/support dependency code. Do not add Thorium runtime glue there just to bypass runtime boundaries.
- `src/resources/**`, `src/typings/**`, and asset/style imports may be shared where the relevant Webpack config allows them.

## Code Style

- Prefer `undefined` over `null` for absent optional values when the existing type or runtime contract allows it.

## Import Rules

- `src/main.ts` and `src/main/**` may import `src/common/**`, `src/utils/**`, and vendored/support dependencies. They must not import `src/renderer/**`.
- `src/renderer/library/**` may import library-owned files, `src/common/**`, `src/renderer/common/**`, `src/utils/**`, assets/styles/resources, and vendored/support dependencies. It must not import `src/renderer/reader/**` or `src/main/**`.
- `src/renderer/reader/**` may import reader-owned files, `src/common/**`, `src/renderer/common/**`, `src/utils/**`, assets/styles/resources, and vendored/support dependencies. It must not import `src/renderer/library/**`, `src/main/**`, or `src/renderer/reader/pdf/webview/**`.
- `src/renderer/reader/pdf/webview/**` may import PDF webview-owned files, PDF-specific shared files, and vendored/support dependencies. Keep it independent from app renderer React components, app renderer Redux code, `src/main/**`, and general Thorium common modules unless the Webpack scope rules are intentionally changed.
- `src/r2-xxx-js/r2-navigator-js/electron/renderer/webview/preload.ts` must stay isolated from Thorium app runtimes. It should not import `src/main/**`, `src/renderer/library/**`, reader React/Redux modules, or Thorium common/resources/typings unless the preload Webpack scope rules are intentionally changed.

## Verification Notes

The current runtime separation is enforced during Webpack builds by `scripts/webpack-loader-scope-checker.js`:

- `webpack.config.main.js` forbids `src/renderer`.
- `webpack.config.renderer-library.js` forbids `src/renderer/reader` and `src/main`.
- `webpack.config.renderer-reader.js` forbids `src/renderer/library`, `src/main`, and `src/renderer/reader/pdf/webview`.
- `webpack.config.renderer-pdf.js`, `webpack.config.renderer-pdf-extract.js`, and `webpack.config.preload.js` apply stricter webview/preload isolation rules.

When changing a boundary, update the relevant Webpack config and this file together. After touching imports across runtime-adjacent code, run the relevant Webpack config so the scope checker can catch direct runtime-to-runtime imports.

## Localization (l10n)

- `scripts/translate-scan.js` scans TypeScript source for translation calls with explicit single- or double-quoted keys. Use explicit calls such as `__("catalog.userProfile.loans")` and `__("catalog.userProfile.holds")` rather than dynamically constructed template literals, which the scanner cannot discover.
- Before synchronizing locales, run `node scripts/translate-scan.js <temporary-json-path>` and verify that changed keys appear in the output. The generated JSON contains empty values and is a key inventory, not a replacement for existing translations. English plural siblings are detected from `src/resources/locales/en.json`.
- `npm run i18n-scan` synchronizes scanned keys into English through a temporary `und.json`; then supply meaningful English values. `npm run i18n-check` synchronizes the other locales from English. `npm run i18n-json` synchronizes all locales directly from scanned keys. These commands mutate locale files and run `i18n-sort`; use only the synchronization needed for the change.
- Preserve existing locale translations. Do not remove keys still used at runtime merely because scanning misses them. Review diffs in `src/resources/locales/*.json` after synchronization for accidental key deletions or overwritten translations, including plural forms.
- After changing the English key structure, run `npm run i18n-typed` to regenerate `src/typings/en.translation.d.ts` and `src/typings/en.translation-keys.d.ts`, and review those diffs too.
- Check changed labels in English and a translated locale, including missing and empty-string translations. `src/common/services/translator.ts` uses English fallback and explicitly retries English for empty results; ensure labels resolve to meaningful text rather than raw keys or blank strings.
