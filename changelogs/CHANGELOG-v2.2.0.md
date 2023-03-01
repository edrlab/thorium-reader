# Thorium Reader v2.2.0

## Summary

Version `2.2.0` was released on **27 November 2022**.

This release includes the following (notable) new features, improvements and bug fixes:

* Updated translations: English, Simplified Chinese, Traditional Chinese, Italian, Japanese, Lithuanian, Spanish, Swedish
* Now with Electron 21 (more recent Chromium web browser engine)
* Feature: show accessibility metadata in publication info dialog
* Fix: MathML support via MathJax, screen reader interaction (accessibility)
* Feature: navigation history, back / forward buttons with keyboard shortcuts
* Fix: TTS and Media Overlays playback options were reset to default values in GUI but not in backend
* Fix: EPUB FXL Fixed-Layout pre-paginated publications can now render with single centered pages (override from authored spread rules, when aspect ratio is portrait instead of landscape)
* Feature: EPUB FXL Fixed-Layout zoom now with keyboard shorcuts (increase, decrease and reset)
* Fix: EPUB FXL and reflowable, support for pagebreak and pagelist edge cases, improved "goto page" navigation
* Fix: support for self-closing body HTML tag in document parser
* Fix: keyboard focus returns to popup menu callsite after cancel-closing publication delete modal dialog (improves usability and accessibility with screen readers)
* Fix: improved popup modal dialog GUI, better default enter key behaviour and form submission behaviour
* Fix: improved CSS styling in reader menu, removed non-implemented annotation menu (future feature)
* Fix: OPDS HTTP basic authentication now handles 302 "found" redirection for GET requests
* Fix: OPDS indirect acquisitions can have child subtype, now display EPUB/PDF and LCP info in download buttons (after generic authenticated borrow action)
* Feature: OPDS edit feed title and url
* Fix: tag name with special characters now supported
* Fix: DAISY v2.02 HTML NCC metadata parsing, multimedia type full text audio is default
* Feature: OPDS HTTP `digest` authentication scheme, supports Calibre content server
* Fix: multilingual metadata parsing (title, author, etc.), RTL for Hebrew, Arabic, etc. now displayed correctly
* Fix: URL protocol/scheme handlers thorium:// and opds:// work on Mac Linux and Windows
* Fix: MacOS 'window' menu in top-level instead of submenu
* Fix: accessible screen reader label for secondary navigation landmark in bookshelf is just "menu" to avoid duplication of announcement
* Fix: added application keywords for Linux integration
* Fix: clearer error reporting when opening a file with unsupported extension (derived from HTTP content-type or obtained from filesystem)
* Fix: Mac and Linux application icons
* Fix: cancelling one download only now works
* Fix: publication info, list of authors now complete
* Fix: OPDS, support for DAISY application/zip mimetype

(previous [v2.1.0 changelog](./CHANGELOG-v2.1.0.md))

## Full Change Log

Git commit diff since `v2.1.0`:
https://github.com/edrlab/thorium-reader/compare/v2.1.0...v2.2.0

