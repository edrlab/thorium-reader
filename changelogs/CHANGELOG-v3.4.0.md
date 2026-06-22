# Thorium Reader v3.4.0

## Summary

Version `3.4.0` was released on **08 April 2026**.

This release includes the following (notable) new features, improvements and bug fixes:

* Upgraded to Electron v41, Chromium v146, NodeJS v24
* Updated translations
* Fixed accessibility issues with screen reader heading hierarchy and keyboard tab cycling order
* New feature: filtering and sorting directly in the publication "grid" mode of the library window (complements existing "table" view functionality)
* New feature: favorite OPDS feed sorting
* New feature: keyboard shortcut "export to HTML" function
* Updated feature: the LCP passphrase input text field can now show unmasked clear text
* Fixed OPDS "breadcrumb" user interface affordance
* Fixed MathML support, MathJax could not be activated
* Fixed a zoom issue with "fixed layout" / pre-paginated EPUBs
* Fix in TTS readaloud and EPUB Media Overlays, the temporary disabling of popup footnotes wasn't being restored properly, as well as the notes highlights (annotations and bookmarks)
* Fixed MacOS issue when bringing re-activating the application to bring the reader window into the foreground (over the library window)
* Fixed "customization profiles" (new feature which was broken on Windows in version 3.3.0). Reminder: this feature offers an alternative to forking the Thorium Desktop codebase, via a plugin mechanism that declaratively expresses modifications to "vanilla" Thorium Desktop reader (color themes, bundled publications and feeds, application logo, etc.)
* Fixed notification toasts which were sometimes incorrectly terminated
* Fix: LCP passphrase prompt was incorrectly displayed when imported protected publications (directly as EPUB or via LCPL) were added and non-already existing in the bookshelf (but with an existing cached valid passphrase based on provider mapping)
* Fix: network requests at application launch (i.e. telemetry ping and version check) could potentially delay the boot process and compromise the application "ready" state
* Fixed bookshelf table layour, translated column headers.
* Fix: in version 3.3.0 a more performant filesystem persistence of "notes" (i.e. annotations and bookmarks) was introduced, using a dedicated SQLite database separate from other scopes of application state. Backward compatibility with the JSON format of older versions of the application was preserved but this caused application shutdown to be very slow (sometimes even hanging and ultimately crashing). In version 3.4.0, the backward compatibility is removed and consequently users are advised to manually backup their notes when they wish to revert to an older version of Thorium Desktop reader
* Fix: under the hood, further changes to filesystem persistence (i.e. preservation of application state) were introduced in order to improve performance and hopefully address rare data loss issues experienced by some Windows users. The user interface indicates missing publications and additional logging is now available for remote troubleshooting (user-accessible text files created in Thorium Desktop's application data folder). This is groundwork for a planned future feature that will allow users to store publications inside an arbitrary folder (this might be useful to address filesystem storage limitations, notably on Windows where a large amount of ebooks / audiobooks could cause the operating system to interfere with application data and potentially corrupt Thorium Desktop's internal database)

(previous [v3.3.0 changelog](./CHANGELOG-v3.3.0.md))

## Full Change Log

Git commit diff since `3.3.0`:
https://github.com/edrlab/thorium-reader/compare/v3.3.0...v3.4.0

