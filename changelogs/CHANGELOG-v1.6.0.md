# Thorium Reader v1.6.0

## Summary

Version `1.6.0` was released on **16 February 2021**.

This release includes the following (notable) new features, improvements and bug fixes:

* Thorium is now based on Electron version 11.
* The Windows installer is now code-signed (no more scary warning messages)
* Localization: updated Japanese and Spanish translations, added Finnish, Russian, Chinese translation.
* Accessibility: improved screen reader detection to trigger force-refresh in the content webview.
* Support for DAISY3 audio-only, audio+text and text-only talking books.
* OPDS authentication: OAuth2 access/refresh token, HTTP cookies, SAML for Library Simplified (Lyrasis).
* OPDS browser: better UI layout (navigation links, facets, groups).
* The "about Thorium" information is now an automatically-generated Web Publication which opens in the reader view.
* LCP: clarified error message for license rights.start in the future, vs. LSD expired status, added sanity check / safeguard for not-well-formed licenses (e.g. HTTP response error code body, or corrupted local file), localized URL hint hyperlink.
* PDF: significant improvements, performance, bug fixes, layout features (still based on Mozilla PDF.js).
* Library / bookshelf: fixed open publication from filesystem / drag-and-drop, removed unnecessary confirm dialog for importing a small number of publications using drag-drop.
* User interface: fixed long unbreakable titles in publication info dialog, title/author ellipsis on 2-lines max layout.
* Reader view: added support for user-installed system fonts (in addition to ReadiumCSS predefined typefaces), reflowable documents are now paginated by default (was scroll mode before), fixed the hyperlink :target CSS styles (temporary green outline), prevent mouse-drag on UI controls, links, etc. inside EPUB HTML, PDF documents.
* Reader settings: Reduce Motion and Disable Footnotes display settings (+ moved MathJax toggle).
* New reader navigation feature: goto begin/end of publication, CTRL HOME/END keyboard shortcuts, and shift-click on left/right arrow button icons.
* Reader "goto page" now has a keyboard shortcut, and works with authored pageList as well as intrinsic page units such as with fixed layout FXL publications, PDF, etc.
* Reader interaction: mouse wheel scroll and touchpad two-finger swipe/drag to turn pages left/right (on bottom footer progress bar and arrows).
* Reader navigation panel: increased table of contents interline.
* Reader footnotes: fixed same-document content restriction.
* Search: fixed DOM / XHTML parsing issue, added keyboard shortcuts for find previous/next commands.
* Divina: audio/video streaming now works.
* Database: internal application state saved at every 3 minutes interval, plus persistence guaranteed on app shutdown (was too frequent before).
* Development: added WebPack bundle analyser (dependency analysis), replaced deprecated TSLint with ESLint + Prettier (code linting / formatting checks).
* ... and many more smaller changes listed below.

(previous [v1.5.0 changelog](./CHANGELOG-v1.5.0.md))

## Full Change Log

Git commit diff since `v1.5.0`:
https://github.com/edrlab/thorium-reader/compare/v1.5.0...v1.6.0

