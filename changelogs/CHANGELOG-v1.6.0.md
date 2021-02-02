# Thorium Reader v1.6.0

## Summary

Version `1.6.0` was released on **?? February 2021**.

This release includes the following (notable) new features, improvements and bug fixes:

* delete publication wap primary button
* about filter by tags disabled
* about book visible in search query result
* updates Japanese translation
* Electron v11, r2-streamer-js HTTP server (activated by default) + optional no-HTTP streamer (Session.protocol.registerStreamProtocol currently buggy)
* removed redundant PDF.js-related electron-builder packaged files
* PDF cover image and metadata extraction using same PDF.js build as reader/renderer
* Electron deprecation of remote module, routing of context-menu event, accessibility / screen reader detection, and r2-navigator-js update to match (added API)
* goto begin/end of publication, CTRL HOME/END keyboard shortcuts, and shift-click on left/right arrow button icons
* code cleanup, removal of unnecessary generic specifier in TypeScript function (TaJsonDeserialize)
* LCP sanity check / safeguard for not-well-formed licenses (e.g. HTTP response error code body, or corrupted local file)
* replace registerBufferProtocol with registerFileProtocol
* PDF bus subscribe of keyup and keydown event in driver.ts. I moved it in the reader.tsx init.
* PDF reader options had incorrect menu (MathJax, Popup Footnotes, Reduce Motion). Also updated to latest PDF.js build from EDRLab fork, built from source ( https://github.com/edrlab/pdf.js/blob/master/THORIUM_BUILD.md )
* PDF.js added TypeScript type definitions, see https://github.com/edrlab/pdf.js/blob/master/TYPESCRIPT_TYPE_DEFINITIONS.md
* PDF remove pdfjs-dist it was used only for typed index_pdf.ts and toc.ts in the webview. I replace some type with any. not a big deal
* r2-streamer-js (notably: HTTP caching disabled for encrypted resources)
* LCP url hint hyperlink is localized
* disable 'autmatic' columns -> doesn't supported in the pdfjs viewer
* Reduce Motion and Disable Footnotes display settings (+ moved MathJax toggle)
* OPDS undefined book extension in import button
* undefined type value in updateOpdsInfoWithEntryLink()
* about epub displayed in "all book" section
* disable about modal for nnecessary "about Thorium" publication requests
* added start:dev:quick NPM command
* keyboard shortcut for search previous/next commands was incorrect (KeyG instead of G)
* chore(pdfjs fork documentation) update readme with last commit hash
* disable print feature in mozilla pdf viewer
* "goto page" feature now has a keyboard shortcut, and works with authored pageList as well as intrinsic page units such as with fixed layout FXL publications, PDF, etc.
* package updates, notably minor Electron release, and r2-shared-js with a LCP PDF fix
* keyboard shortcuts for search previous/next commands, now with alternative option
* facets and navigation above publication listing now occupies available horizontal space
* about dialog box now a publication to open in reader view, with full document accessibility, including readaloud
* new Mozilla-based viewer / renderer with search and multipage
* Redux Devtools CLI is now disabled (SQLite3 v5 compile issues)
* package updates, including r2-shared-js with support for DAISY3 audio-only talking books
* installer in Office category
* removed unnecessary confirm dialog for importing a small number of publications during drag-drop
* mouse wheel scroll and touchpad two finger swipe / drag to turn pages left/right (on bottom footer progress bar and arrows)
* table of contents line height / interline of heading text
* added missing previous/next keyboard shortcuts
* double-click on list item closes menu, just like pressing enter
* improved homescreen bookshelf design
* URL hint was missing in passphrase dialog
* book catalog update from setReduxState
* OPDS authentication, OAuth2 access/refresh token, HTTP cookies
* Russian localization
* Chinese UI translation
* i18n types update (alphabetical sort)
* DOM search
* typo in XHTML content type
* packager resources path in the zip
* documentation and debug in lock.ts
* packager: resources path in the zip is the same that resources path in the rwpm
* removed the possibility for protocol.registerSchemesAsPrivileged to be called after Electron app ready state
* R2 OPDS JS with important bug fixes
* package updates, notably: pdf-extract.js on the NodeJS backend require("canvas") ignored by WebPack config (breaking change due to PDF.js update in pdf-extract's own bundle)
* converter from W3C Web Publications to Readium2 format, links vs. resources, typings + NPM updates and necessary code cleanup (stricter compiler checks)
* package updates, stricter TypeScript Promise/void checks
* filter rel='alternate', improved contentType parsing
* WebPub content-type accepted in OPDS feeds, etc.
* R2 navigator package update, fixes footnotes same-document content restriction, and DOM :target CSS styles
* support for DAISY3 audio+text and text-only publications
* Divina audio/video streaming now works (problem was related to Session.protocol.registerStreamProtocol() vs Session.protocol.registerHttpProtocol())
* added missing paragraph spacing UI
* PDF pagination overflow, now doesn't exceed last page
* reflowable documents are now paginated by default, was scrolling
* Updated Spanish translation
* removed old ping lib
* open publication from filesystem or drag-and-drop only opened library window
* WebPack bundle analyser
* prevent mouse drag on links, etc. in PDF rendering
* prevent mouse drag on UI controls, links, etc. including inside EPUB HTML documents

(previous [v1.5.0 changelog](./CHANGELOG-v1.5.0.md))

## Full Change Log

Git commit diff since `v1.5.0`:
https://github.com/edrlab/thorium-reader/compare/v1.5.0...v1.6.0
https://github.com/edrlab/thorium-reader/compare/v1.5.0...develop

=> **100** GitHub Pull Requests or high-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/cf04170d65959b66cef906f3cbe362d8dbbd73c0) __(HEAD -> develop, origin/develop) fix(UI):__ delete publication wap primary button (fixes [#1352](https://github.com/edrlab/thorium-reader/issues/1352))
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
* [(_)](https://github.com/edrlab/thorium-reader/commit/57b818376fbfe8be99362246abe66e7648c23b56) __fix:__ WebPub content-type accepted in OPDS feeds, etc. (PR [#1248](https://github.com/edrlab/thorium-reader/pull/1248))
* [(_)](https://github.com/edrlab/thorium-reader/commit/af88785e0f737236bb9f40691a46c833805364ac) __chore(NPM):__ package update, including important r2-shared-js update
* [(_)](https://github.com/edrlab/thorium-reader/commit/06ef8282e6b02bf209619f9a17dab1a8a7d200e2) __chore(NPM):__ package update r2-shared-js (DAISY support)
* [(_)](https://github.com/edrlab/thorium-reader/commit/2de69e48df127a4a48c9ff7336c56f28356d72c8) __chore(NPM):__ r2-shared-js package update
* [(_)](https://github.com/edrlab/thorium-reader/commit/550fe015eeb58000fc34b14250986c7a69e1d7e6) __Merge branch 'develop' of github.com:__readium/readium-desktop into develop
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
* `git --no-pager log --decorate=short --pretty=oneline v1.5.0...develop | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
