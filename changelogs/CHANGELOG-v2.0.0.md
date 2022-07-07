# Thorium Reader v2.0.0

## Summary

Version `2.0.0` was released on **30 May 2022**.

This release includes the following (notable) new features, improvements and bug fixes:

* Electron v19, Chromium v102
* Updated locales: Swedish, Dutch, Spanish, Chinese, Japanese, Portugese
* New translations: Basque, Galician, Catalan
* New major bookshelf functionality: interactive "data grid", i.e. table graphical user interface that features filtered rows based on keyword search (instant for visual find-as-you-type, or deferred for screen reader usage with submit button + ARIA live assertive annoucement), paginated list of results, alphanumerical sortable columns (descending / ascending), basic vs. advanced choice of columns (e.g. title, author, publication format, publishing date, etc.), clickable cell contents to automatically search for selected text (includes support for user-provided tags), etc. etc.
* Improved accessibility feature: alternative "where am I" for screen readers in speech mode only (i.e. assertive ARIA live region via toast notification) using the SHIFT-CTRL-K keyboard shortcut (this is equivalent to the existing "where am I" via SHIFT-CTRL-I popup modal dialog, with the advantage of not loosing focus in the publication HTML document)
* Fixed a bug where publication HTML documents were reset to the first page when ALT-TAB between application windows.
* Fixed issue with HTTP downloader, stream read/write pipe was causing invalid ZIP directory parsing (unwaited filesystem buffer flush), also improved request timeout handling.
* EPUB metadata accessibility summary is exposed in publication info popup modal dialog, and several under-the-hood mechanics to pave the way to proper presentation of the full set of a11y metadata.
* Several key improvements in user interface structure / semantics to ensure more confortable experience with screen readers.
* Updated MathJax integration to support MathML alt text with special treatment of screen readers (specialised Math plugins offer structural exploration of Math markup), and separate treatment for Thorium's built-in TTS read aloud feature.
* Fixed footnotes issue where the note contents inside "aside" HTML elements weren't hidden.
* Fixed DAISY 2.02 support (NCC HTML file picker), and fixed XML/HTML parsing issues.
* Fixed a Readium CSS bug where some publication document height was not fully extended Also fixed a performance issue with CSS columns.
* Fixed night / dark mode GUI inconsistencies.
* Improved visual rendering of Table Of Contents.
* Thorium's internal database format changed from native LevelDown/SQLite3 modules to JSON serialisation.
* Improved toast notifications placement to avoid obscuring critical GUI parts, added keyboard focus and mouse click handling, easier clipboard copy of message, and fixed the overflow text clipping.
* LCP META-INF/license.lcpl now excluded from hash computation to eliminate duplicates during EPUB import.
* Fixed a Windows bug where drive letters other than C: were not supported when opening publications directly from the file explorer.
* New image zoom feature with SHIFT-click in publication HTML documents.
* Fixed HTML5 audio controls mis-renderering due to CSS overrides.
* Better, clearer presentation of "borrow" links and other publication acquisition details in the publication info modal popup dialog.
* Fixed a PDF metadata bug related to date format parsing + timezone calculations.
* Major update under the hood to support latest package dependencies, notably WebPack and associated build / development plugins, but also critical application components such as React, Router, etc. (Thorium remains on React 17 so that forks do not experience upgrade issues to React 18)

(previous [v1.8.0 changelog](./CHANGELOG-v1.8.0.md))

## Full Change Log

Git commit diff since `v1.8.0`:
https://github.com/edrlab/thorium-reader/compare/v1.8.0...v2.0.0

