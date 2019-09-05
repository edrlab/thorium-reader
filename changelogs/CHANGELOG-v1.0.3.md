# Thorium Reader v1.0.3

## Summary

Version `1.0.3` was released on **05 September 2019**.

This release includes the following (notable) new features, improvements and bug fixes:

* Tweaked user interface / user experience, based on testers' feedback
* Better support for assistive technology, including the following screen readers:
  * Narrator, JAWS and NVDA on Microsoft Windows
  * Voice Over on MacOS
  * (not tested on Linux)
* Facilitated keyboard-based interaction, shortcuts and visual outlining
* Improved OPDS support (online catalogs / publication feeds), including search, and error messaging (asynchronous HTTP requests, concurrent downloads)
* Cleaned-up language resources (at the moment: English, French, German), to facilitate contributions / UI translations
* Added a Command Line Interface (CLI) to import multiple publications, "open with" or double-click from the file explorer (registered EPUB file extension)
* Better performance and security, latest NPM package dependencies wherever possible
* Improved developer experience:
  * Stricter TypeScript compiler rules (static type checking)
  * Chromium developer tools with integrated Electron debugger, React and Redux extensions, Axe accessibility checker, and "inspect here" popup menu helper
  * Debugger configuration for Visual Studio Code, Electron main and renderer processes
  * Locales management: scripts and workflow to maintain JSON language resources

## Full Change Log

Git commit diff since `v1.0.2`:
https://github.com/readium/readium-desktop/compare/v1.0.2...v1.0.3

=> **139** GitHub Pull Requests or high-level Git commits.

Here is an exhaustive list of commits created by the following one-liner command line script:

`git --no-pager log --decorate=short --pretty=oneline v1.0.2...v1.0.3 | cut -d " " -f 2- | sed -En '/^([^:]+):(.+)$/!p;s//__\1__\2/p' | sed -En 's/^(.+)$/* \1/p' | sed -En "/PR #([0-9]+)/!p;s//[PR ?#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/p" | sed -En "/(Fixes|See) ?#([0-9]+)/!p;s//[\1 #\2](https:\/\/github.com\/readium\/readium-desktop\/issues\/\2)/p"`

