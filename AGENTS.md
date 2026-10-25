# AGENTS.md

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