=> **112** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/c35aed2f0d11955ffd364238ff88df80f443782f) __chore(dev):__ temporarily disable unit tests, broken JEST (see [#1697](https://github.com/edrlab/thorium-reader/issues/1697) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e617d0592e00ea0d4b7e4d3cc81d0b3676fcde00) __fix(l10n):__ sv Swedish locale (PR [#1696](https://github.com/edrlab/thorium-reader/pull/1696) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2de68fb6632754dec292c4484322838e74968f32) __chore(NPM):__ sha1-sha512 NPM checksum (lockfile) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c0d59aa05a6a672eedd5387fac6cdb3e52e9271e) __chore(NPM):__ updated packages, stricter TypeScript
* [(_)](https://github.com/edrlab/thorium-reader/commit/29602ac6e823dec483a739e2ea28203e1fa029ef) __feat:__ where am I feature, but speak only (assertive ARIA live region via toast) with CTRL K keyboard shortcut (Fixes [#1662](https://github.com/edrlab/thorium-reader/issues/1662) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/3f2507302e0e7a7cab8dd95b009701ea5873f3a9) __fix:__ updated navigator package which address keyboard focus / page reset, as well as footnotes issues (Fixes [#1690](https://github.com/edrlab/thorium-reader/issues/1690) Fixes [#1675](https://github.com/edrlab/thorium-reader/issues/1675) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d497ee785e140f7edc0663316020b204d28870d7) __fix:__ LCP publications CRC excludes META-INF/license.lcpl (hash computation to detect duplicates during EPUB import)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b53ab1b8d7261b045c5c5db0638a10749feb1472) __chore(lint):__ src/renderer/library/components/searchResult/AllPublicationPage.tsx
* [(_)](https://github.com/edrlab/thorium-reader/commit/e1f242bbf13e668de84019edc85314bd27182187) __fix:__ bugfix for CSS regression in Chromium v102 in Electron v19 (flex / flow-root reset breaking CSS columns layout)
* [(_)](https://github.com/edrlab/thorium-reader/commit/114433e502204373e8906655a757b018d2386c0b) __chore(NPM):__ updated dropzone package (major, but no breaking change in Thorium)
* [(_)](https://github.com/edrlab/thorium-reader/commit/01b3dd9ff7186b79e22a4f86a55b6dce88ec4391) __fix:__ fetch-cookie doesn't require patching anymore (package.json exports default entry now corrected, see https://github.com/valeriangalliat/fetch-cookie/issues/72 )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2d9f69e44488d6c34fff54f216097e536837c17d) __fix:__ added missing file in previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/55e67940c6b9ceb6f18cd16e9d4d6e842f162a29) __chore(NPM):__ package updates, required patching incorrect package.json exports in node_modules + new Typescript error (incorrect spread use)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b64cb41f1934938af6ccd0b9c04db230ac49b96f) __fix(l10n):__ Dutch locale improvements, thank you Ted Van Der Togt from @KBNLresearch
* [(_)](https://github.com/edrlab/thorium-reader/commit/b167e912d9990cf2f96a6dc692744a111766faf1) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/9293e04787469c09a986890ef6881ab54f04190d) __fix:__ PDF publication date parsing was incorrect, months are zero-based in JS Date object (same in Moment), and the month/day was inverted, and the timezone was not taken into account.
* [(_)](https://github.com/edrlab/thorium-reader/commit/9ff488fbe1da17bcb119c884e23185feb47dcd1d) __fix(GUI):__ bookshelf date display was incorrect (zero-based months, and wrong day)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4f6e714b529d8046a49509419803decf8ccc9501) __feat(GUI):__ added "last read" bookshelf data grid column (to sort by recent reads, see unread publications)
* [(_)](https://github.com/edrlab/thorium-reader/commit/2c4f2baa65d88a3978b1533daf4d862a2b4f5714) __feat(GUI):__ added "format" column in bookshelf data grid (EPUB, EPUB FXL, Divina, DAISY, Audio, PDF, etc.)
* [(_)](https://github.com/edrlab/thorium-reader/commit/24ba9e21b6e5a10c518ba18a373904265c800856) __fix(GUI):__ bookshelf with simple (default) vs. advanced mode / grid vs. list display views (number of columns) ( Fixes [#1666](https://github.com/edrlab/thorium-reader/issues/1666) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/25633a967fcd280cdb0797cb9094d127a7bce1f2) __fix(GUI):__ display of supported file extensions on welcome screen (first install / launc, empty bookshelf)
* [(_)](https://github.com/edrlab/thorium-reader/commit/47a4dbbe3d6940dd29fb800c1a941534e6818c2c) __doc:__ added missing DAISY mention in readme (Fixes [#1616](https://github.com/edrlab/thorium-reader/issues/1616) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2a069eea14c728279d517b3c8effba079fe1552f) __feat(l10n):__ Basque locale (eu) (follows PR [#1670](https://github.com/edrlab/thorium-reader/pull/1670) , PR [#1688](https://github.com/edrlab/thorium-reader/pull/1688))
* [(_)](https://github.com/edrlab/thorium-reader/commit/71728704d8340bd8ce187659e97e894d62bea41d) __fix:__ ReadiumCSS height auto override, body position:relative, height:inherit, document height:100vh (Fixes [#1677](https://github.com/edrlab/thorium-reader/issues/1677) Fixes [#1658](https://github.com/edrlab/thorium-reader/issues/1658) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d358a2d5886d300dd93caa9bb1fe026653bd9785) __chore(dev):__ electron rebuild correct version (not needed anymore for SQL and LevelDown ... but need to make sure the versions are in sync nonetheless, for correctness)
* [(_)](https://github.com/edrlab/thorium-reader/commit/05134d1c1253da296ccd97d9b1050daccffd6ebe) __chore(NPM):__ package dependencies update, a few major version increments (and a couple of breaking changes)
* [(_)](https://github.com/edrlab/thorium-reader/commit/85ccc8e616457f4d899ed0a8e99846afd888a33f) __hotfix(l10n):__ ga language code is Gaelic, gl is Galician (follows https://github.com/edrlab/thorium-reader/pull/1673#issuecomment-1096971006 )
* [(_)](https://github.com/edrlab/thorium-reader/commit/24b90f0703017174786fddee424cb9ad09b379f0) __feat(l10n):__ Added Catalan locale (PR [#1674](https://github.com/edrlab/thorium-reader/pull/1674) follows PR [#1669](https://github.com/edrlab/thorium-reader/pull/1669))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cdd617f766680925a90937c3ddf41e26f042df92) __feat(l10n):__ Added Galician locale (PR [#1673](https://github.com/edrlab/thorium-reader/pull/1673) follows PR [#1671](https://github.com/edrlab/thorium-reader/pull/1671))
* [(_)](https://github.com/edrlab/thorium-reader/commit/74c6844ac596536bba1afd96fb76a1f43704ef00) __fix(l10n):__ improved Spanish translation (PR [#1668](https://github.com/edrlab/thorium-reader/pull/1668) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/efbec8647994082783c34251f10fcf1af3229919) __fix(l10n):__ improved Simplified Chinese translation (PR [#1665](https://github.com/edrlab/thorium-reader/pull/1665) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/81d21a2b0c485cd1fffa192d8667b45246f1202b) __fix(l10n):__ improved Japanese translation (PR [#1661](https://github.com/edrlab/thorium-reader/pull/1661) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/a2fafca804477fdcb40378550f4c9637b6ae96b6) __fix(l10n):__ updated Portugese pt-PT translation (PR [#1672](https://github.com/edrlab/thorium-reader/pull/1672) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/468ef255be7aa292b0e6582802466daa26713029) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/99e005f116a27b1c5e088e25d5f6bf2c682c5737) __fix(UI):__ about publication dialog now with correct title (was publication title, duplicated)
* [(_)](https://github.com/edrlab/thorium-reader/commit/40dfb594d74645a49f58b3b396b31d81165c56d6) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2a835e94b84f7b15f69b85676fbb9e4869e6b438) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/214f6e83468d3786b5466247afc598150b34cffb) __chore(NPM):__ package updates, including electron-builder which was behind due to incorrect release tag
* [(_)](https://github.com/edrlab/thorium-reader/commit/a62b00d8bd9abed308230635ccda72e7fbc19096) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/2365531b973fc8dabc77ab47075a63ac2c7978dd) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ec0367777a1db2e253727cd67fd2950718357bb) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/f204fcbbce8137f238988450bcdfec54f23b50db) __chore(NPM):__ minor package update
* [(_)](https://github.com/edrlab/thorium-reader/commit/a44d9a7e0b1917d444b21487d282e5699a3a3395) __fix(dev):__ eclint glob (Windows)
* [(_)](https://github.com/edrlab/thorium-reader/commit/a9892100906436b082b6ea91cdaac37b32951899) __fix(GUI):__ mouse hit regression on bookmark button
* [(_)](https://github.com/edrlab/thorium-reader/commit/ed547e033195b9a03e3fce86090cbb6b1804f5c9) __fix(dev):__ eclint glob woes on Windows
* [(_)](https://github.com/edrlab/thorium-reader/commit/260250be45d5cc1ad9465c5e19b511e8cac58f31) __chore(NPM):__ package updates, including ReadiumCSS fix via r2-navigator-js (CSS columns perf with large DOMs) and Electron v18 upgrade
* [(_)](https://github.com/edrlab/thorium-reader/commit/0a33122fe6495a598a1b12631258a3c646937ba7) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/a09c2da4faa3b3db9d3cb5b320a9f52c0888c54f) __fix(a11y):__ MathML / MathJax special treatment of screen reader, to avoid clash with Thorium's built-in TTS read aloud feature (Fixes [#1602](https://github.com/edrlab/thorium-reader/issues/1602) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/dbdc4f729370ac9bcc715adb63200d6f75af96f9) __fix(DAISY):__ ncc.html support in file browser chooser (Fixes [#1629](https://github.com/edrlab/thorium-reader/issues/1629) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/eb8bbdd23e6adfbdcb57c14c94c394caa99d53da) __fix(a11y):__ accessible labels and keyboard navigation improved (Fixes [#1583](https://github.com/edrlab/thorium-reader/issues/1583) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/9b7e39fbe523cc4fd94f385541ee0fe0252dc288) __fix(CSS):__ yes/no ok/cancel etc. dialog footer buttons were too far apart (Fixes [#1596](https://github.com/edrlab/thorium-reader/issues/1596) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0bedc6b86255b976444c302b3e19f20dedc6db01) __fix(CSS):__ TTS voice selector and Media Overlays speech rate selector font color in night mode (Fixes [#1115](https://github.com/edrlab/thorium-reader/issues/1115) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/3bdbd8c4ff9cad23f644d2fee68b34c451bbc42d) __fix(CSS):__ night mode lower left corner text in reader window (Fixes [#1135](https://github.com/edrlab/thorium-reader/issues/1135) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c00764d46167c96633601b8d072b7360e0cc2abe) __fix(CSS):__ TOC Table Of Contents visual improvements, also fixed search bar in reader window in night mode (Fixes [#1656](https://github.com/edrlab/thorium-reader/issues/1656) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/99fa3ec2fc6dcd609a607fde7d19481d04e55e0d) __fix:__ local bookshelf data grid column-search vs. global search, controlled React components workaround
* [(_)](https://github.com/edrlab/thorium-reader/commit/9eaca940636ec4868fb63d320811b655e39d5b62) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/a1e5cb17eaa20b4c7df648f5f7cf2d894de83b7c) __chore(NPM):__ updated packages, including minor Electron release
* [(_)](https://github.com/edrlab/thorium-reader/commit/41d5d0722f3a61f36624509cfd28dc495cf66e43) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/84e2abd122c46960d12dd996175e0027d67bd3d0) __fix(a11y):__ debounced search-as-you-type in individual columns, detection of screen reader for submit button + ARIA live assertive annoucement + fixed incorrect reader window query
* [(_)](https://github.com/edrlab/thorium-reader/commit/2dc27475c01039737c45f1e8167fe7faa26cace2) __fix(a11y):__ ARIA live search button assertive notification, switch when screen reader is detected (added form submit button, not search-as-you-type)
* [(_)](https://github.com/edrlab/thorium-reader/commit/11e62ea5ff470670cd22faa8ae9f93e96feb4082) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/4951ab8f691a05663c0bd5ecaee1514488b1e627) __fix:__ added missing a11y metadata in data model, expose accessibility summary in bookshelf grid and publication info panel (alongside description). For now, do not display access mode/sufficient etc. (need localisable / translated strings and proper presentation strategy, but sorting / filtering in data grid worked (currently disabled))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a673dd2cfe679920cad0a3a39b41bdde519391b4) __fix:__ bookshelf data grid, publication date display sorting and filtering (includes r2-shared-js parser fix too)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fbafe6bdeaaae61d1e62f59d8ba524371b0ff5b8) __fix(l10n):__ publication date to localised string, based on user language preference (Thorium GUI setting)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b79817a8dd89a19f3d277889187a6aa033e126c5) __chore(NPM):__ package updates [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/15a75390d5883b3f08b18def6a820a963c8934ad) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/b8a090e27ee5512f3890ae168d47e723f8c06d30) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/0884714534c6f108d3e67a1ebaa1a5e3839425b8) __fix(l10n):__ updated Swedish translation (PR [#1655](https://github.com/edrlab/thorium-reader/pull/1655) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d6bdda4dc5ce79f3245d8d9a01e823e452253131) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/86b2809d45de77b9523238b3f778557c88fa1182) __fix(l10n):__ updated Spanish translation (PR [#1652](https://github.com/edrlab/thorium-reader/pull/1652))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0d55dc4a7457669d06d7f74cdedb6b06e4d20ab4) __fix(UI):__ bookshelf grid accessibility improvements, added clickable author and publisher for quick search, tags now search locally in table too
* [(_)](https://github.com/edrlab/thorium-reader/commit/b10094c594f1d76d5fccee2331697d382b1e5d98) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/3732f97c0df436dd68f25c17a4c6bc02560b4739) __feat:__ accessible bookshelf data grid, fuzzy text search (global and per-column), column sorting, pagination, compact / list mode (PR [#1651](https://github.com/edrlab/thorium-reader/pull/1651))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b1329740ea8303d9a8322c5c10115dbe59f1d4bc) __fix(OPDS):__ clickable tag with mouse pointer proactive feedback (UX)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8b1c457960e12c6a353a0b2e3ad42edd7b737300) __fix:__ HTTP downloader stream read/write pipe was prematurily triggering Redux Saga completion, resulting in invalid ZIP directory parsing (filesystem buffer flushing)
* [(_)](https://github.com/edrlab/thorium-reader/commit/c4645ce201db7effcbab2c0464cc1f97523b9ed0) __chore(NPM):__ updated package dependencies
* [(_)](https://github.com/edrlab/thorium-reader/commit/c3fdb13e97ce447e515fba2e278efbf66386ba7b) __chore(NPM):__ package updates, notably r2-shared-js with DAISY HTML/XML parser bugfix
* [(_)](https://github.com/edrlab/thorium-reader/commit/3f39a836030791f8734405de32c5f9c78f3e836e) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/5403eac9f25616f614d508e0aa351979a0994486) __fix(UI):__ added keyboard focus and mouse click handling in toast notifications, clipboard copy of message, clipping of overflowing text, re-positioning in lower-left corner (Fixes [#1644](https://github.com/edrlab/thorium-reader/issues/1644) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/f4f3c47705e7263bdb9b142572a8c3782afbbb1b) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/3d44c1609e65f9559a25df63e5b8938da5faea75) __fix:__ NPM package updates, notably r2-navigator-js which fixes [#1535](https://github.com/edrlab/thorium-reader/issues/1535) (see https://github.com/edrlab/thorium-reader/issues/1535#issuecomment-1059113442
* [(_)](https://github.com/edrlab/thorium-reader/commit/ee0cc5f915905ef5d629fe79843b6b3b60d81d3e) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/9e41778f781c09ca47478fbb61b54fef11dbb70f) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/b07ed39049c9af3c86f6142c78800d26eabe130b) __chore(NPM):__ updated packages, notably fetch-cookie which now handles HTTP redirects internally
* [(_)](https://github.com/edrlab/thorium-reader/commit/a76231c26855b61ee9625c83ef7a9efeb9a3f0e3) __fix:__ improved HTTP fetch timeout detection (race condition with abort controller, single signal)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8cf94381caa56ab46c9c8b17e3c0da8a1c35cc3d) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/8bedfd2ccd2e2db45f64587f42ce4e3657c475e1) __fix(l10n):__ Swedish translation update (PR [#1640](https://github.com/edrlab/thorium-reader/pull/1640))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a161eb49132f5548ad9a71099fbac793bf6cd4d5) __chore(CI):__ attempt to pin down a broken stylelint lib dependency to fix Windows crash (build only, not runtime)
* [(_)](https://github.com/edrlab/thorium-reader/commit/517002fa9ad3bce5c0edeaad219e77c709223163) __chore(NPM):__ package updates, hopefully fixes Windows CI (stylelint / css-functions-list regression, URL parsing crash)
* [(_)](https://github.com/edrlab/thorium-reader/commit/55f2e10f2ba6b4b4f138fd4dcaab3d955b6321dc) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/890b1bdb478174af8c8cfc4863c60fb496ff3602) __chore(dev):__ Jest update
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f356c278ae47854df2c41104aacf76412c8e97e) __fix:__ node-fetch v3 (Fixes [#1628](https://github.com/edrlab/thorium-reader/issues/1628) Fixes [#970](https://github.com/edrlab/thorium-reader/issues/970) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2baa605e248f94701bc6301158b32986c99f329e) __fix:__ updated WebPack externals with better, cleaner script (tested in dev and prod, including release package ... LCP, PDF, etc.).
* [(_)](https://github.com/edrlab/thorium-reader/commit/60812713d5020563a9b5758973fc947ee0a9da21) __chore(dev):__ migrated from ES6-2015 to ES8-2017 Readium2 packages + ES2020 TypeScript / WebPack config
* [(_)](https://github.com/edrlab/thorium-reader/commit/091b67a2042fb2c439b2df2dd06938b6c7381411) __chore(NPM):__ i18next update
* [(_)](https://github.com/edrlab/thorium-reader/commit/4821b111c501b4fc17395ffee7876a121194f7cf) __chore(NPM):__ updated Yargs
* [(_)](https://github.com/edrlab/thorium-reader/commit/370195cee0f529a1ac42b76e9b33c35bca799580) __fix:__ updated WebPack and plugins, fixed console warnings with TypeScript type imports
* [(_)](https://github.com/edrlab/thorium-reader/commit/21d61f1730f6b8ea90bb2e0b8600bc70772cb021) __fix:__ updated WebPack CLI and DevServer (also fixed the i18n CJS/ESM interop import / require problems)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0fc5b84a8c7ba6aff1132fa8ca3096eb06f8f93c) __fix:__ React 17
* [(_)](https://github.com/edrlab/thorium-reader/commit/94612580345af4de0faa58ccc2b99a578c1867c2) __fix:__ updated React Router to pave the way to further React and WebPack upgrades (PR [#1638](https://github.com/edrlab/thorium-reader/pull/1638))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0cd90fd20a04b096776d27bca7bb63f116953736) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d2d82924138a9b5d77d06f29901cf3f3c32d1544) __chore(NPM):__ package updates, notably: Electron v17 (was 16)
* [(_)](https://github.com/edrlab/thorium-reader/commit/09ae89c0585b91556cc8ca77fbbcb3f288c6cfd5) __fix(OPDS):__ presentation of borrow links and other publication acquisition details (PR [#1627](https://github.com/edrlab/thorium-reader/pull/1627) Fixes [#1563](https://github.com/edrlab/thorium-reader/issues/1563) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/9fb51e7cad958c687113b136dc642e9e1bf36d95) __fix:__ support for Windows drive letters other than C: when opening publications directly from the OS file explorer (PR [#1626](https://github.com/edrlab/thorium-reader/pull/1626) Fixes [#1620](https://github.com/edrlab/thorium-reader/issues/1620) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/68853e66a8451c8fdb5c467065b86c3c96610c97) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/0af15ff185a6f982a96f08fdf63c383729917db8) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/f4367096de3ed9d28d2f196f9c765678ca333446) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/a556ff941749ae474c44acaa9371a27ca3e352e0) __fix:__ removal of SQLite3 and LevelDown native database dependencies (PR [#1622](https://github.com/edrlab/thorium-reader/pull/1622) Fixes [#1619](https://github.com/edrlab/thorium-reader/issues/1619) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c5a71b91f628341bccfde352b0945efb960e4f49) __chore(NPM):__ package updates, notably R2 navigator component which fixes the Readium CSS audio width/height bug, and which introduces the image zoom feature (Fixes [#1612](https://github.com/edrlab/thorium-reader/issues/1612) Fixes [#1160](https://github.com/edrlab/thorium-reader/issues/1160) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/f35ea3c6b69b248a22acdc5cbae80bcf90f17c53) __chore(NPM):__ package updates, notable fixes in R2 modules where safeguard against callbacks that do not capture async / await thrown errors (exceptions do not automatically transit up the call chain) avoids UnhandledPromiseRejectionWarning
* [(_)](https://github.com/edrlab/thorium-reader/commit/f6c53907e9c7395ac9e20d85a49d55e7a12546bf) __fix(dev):__ hoisted the LCP LSD skip ENV var to preprocessor directive stage, for better control at build time [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9c85c6e0380bdbc37cf1718207f9ef4d0d9b6ef7) __chore(release):__ version bump to 1.9 alpha

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.8.0...v2.0.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
