## Project technology stack

Thorium Desktop reader is a software application for "desktop" operating systems: Windows, MacOS, and Linux.

- Electron framework = NodeJS for the "backend" and Chromium webview APIs for the "frontend".
- TypeScript programming language (plus some occasional Javascript for utility jobs, and a minute amount of C++ for a native Windows module).
- React user interface, Adobe's React ARIA Components.
- Redux for state management, Redux Saga for side effects orchestration.
- SCSS for styling.
- Webpack as the build system and to provide a debugging / development environment.

## How to install software dependencies, SBOM (Software Bill Of Materials)

This project uses NPM (not PNPM, not Bun, not Yarn, etc.)

* Read the ["sfw" skill](./.agents/skills/sfw/SKILL.md) (Socket Security Firewall to safely install dependencies from the NPM package supply chain).
* Read the ["taze" skill](./.agents/skills/taze/SKILL.md) (Taze to check for updates and apply them selectively once approved for the package lockfile).
* Read the ["npx" skill](./.agents/skills/npx/SKILL.md) (NPM "exec" to safely run arbitrary code from the NPM registry, as part of this project's approved dependencies).

Optionally, to learn about using Flox (Nix packages) for setting up the development environment, read the ["flox" skill](./.agents/skills/flox/SKILL.md).

## How to build the software

- The command `npm run typescript-check-GO` performs fast TypeScript type-checking over the entire codebase, using the TypeScript version 7 compiler implemented in Go. Use this command to quickly check code changes.
- The command `npm run typescript-check` performs slow TypeScript type-checking over the entire codebase, using the TypeScript version 6 compiler implemented in Javascript. You do not need to use this command, use the fast one instead as there is now complete parity between the Go and Javascript capabilities. Only use the slow command if you need to compare the output or the performance timings.
- The command `npm run lint` performs linting over the entire source tree. This is a computationally expensive operation, and this is a prerequisite before committing code to the repository. However, linting is not necessary during fast programming iterations / active development of new features or bug fixes (only successful compilation is required).
- When CSS styling files are changed, the command `npm run style-typed` must be called in order to generate the TypeScript typings that are used during compilation to validate the usage of CSS classes inside TypeScript JSX / TSX.
- The command `npm run build` performs a full compilation (using Webpack) for the entire Electron codebase: main process, renderer processes and preload scripts. This is a computationally expensive operation, but it is only needed to validate the complete source tree before committing changes to the repository. The command `npm run build` must be invoked when files inside the following directories have changed: `./src/common`, `./src/utils`, `./src/typings`, `./src/third_party`, `./src/resources`.

Breakdown of scoped Webpack build commands:

- MAIN PROCESS: The command `./node_modules/.bin/webpack-cli --config webpack.config.main.js` can be used to check the compilation of **only** the source code of the Electron main process (i.e. files located inside the `./src/main` directory, and the entry point file `./src/main.ts` itself).
- PRELOAD: The command `./node_modules/.bin/webpack-cli --config webpack.config.preload.js` can be used to check the compilation of **only** the source code of the Electron webview preload script (i.e. files located inside the `./src/r2-xxx-js` directory, and more specifically the entry point file `./src/r2-xxx-js/r2-navigator-js/electron/renderer/webview/preload.ts`).
- RENDERER PROCESS LIBRARY: The command `./node_modules/.bin/webpack-cli --config webpack.config.renderer-library.js` can be used to check the compilation of **only** the source code of the "library" Electron browser window (i.e. files located inside the `./src/renderer/library` directory, more specifically the entry point file `./src/renderer/library/index_library.ts`, but also the `./src/renderer/common` and `./src/renderer/asset` folders which are shared).
- RENDERER PROCESS READER: The command `./node_modules/.bin/webpack-cli --config webpack.config.renderer-reader.js` can be used to check the compilation of **only** the source code of the "reader" Electron browser window (i.e. files located inside the `./src/renderer/reader` directory, more specifically the entry point file `./src/renderer/library/index_reader.ts`, but also the `./src/renderer/common` and `./src/renderer/asset` folders which are shared).
- RENDERER PDF: The command `./node_modules/.bin/webpack-cli --config webpack.config.pdf.js` can be used to check the compilation of **only** the source code of the PDF.js webview inside the "reader" Electron browser window (i.e. files located inside the `./src/renderer/reader/pdf/webview` directory, including more specifically the entry point file `./src/renderer/reader/pdf/webview/index_pdf.ts` itself).
- RENDERER PDF EXTRACT: The command `./node_modules/.bin/webpack-cli --config webpack.config.pdf-extract.js` can be used to check the compilation of **only** the source code of the PDF.js integration inside the "reader" Electron browser window used when importing PDF files (also files located inside the `./src/renderer/reader/pdf` directory, but more specifically the entry point file `./src/renderer/reader/pdf/webview/index_pdf_extract.ts`).

Ask the user if you have doubts about which compilation command to use.

## Localization

- Use explicit quoted translation keys, e.g. `__("catalog.userProfile.loans")`; `scripts/translate-scan.js` cannot discover dynamically constructed keys.
- Before synchronization, run `node scripts/translate-scan.js <temporary-json-path>` and verify changed keys. Its empty values are a key inventory, never replacement translations; plural siblings come from `src/resources/locales/en.json`.
- Use only the required synchronization:
  - `npm run i18n-scan`: scanned keys → English; supply meaningful English values afterward.
  - `npm run i18n-check`: English → other locales.
  - `npm run i18n-json`: scanned keys → all locales; required after locale JSON edits for canonical tab formatting, key ordering, and missing-key injection.
- These commands mutate locales and run `i18n-sort`. Preserve translations, plural forms, and runtime-used keys even when scanning misses them; review `src/resources/locales/*.json` diffs for unintended changes.
- After locale edits, especially English key changes, run `npm run i18n-typed` and review `src/typings/en.translation.d.ts` and `src/typings/en.translation-keys.d.ts`.
- Verify changed labels in English and one translated locale, including missing and empty translations. Confirm `src/common/services/translator.ts` falls back to meaningful English text, never raw keys or blank labels.

## How to run the software

- The command `npm run start:dev:quick` launches the application in debugging mode with a Webpack dev server that supports hot module reloading for the Electron renderer processes (including CSS styles). However the application must be restarted to take into account code changes in the main NodeJS process.
- The command `npm run start` launches the application in slow bundling mode (including full type checking and linting), without the fast dev server. This closely emulates a production packaged application. Recommendation: use the quick variant for most troubleshooting tasks.

## Source code organisation

The Typescript source tree is located in the `./src` directory, there are tests in a separate `./test` folder.

You must ignore the `./.flox/`, `./.git/`, `./pi/` directories inside the current working directory, unless explicitly instructed by the user to do so.

You are not allowed to read or write files outside the project folder. Your access to the filesystem is strictly limited to the current working directory.

Keep changes compatible with all three operating systems, especially filesystem paths, keyboard shortcuts, commands, and native integrations.

To learn how to organise additional project folders in order to work on features / fixes inside separate worktrees / branches, read the ["git" skill](./.agents/skills/git/SKILL.md).

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