=> **68** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/60b336c229a5d5caeb6030312111f4adeb7ee325) __fix(l10n):__ update Simplified Chinese translation (PR [#1889](https://github.com/edrlab/thorium-reader/pull/1889) PR [#1862](https://github.com/edrlab/thorium-reader/pull/1862) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6e0a95c46dad31dbc4208a501a21054f321fffae) __fix(l10n):__ updated JSON locales
* [(_)](https://github.com/edrlab/thorium-reader/commit/f4407b886f59e58a91690d2522863669ea12e530) __fix(l10n):__ update Traditional Chinese translation (PR [#1888](https://github.com/edrlab/thorium-reader/pull/1888) PR [#1855](https://github.com/edrlab/thorium-reader/pull/1855) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8cc51d132ecced86f54995aea72a4055a6a35694) __fix(l10n):__ update Italian translation (PR [#1887](https://github.com/edrlab/thorium-reader/pull/1887) PR [#1864](https://github.com/edrlab/thorium-reader/pull/1864) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/5ad12f83f3177d1bbf5725a6e3b765add0fb5e5e) __fix(l10n):__ update Japanese translation (PR [#1886](https://github.com/edrlab/thorium-reader/pull/1886) PR [#1858](https://github.com/edrlab/thorium-reader/pull/1858) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/f41d02a0161037975b049a509974ec02fbb1c0d0) __fix(l10n):__ update Lithuanian translation (PR [#1885](https://github.com/edrlab/thorium-reader/pull/1885) PR [#1851](https://github.com/edrlab/thorium-reader/pull/1851) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2cd81feef81724de1329c1cd1c5ae2e214b2a2a0) __fix(l10n):__ update Spanish translation (PR [#1854](https://github.com/edrlab/thorium-reader/pull/1854) PR [#1884](https://github.com/edrlab/thorium-reader/pull/1884) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ad930a3430a33d43dae906be5ab6b87eeeb885df) __fix(l10n):__ typos in English translation (PR [#1852](https://github.com/edrlab/thorium-reader/pull/1852) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2808236329b8cac1cc13a582ade3a7510d0a79ac) __fix(l10n):__ update Swedish translation (PR [#1883](https://github.com/edrlab/thorium-reader/pull/1883) PR [#1857](https://github.com/edrlab/thorium-reader/pull/1857) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b07c2016790481c85118ac1e8c36144bf93eda6) __fix(l10n):__ updated Simplified Chinese translation (PR [#1882](https://github.com/edrlab/thorium-reader/pull/1882) PR [#1866](https://github.com/edrlab/thorium-reader/pull/1866) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/a15b33fbaaf1c6a1e483906f81abb5e0bfe8210d) __feat:__ EPUB FXL Fixed-Layout pre-paginated publications can now render with single centered pages (override from authored spread rules, when aspect ratio is portrait instead of landscape)
* [(_)](https://github.com/edrlab/thorium-reader/commit/39a6d28deec2e42487512dc1857a7b68fac33dfc) __fix:__ EPUB Fixed Layout zoom feature, now with keyboard shorcuts for plus, minus and reset (Fixes [#1825](https://github.com/edrlab/thorium-reader/issues/1825) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8af2b2dffe065eae1ec88d049cafa0a0b8f35cfb) __fix:__ TTS options were reset to default values in GUI but not in backend (affected media overlays too)
* [(_)](https://github.com/edrlab/thorium-reader/commit/96e502f377b4c8db79475b1a8f47bea80ee5e9b8) __fix:__ EPUB FXL and reflowable support for pagebreak and pagelist edge cases, "goto page" navigation (Fixes [#1881](https://github.com/edrlab/thorium-reader/issues/1881) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c1e3ccd2f49c789c776b62937ddaab91f35ebfaa) __fix:__ support for self-closing body HTML tag (Fixes [#1880](https://github.com/edrlab/thorium-reader/issues/1880) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/26c5b3a2e989b42678c96f17ac16aa6f617633d7) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/4bc3e3f330cc7b4f16ace2733e0cb8eb10e733fa) __fix(a11y):__ keyboard focus returns to popup menu callsite after cancel-closing publication delete modal dialog (Fixes [#773](https://github.com/edrlab/thorium-reader/issues/773) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0e99499b7fdad8c567f7b9df6bfe247d590f2060) __fix:__ popup modal dialog GUI improved, better default enter key behaviour and form submission (PR [#1856](https://github.com/edrlab/thorium-reader/pull/1856) Fixes [#1635](https://github.com/edrlab/thorium-reader/issues/1635))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9967b6bcf813a66984dc163c63692150ce791482) __fix(GUI):__ improved CSS in reader view menu (Fixes [#1874](https://github.com/edrlab/thorium-reader/issues/1874) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/253ae1648a3d856ab181403617da041683a59dcf) __fix:__ removed non-implemented annotation menu (PR [#1873](https://github.com/edrlab/thorium-reader/pull/1873)  Fixes [#1872](https://github.com/edrlab/thorium-reader/issues/1872) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a01dc6e97184c47913de1b34f58d5d53a2764e6) __fix:__ navigation history ignores http: mailto: etc. URLs (only handles in-publication links) (Fixes [#1876](https://github.com/edrlab/thorium-reader/issues/1876) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/33db0aa183fdf6b4390443f4a55c4f0e52cfe95a) __fix:__ handle HTTP 302 "found" for GET requests, fixes a known case of redirected OPDS basic authentication (PR [#1877](https://github.com/edrlab/thorium-reader/pull/1877) Fixes [#1875](https://github.com/edrlab/thorium-reader/issues/1875) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/703c775b0b8af22713c70c25848b060d0b654b26) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/29ac5ae0407516662be25f8d187dba5b5864018b) __fix(PDF):__ Electron webview session partition handling (protocol handler is default unamed)
* [(_)](https://github.com/edrlab/thorium-reader/commit/86e3d4aa091c639a4e87e4238aaebfc9bbb28bf9) __chore(NPM):__ package updates, Electron v21 (was v19)
* [(_)](https://github.com/edrlab/thorium-reader/commit/12264d6188035dabedf2bbb05404d9ba3ba2769a) __fix(OPDS):__ indirect acquisitions can have child subtype, now display EPUB/PDF and LCP info in download buttons (after generic authenticated borrow action)
* [(_)](https://github.com/edrlab/thorium-reader/commit/9b15f5ede81f7dd0514740be3c4776439f1f2bda) __chore(NPM):__ updated package dependencies, including Electron v21
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d48f88691134b8d0f53bbe5a0f70b7f0d3d6904) __feature(a11y):__ show accessibility metadata in publication info dialog (PR [#1839](https://github.com/edrlab/thorium-reader/pull/1839)  Fixes [#1332](https://github.com/edrlab/thorium-reader/issues/1332) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/48917cf01fc0fd687a656e0da26be313c930250b) __feature(OPDS):__ edit feed title and url (PR [#1843](https://github.com/edrlab/thorium-reader/pull/1843) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4885ca5994c36aa2f2924ba5f15989d04f2b3274) __fix(l10n):__ Lithuanian updates (PR [#1845](https://github.com/edrlab/thorium-reader/pull/1845) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/061886f6201294ef49d22fdb017ff68e51c92f1b) __fix:__ doc typos (PR [#1846](https://github.com/edrlab/thorium-reader/pull/1846) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/7c7f5de4ed3f57169cf2be005f940c6be353125f) __fix:__ tag name in react-router encoded with encodeURIComponent_RFC3986
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a924cdd2cd44665d9cf5edc04974912b5264343) __fix:__ a11y metadata parsing, also updated NPM packages other than r2-shared-js
* [(_)](https://github.com/edrlab/thorium-reader/commit/0367bdf65212be0f5746744de62320dec13a7fdb) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/55866f2a37959f790fb1b02b8a56950b5e477cb6) __fix(DAISY):__ v2.02 HTML NCC metadata parsing, multimedia type full text audio is default
* [(_)](https://github.com/edrlab/thorium-reader/commit/1def76bebef351aa3f531f9b292d363761e6c03b) __fix:__ opds authentication 'authentication.AdditionalJSON' maybe undefined
* [(_)](https://github.com/edrlab/thorium-reader/commit/4501cd1e2e03c32680cfa72afd729229ee39dee6) __fix(GUI):__ navigation history arrows now better SVG icon, and enabled in fullscreen mode (follows Fixes [#1198](https://github.com/edrlab/thorium-reader/issues/1198) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/625a7831d6e4b61dd1969241f95fe0642c4a5b22) __fix(UI):__ back/forward icons for navigation history, restored to original proposal but added code comments for alternatives, see https://github.com/edrlab/thorium-reader/issues/1198#issuecomment-1280696043
* [(_)](https://github.com/edrlab/thorium-reader/commit/538dd9ac27967b3e56dc6881cac83c5994d4c19b) __chore(NPM):__ package updates, required CSS linting fixes (url import statements)
* [(_)](https://github.com/edrlab/thorium-reader/commit/a407d1669bde9dc904ce640150a5ab148976f12a) __feat:__ navigation history, back / forward buttons and keyboard shortcuts (PR [#1200](https://github.com/edrlab/thorium-reader/pull/1200) Fixes [#1198](https://github.com/edrlab/thorium-reader/issues/1198) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd5bd6ac62d3bbb781e4e924ec48c0007f85e829) __feat(OPDS):__ HTTP `digest` authentication scheme, supports Calibre content server (PR [#1832](https://github.com/edrlab/thorium-reader/pull/1832)  Fixes [#1829](https://github.com/edrlab/thorium-reader/issues/1829) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e608910d2816e15175f901fabd5b7b24294bb12c) __feat(l10n):__ Traditional Chinese translation (PR [#1830](https://github.com/edrlab/thorium-reader/pull/1830) PR [#1835](https://github.com/edrlab/thorium-reader/pull/1835) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/18774254d109b9e35048cd1ff2a6da23fcace400) __chore(NPM):__ package update r2-shared-js (internal fixes in metadata multilingual parsing)
* [(_)](https://github.com/edrlab/thorium-reader/commit/d67cab6ae21ddc2f9eecf27c8e0bdf1b26fa9a62) __fix(metadata):__ publication title now displayed with correct locale/direction (RTL for Hebrew, Arabic, etc.)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4cb489f658852b402676e695e92a59d6f88d639e) __chore(dev):__ unit tests with Jest are now working again
* [(_)](https://github.com/edrlab/thorium-reader/commit/db906491f88eb9053f426a7236ac60ee91c29fdc) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/c310de39231e321c0ff0738312c10250d6841243) __chore(NPM):__ removed unused package dependency (Fixes [#1818](https://github.com/edrlab/thorium-reader/issues/1818) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/12b8925181412eeb5491b25c6632b21c710c06cc) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/f9f350caa5c9702f14f6c4f83cccafbd124401f3) __fix:__ publication `publisher` metadata potentially undefined (PR [#1814](https://github.com/edrlab/thorium-reader/pull/1814) Fixes [#1810](https://github.com/edrlab/thorium-reader/issues/1810) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/1814b262f2e48324d59b9d3071e2a09a2cf0d5ea) __fix:__ URL protocol/scheme handlers thorium:// and opds:// work on Mac Linux and Wondpw (PR [#1802](https://github.com/edrlab/thorium-reader/pull/1802))
* [(_)](https://github.com/edrlab/thorium-reader/commit/411f6312a856469a7f8fac8a728f16b31e052f9f) __fix(dev):__ Electron/Chromium devTools automatically open only when THORIUM_OPEN_DEVTOOLS env var is set (PR [#1822](https://github.com/edrlab/thorium-reader/pull/1822))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a459e9b596c6e789b9905855dfd8a13d209eeec4) __fix(release):__ removed unnecessary and broken MathJax dependency in src/package.json (Electron Builder production dependencies) (PR [#1823](https://github.com/edrlab/thorium-reader/pull/1823) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ce377b2cb81a190b47c3e44f478bf2f8f0f596a) __hotfix:__ add missing 'cancel' file from previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/034cc93007d4e3e086beac7636673dfc59414dd1) __fix(OPDS):__ when user cancels authenticaton dialog, go back (router history) (PR [#1819](https://github.com/edrlab/thorium-reader/pull/1819) Fixes [#1405](https://github.com/edrlab/thorium-reader/issues/1405) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/aeca8cbba848603e8207008c7f0ab07682f10803) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d983c8ac757f747dcafa1aa589be89a2723d52f2) __fix(GUI):__ MacOS 'window' menu in top-level instead of submenu (PR [#1808](https://github.com/edrlab/thorium-reader/pull/1808) Fixes [#1137](https://github.com/edrlab/thorium-reader/issues/1137) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/95d4c147512e4199c76c63643e505103d2430dad) __fix(a11y):__ screen reader label for secondary navigation landmark in bookshelf is just "menu" to avoid duplication of announcement (Fixes [#1716](https://github.com/edrlab/thorium-reader/issues/1716) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/440886b78725f55a0130891e03147ea6c2265367) __fix:__ added Linux application keywords (PR [#1646](https://github.com/edrlab/thorium-reader/pull/1646) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/b32f20113d2c93caa285c2e5694f2a3aa7a0ba25) __fix:__ clearer error reporting when opening a file with unsupported extension (derived from HTTP content-type or obtained from filesystem) (PR [#1803](https://github.com/edrlab/thorium-reader/pull/1803) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e000a0e6638d9350379c8200e029b122f103e75b) __fix:__ Linux application icons (PR [#1805](https://github.com/edrlab/thorium-reader/pull/1805)  Fixes [#1241](https://github.com/edrlab/thorium-reader/issues/1241))
* [(_)](https://github.com/edrlab/thorium-reader/commit/83c9803baa9c7a9eea5ff6f614e68d891e94c6dc) __fix:__ Mac application dock icon was too large (PR [#1804](https://github.com/edrlab/thorium-reader/pull/1804) Fixes [#1664](https://github.com/edrlab/thorium-reader/issues/1664) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0b80bab12faf2c932675bb4d0b797a5c41b8bee6) __fix:__ cancelling one download only (PR [#1806](https://github.com/edrlab/thorium-reader/pull/1806) Fixes [#1613](https://github.com/edrlab/thorium-reader/issues/1613))
* [(_)](https://github.com/edrlab/thorium-reader/commit/023b6b81329edeb6fc9f864cef7ee0cfc826c38f) __fix(UI):__ publication info, list of authors now complete (PR [#1807](https://github.com/edrlab/thorium-reader/pull/1807) Fixes [#1586](https://github.com/edrlab/thorium-reader/issues/1586) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/100d876bcbc0ab17002f92210972bc1cadd1ca5a) __feat(OPDS):__ support for DAISY application/zip mimetype (PR [#1730](https://github.com/edrlab/thorium-reader/pull/1730) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/12398fab6a1a930bc5b1ade2c6fc03428b641efc) __fix(OPDS):__ some feeds have undefined properties (PR [#1801](https://github.com/edrlab/thorium-reader/pull/1801) Fixes [#1800](https://github.com/edrlab/thorium-reader/issues/1800) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2ad37fa8d4753c308b6d39b3f7c9439e09d93447) __fix(l10n):__ reinstated Swedish (Fixes [#1734](https://github.com/edrlab/thorium-reader/issues/1734) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/49b9a2a12bd1ece6355393b0697fb0802153e4c6) __fix(l10n):__ Swedish locale typo (PR [#1728](https://github.com/edrlab/thorium-reader/pull/1728))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0cde7e3c45c19383c03a06134dc82af4b240aac4) __chore(release):__ version bump (2.1.1-alpha.0)

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v2.1.0...v2.2.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