=> **248** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/59b0263644ebdc8f6ef3a0837abb267d70d37071) __fix(GUI):__ bookshelf table column headers translated name regression (Fixes [#3486](https://github.com/edrlab/thorium-reader/issues/3486) follows PR [#3478](https://github.com/edrlab/thorium-reader/pull/3478) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/26931a63acd384ea91d80efbd7c0eae5d53c3bf9) __fix:__ notes highlights (annotations and bookmarks) were automatically hidden "do not display" when playing EPUB Media Overlays or Text To Speech readaloud, but not restored which caused confusion, giving the impression that notes disappeared / were wiped. (Fixes [#3454](https://github.com/edrlab/thorium-reader/issues/3454) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0a3c1e61d907cbb14ed6458690ec4c9f1004ab8a) __chore(NPM):__ package dependency updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/e9348324523f8aa4a88fa141a2027c21b08c55de) __fix(l10n):__ updated translation via Weblate, Italian (PR [#3485](https://github.com/edrlab/thorium-reader/pull/3485))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b62a584e95e62f5f5e63a362c5be3e687513aa1) __fix:__ incorrect import statement [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1580cb62174057ab90e075e48692efe21b4dbc6e) __fix(l10n):__ updated translations via Weblate - Italian, Swedish (PR [#3483](https://github.com/edrlab/thorium-reader/pull/3483))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cf38f6cffc36f097178baae3924d7ed58d7717ee) __fix(OPDS):__ the state of the "resume browsing" button was incorrect after catalog removal (PR [#3465](https://github.com/edrlab/thorium-reader/pull/3465) Fixes [#3462](https://github.com/edrlab/thorium-reader/issues/3462))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4e917e9a393a675affb0b830cd3ac9ce3edb9fb4) __fix(GUI):__ table column header in the bookshelf were not refreshed when locale changed (PR [#3478](https://github.com/edrlab/thorium-reader/pull/3478))
* [(_)](https://github.com/edrlab/thorium-reader/commit/720e5399c24ea71c10c965b29a19c8353b1f3cbb) __fix(GUI):__ notification toasts were sometimes incorrectly terminated (PR [#3450](https://github.com/edrlab/thorium-reader/pull/3450) Fixes [#3448](https://github.com/edrlab/thorium-reader/issues/3448))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f6463e74e8b36e7edc5c2a5e021e1146dda2125c) __chore(dev):__ Taze check NPM updates command tweak (fallback to major when no minor found) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8724b3325561a129853129e32c2beb6cb159bfd5) __fix(store):__ initialize win.registry.reader to prevent persistence crashes on 330 state migration with no publications
* [(_)](https://github.com/edrlab/thorium-reader/commit/2dca45b805f3b01017d19d9a31c998ff2055ad53) __fix(publication-data):__ replace incorrect directory fs.access flags and handle directory creation properly
* [(_)](https://github.com/edrlab/thorium-reader/commit/1f34437eb9ad58bd2f6e5726f91c9b125951c648) __fix:__ reader can be null in persistReaderRegistry()
* [(_)](https://github.com/edrlab/thorium-reader/commit/9f3e62f671e19c0258443f466b728fca779ab421) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b4f6bcd429b6d6f1852d375a0c0ccfffca0371a) __chore(dev):__ Flox/Nix lockfile [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b7ede9ad4396bb6087c6b3535556b7bfccbca72b) __chore(dev):__ scripts that install node_modules with or without SFW Socket Security Firewall, npm audit, taze checks [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/97a65a816df14b2adb70923b38ff89950d28d74d) __chore(NPM):__ added taze locally to replace global NCU NPM Check Updates, removed postinstall script now that ts-loader is fixed [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/411e70e884245987aa096cacac99b3fa129fc15a) __chore(CI):__ remove the local NPM postinstall now that ts-loader is fixed [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a3264f40c7622fe80bb9578ed0a65c90ba4f791) __chore(dev):__ Apple Container Docker memory bump and shutdown builder to give the runner more resources [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/703868652ed4f0f083b937137d418eb8e67a5db5) __chore(dev):__ Dockerfile SFW Socket Security Firewall [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/7576151843608e5dc230b53fb5867ada8e053895) __chore(dev):__ Flox/Nix globally-installed NCU NPM Check Updates replaced with Taze in local lockfile'd node_modules via NPX --no --offline [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/60884b3e4219523b34640f01cc941d6b9f4a2d5d) __fix(l10n):__ updated translation via Weblate - Italian (PR [#3481](https://github.com/edrlab/thorium-reader/pull/3481))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b53a27cf5857bb9f8f0f3ef8af070a5297c2c45) __fix(persistence):__ Enable win registry reader state saving in runtime.state for backward compatibility with 330 during crash/reboot
* [(_)](https://github.com/edrlab/thorium-reader/commit/dbce3eb63c1902df927915ec208b44a917de022a) __fix(memory):__ fix inverted error check in applyPatch
* [(_)](https://github.com/edrlab/thorium-reader/commit/cde5cc1baaff05ef804f40116d69894a6cc2369b) __refactor:__ JSON Application State Loading Strategy (PR [#3471](https://github.com/edrlab/thorium-reader/pull/3471))
* [(_)](https://github.com/edrlab/thorium-reader/commit/76d63280e8f73e1614635baf2fb6e77cbf55519e) __fix:__ persist final global state on application shutdown (PR [#3477](https://github.com/edrlab/thorium-reader/pull/3477) & PR [#3471](https://github.com/edrlab/thorium-reader/pull/3471))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1b34b21052c30c89cbbf86c916f3189e53b8fe3b) __chore(publication/findAll):__ disable publication-storage disk listing in findAll for 3.4 release
* [(_)](https://github.com/edrlab/thorium-reader/commit/d678d4742704ca62f38e43d1152c8da87a53fb29) __chore(publication-storage):__ The publication-storage feature for storing a copy of the publication-data locator/config is disabled in version 3.4. It will be introduced in the next release.
* [(_)](https://github.com/edrlab/thorium-reader/commit/03b738ee151f72eebf0c8d813f46dcc0bccf7bf6) __refactor(publication-data):__ improve file handling, use high-level fs.promises API
* [(_)](https://github.com/edrlab/thorium-reader/commit/b1e32189813b7faf9acd59dc3cfd62fcc842e376) __fix(l10n):__ updated translations via Weblate - Italian, Finnish, Estonian (PR [#3470](https://github.com/edrlab/thorium-reader/pull/3470))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9643f6464f0feedd5d4a30833a7d964b21c09b3c) __fix(build):__ Electron Fuses via Electron Builder was failing, now flipFuses() manual call
* [(_)](https://github.com/edrlab/thorium-reader/commit/821e8741a7bbad8aae8adfeea39e956981a66479) __fix:__ not sure why CI fails...all 9 Electron Fuses are declared exhaustively
* [(_)](https://github.com/edrlab/thorium-reader/commit/3b3c84d5579f61fa5cff4a4850992cb3bac1a095) __chore(release):__ added missing Electron Fuse (exhaustive requirement, even if default value)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fcd78b8a97e846c0884385fbf58f4f7e9153cef8) __chore(NPM):__ minor package-lock update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4749d2417c02ad0659127c18e5404224904806c7) __chore(build):__ NPM 11.12.0 introduced a regression bug, now fixed
* [(_)](https://github.com/edrlab/thorium-reader/commit/27e9628ce5f1e9857e98cd15f68f3bb43aee9c43) __chore(NPM):__ Electron v41 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/30a120a596a4aaa6a2d3079c7e9804d9e3765312) __chore(dev):__ minor TypeScript config update dom.iterable is now included in dom lib [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c369c7b97e2eeb07f6f94931cabb9c3df9e0eb62) __fix(build):__ CI Windows quote syntax
* [(_)](https://github.com/edrlab/thorium-reader/commit/8e438603cc7d74928166ec379ebf434808e161e2) __chore(NPM):__ package dependencies updates, notably latest TypeScript with a few breaking changes (moving towards Go implementation which we have been aligning with for several months now, but WebPack's ts-loader needs a temporary patch until fixed upstream)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea90383308fc04e398c390b01241d847de92097e) __chore(dev):__ Flox/Nix update lockfile [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4d5c071439c9f528b67da053ab77337b25e84039) __chore:__ lint
* [(_)](https://github.com/edrlab/thorium-reader/commit/af555c1a2f5f0b87a844b5711c6568d9de10445e) __fix:__ window bounds rectangle issues (PR [#3467](https://github.com/edrlab/thorium-reader/pull/3467) Fixes [#3466](https://github.com/edrlab/thorium-reader/issues/3466))
* [(_)](https://github.com/edrlab/thorium-reader/commit/34918c222c416c3e86397869ae798a2733ecfa08) __fix(l10n):__ updated translations via Weblate - Italian (PR [#3463](https://github.com/edrlab/thorium-reader/pull/3463))
* [(_)](https://github.com/edrlab/thorium-reader/commit/65abfbcd9f379289a9311ee98b705cbcc145c385) __fix:__ reader browser window lifecycle (PR [#3464](https://github.com/edrlab/thorium-reader/pull/3464) Fixes [#3439](https://github.com/edrlab/thorium-reader/issues/3439))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dc02d5226287aa3ec051657b4f80d59f0e2be0b3) __fix(GUI):__ OPDS catalogs header,  wrapping behavior for long feed names/titles (PR [#3451](https://github.com/edrlab/thorium-reader/pull/3451) Fixes [#3442](https://github.com/edrlab/thorium-reader/issues/3442))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f803787cfb83bd241e6d7533e50e0ac4a30ea932) __fix(i18n):__ npm run i18n-scan + check + typed (Weblate is locked, as the JSON locales have breaking structural changes) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/e9eb369943bc5ea207a5f4e1bb7d9e892c5c1d03) __chore(NPM):__ Inversify major breaking changes (no impact in this project) https://inversify.io/docs/guides/migrating-from-v7/
* [(_)](https://github.com/edrlab/thorium-reader/commit/2cd2e319dea097b1f4ed6aa4e591571cca355f24) __chore(NPM):__ updated package dependencies
* [(_)](https://github.com/edrlab/thorium-reader/commit/04727e569eb8c9a1e2917e5ca5284e27bc7ea608) __chore(dev):__ Flox/Nix 1.10.0 update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/de505670b5308a91087185128eebc32d6b6f152f) __fix(l10n):__ updated translation via Weblate - Italian (PR [#3456](https://github.com/edrlab/thorium-reader/pull/3456))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3917b6a74769c079081fb70896eeafbf552803c8) __chore(dev):__ Dockerfile NPM regression bug workaround (avoid version 11.12.0) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6afb50eee9dd7fbdd499b59124d74d9781b9f5e4) __chore(NPM):__ forcing NPM version different than 11.12.0 to work around NPM CLI regression, updated package dependencies
* [(_)](https://github.com/edrlab/thorium-reader/commit/381075eba8c0e9a77e411aaa1340631d264591be) __chore(CI):__ GitHub Actions NodeJS v22 --> 24 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a1d1d387893b7c270e32950b79be1d5583e4187f) __chore(dev):__ Flox/Nix lock manifest update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b171b9c68b77c06830b26e2360dfbdade6666abd) __fix(l10n):__ updated translations via Weblate - Portuguese (Portugal), Russian (PR [#3440](https://github.com/edrlab/thorium-reader/pull/3440))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7f1bdd9abc435b320b01a0456a333f1dbfb131ed) __fix(readingFinished):__ add a debounce on the setReadingFinished readerFooter function (PR [#3446](https://github.com/edrlab/thorium-reader/pull/3446))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c648a391bb823beb380e4df5db01f78105e90d6e) __fix(pdf):__ pdfConfig peristence and hydration
* [(_)](https://github.com/edrlab/thorium-reader/commit/48337ff6000fc985591eeb86cd6c98a305884028) __fix:__ network requests at application launch (i.e. telemetry ping and version check) could potentially delay the boot process and compromise the application "ready" state (PR [#3452](https://github.com/edrlab/thorium-reader/pull/3452))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a9c768132155afe235681d7fd395f88a38fb83ac) __chore(dev):__ Flox/Nix [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/24f8706a65214354690cabf290fdebb95a062ff4) __fix(l10n):__ added in-progress translations in DEV/CI (excluded in PROD) (Fixes [#3438](https://github.com/edrlab/thorium-reader/issues/3438))
* [(_)](https://github.com/edrlab/thorium-reader/commit/af6386584fb2d67b24e09b3df67cec59df76210b) __fix(publication-delete):__ log catch exception in api/publication-delete
* [(_)](https://github.com/edrlab/thorium-reader/commit/b96066b5bfeb07383430e2ed74a673154267ad69) __chore(NPM):__ package updates, workaround for proxy-agent incompatible ESM module exports/imports syntax in package.json (for externals from main.js Webpack bundle)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e3994ffae01d6411f3037bd5a562c1a7ebbcac71) __chore(dev):__ script to list ESM modules in package dependencies [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/98efdc91429da63d90ac11faa545896f9e10b98a) __fix(LCP):__ passphrase prompt was incorrectly displayed when imported LCP-protected publications (directly of via LCPL) were added and non-already existing in the bookshelf (but with an existing cached valid passphrase based on provider mapping) ( Fixes [#3372](https://github.com/edrlab/thorium-reader/issues/3372) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c8c8701901c5c876876555fe996f385e63f52d18) __fix(dev):__ TypeScript Go implementation is stricter on thrown exceptions typing [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c5013c0e2f42324dbad0345915ed150d460a1ace) __fix(dev):__ Typescript esModuleInterop declare module vs. namespace, Slugify.d.ts [skip]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d5e86eddb7459f043a9697feac801a3f504338bf) __fix:__ apply hydration on reader config (PR [#3436](https://github.com/edrlab/thorium-reader/pull/3436))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c351ca8c8eb431f518487e743b343af083591fe5) __Revert "chore(release):__ v3.4.0 [skip ci]"
* [(_)](https://github.com/edrlab/thorium-reader/commit/48ca15d4ee34a01fda09a63965a982931db232ab) __chore(release):__ v3.4.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2a23685ac531d5f97a5256060caceae4050fa2c9) __fix(l10n):__ updated translations via Weblate - Portuguese (Portugal) (PR [#3435](https://github.com/edrlab/thorium-reader/pull/3435))
* [(_)](https://github.com/edrlab/thorium-reader/commit/698e3f3fc93addc8cb664a4da7eeb7f06e9e68be) __fix(publication-storage):__ catch any type
* [(_)](https://github.com/edrlab/thorium-reader/commit/16d6e3453bf4b913b254a821130bb2f9c38a5bfa) __fix(publication-storage):__ fixes undefined userVaultPath in removePublication
* [(_)](https://github.com/edrlab/thorium-reader/commit/b8d72faca703f73f210e077cbbc066651b0ea7d1) __Revert "chore(release):__ v3.4.0 [skip ci]"
* [(_)](https://github.com/edrlab/thorium-reader/commit/aaf8f63253cb61c57e3d8646ccc1ebe50900de1f) __chore(dev):__ fixed incorrect imports [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f57edddbf0e42ce675117ed5d9beb539aad10ac6) __chore(release):__ v3.4.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c4c77d70f223b2643deba4de8749e88d038f4526) __chore(release):__ Docker Linux NodeJS 24 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c4db8ffd3ba93bcb98b379738b3a4d5508ec825) __chore(release):__ changelog 3.4.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d14bd615cb7900788d9de0ffb823a3697d8c98b1) __fix(l10n):__ updated translation via Weblate - Lithuanian (PR [#3433](https://github.com/edrlab/thorium-reader/pull/3433))
* [(_)](https://github.com/edrlab/thorium-reader/commit/bc86b06ff205ca0ca8b206ff86d1e6365cf07415) __fix:__ the SQLite database for notes (annotations and bookmarks) was not correctly linked in automated CI builds (not dev, but packaged app with some development menu items enabled)
* [(_)](https://github.com/edrlab/thorium-reader/commit/224132337814a5096b6dfc45917002f42c63afb3) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d2d4156ca370508b217c8b7ebe317023f552d184) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f7e074ee712448a2e477afafcff4a0682f2e252) __fix(l10n):__ updated translation via Weblate - Dutch (PR [#3432](https://github.com/edrlab/thorium-reader/pull/3432))
* [(_)](https://github.com/edrlab/thorium-reader/commit/32f8a811b2446f3e02b9afdac1ecff75fb59a500) __fix:__ custom profile private signing key WebPack "define" plugin and Terser minifier was resulting in const var=null&&VALUE; without dead code elimination
* [(_)](https://github.com/edrlab/thorium-reader/commit/47a1c2d4932e77dc61d9334831fabbcc4ddc1fdc) __fix:__ ElectronBuilder Yargs ESM import.meta.url createRequire() externals WebPack config and manual NPM install in dist to populate node_modules without manually copying direct and transitive dependencies
* [(_)](https://github.com/edrlab/thorium-reader/commit/9c4773219d66f87337e374608c75caaa27b2f54a) __fix(wizard):__ secure opening of wizard links (PR [#3430](https://github.com/edrlab/thorium-reader/pull/3430))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6b809e02892d162c54dc799cf183a7b8f84b87be) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/b0e494769ca1c8e971f6946edf2f767af7735a05) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d786efd0714710a1857e1cb37ffe6c4700362e43) __fix(persistence):__ locator persistence at reader closing
* [(_)](https://github.com/edrlab/thorium-reader/commit/1904b6e062501985748530b4d35bb898e2c33a72) __fix(wizard):__ force wizard for 3.4.0 (Fixes [#3422](https://github.com/edrlab/thorium-reader/issues/3422))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ce381a7a04fdc3791c7df72aba4e9f347401b356) __fix(l10n):__ updated translations via Weblate - Turkish, Finnish, Italian (PR [#3425](https://github.com/edrlab/thorium-reader/pull/3425))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a11d4b8bfb483627a8934efa6011655a43dd26f1) __fix(persistence):__ split persisted redux state for 3.3.0 and 3.4.0 with forward/backward compatibility (PR [#3423](https://github.com/edrlab/thorium-reader/pull/3423))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ab75e458ca63583a2d66a6c089e71744ddd7f2b2) __fix(l10n):__ updated translations via Weblate - Russian, Portuguese (Portugal), Czech, Lithuanian (PR [#3419](https://github.com/edrlab/thorium-reader/pull/3419))
* [(_)](https://github.com/edrlab/thorium-reader/commit/91c30f5fa1e5c7778bcac18f0da5f095ac0ede29) __fix(wizard):__ update wizard content for version 3.4 (PR [#3421](https://github.com/edrlab/thorium-reader/pull/3421))
* [(_)](https://github.com/edrlab/thorium-reader/commit/eb0e11f0bcf54643d0ace9ec61d21eb9169df676) __chore(dev):__ save processLogs to app-logs{-dev} instead of app-logs for dev and prod, split dev/prod for any data folder in appData
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd04c3b12c85a8cb4e64eab52395a351b69684f3) __fix(publication-storage):__ disable publication-storage persitence for configs... but not for the locator
* [(_)](https://github.com/edrlab/thorium-reader/commit/620fb6faaa64ab337af1c6049da931f7de7a9bf0) __fix(library):__ try-catch the action dispatcher in the IPC sync consumer (PR [#3417](https://github.com/edrlab/thorium-reader/pull/3417))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ec868a5e2ba4a5a4d09a24b246eef0e6b295ffb2) __fix(main):__ reader redux state memory hydration
* [(_)](https://github.com/edrlab/thorium-reader/commit/d8f2a54702b1873ae0423331ec548220df21bdf2) __fix(l10n):__ npm run i18n-scan + check + typed ("library.filter.reset" key vanished in recent PR update)
* [(_)](https://github.com/edrlab/thorium-reader/commit/05845ee6d4ee0093a7c4c4d62d2cc9a1bcc8946e) __fix(dev):__ debug() was forcefully disabled instead of using allowlist / blocklist on the command line via the DEBUG env var [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/aa451deb45f83fb74b245f3987e3a1197aa62974) __chore(l10n):__ npm run i18next-check [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/e79bd32db22ed284d62014ca78a90e8b51dce738) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/8e021205425a7d4ce5e596d016794cc29a4a4540) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2ef98bd69af76dab044fb352c461eb191ebe35cf) __fix(l10n):__ updated translations via Weblate - Lithuanian, Finnish (PR [#3411](https://github.com/edrlab/thorium-reader/pull/3411))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9d7ff75e7dad1a80228020448f1360594bc22367) __fix(a11y):__ HTML headings structure in the "publication information" panel (PR [#3406](https://github.com/edrlab/thorium-reader/pull/3406))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d9e88e9b34ea1512884f38e36f2057d696018fec) __fix(persistence):__ persist in final state win.session.library.windowBound
* [(_)](https://github.com/edrlab/thorium-reader/commit/73b5ab7426389ffb80863e25c2c235ea8982e72e) __fix(library):__ add styles to missing publication cards and up catalogmenu items (PR [#3395](https://github.com/edrlab/thorium-reader/pull/3395))
* [(_)](https://github.com/edrlab/thorium-reader/commit/33679d27b8f57f9725af13266d47d99967411ba8) __fix(persistence):__ remove win diff patch compute and win.session persistence, save the final win.registry.reader subset for 3.x compatibility (PR [#3412](https://github.com/edrlab/thorium-reader/pull/3412))
* [(_)](https://github.com/edrlab/thorium-reader/commit/44591020247be0e89bfdbc9f561f696e795d9c44) __fix(publication-data):__ persist and migrate allowCustomConfig/pdfConfig/noteTotalCount/divina reader state
* [(_)](https://github.com/edrlab/thorium-reader/commit/6d75ff4220ad82115b7327f7a3be42bbefd44cc7) __fix(session):__ disable the session saving option
* [(_)](https://github.com/edrlab/thorium-reader/commit/06b53e69a1d55b516fc7e96dff7301daecdd144a) __fix(publication-persistence):__ migrate registry+db to publication-data/storage with immediate+debounced writes (PR [#3409](https://github.com/edrlab/thorium-reader/pull/3409))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8b354b1c1a95ef7022ed8c3fab5db89811ac94c8) __chore(dev):__ updated Flox/Nix [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/3baa82d3b89fe064958411b2b2c46ddc6ea7785d) __fix:__ sorry, one Redux Saga *Typed() function name slipped through the net
* [(_)](https://github.com/edrlab/thorium-reader/commit/588c9f8ab3d218fd818c71afb02de5f5afbc9318) __fix:__ handle edge case of non-existing map.get(publication_id)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea0eeb832f24dac9cc9c17f5b227d90f5f521a54) __chore(dev):__ [skip ci] a few more commented-out yield* Redux Saga statements for Typed() function naming convention, discovered with regular expression: yield\s*\*\s+((?!Typed).)*\(
* [(_)](https://github.com/edrlab/thorium-reader/commit/bc4ce3a9d5c2324c057289b949f8b945e7aa0329) __chore(dev):__ incorrect Saga function name import convention [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8923647a257d9556a12d9b25649071a9be227b17) __chore(dev):__ yield* syntax harmonization so that we can consistently search text matches [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f2ed843862b1a5653ec444d6ca1dd7ca12a0e090) __fix:__ Map.values() is an iterator, must clone as Array [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/fbc1e75341ce65acc9093f34ee43a7ae538b512e) __chore(dev):__ code comment TODO, suspected crash with multiple reader windows [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/dde5bccc8098eba4749da8e17c42c878291c94f0) __fix:__ good practice handling of race condition for file handle map (based on publication id) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/7ba0617744aead340c05164150a03208e60a1c8b) __chore(dev):__ assertUUIDv4(identifier) guarantees that the publication ID is already trimmed, otherwise fails with thrown exception [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/28416af1395edcae8bd11168cabdc8471d7a0eb2) __feat(publication-storage):__ readData config
* [(_)](https://github.com/edrlab/thorium-reader/commit/10f169b648d53a0636e794f4502e3d660382cc3c) __chore(NPM):__ package updates, fixes a vulnerability in a transitive dependency
* [(_)](https://github.com/edrlab/thorium-reader/commit/b7911f0951f241f955a63536daea42f223497e9f) __chore(dev):__ TypeScript Go compiler fixes [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/3c3e9d2525d4440ef069084baf0b0998c3624f62) __fix:__ fixed layout EPUB page x/y ratio now using CSS zoom, was 2D transform (Fixes [#3403](https://github.com/edrlab/thorium-reader/issues/3403))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d896f3ea2f61dd56cd8708ec7eaca354266ad32a) __fix(publication-storage):__ write locator data on tmp dir and mv to final publication vault locator
* [(_)](https://github.com/edrlab/thorium-reader/commit/00a16ca8d4c2b7b1f4f7a10ea449a37538641c5f) __fix(publication-storage):__ file handle closing & json stringify in dev/prod mode
* [(_)](https://github.com/edrlab/thorium-reader/commit/52690b67788f28f525d043c44f0fa4e2c14622c7) __feat(locator-storage):__ store locator json blob next to the publication vault with debounce on every change or when the reader is closing
* [(_)](https://github.com/edrlab/thorium-reader/commit/458b1c2076596efa60393ea997f0a998d97defaf) __fix(publication-storage):__ add a cache to find publicationEpubPath function
* [(_)](https://github.com/edrlab/thorium-reader/commit/2e242079635f20aef44360c55416f838ed94d279) __chore(dev):__ temporary disabled session and streamerNoHttp debug logs for easy debugging and screen reading
* [(_)](https://github.com/edrlab/thorium-reader/commit/7571e2cdbcc00396d05d404095af013ad7492630) __feat(locator-storage):__ store locator json blob to appData/config-data-json/reader/<uuid>/locator.json and dump it on each change
* [(_)](https://github.com/edrlab/thorium-reader/commit/297433b68480ee0b98192d9fe049a0a90ab919a1) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/3e43d434fb4708d36b3ec6b362ab6ea0f7d0ca5b) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d35632b7c4665104751b560c6c4c1a0cbed83da1) __fix:__ TTS and EPUB Media Overlays, temporary popup footnotes disabling wasn't restoring properly (Fixes [#3399](https://github.com/edrlab/thorium-reader/issues/3399))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b47a6c5af79ab585a3c32399a945c72a59a82062) __feat(publication-storage):__ introduce the concept of external publication vault
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d63e3aff7bdcfdb203c2e13b9f9e5e3aded3cc3) __feat(menu):__ show open publication folder button with shift key
* [(_)](https://github.com/edrlab/thorium-reader/commit/2839b663f1d8b2664cc9eb7a6cbd7ec147386c1c) __fix(regression):__ typo introduced different user-agent in 1ef99464fbb2a4feb56c37f0683a249b1134d5e6
* [(_)](https://github.com/edrlab/thorium-reader/commit/3ece3a82fc12cd923d3cbd5710c1ec1e777c051b) Merge remote-tracking branch 'refs/remotes/origin/develop' into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b5c46624c9e5da53f9624ba6c362bbecdb5f70c) __feat(publication-openFolder):__ add open path publication folder as API request
* [(_)](https://github.com/edrlab/thorium-reader/commit/f1e99005bd62ad721667064e4a073e21db289fab) __fix(publication-checker):__ fix publicationCheckerState API send to front & fix variable name, dump message
* [(_)](https://github.com/edrlab/thorium-reader/commit/9619c68c95826c9780125d86dc12b303fae9dc0e) __fix(dev):__ TypeScript checker woes, discrepancies between Go and Javascript implementations [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/09f76448ec580d3bb59a846cd7dceefe79220c99) __fix:__ node_modules direct imports instead of symbolic alias
* [(_)](https://github.com/edrlab/thorium-reader/commit/4a010f2116eacd959190f8a6310d9b0f1dcea335) __feat(bookshelf):__ filtering and sorting directly in the publication "grid" mode of the library window, complements existing "table" view (PR [#3364](https://github.com/edrlab/thorium-reader/pull/3364))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cc2b8b0761eadbf8a705735ae66f0eb2d4e92456) __fix(NPM):__ i18next minor regression fix, does not affect Thorium Desktop as moduleResolution=bundler and import default export is consistent between declared typings and actual runtime [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1ef99464fbb2a4feb56c37f0683a249b1134d5e6) __fix:__ 'thorium-desktop' user-agent in HTTP requests, unchanged LCP LSD device name, currently 'Thorium', also unchanged APIAPP headers (Fixes [#3328](https://github.com/edrlab/thorium-reader/issues/3328))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba5924b348e5878943d6d741499a79e7928dff24) __fix(a11y):__ added clearer labels on action buttons for modal popup vs. left/right docked panel (PR [#3388](https://github.com/edrlab/thorium-reader/pull/3388) Fixes [#3365](https://github.com/edrlab/thorium-reader/issues/3365))
* [(_)](https://github.com/edrlab/thorium-reader/commit/37eb90951d5ed4932f80015139fea22e55369f72) __fix(l10n):__ updated translations via Weblate - Finnish, Swedish (PR [#3396](https://github.com/edrlab/thorium-reader/pull/3396))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9b4d2804459d283d6394d1546234a3c940673abf) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d62ef56407abc9ba21a41abd392b6616e1de9c3e) __chore(dev):__ Flox/Nix manifest lock [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/70f916c4c3b67379495030c63df0f16a8e1c1606) __fix(cover):__ add broken svg in CellCoverImage in Table view
* [(_)](https://github.com/edrlab/thorium-reader/commit/f2e3d7a0953b0bd04dc7b8f4334cd72889c0ce5c) __fix(publication-delete):__ replace async rmdir (broken) with rm -rf and 3 retries
* [(_)](https://github.com/edrlab/thorium-reader/commit/c0c21cdd6cb34e6060566968cf36fb0dceeb0fe0) __fix(publication-findAll):__ improve api findAll to check/diplay publication in disk but not found on DB (kind of dummy publication defined as missingOrDeleted)
* [(_)](https://github.com/edrlab/thorium-reader/commit/858a290df1d6f796ba941daa422301cfb5dd5dce) __fix(publication-checker):__ fix condition for pubId disk & change variable name & use findAll instead select
* [(_)](https://github.com/edrlab/thorium-reader/commit/9cab6c81a63ee35f5c89af3f935a9fba6c2a3444) __fix(css):__ toast exit by translation to the left
* [(_)](https://github.com/edrlab/thorium-reader/commit/21420e55b025b9b585952ea4b79f39195ff09c2c) __feat(publication-checker):__ dispatch state to library win
* [(_)](https://github.com/edrlab/thorium-reader/commit/a43494f8126d6f11fe6589253071e158f67117f7) __fix(publication-checker):__ improve logs dump
* [(_)](https://github.com/edrlab/thorium-reader/commit/8713a570d48d9415b7118e9c876a5bca358eb3bb) __fix(publicationIntegrityChecker):__ dump check results to app-logs directory
* [(_)](https://github.com/edrlab/thorium-reader/commit/204044c2cba3e7c3d0b199a339fd7a1970693179) __feat(publication):__ Integrity checker for publications between FS and DB
* [(_)](https://github.com/edrlab/thorium-reader/commit/f2854c6861b5e822cc07d5bef9848bdf12c85a9c) __fix(cover):__ duplicate in no img section and add opacity to 0.7
* [(_)](https://github.com/edrlab/thorium-reader/commit/0bb6cca448efc3ef458caa04c77128e8579a8e89) __fix(publication):__ fix cover design regression, revert catalogMenu change and ensure EPUB file exists before reading manifest from disk in unmarshallR2Publication
* [(_)](https://github.com/edrlab/thorium-reader/commit/dffacb0bf20924c411242c9bec895edc6195ecbb) __feat(bookshelf):__ "missing" publication UI (PR [#3393](https://github.com/edrlab/thorium-reader/pull/3393) Fixes [#3386](https://github.com/edrlab/thorium-reader/issues/3386))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b3f23d7638f66fe1e198c75495b26199552c7c3c) __fix(l10n):__ updated translations via Weblate - Estonian, Portuguese, Chinese, Italian (Simplified Han script) (Portugal) (PR [#3389](https://github.com/edrlab/thorium-reader/pull/3389))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4d91fea21e0c999b9b293a98f80a79656eec13ef) __chore(refactor):__ set userData as a constant
* [(_)](https://github.com/edrlab/thorium-reader/commit/aef78e91fc6b3f848d8902c662ee8c7920ed484e) __fix(notes/patch):__ disable note persistence in redux state on reader closing (Fixes [#3308](https://github.com/edrlab/thorium-reader/issues/3308))
* [(_)](https://github.com/edrlab/thorium-reader/commit/84b4add036383e9032992ab4948b0980b05cb01c) __fix(publication-import):__ remove existing missing or deleted publication before restarting import
* [(_)](https://github.com/edrlab/thorium-reader/commit/d612b3e148f4facded68b7eba9ab9047ef06798c) __fix(publication):__ convert publicationView to minimal state when missing or deleted
* [(_)](https://github.com/edrlab/thorium-reader/commit/2e0bc60e755e19007d5f60672e52735c3c86a5e5) __fix(publication-storage):__ replace rmDir to the async version
* [(_)](https://github.com/edrlab/thorium-reader/commit/509f02ddb9fb6280a622de21f40459d9aa6fabc9) __fix(api):__ dispatch an error toast notification when API request failed
* [(_)](https://github.com/edrlab/thorium-reader/commit/54558fffaa94378e5b9bf3dd56ad7eb38df8dc98) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/373820169e70c1a587a5230514b8a8bd966079e7) __fix(storage):__ refactor getPublicationEpubPath to read publication root directory asynchronously
* [(_)](https://github.com/edrlab/thorium-reader/commit/77f91e5c81bcdb2ba07b0bd7f86dc91e21112bfb) __fix(library/reader):__ code comment early return on did-finish-load event, just crash the store initialization because window seems to be not created yet ! I do not know more what it is happen
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea40cfe631918c033e1f22dde184ebb47c84c581) __fix(reader/library):__ early return in did-finish-load when browserWin is destroyed
* [(_)](https://github.com/edrlab/thorium-reader/commit/bffbeee3811f3f1cc2bb46e2058df51f83b5289a) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/0453dc1f2f364b7a10de5aa146c084f4ede8945c) __fix(library):__ check if window is destroyed before loadUrl,setMenu and listener in createLibraryWindow
* [(_)](https://github.com/edrlab/thorium-reader/commit/1f95cf4622f1f834f45603c354ae64ea79c61cf4) __fix(reader):__ check if window is drestroyed before listening and add a try catch on loadUrl promise
* [(_)](https://github.com/edrlab/thorium-reader/commit/14bbdcb9157b86717d6667f5eaa52173dbc611da) __fix(reader):__ in winOpen add reader typeGuard safety
* [(_)](https://github.com/edrlab/thorium-reader/commit/50bd6af828a9425c00b874635c58ff1731db06ee) __chore(profile):__ code comment on 10seconds fallback to manual import
* [(_)](https://github.com/edrlab/thorium-reader/commit/861ba2e9b786d013b63250b732c18712bb8da1a6) __fix(profile):__ set timeout fallback for profile provioning to 10 seconds [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f413cd903b5e3b987182db6002eb8d9307019866) __fix(profile):__ provisionning timeout fallback to manual import
* [(_)](https://github.com/edrlab/thorium-reader/commit/7ca775a72b04283a96ac273ce938b7b3609c6bd1) __fix(l10n):__ updated translations via Weblate, Portuguese (Portugal) (PR [#3387](https://github.com/edrlab/thorium-reader/pull/3387))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8e71561a567848b20f106d11b654ec8bb320b1fe) __chore:__ migration of r2-xxx-js packages into Thorium's source tree (PR [#3383](https://github.com/edrlab/thorium-reader/pull/3383))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c40325140cf1f4e6a16ea3f1c14fb7c8325338b4) __fix:__ disable the "go to page" tab when necessary (PR [#3340](https://github.com/edrlab/thorium-reader/pull/3340) Fixes [#3284](https://github.com/edrlab/thorium-reader/issues/3284))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c2ed994c58215c534f04f2997e92ee7f66466abb) __fix:__ build error since the removal of resources/information/*.xhtml unused files
* [(_)](https://github.com/edrlab/thorium-reader/commit/32570c64e41afad400523cd114b258f3572099cc) __chore:__ Flox/Nix lockfile update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/3cb6b9411713e1343a464e453d34d0c8a243fada) __fix:__ tabulated header structure in modals dialogs, better keyboard tab cycling order (PR [#3347](https://github.com/edrlab/thorium-reader/pull/3347) Fixes [#2738](https://github.com/edrlab/thorium-reader/issues/2738))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1ee70f2d407578d51492ad2a79a23e43df7b5d0d) __fix:__ removed unused HTML information files (see [#3355](https://github.com/edrlab/thorium-reader/issues/3355) ) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea1b308d6eeac420c53a30074c7cfc7e45a5df33) __fix:__ submenu anchor was incorrect after deleting a publication (PR [#3379](https://github.com/edrlab/thorium-reader/pull/3379) Fixes [#3359](https://github.com/edrlab/thorium-reader/issues/3359))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d0f9c89bcb04d454a55ed8a27d87e5679b4e7b80) __fix(l10n):__ updated translation via Weblate, Swedish (PR [#3382](https://github.com/edrlab/thorium-reader/pull/3382))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4014a19b493abf4ec4a5dcfa61a7381a7a629a69) __fix:__ LCP passphrase form, enter key was toggling show/hide button (PR [#3384](https://github.com/edrlab/thorium-reader/pull/3384))
* [(_)](https://github.com/edrlab/thorium-reader/commit/da8ce5ad536a8c43cf5c397c37fe5d257db01a56) __fix:__ node_modules was shipped by Electron Builder with devDependencies due to automatic upward directory scanning from dist
* [(_)](https://github.com/edrlab/thorium-reader/commit/f5ae2e0581aca04c45d456355ae6afe44bcc57d8) __fix(MathML):__ MathJax could not be activated (Fixes [#3375](https://github.com/edrlab/thorium-reader/issues/3375) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ea1d73fcc361c8e819acd8bd8208ca474ad8144) __fix(l10n):__ locales checker [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a4afddd73dbb7de62c1ce463bcef376747d8c8c2) __fix(l10n):__ updated translations via Weblate - Chinese (Simplified Han script), Arabic, Italian, Greek, Estonianm Swedish, Finnish, Russian, Portuguese (Brazil), Lithuanian, Portuguese (Portugal) (PR [#3361](https://github.com/edrlab/thorium-reader/pull/3361))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c3bd42b7eaaecc1740377629bef414819b51a31b) __fix(l10n):__ not all locales were processed from the source tree (they are not necessarily integrated in the application) (see [#3368](https://github.com/edrlab/thorium-reader/issues/3368)) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b4b6a00cdb375431b0a74f5739f3eb1a2d09d648) __chore(NPM):__ package dependencies update, notably Electron 40 NodeJS 24
* [(_)](https://github.com/edrlab/thorium-reader/commit/572f5cd4b8478e2b55c128d5ba8f02870753070e) __chore(dev):__ Flox/Nix lockfile update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/76b5931332d62a94b226e9fad1078abc3d54381f) __fix(typo):__ removed extra parenthesis
* [(_)](https://github.com/edrlab/thorium-reader/commit/166c1b4b4658de8c507ee85a9101a021cb49db67) __chore(dev):__ code comment [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/25b62373752508fd3c0cdb5c24359f0869c5f584) __fix:__ additional string parsing safety, to guarantee removal of slash prefix(es)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8d28c99d639b0f65782842810560ec107057c2c9) __fix(profile):__ handle backslash filepath on windows for profile package file streaming
* [(_)](https://github.com/edrlab/thorium-reader/commit/9452c905b4772ce08fd4fd78b2b5bfcc260538c4) __fix(profile):__ set default hash for empty package
* [(_)](https://github.com/edrlab/thorium-reader/commit/b3b79763e7f17cd74bb7ba16b5ffa87eab79f801) __chore(dev):__ Apple container script tweaks (startup and teardown) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/53f0cb59d7a4dfe382e73ec9ea9a1474774eb7ff) __fix(css):__ input margin (PR [#3377](https://github.com/edrlab/thorium-reader/pull/3377))
* [(_)](https://github.com/edrlab/thorium-reader/commit/896cec1cb14b076f83600fbc862b0bcf67a5824c) __chore(cli):__ dump info to processLogs.txt about opds custom scheme handling
* [(_)](https://github.com/edrlab/thorium-reader/commit/aeb7832de92f55c754a6f10c480bc78cdce85c8c) __chore(dev):__ Apple container (Docker alternative) tweaks [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a3c95c0e38bb358def7eb7588b1b9fbaf9410cdf) __chore(dev):__ Docker alternative Apple Tahoe native Linux container builder [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/0f5df9074ff6c83c03f56334b1fdd3bd849d92d4) __chore(NPM):__ package dependencies update
* [(_)](https://github.com/edrlab/thorium-reader/commit/dbeed951851aa52e21a063246f10110f54b8d4d4) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/deb6de5b222b4c18e2b388e4950b400e7192c173) __chore(cli):__ dump thorium name and version to process info logs
* [(_)](https://github.com/edrlab/thorium-reader/commit/752e486a7d6f13a9f1141a6a567eb2c688b61783) __chore(cli):__ dump process instance info to %APPDATA%/app-logs/processLogs.txt
* [(_)](https://github.com/edrlab/thorium-reader/commit/82a664e67e39fa04ad398676b9dcc54424e4b4ff) __fix(profile):__ add type guard for logoUrl and trim pubkey before matching
* [(_)](https://github.com/edrlab/thorium-reader/commit/fc7a466500af4b3d7b87a77bd759d99d85e9d6fb) __fix(CI):__ MacOS ARM ad-hoc code-signing disabling (instead of wholesale com.apple.security.cs.disable-library-validation enabling) (Fixes [#3366](https://github.com/edrlab/thorium-reader/issues/3366))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b6d4cc818527edf714664a59029001634b56734c) __chore(NPM):__ package dependencies updates, sticking with Electron 38 (NodeJS 22) will wait to Electron 40 (NodeJS 24) to be tested further
* [(_)](https://github.com/edrlab/thorium-reader/commit/c58cec98248a089b08f9576290704bf09f79dc58) __chore(dev):__ Flox/Nix [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/755c7f98bef7ada59d1c35ebed91cc054ee46b90) __chore(dev):__ i18next sort after scan and check scripts [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/992429d98e50f1ed048c4dc5b4777b8bd61c97fd) __fix(l10n):__ added i18next missing empty keys in some locales [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9c951f187c2ab0fd7ba943045bccc2f3b255b469) __fix(l10n):__ sort keys (now also in Weblate) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d1b58d7a8844d963933028f03beb8607598c54fe) __fix(l10n):__ typed i18next (minor sort fix) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/31f5ace3c2f551c03cb5f7809ae62130efe68df2) __fix(l10n):__ updated translations via Weblate - French, Turkish, Estonian, Finnish, Swedish, Russian (PR [#3352](https://github.com/edrlab/thorium-reader/pull/3352))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2f6b212db08a4ab928d887e258218e21eadf525d) __fix:__ change author info from span to h3 to correct html structure (PR [#3356](https://github.com/edrlab/thorium-reader/pull/3356))
* [(_)](https://github.com/edrlab/thorium-reader/commit/bf9a2d8ed9ff6a5cdac13f9d0c81980c8974557f) __fear(GUI):__ Allow displaying the LCP password in clear text (PR [#3348](https://github.com/edrlab/thorium-reader/pull/3348))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e3a2690786f9c6ff5b46e055504b3a274cd08ab8) __fix(GUI):__ hide publicationInfoA11y2 tooltip in publication info dialog (PR [#3346](https://github.com/edrlab/thorium-reader/pull/3346))
* [(_)](https://github.com/edrlab/thorium-reader/commit/917e3f14b07f2c177f8c06de8fed83d7d60b6c74) __feat(l10n):__ enable i18next plurals (PR [#3351](https://github.com/edrlab/thorium-reader/pull/3351))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d44dab37f2110be22d0c705eebd2d8a23ef7e124) __chore(l10n):__ i18next scanner [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/7799f2e2ce8c1fe6a4576a84b8131de2d86b5c4f) __fix(l10n):__ updated translations via Weblate - Turkish, Greek, Russian, Italian, Polish, Estonian, Portuguese (Portugal), Czech, Lithuanian, Swedish, Chinese (Traditional Han script),  (PR [#3315](https://github.com/edrlab/thorium-reader/pull/3315))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0f0975320cc3c53b51b785489c6e8f9b4ac28ba1) __chore(NPM):__ package dependencies updates, notably Electron 39
* [(_)](https://github.com/edrlab/thorium-reader/commit/11a0ba963472037660fcc1f0a3682baa0fcb0e64) __chore(dev):__ Flox/Nix Node 24 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a068dc807b216ebb42c2ce4f275d0b1f70404209) __feat(opds):__ add favorite opds feed sorting in feedList component (PR [#3266](https://github.com/edrlab/thorium-reader/pull/3266))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c2140af251aa524cd8bb8f1f2a023ea34017ce45) __fix(opds):__ set the breadcrumb to the last end value pointer and set previous button to the last history value (PR [#3263](https://github.com/edrlab/thorium-reader/pull/3263))
* [(_)](https://github.com/edrlab/thorium-reader/commit/86719cdd059c40b54386804cbee5958b3f4ccd98) fix(css) background color of annotations and bookmarks cards (PR [#3337](https://github.com/edrlab/thorium-reader/pull/3337) Fixes [#3324](https://github.com/edrlab/thorium-reader/issues/3324))
* [(_)](https://github.com/edrlab/thorium-reader/commit/392d68c79dc72084cc30375c149a249961f9c706) fix(apiapp) automatically closing modal when adding library (PR [#3338](https://github.com/edrlab/thorium-reader/pull/3338) Fixes [#3329](https://github.com/edrlab/thorium-reader/issues/3329))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0420840e2555d4fa297322f28ff758844b793570) __fix(shortcut):__ add a button to export keyboard shortcut list to html (PR [#2949](https://github.com/edrlab/thorium-reader/pull/2949))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e000e8dd8249890f8b065e32e4cde48cd9c25c1b) __fix(GUI):__ on macOS appActivation event restore the first readerWindow in priority instead of the libraryWindow (PR [#3292](https://github.com/edrlab/thorium-reader/pull/3292))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9cbff78e7b1254d5e76574766ffb75033529fec0) __fix(opds):__ replace the catalog header title from the user title of the feed to the opds metadata.title (PR [#3256](https://github.com/edrlab/thorium-reader/pull/3256))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0ea6f3d86f6d62a8383ff6d29b12ef0911ae5754) __fix(customization):__ on windows chokidar wellknow folder filepath replace by forward-slash instead of backslashes & introduce debug information and polling opt (PR [#3330](https://github.com/edrlab/thorium-reader/pull/3330))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c8b68da469582127a74b2054ec417a14f7ce2226) __chore(dev):__ utility script to generate a package.json lockfile without devDependencies (SBOM Software Bill Of Materials) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/db8368ed1780c376b98fc37a7aaefaddc54b0dbd) __chore(NPM):__ minor package update (transitive) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/e328d3e1cb661bf4d68b100a0f64081e3a1bd025) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2c081181f3c15c54e91d7ff64fd5823a4b280329) __fix(dev):__ WebPack main and renderer process bundling JS module import default obj (TypeScript Go compiler typechecker was failing)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fcb913a9849c460174e139fbb6c62f3185f66767) __fix(GUI):__ Electron BrowserWindow for OPDS auth (and PDF extract) should not have menus (affects Windows and Linux, modal child sheet in MacOS obeys different rules) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/01f87e9c54391f4369539caa9f882e214854b3df) __fix:__ inadvertently deleted custom profile ZIP in previous commit [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/fb623bfbbd180e4ced5a96780efc8ccc2aae1ceb) __fix:__ custom profile ZIP streaming Windows filepath backslash
* [(_)](https://github.com/edrlab/thorium-reader/commit/cdbde013d7dd87b12746d5fd2f81aa594487cc93) [skip ci] Merge branch 'master' into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/29ae3ad482b59087f47fea4b443be3b4c4a17ef6) __(origin/master, master) chore(release):__ latest.json 3.3.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/09fb1ec7454e64d2e141a30169fe490becf0b11f) __chore(release):__ latest.json 3.3.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/cf2f23a504d0593ec1827b2841875826457bc7ea) __chore(ci):__ version 3.3.1-beta.1 bump
* [(_)](https://github.com/edrlab/thorium-reader/commit/3a31b616535336495c557425f9d9cce9f40f6bef) __chore(dev):__ NPM postinstall explicit arch [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/07015fcb00431721b623b5ce3dee54c1230f44e9) __chore(dev):__ Docker script with ARCHI uname override [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/ebea54cee5463e074d5f4f9f9821917e86db0146) __chore(dev):__ fixed Linux Docker conf [skip ci]

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v3.3.0...v3.4.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