* __fix(dev)__ editorconfig linter was failing on Windows (glob file path)
* __fix__ reader side menu, ARIA levels in TOC tree headings, aria-hidden on collapsed sections, list item containment ([PR ?#670](https://github.com/readium/readium-desktop/pull/670) [Fixes #569](https://github.com/readium/readium-desktop/issues/569) Fixes #672 Fixes #676)
* __hotfix__ display settings radio buttons are not lists, [Fixes #677](https://github.com/readium/readium-desktop/issues/677)
* __fix__ scrollbar extend in library view ([PR ?#673](https://github.com/readium/readium-desktop/pull/673) [Fixes #505](https://github.com/readium/readium-desktop/issues/505))
* __hotfix__ redundant / duplicate nested list containers in TOC tree, [Fixes #671](https://github.com/readium/readium-desktop/issues/671)
* __hotfix__ incorrect ARIA role on radio button, [Fixes #675](https://github.com/readium/readium-desktop/issues/675)
* __hotfix__ [PR ?#667](https://github.com/readium/readium-desktop/pull/667) Screen readers have their own shortcut to activate hyperlinks (e.g. VoiceOver CTRL+OPT+SPACE), consistent focus handling
* __fix__ CSS styles in reader view, font family, etc. ([PR ?#674](https://github.com/readium/readium-desktop/pull/674) [Fixes #449](https://github.com/readium/readium-desktop/issues/449))
* __fix__ Keyboard-accessible and screen-reader friendly TOC navigation, and skip-to-main-content in reader view ([PR ?#667](https://github.com/readium/readium-desktop/pull/667) [Fixes #565](https://github.com/readium/readium-desktop/issues/565) Fixes #156)
* __feature__ "go to page" in reader view, for EPUB pagelist navigation structure ([PR ?#668](https://github.com/readium/readium-desktop/pull/668) [Fixes #82](https://github.com/readium/readium-desktop/issues/82))
* __hotfix__ follow-up to [PR ?#653](https://github.com/readium/readium-desktop/pull/653) ensures Publication Landmarks exist, [Fixes #665](https://github.com/readium/readium-desktop/issues/665)
* __hotfix(dev)__ DevTron dymamically-injected package needs to be in node-externals WebPack directive, [Fixes #666](https://github.com/readium/readium-desktop/issues/666)
* __fix__ temporarily remove LCP support ([PR ?#662](https://github.com/readium/readium-desktop/pull/662), [See #663](https://github.com/readium/readium-desktop/issues/663))
* __fix(ui)__ reader options, pagination radio button ([PR ?#661](https://github.com/readium/readium-desktop/pull/661) [Fixes #660](https://github.com/readium/readium-desktop/issues/660))
* __fix__ single Electron app instance, with CLI support ([PR ?#606](https://github.com/readium/readium-desktop/pull/606) [Fixes #547](https://github.com/readium/readium-desktop/issues/547))
* __chore(dev)__ display name in React Higher Order Component ([PR ?#648](https://github.com/readium/readium-desktop/pull/648))
* __fix__ OPDS publication acquisition, check for duplicate / already-imported during download ([PR ?#646](https://github.com/readium/readium-desktop/pull/646) [Fixes #538](https://github.com/readium/readium-desktop/issues/538))
* __chore(dev)__ R2 package import aliases ([PR ?#658](https://github.com/readium/readium-desktop/pull/658) [Fixes #657](https://github.com/readium/readium-desktop/issues/657))
* __hofix__ follow-up to [PR ?#653](https://github.com/readium/readium-desktop/pull/653) to replace TypeScript "any" with correct type.
* __chore__ NPM package updates (minor semver)
* __fix__ reader navigation menu, landmarks instead of list of illstrations ([PR ?#653](https://github.com/readium/readium-desktop/pull/653) [Fixes #81](https://github.com/readium/readium-desktop/issues/81))
* __fix__ incorrect PostCSS autoprefixer statement ([Fixes #654](https://github.com/readium/readium-desktop/issues/654))
* __fix__ revert console disabling (yargs) ([PR ?#649](https://github.com/readium/readium-desktop/pull/649), reverts PR #485)
* __fix__ Thorium package and executable name ([PR ?#651](https://github.com/readium/readium-desktop/pull/651), related issue #411)
* __fix(a11y)__ accessible label for breadcrumb links ([PR ?#650](https://github.com/readium/readium-desktop/pull/650) [Fixes #602](https://github.com/readium/readium-desktop/issues/602))
* __fix__ removed unnecessary pointer cursor on publication cover image ([PR ?#652](https://github.com/readium/readium-desktop/pull/652) [Fixes #452](https://github.com/readium/readium-desktop/issues/452))
* __chore(dev)__ OPDS API typings ([PR ?#617](https://github.com/readium/readium-desktop/pull/617))
* __fix(l10n)__ German locale names, script tool to create JSON data from CSV ([PR ?#647](https://github.com/readium/readium-desktop/pull/647) [Fixes #430](https://github.com/readium/readium-desktop/issues/430))
* __fix__ OPDS feeds, async HTTP requests with timeouts and error handling, display info to user ([PR ?#542](https://github.com/readium/readium-desktop/pull/542) [Fixes #419](https://github.com/readium/readium-desktop/issues/419) Fixes #418)
* __fix__ ensure non-supported CLI parameters (such a Electron/Chromium ones) are ignored during Yargs parsing ([PR ?#607](https://github.com/readium/readium-desktop/pull/607), see https://github.com/readium/readium-desktop/issues/547#issuecomment-520785137)
* __fix__ OPDS feeds, conversion from relative to absolute URLs + handling of opds:// scheme ([PR ?#639](https://github.com/readium/readium-desktop/pull/639))
* __fix(gui)__ better focus outline thanks to additional padding ([PR ?#637](https://github.com/readium/readium-desktop/pull/637) [Fixes #573](https://github.com/readium/readium-desktop/issues/573))
* __chore(doc)__ CLI usage ([PR ?#640](https://github.com/readium/readium-desktop/pull/640) [Fixes #584](https://github.com/readium/readium-desktop/issues/584))
* __chore(l10n)__ follow-up to [PR ?#641](https://github.com/readium/readium-desktop/pull/641), removed unnecessary Toast code-scanning routine (in i18n-scan script)
* __fix__ "toast" typing and upstream i18next message interpolation ([PR ?#641](https://github.com/readium/readium-desktop/pull/641) [Fixes #534](https://github.com/readium/readium-desktop/issues/534))
* __fix__ Linux executable filename ([PR ?#642](https://github.com/readium/readium-desktop/pull/642) [Fixes #411](https://github.com/readium/readium-desktop/issues/411))
* __chore(dev)__ NPM packages maintenance, minor updates
* __fix__ catalog refresh (recent publications) when reading location changes ([PR ?#635](https://github.com/readium/readium-desktop/pull/635) [Fixes #555](https://github.com/readium/readium-desktop/issues/555))
* __fix(a11y)__ publication grid view - title+author description on cover image, and dedicated label to announce menu button ([PR ?#633](https://github.com/readium/readium-desktop/pull/633) [Fixes #586](https://github.com/readium/readium-desktop/issues/586) Fixes #568)
* __chore(doc, l10n)__ README JSON locale scripts
* __fix(ui)__ dummy cover (CSS gradient), long title+author text overflow now contained ([PR ?#619](https://github.com/readium/readium-desktop/pull/619) [Fixes #491](https://github.com/readium/readium-desktop/issues/491) Fixes #409 partially)
* __chore(dev)__ removed unnecessary build step in dev mode (preload script for R2 navigator)
* __chore(dev)__ added missing "release" folder removal in clean task, and ensure eclint ignores the release folder (very time consuming lint!)
* __chore(dev)__ improved Visual Studio Code main and renderer process debugging ([PR ?#632](https://github.com/readium/readium-desktop/pull/632))
* __chore(dev)__ exclude dev-time packages from the production build (WebPack ignore plugin), as the define plugin + minification does not address this use-case (devtron, react-axe-a11y and the devtools extensions installer)
* __chore(dev)__ WebPack dev server with Hot Module Reload requires inline source maps (otherwise, no breakpoint debugging in the web inspectors of Electron BrowserWindows)
* __chore(build)__ minor hotfix for out-of-date version in package.json for ASAR
* __fix(a11y)__ remove incorrect ARIA labels in list of publications ([PR ?#631](https://github.com/readium/readium-desktop/pull/631) [Fixes #600](https://github.com/readium/readium-desktop/issues/600))
* __chore(doc)__ hotfix README typo (i18n / l10n task / script name)
* __fix(a11y)__ ARIA labels, descriptions for previous/next arrow buttons of cover images slider ([PR ?#630](https://github.com/readium/readium-desktop/pull/630), [Fixes #585](https://github.com/readium/readium-desktop/issues/585))
* __chore(npm)__ minor package updates, mostly patch updates (security, etc. no feature changes) ([PR ?#629](https://github.com/readium/readium-desktop/pull/629))
* __fix(ui)__ removed duplicate OPDS header ([PR ?#627](https://github.com/readium/readium-desktop/pull/627) [Fixes #591](https://github.com/readium/readium-desktop/issues/591))
* __fix(l10n)__ remove duplicated translations, OPDS import publication/sample ([PR ?#628](https://github.com/readium/readium-desktop/pull/628) [Fixes #592](https://github.com/readium/readium-desktop/issues/592))
* __fix__ support for .epub3 extension ([Fixes #544](https://github.com/readium/readium-desktop/issues/544))
* __fix(ui)__ list of catalogs / OPDS feeds, top margin ([PR ?#622](https://github.com/readium/readium-desktop/pull/622) [Fixes #609](https://github.com/readium/readium-desktop/issues/609))
* __fix(opds)__ short search breadcrumb, root catalog context ([PR ?#620](https://github.com/readium/readium-desktop/pull/620) [Fixes #616](https://github.com/readium/readium-desktop/issues/616))
* __fix(l10n)__ French translation tweaks ([PR ?#618](https://github.com/readium/readium-desktop/pull/618))
* __hotfix(l10n)__ removed debug messages ([Fixes #610](https://github.com/readium/readium-desktop/issues/610))
* __fix(a11y)__ screen reader modal dialogs and popup menus ([Fixes #605](https://github.com/readium/readium-desktop/issues/605))
* __fix(a11y,l10n)__ changed untranslated french strings ([Fixes #604](https://github.com/readium/readium-desktop/issues/604))
* __fix(a11y)__ menu ARIA expanded, and menuitem roles ([Fixes #599](https://github.com/readium/readium-desktop/issues/599))
* __fix(dev)__ removed unused React component AddEntryForm ([Fixes #597](https://github.com/readium/readium-desktop/issues/597))
* __fix__ React iterated key'ed markup, Toasts, Grid and List views ([Fixes #562](https://github.com/readium/readium-desktop/issues/562))
* __fix(dev)__ ensures React and Redux dev tools are loaded when the BrowserWindow contents are ready
* __chore(dev)__ added full WebPack config console debug when building in production
* __chore(dev)__ ensures lint task is always called for production builds
* __chore(dev)__ NodeJS TypeScript typings was incorrect version ([Fixes #595](https://github.com/readium/readium-desktop/issues/595))
* __fix__ language locale applied to HTML document root ([Fixes #587](https://github.com/readium/readium-desktop/issues/587))
* __chore(npm)__ minor package updates
* __chore(code)__ OPDS feed parser lib updated with latest TypeScript typings fix (see https://github.com/NYPL-Simplified/opds-feed-parser/commit/d254de4130725bbe0314cfb731b4d87e79e3528b#r34665675 )
* __fix__ Redux Saga was using deprecated API coding style (now 1.* stable lib, was 0.* alpha) ([PR ?#590](https://github.com/readium/readium-desktop/pull/590))
* __chore(code)__ minor variable cleanup
* __feat(dev)__ Axe React a11y checker integrated in DEV mode ([PR ?#589](https://github.com/readium/readium-desktop/pull/589) [Fixes #87](https://github.com/readium/readium-desktop/issues/87))
* __fix(a11y)__ colour contrast, disabled buttons ([PR ?#583](https://github.com/readium/readium-desktop/pull/583) [Fixes #574](https://github.com/readium/readium-desktop/issues/574))
* __feat(dev)__ httpGet refactor, wrapper to fetch remote resources, with TypeScript typing, and error handling ([PR ?#541](https://github.com/readium/readium-desktop/pull/541))
* __fix__ library list view, consistent line/row height, text ellipsis for long publication descriptions ([PR ?#582](https://github.com/readium/readium-desktop/pull/582) [Fixes #553](https://github.com/readium/readium-desktop/issues/553))
* __chore(dev)__ app debugging from Visual Studio Code, improved workflow and error reporting ([PR ?#581](https://github.com/readium/readium-desktop/pull/581))
* __chore(doc)__ added l10n developer information
* __chore(doc)__ fixed build status link
* __chore(l10n)__ tooling pass - sort, scan, typed, to sync locales with codebase and make canonical ([PR ?#566](https://github.com/readium/readium-desktop/pull/566))
* __fix__ app/window menu consistent on Windows, Linux (dev utilities only, same as MacOS) ([PR ?#564](https://github.com/readium/readium-desktop/pull/564) [Fixes #563](https://github.com/readium/readium-desktop/issues/563))
* Npm updates (#561)
* __chore(dev)__ eliminate Redux Saga deprecation warnings (all effect on array yield)
* __chore(dev)__ limit the number of file watchers during hot reloead dev server mode (Linux limited filesystem handles)
* __fix__ MacOS CMD-W to close windows, other menus and dev tools ([PR ?#560](https://github.com/readium/readium-desktop/pull/560) [Fixes #454](https://github.com/readium/readium-desktop/issues/454))
* __chore(typo)__ MenuButton, [Fixes #472](https://github.com/readium/readium-desktop/issues/472)
* __fix__ publication tags are normalized (trimmed, whitespace collapsed) [Fixes #490](https://github.com/readium/readium-desktop/issues/490)
* __fix__ CSS user-select none, except for publication metadata ([PR ?#559](https://github.com/readium/readium-desktop/pull/559) [Fixes #525](https://github.com/readium/readium-desktop/issues/525))
* __fix__ added support for .epub3 file extension ([Fixes #544](https://github.com/readium/readium-desktop/issues/544))
* __feat(dev)__ context menu to inspect element ([PR ?#558](https://github.com/readium/readium-desktop/pull/558) [Fixes #545](https://github.com/readium/readium-desktop/issues/545))
* __feat(dev)__ devtron integration ([PR ?#557](https://github.com/readium/readium-desktop/pull/557) [Fixes #546](https://github.com/readium/readium-desktop/issues/546))
* __NPM update__ i18next (#556)
* __feat__ OPDS feed search ([PR ?#386](https://github.com/readium/readium-desktop/pull/386) [Fixes #296](https://github.com/readium/readium-desktop/issues/296))
* __fix__ library view, list mode, click-on-line to open reader ([PR ?#548](https://github.com/readium/readium-desktop/pull/548) [Fixes #497](https://github.com/readium/readium-desktop/issues/497))
* __fix__ empty library view (no publications), drag-drop / import message ([PR ?#549](https://github.com/readium/readium-desktop/pull/549) [Fixes #537](https://github.com/readium/readium-desktop/issues/537))
* __fix__ OPDS addition/import form (popup modal dialog), invoked from button ([PR ?#550](https://github.com/readium/readium-desktop/pull/550) [Fixes #345](https://github.com/readium/readium-desktop/issues/345))
* __fix(a11y)__ "skip to main" link style and position ([PR ?#551](https://github.com/readium/readium-desktop/pull/551) [Fixes #470](https://github.com/readium/readium-desktop/issues/470))
* __fix__ toast notifications had html unicode escape sequences / charcodes ([PR ?#552](https://github.com/readium/readium-desktop/pull/552) [Fixes #453](https://github.com/readium/readium-desktop/issues/453))
* __chore(dev)__ downloader TypeScript typings ([PR ?#543](https://github.com/readium/readium-desktop/pull/543))
* __fix (arch)__ pass boolean value into react props to indicate when api promise is rejected (known error or unexpected exception) ([PR ?#539](https://github.com/readium/readium-desktop/pull/539))
* library term becomes bookshelf
* Better labels, a11y, English
* Correction of multiple typos in English
* __fix__ window rectangle bounds, non-rounded decimal values crash DB backend ([PR ?#536](https://github.com/readium/readium-desktop/pull/536) [Fixes #532](https://github.com/readium/readium-desktop/issues/532))
* __fix(l10n)__ delete feed vs. publication ([PR ?#533](https://github.com/readium/readium-desktop/pull/533) [Fixes #501](https://github.com/readium/readium-desktop/issues/501))
* __hotfix__ reference to Electron BrowserWindow (library view) maintained in new createWindows.ts file split from maint.ts (follow-up to [PR ?#403](https://github.com/readium/readium-desktop/pull/403))
* __fix__ base64 encode / decode errors ([PR ?#531](https://github.com/readium/readium-desktop/pull/531) [Fixes #522](https://github.com/readium/readium-desktop/issues/522) Fixes #486)
* __fix__ [Fixes #530](https://github.com/readium/readium-desktop/issues/530) confusing console error message for i18n language query from database (missing key)
* __hotfix__ [PR ?#471](https://github.com/readium/readium-desktop/pull/471) duplicate configRepository.save() [Fixes #529](https://github.com/readium/readium-desktop/issues/529)
* __hotfix__ window resize / move event handling, follow-up to #403 and #524 (bad merge, and uncaught debounce() coding error)
* __chore__ refreshed package-lock.json which had been updated incrementally several times recently
* __fix__ stricter TypeScript and TSLint code checks ([PR ?#404](https://github.com/readium/readium-desktop/pull/404))
* __feat__ CLI Command Line Interface - import EPUBs, OPDS, read EPUBs ([PR ?#403](https://github.com/readium/readium-desktop/pull/403) [Fixes #85](https://github.com/readium/readium-desktop/issues/85))
* __fix__ library and reader windows bounds / position + dimensions ([PR ?#524](https://github.com/readium/readium-desktop/pull/524) [Fixes #492](https://github.com/readium/readium-desktop/issues/492) Fixes #494)
* __fix(10n)__ updated codebase static analyzer to capture dynamic locale keys used in notification toasts ([PR ?#527](https://github.com/readium/readium-desktop/pull/527) [Fixes #526](https://github.com/readium/readium-desktop/issues/526))
* __feat__ Microsoft Windows Store AppX images ([PR ?#521](https://github.com/readium/readium-desktop/pull/521))
* http request update ([PR ?#523](https://github.com/readium/readium-desktop/pull/523) PR #481 [Fixes #463](https://github.com/readium/readium-desktop/issues/463))
* __fix__ reader view, navigation (TOC), "title"-only headings should not be clickable, should be inert. ([Fixes #520](https://github.com/readium/readium-desktop/issues/520))
* __fix__ updated r2-shared-js NPM package which addresses publications with no resources (only spine items)
* __fix__ package.json version in about info ([Fixes #473](https://github.com/readium/readium-desktop/issues/473))
* __fix(l10n)__ publication languages shown in the user's locale ([Fixes #519](https://github.com/readium/readium-desktop/issues/519))
* __fix__ application / product name in epubReadingSystem info ([Fixes #510](https://github.com/readium/readium-desktop/issues/510))
* __chore(code)__ consistent use of preprocessor directive / build-time constants ([Fixes #511](https://github.com/readium/readium-desktop/issues/511))
* __fix(l10n)__ replaced prefix/suffix bash shell script with wrap NodeJS code ([Fixes #514](https://github.com/readium/readium-desktop/issues/514))
* __fix(l10n)__ replace native shell utility for JSON sort with NodeJS script ([Fixes #514](https://github.com/readium/readium-desktop/issues/514))
* __fix(l10n)__ removed unused locale keys (static codebase analysis, i18next calls) (#516 [Fixes #509](https://github.com/readium/readium-desktop/issues/509))
* __feat(l10n)__ typings for i18next JSON locales ([PR ?#518](https://github.com/readium/readium-desktop/pull/518) PR #517)
* __hotfix__ found typo in license header (`node ../r2-utils-js/tools/license_header.js src/`)
* __fix__ JSON locales checking (discover missing and redundant keys) ([PR ?#506](https://github.com/readium/readium-desktop/pull/506) [Fixes #397](https://github.com/readium/readium-desktop/issues/397) Fixes #476)
* __chore(code)__ reader.tsx cleanup, queryParam, publication URL ([PR ?#513](https://github.com/readium/readium-desktop/pull/513))
* __fix__ reader view, publication info button now works at first opening ([PR ?#512](https://github.com/readium/readium-desktop/pull/512) [Fixes #292](https://github.com/readium/readium-desktop/issues/292))
* __fix__ css-hot-loader was in production build ([Fixes #432](https://github.com/readium/readium-desktop/issues/432))
* __fix__ unused and misplaced NPM dependencies ([PR ?#504](https://github.com/readium/readium-desktop/pull/504) [Fixes #499](https://github.com/readium/readium-desktop/issues/499))
* __fix__ flickering navbar ([PR ?#498](https://github.com/readium/readium-desktop/pull/498))
* __chore__ R2 NPM packages updates (notably, consistent reflect-metadata version for ta-json) ([PR ?#495](https://github.com/readium/readium-desktop/pull/495))
* __fix__ delete publication (in library view) => close opened readers ([PR ?#489](https://github.com/readium/readium-desktop/pull/489) [Fixes #448](https://github.com/readium/readium-desktop/issues/448))
* __fix__ migrate deprecated "new Buffer()" API to "Buffer.from()" ([PR ?#487](https://github.com/readium/readium-desktop/pull/487))
* __fix__ disable console functions in PACKAGED mode, in addition to debug() ([PR ?#485](https://github.com/readium/readium-desktop/pull/485))

Note that the changelog generated by the [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) only contains a limited number of entries, thus why we use a shell script.