=> **134** GitHub Pull Requests or high-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/4dc8d3d8fd850453ddf020fa662880941bff9124) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/0923ff2b378d877d93bf83a9c386da615af2f1d6) __chore(dev):__ replace deprecated TSLint with ESLint + Prettier (PR [#1374](https://github.com/edrlab/thorium-reader/pull/1374) Fixes [#625](https://github.com/edrlab/thorium-reader/issues/625) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e813cccbaac6017573503c0c6f685c0b06c8824b) __fix (l10n):__ updated Japanese Translation (PR [#1372](https://github.com/edrlab/thorium-reader/pull/1372) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/5cc28f5a295842d2b020d5e1784f569ed83899ae) __chore(code):__ cleanup redundant OPDS auth key/value escaping (decodeURIComponent)
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ee0ce41eef1f3ddcff5a5a21bb73a5af9f66a5b) __fix(OPDS):__ slow servers tolerance, increased from 5s to 10s
* [(_)](https://github.com/edrlab/thorium-reader/commit/b578179718768110b6db765588f882e9aa767e48) __fix(ilnt):__ code checks via TSLint are unreliable, time to migrate to ESLint (see [#625](https://github.com/edrlab/thorium-reader/issues/625) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/61a35dcb5d2aad55e365ca163f9ef17940414ea9) __fix(OPDS):__ username/password for auth data was not decodeURIComponent'ed (incorrect base64 HTTP auth basic header was causing 401 status codes)
* [(_)](https://github.com/edrlab/thorium-reader/commit/bd81f9f2d84e936afe127ea6373ed486a711803f) __feat:__ user-installed system fonts, in addition to ReadiumCSS predefined typefaces (PR [#1373](https://github.com/edrlab/thorium-reader/pull/1373) Fixes [#766](https://github.com/edrlab/thorium-reader/issues/766) Fixes [#765](https://github.com/edrlab/thorium-reader/issues/765) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/684b0a24cfa8378b59ae685786a3b61baf2e131e) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/010ca1d33779babea7b217513209a928e8e5760f) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/726e70d6abecd758a54ffbd46eaecbc9bed1d00b) __fix:__ code fixes for absolute URL resolving, handling of Windows filepaths, and percent-encoded hrefs (PR [#1370](https://github.com/edrlab/thorium-reader/pull/1370))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f31fc4c905dbd5d8e76a59984645fe415c269c26) __feat(l10n):__ XHTML "about Thorium" documents (PR [#1371](https://github.com/edrlab/thorium-reader/pull/1371))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c03bd7e52fdcbdcd70a2e911c9b49b26f1d30be) __fix(about):__ follow-up PR [#1370](https://github.com/edrlab/thorium-reader/pull/1370) and commit a47e73f4f339e7436bcf08a84ea6f704b17508d3
* [(_)](https://github.com/edrlab/thorium-reader/commit/cbcde7a2469c68b00ee8886c85346be9bec81fa9) __fix(about):__ about publication always re-generated (Fixes [#1369](https://github.com/edrlab/thorium-reader/issues/1369))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8322de68215e725b5527c5504860742a910ae348) chore(a47e73f4f339e7436bcf08a84ea6f704b17508d3) lint previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/a47e73f4f339e7436bcf08a84ea6f704b17508d3) fix(about) os windows path error on both images and xhtml (fixes [#1328](https://github.com/edrlab/thorium-reader/issues/1328))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ad6fe6e0227647fdb283332bd9e3fa737a920e31) __fix(catalog):__ undefined publication on lastReadedPublication finder
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ff591f2cd87df499f89519bfa67dcf406c00848) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/c1ac3db7b23b04cbf2769e7940d043417fa4e1bf) __feat(OPDS):__ SAML authentication for Library Simplified, Lyrasis (PR [#1366](https://github.com/edrlab/thorium-reader/pull/1366) original PR [#1272](https://github.com/edrlab/thorium-reader/pull/1272) Fixes [#1237](https://github.com/edrlab/thorium-reader/issues/1237))
* [(_)](https://github.com/edrlab/thorium-reader/commit/566243d56bbc474308032eb194bf17a32a6debac) __chore(NPM):__ package updates, including minor Electron v11 VoiceOver fixes, etc.
* [(_)](https://github.com/edrlab/thorium-reader/commit/32b804d471d698e6a5e8defeb7c28648f72ae1ea) __fix(OPDS):__ feed navigation menu on the left, publications on the right (PR [#1363](https://github.com/edrlab/thorium-reader/pull/1363) Fixes [#1294](https://github.com/edrlab/thorium-reader/issues/1294))
* [(_)](https://github.com/edrlab/thorium-reader/commit/66f5815ffa2e60421a30e937f35c5fce8001a829) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/30bd54d20748c406d55d6e1132231f9375e94df4) __feat(OPDS):__ group navigation label (PR [#1360](https://github.com/edrlab/thorium-reader/pull/1360) Fixes [#1295](https://github.com/edrlab/thorium-reader/issues/1295))
* [(_)](https://github.com/edrlab/thorium-reader/commit/91fea7de1d181c6c5a64238f1b5e15d2d904e160) __chore:__ code cleanup, remove unused translated locale names (PR [#1365](https://github.com/edrlab/thorium-reader/pull/1365))
* [(_)](https://github.com/edrlab/thorium-reader/commit/da7a089a2cbdcc2863c0129517082de8ce58f81a) __chore(l10n):__ XHTML formatting ('es' and 'ja' only, 'en' and 'fi' are ok)
* [(_)](https://github.com/edrlab/thorium-reader/commit/09fd6900f62cffcc6da1fc36789d2500691eea57) __feat(l10n):__ Finnish translation (PR [#1364](https://github.com/edrlab/thorium-reader/pull/1364) Original PR: [#1362](https://github.com/edrlab/thorium-reader/issues/1362))
* [(_)](https://github.com/edrlab/thorium-reader/commit/760ddf0faf552e6cc23bea1d5ebf755b52981f2c) __fix:__ instead of saving the internal state every second into the database, increase the interval to 3 minutes (state is persisted on app shutdown too) (PR [#1359](https://github.com/edrlab/thorium-reader/pull/1359) Related issue: [#1274](https://github.com/edrlab/thorium-reader/issues/1274) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4c7ec27f44a36b2ab1b2255a1e5289ff09fa3860) __chore(ci):__ NPM v7 was breaking the build, so now ensure NPM v6 is used
* [(_)](https://github.com/edrlab/thorium-reader/commit/4f18f7a8a36ece75623097b33c04c990e2e32cef) __chore(ci):__ troubleshooting GitHub Actions which has entered an infinite loop of doom (NPM ERR! repeated for 6 hours until VM is shutdown)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5c354e0d829e2ea1697572cb2a9ddf90604e04fd) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/1dac736089b9cb38a21eef685b1de5b655be6c41) __fix(UI):__ long unbreakable titles in publication info dialog, and title/author ellipsis on 2-lines max layout (Fixes [#1345](https://github.com/edrlab/thorium-reader/issues/1345) Fixes [#1358](https://github.com/edrlab/thorium-reader/issues/1358) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/cd9c450877b7820af7ffbb40a44533d1c267dcbc) __fix(l10n):__ updated Spanish translation, including new XHTML "about Thorium" info (PR [#1353](https://github.com/edrlab/thorium-reader/pull/1353))
* [(_)](https://github.com/edrlab/thorium-reader/commit/01581e540e88f165a26fdc225e750dcc33e04028) __fix(LCP):__ correct UI message for license rights.start in the future, vs. LSD expired status (PR [#1357](https://github.com/edrlab/thorium-reader/pull/1357) Fixes [#1351](https://github.com/edrlab/thorium-reader/issues/1351) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4c031ef8b49df2cc30217efe5c0902e53c2ad5a8) __chore(release):__ first-pass documentation for 1.6.0 release (changelog, distillation of 100+ commits into human-readable release notes)
* [(_)](https://github.com/edrlab/thorium-reader/commit/cf04170d65959b66cef906f3cbe362d8dbbd73c0) __fix(UI):__ delete publication wap primary button (fixes [#1352](https://github.com/edrlab/thorium-reader/issues/1352))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f763ef65bcb13b75ab5c6b5d7cfc87b9cea6fdfc) __fix(about):__ about filter by tags disabled (fixes [#1350](https://github.com/edrlab/thorium-reader/issues/1350) twice)
* [(_)](https://github.com/edrlab/thorium-reader/commit/3c7fb457459db13d50344df3b3b1205de2c05794) __fix(about):__ about book visible in search query result (fixes [#1350](https://github.com/edrlab/thorium-reader/issues/1350))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a11780ad087f0ef4ffff1db7deb0f8f4909c34f2) __doc:__ updates Japanese translation (PR [#1344](https://github.com/edrlab/thorium-reader/pull/1344))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1a01c03e74d1504b0a521898f1ca76b5f6484cfc) __feat:__ Electron v11, r2-streamer-js HTTP server (activated by default) + optional no-HTTP streamer (Session.protocol.registerStreamProtocol currently buggy) (PR [#1258](https://github.com/edrlab/thorium-reader/pull/1258))
* [(_)](https://github.com/edrlab/thorium-reader/commit/622da0207ba3fa8048a6be188e2b6200f35bb56c) __chore(dev):__ code cleanup, removed unused sections [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2198dc37786ac8615b31141684771aff9e925d8a) __fix:__ removed redundant PDF.js-related electron-builder packaged files (Fixes [#1317](https://github.com/edrlab/thorium-reader/issues/1317) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e94ac7b7a66beca8a8e08e231b3d3fe32209d2d3) __fix:__ PDF cover image and metadata extraction using same PDF.js build as reader/renderer (PR [#1338](https://github.com/edrlab/thorium-reader/pull/1338) Fixes [#1335](https://github.com/edrlab/thorium-reader/issues/1335))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1e0623626be16b0447828948466a2462097894f1) __fix:__ Electron deprecation of remote module, routing of context-menu event, accessibility / screen reader detection, and r2-navigator-js update to match (added API)
* [(_)](https://github.com/edrlab/thorium-reader/commit/91afbdb6b99c9f94c0a71da24632549963dabbf5) __chore(NPM):__ minor package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/f3428a25b3f9c064d4a602540c8e9ebc03d9157f) __feat:__ goto begin/end of publication, CTRL HOME/END keyboard shortcuts, and shift-click on left/right arrow button icons (PR [#1341](https://github.com/edrlab/thorium-reader/pull/1341) Fixes [#1247](https://github.com/edrlab/thorium-reader/issues/1247))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c9de175f91c5911528f677346fd3f73d25bc19c8) __chore(dev):__ code cleanup, removal of unnecessary generic specifier in TypeScript function (TaJsonDeserialize)
* [(_)](https://github.com/edrlab/thorium-reader/commit/703ca76550b5be2b79629f08565a35c81b4baa68) __fix(LCP):__ sanity check / safeguard for not-well-formed licenses (e.g. HTTP response error code body, or corrupted local file) Fixes [#1254](https://github.com/edrlab/thorium-reader/issues/1254)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b467173ee8af433f46646f237f9908aa631cfd0a) __fix(8bbba718297d768086b439657a9965e823d35583):__ lint
* [(_)](https://github.com/edrlab/thorium-reader/commit/8bbba718297d768086b439657a9965e823d35583) __fix(PDF):__ replace registerBufferProtocol with registerFileProtocol
* [(_)](https://github.com/edrlab/thorium-reader/commit/d7f95513e0dd23ddd5742acaf4e70c6f54bb053a) __fix(PDF):__ bus subscribe of keyup and keydown event in driver.ts. I moved it in the reader.tsx init.
* [(_)](https://github.com/edrlab/thorium-reader/commit/1edfdaae7aab9e1fe4bab4e7699c97d7f6b6070d) __fix:__ PDF reader options had incorrect menu (MathJax, Popup Footnotes, Reduce Motion). Also updated to latest PDF.js build from EDRLab fork, built from source ( https://github.com/edrlab/pdf.js/blob/master/THORIUM_BUILD.md )
* [(_)](https://github.com/edrlab/thorium-reader/commit/630f02a19601822aaf1d780e35b4ab6cbbf948cb) __chore(doc):__ PDF.js -related documentation (forking)
* [(_)](https://github.com/edrlab/thorium-reader/commit/77aa9e5acede536c56550ca7eb4d73ca43dc3858) __fix(PDF.js):__ added TypeScript type definitions, see https://github.com/edrlab/pdf.js/blob/master/TYPESCRIPT_TYPE_DEFINITIONS.md (follows commit 73d4165b3a427522d027a18ae451100b5e1a7321, see issue [#1335](https://github.com/edrlab/thorium-reader/issues/1335) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/df7fe31bd15fea5c50d1ca23c022c9548c50fb69) lint(73d4165b3a427522d027a18ae451100b5e1a7321)
* [(_)](https://github.com/edrlab/thorium-reader/commit/73d4165b3a427522d027a18ae451100b5e1a7321) __fix(PDF):__ remove pdfjs-dist it was used only for typed index_pdf.ts and toc.ts in the webview. I replace some type with any. not a big deal. (fixes [#1335](https://github.com/edrlab/thorium-reader/issues/1335) partially)
* [(_)](https://github.com/edrlab/thorium-reader/commit/390356ea03cb10ce1fd8a34567fb5659bcf1e770) __chore(NPM):__ package update r2-streamer-js (notably: HTTP caching disabled for encrypted resources)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd2e96f5b2f291f3b91516dc62f86f90262aa67c) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/36f372c21fa523d0c003509edf599cbe6fa27c63) __fix(LCP):__ url hint hyperlink is localized (fixes [#1263](https://github.com/edrlab/thorium-reader/issues/1263) twice)
* [(_)](https://github.com/edrlab/thorium-reader/commit/df06469975c1afcc6a6899be98aa6541899dc6ee) __fix(b9c7210ff107cdc466af6504bbb28dfa7796aeca):__ follow-up of the previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/b9c7210ff107cdc466af6504bbb28dfa7796aeca) __fix(PDF):__ disable 'autmatic' columns -> doesn't supported in the pdfjs viewer (fixes [#1334](https://github.com/edrlab/thorium-reader/issues/1334))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fbed9eb2fb2f33cb50eb6efa2b0af87770365d81) __feat:__ Reduce Motion and Disable Footnotes display settings (+ moved MathJax toggle) (PR [#1333](https://github.com/edrlab/thorium-reader/pull/1333) Fixes [#1286](https://github.com/edrlab/thorium-reader/issues/1286))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0603554732034ba62a10886d0b6310b69ff5d26f) __fix(OPDS):__ undefined book extension in import button (fixes [#1302](https://github.com/edrlab/thorium-reader/issues/1302))
* [(_)](https://github.com/edrlab/thorium-reader/commit/809ec97be09dc80c9b3252de24f690c3b8b5b7ba) __fix:__ undefined type value in updateOpdsInfoWithEntryLink() (fixes [#1324](https://github.com/edrlab/thorium-reader/issues/1324))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c52f03f3c164af6fd6f9c38535cd941007fad56a) __chore(lint):__ catalog.ts import sorting
* [(_)](https://github.com/edrlab/thorium-reader/commit/687990369ef499929547de056813e1b0b50f480b) __fix(about):__ about epub displayed in "all book" section (fixes [#1318](https://github.com/edrlab/thorium-reader/issues/1318))
* [(_)](https://github.com/edrlab/thorium-reader/commit/941b91ecdb45a902317dbeacb37f416bd7cc961d) __Merge branch 'develop' of https:__//github.com/edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/aa484815990ac1938ae898e9a267ac71a5f35f0f) __fix(about):__ disable about modal for nnecessary "about Thorium" publication requests (fixes [#1325](https://github.com/edrlab/thorium-reader/issues/1325))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a2f881ad78ce5a2675823bbf3638995f09bb6192) __chore(dev):__ added start:dev:quick NPM command
* [(_)](https://github.com/edrlab/thorium-reader/commit/86ad7e3d65e08395e9a779e064cea09fe2a8e4a2) __fix(a11y):__ keyboard shortcut for search previous/next commands was incorrect (KeyG instead of G)
* [(_)](https://github.com/edrlab/thorium-reader/commit/be531025720e7eaf5a9f3d7c5f46cf8e24040d5b) chore(pdfjs fork documentation) update readme with last commit hash
* [(_)](https://github.com/edrlab/thorium-reader/commit/603c65cef4ebfec9fb3492e99cf923feeb2b0c51) __fix:__ disable print feature in mozilla pdf viewer (fixes [#1320](https://github.com/edrlab/thorium-reader/issues/1320))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6f8a122d1b6fcb4282233478b7c5a50504897b71) __fix:__ downgrade pdfjs.extract from 0.1.5 to 0.1.4 (fixes [#1316](https://github.com/edrlab/thorium-reader/issues/1316)) pdf import fail with npm run start
* [(_)](https://github.com/edrlab/thorium-reader/commit/19aba45712336931de16f3222adcea68ee25e2a3) __fix:__ "goto page" feature now has a keyboard shortcut, and works with authored pageList as well as intrinsic page units such as with fixed layout FXL publications, PDF, etc. (PR [#1319](https://github.com/edrlab/thorium-reader/pull/1319))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0d9e15c745804c5815b0373adbac6f1b6081fa96) __chore(NPM):__ package updates, notably minor Electron release, and r2-shared-js with a LCP PDF fix
* [(_)](https://github.com/edrlab/thorium-reader/commit/e518c1d998cab84efd6d5b7ce88440f218958d8c) __fix(a11y):__ keyboard shortcuts for search previous/next commands, now with alternative option (Fixes [#1214](https://github.com/edrlab/thorium-reader/issues/1214))
* [(_)](https://github.com/edrlab/thorium-reader/commit/29f0092cfe81346cf7e7d3ed7972960a951ea32d) __fix(OPDS):__ facets and navigation above publication listing now occupies available horizontal space (PR [#1309](https://github.com/edrlab/thorium-reader/pull/1309) Fixes [#1218](https://github.com/edrlab/thorium-reader/issues/1218))
* [(_)](https://github.com/edrlab/thorium-reader/commit/35e33214bf6860d4c740d7ff0df80887caa13036) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2cbd7e3a9c2e40158f3e239069341e82838961de) __fix:__ about dialog box now a publication to open in reader view, with full document accessibility, including readaloud (PR [#1199](https://github.com/edrlab/thorium-reader/pull/1199) Fixes [#992](https://github.com/edrlab/thorium-reader/issues/992) Fixes [#576](https://github.com/edrlab/thorium-reader/issues/576))
* [(_)](https://github.com/edrlab/thorium-reader/commit/87aebfb25f70b542e86feff9278dadd8bc1ec19f) __fix(PDF):__ new Mozilla-based viewer / renderer with search and multipage (PR [#1285](https://github.com/edrlab/thorium-reader/pull/1285) Fixes [#1192](https://github.com/edrlab/thorium-reader/issues/1192) Fixes [#1190](https://github.com/edrlab/thorium-reader/issues/1190) Fixes [#1194](https://github.com/edrlab/thorium-reader/issues/1194) Fixes [#1193](https://github.com/edrlab/thorium-reader/issues/1193) Fixes [#1191](https://github.com/edrlab/thorium-reader/issues/1191))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dcc11dedfc8abe0206718fa5302515e56dc814f6) __fix(dev):__ Redux Devtools CLI is now disabled (SQLite3 v5 compile issues)
* [(_)](https://github.com/edrlab/thorium-reader/commit/871f70190bb755c2e62d965bc9d9330c877a4478) __chore(NPM):__ package updates, including r2-shared-js with support for DAISY3 audio-only talking books
* [(_)](https://github.com/edrlab/thorium-reader/commit/1989407e947120116e7026682193b0b350c4e46f) __fix(linux):__ installer in Office category (Fixes [#1242](https://github.com/edrlab/thorium-reader/issues/1242))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5fa74b3226ebafc2ac0df3ee78c656cb66888305) __fix(UI):__ removed unnecessary confirm dialog for importing a small number of publications during drag-drop (Fixes [#1129](https://github.com/edrlab/thorium-reader/issues/1129))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ffc560f6b090b4ef2be01b10bcdc0ccac5274623) __feat(UI):__ mouse wheel scroll and touchpad two finger swipe / drag to turn pages left/right (on bottom footer progress bar and arrows)
* [(_)](https://github.com/edrlab/thorium-reader/commit/56c7f3e2ab2eb5a266342d4fb1c774d0256d3344) __fix(UI):__ table of contents line height / interline of heading text (Fixes [#1164](https://github.com/edrlab/thorium-reader/issues/1164))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c793635c6829cf1b19f2cd132bce72269bd0196d) __fix(search):__ added missing previous/next keyboard shortcuts (Fixes [#1214](https://github.com/edrlab/thorium-reader/issues/1214))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a75f739055d89ec349be1f395956d8a90bfa0418) __fix(search):__ double-click on list item closes menu, just like pressing enter (Fixes [#1229](https://github.com/edrlab/thorium-reader/issues/1229))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c7058891e134a44032a901768717c50de18c7523) __fix:__ improved homescreen bookshelf design (PR [#1292](https://github.com/edrlab/thorium-reader/pull/1292) Fixes [#1273](https://github.com/edrlab/thorium-reader/issues/1273))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a2cb0ad572075627f2b734ccf63b880e411d4d7) __chore:__ code consistency, R2 imports
* [(_)](https://github.com/edrlab/thorium-reader/commit/713bae17eb3d992745433decf0db4eb9707e638c) __fix(LCP):__ URL hint was missing in passphrase dialog (PR [#1264](https://github.com/edrlab/thorium-reader/pull/1264) Fixes [#1263](https://github.com/edrlab/thorium-reader/issues/1263))
* [(_)](https://github.com/edrlab/thorium-reader/commit/49579060dd42d2c7ae982695b7664befa7e2e91f) __fix(improve):__ book catalog update from setReduxState (PR [#1291](https://github.com/edrlab/thorium-reader/pull/1291))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3fa1ac5abc88c0e28fe4cf2bb3f68d959e825a44) __feat(refactor):__ OPDS authentication, OAuth2 access/refresh token, HTTP cookies (PR [#1252](https://github.com/edrlab/thorium-reader/pull/1252) Fixes [#899](https://github.com/edrlab/thorium-reader/issues/899) See [#1237](https://github.com/edrlab/thorium-reader/issues/1237))
* [(_)](https://github.com/edrlab/thorium-reader/commit/240bc0e90b5103dc74b7148a1205e3a4e5bbb6a9) __feat(l10n):__ Russian localization (PR [#1307](https://github.com/edrlab/thorium-reader/pull/1307) based on PR [#1287](https://github.com/edrlab/thorium-reader/pull/1287))
* [(_)](https://github.com/edrlab/thorium-reader/commit/12d55f020d631c0527a035f8ba98cf818b426d0f) __feat(l10n):__ Chinese UI translation (PR [#1306](https://github.com/edrlab/thorium-reader/pull/1306) based on PR [#1271](https://github.com/edrlab/thorium-reader/pull/1271))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b3a9781dea769a76c25920ea459c0d7452579e22) __chore(l10n):__ i18n types update (alphabetical sort)
* [(_)](https://github.com/edrlab/thorium-reader/commit/67613e264663d166d78caedb8b483b007f04ccfb) __fix:__ DOM search (PR [#1305](https://github.com/edrlab/thorium-reader/pull/1305) Fixes [#1304](https://github.com/edrlab/thorium-reader/issues/1304))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4cadc2a2adb5935d00a83729dab1c73bb0598dd6) __fix:__ typo in XHTML content type
* [(_)](https://github.com/edrlab/thorium-reader/commit/19988d0f45b878a1a3d874c22532dcffa82dc951) __fix(c0ddd1923048dec8d030b6f02afa9db0c70a0e14):__ packager resources path in the zip
* [(_)](https://github.com/edrlab/thorium-reader/commit/538b9ced86e03a3dbc065f7e1279f62659c70c50) __chore:__ documentation and debug in lock.ts (PR [#1301](https://github.com/edrlab/thorium-reader/pull/1301))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c0ddd1923048dec8d030b6f02afa9db0c70a0e14) __fix[packager]:__ resources path in the zip is the same that resources path in the rwpm (PR [#1298](https://github.com/edrlab/thorium-reader/pull/1298), fixes [#1303](https://github.com/edrlab/thorium-reader/issues/1303))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b359c0f367efe4b3fbb3b46223c2ebe702bf3c2) __fix:__ removed the possibility for protocol.registerSchemesAsPrivileged to be called after Electron app ready state (PR [#1300](https://github.com/edrlab/thorium-reader/pull/1300) Fixes [#1299](https://github.com/edrlab/thorium-reader/issues/1299))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e94e631678df85ece7a18156a9e37ca4b481de56) __chore:__ replace debug filename of publication/import
* [(_)](https://github.com/edrlab/thorium-reader/commit/7680952c9843f1fcb110bea4864996e110ca0cbd) __chore(NPM):__ package updates, including R2 OPDS JS with important bug fixes
* [(_)](https://github.com/edrlab/thorium-reader/commit/3a839631560551eff5a1061cc6a6f9844d4f87d5) __chore(npm):__ minor package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2517c28d0aa945d2054fd1967b7087208c68d756) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/a2fbdde76ae755fd9b07120a5bea096a7d32dda7) __fix:__ SQLite3 Electron build (v9.4.0) in postinstall
* [(_)](https://github.com/edrlab/thorium-reader/commit/e1f16b2c3112a96470d3e6049fb094cd66be1233) __chore(NPM):__ package updates, notably: pdf-extract.js on the NodeJS backend require("canvas") ignored by WebPack config (breaking change due to PDF.js update in pdf-extract's own bundle)
* [(_)](https://github.com/edrlab/thorium-reader/commit/3783b2ea7aa957ce20a5f469feb5bd3795f8c41f) __fix:__ converter from W3C Web Publications to Readium2 format, links vs. resources, typings + NPM updates and necessary code cleanup (stricter compiler checks) (PR [#1278](https://github.com/edrlab/thorium-reader/pull/1278) Fixes [#1280](https://github.com/edrlab/thorium-reader/issues/1280))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e5fe7f1239aaa9f32c9fe74a0b4f6e08f01e4ed6) __chore(NPM):__ package updates, stricter TypeScript Promise<void> checks
* [(_)](https://github.com/edrlab/thorium-reader/commit/c5c019b22fa0ad50e26c2ab0daf9b3e2ef395116) __fix(OPDS):__ filter rel='alternate', improved contentType parsing (PR [#1275](https://github.com/edrlab/thorium-reader/pull/1275) Fixes [#1148](https://github.com/edrlab/thorium-reader/issues/1148))
* [(_)](https://github.com/edrlab/thorium-reader/commit/57b818376fbfe8be99362246abe66e7648c23b56) __(saad/develop) fix:__ WebPub content-type accepted in OPDS feeds, etc. (PR [#1248](https://github.com/edrlab/thorium-reader/pull/1248))
* [(_)](https://github.com/edrlab/thorium-reader/commit/af88785e0f737236bb9f40691a46c833805364ac) __chore(NPM):__ package update, including important r2-shared-js update
* [(_)](https://github.com/edrlab/thorium-reader/commit/06ef8282e6b02bf209619f9a17dab1a8a7d200e2) __chore(NPM):__ package update r2-shared-js (DAISY support)
* [(_)](https://github.com/edrlab/thorium-reader/commit/2de69e48df127a4a48c9ff7336c56f28356d72c8) __chore(NPM):__ r2-shared-js package update
* [(_)](https://github.com/edrlab/thorium-reader/commit/36d4646308482777f6bdc354e9660cb6d1a1fc8b) __chore(NPM):__ misc. package updates, R2 navigator and shared-js components
* [(_)](https://github.com/edrlab/thorium-reader/commit/ef280f8a082a05d7355c437c35d8123c4a2c191b) __chore(CI):__ second attempt at fixing Travis CI (Windows was failing)
* [(_)](https://github.com/edrlab/thorium-reader/commit/f8d95902b4318bfa5f435caed6fe3794802f1a6f) __chore(CI):__ attempt to fix GitHub Actions (replacement of set-env command)
* [(_)](https://github.com/edrlab/thorium-reader/commit/00de45116459bd98ba2d9ba53db08e6e94b700b4) __chore(NPM):__ package update (R2 shared)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ef817803c8bf595e26752b98c378d20d6e07fade) __chore(NPM):__ R2 navigator package update, fixes footnotes same-document content restriction, and DOM :target CSS styles
* [(_)](https://github.com/edrlab/thorium-reader/commit/6bb6a982d9b81137a10c829f6d32f065eaaa9089) __chore(NPM):__ minor package updates, notably: DAISY support
* [(_)](https://github.com/edrlab/thorium-reader/commit/b9853676f69ac95230ff1c2c689c273ae596081e) __feat:__ support for DAISY3 audio+text and text-only publications (PR [#1257](https://github.com/edrlab/thorium-reader/pull/1257))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dee5e3ec4e25e7ba1abb18e2d79a3f12cf0e62e7) __fix:__ Divina audio/video streaming now works (problem was related to Session.protocol.registerStreamProtocol() vs Session.protocol.registerHttpProtocol())
* [(_)](https://github.com/edrlab/thorium-reader/commit/d1eb8af4930ff2f9951a557ea3d1aa954b07a930) __chore(NPM):__ package dependencies (minor updates)
* [(_)](https://github.com/edrlab/thorium-reader/commit/1451234ae035f2a576829f9edb4e220679f372d7) __fix:__ added missing paragraph spacing UI (PR [#1239](https://github.com/edrlab/thorium-reader/pull/1239) Fixes [#1100](https://github.com/edrlab/thorium-reader/issues/1100))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d3e559a40410f5a160a3199b08b24724b54325f) __fix:__ PDF pagination overflow, now doesn't exceed last page (PR [#1240](https://github.com/edrlab/thorium-reader/pull/1240) Fixes [#1215](https://github.com/edrlab/thorium-reader/issues/1215))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d52ec0b8872bece2f118cd9d4ddbaf72fe93dac3) __fix:__ reflowable documents are now paginated by default, was scrolling (PR [#1238](https://github.com/edrlab/thorium-reader/pull/1238) Fixes [#1222](https://github.com/edrlab/thorium-reader/issues/1222))
* [(_)](https://github.com/edrlab/thorium-reader/commit/774d1153e4f2917fbb9ce466edfcba4c65604356) __fix(l10n):__ Updated Spanish translation (PR [#1232](https://github.com/edrlab/thorium-reader/pull/1232))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd94ce36c512ac80f5013356b8adeb7f445684df) chore(dev (PR [#1235](https://github.com/edrlab/thorium-reader/pull/1235) Fixes [#636](https://github.com/edrlab/thorium-reader/issues/636))
* [(_)](https://github.com/edrlab/thorium-reader/commit/afab8bb287b71cb43b849b19f2213fe679a6d7de) __fix:__ open publication from filesystem or drag-and-drop only opened library window (PR [#1221](https://github.com/edrlab/thorium-reader/pull/1221) Fixes [#1220](https://github.com/edrlab/thorium-reader/issues/1220) Fixes [#1123](https://github.com/edrlab/thorium-reader/issues/1123))
* [(_)](https://github.com/edrlab/thorium-reader/commit/51c1bafa59b466e0f4ecaa35af7b69d1ba9e9bdc) __dev:__ WebPack bundle analyser (see [#1226](https://github.com/edrlab/thorium-reader/issues/1226) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/bee2de14c0f3b3536ff72bef9b0c6c08fe461727) __fix:__ prevent mouse drag on links, etc. in PDF rendering (Fixes [#918](https://github.com/edrlab/thorium-reader/issues/918) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/414b730128217e791c0cdcabc35d681cea574743) __fix:__ prevent mouse drag on UI controls, links, etc. including inside EPUB HTML documents (Fixes [#918](https://github.com/edrlab/thorium-reader/issues/918) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/34daaf334032f02a291b50065a02f7244afd7c45) __chore(release):__ version bump 1.6 alpha

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.5.0...v1.6.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
