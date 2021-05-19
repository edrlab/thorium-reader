# Thorium Reader v1.7.0

## Summary

Version `1.7.0` was released on **14 May 2021**.

This release includes the following (notable) new features, improvements and bug fixes:

* Major refactor: database migration (SQLite3 / LevelDown) to Redux (JSON serialization). The DB backend will be completely removed in a future version (probably 1.8), which will complete the fix for large filesystem allocation
* Fixed LCP passphrase hint which was incorrectly escaped (URL slashes), and English grammar was incorrect
* Updated Chinese translation
* Added korean translation
* Added TTS synthetic speech voice selection (overrides engine default which selects based on language, so this forces user preference)
* Faster audio playback rate option (2 -> 3x)
* Fixed DAISY support, now allows opening files with .zip extension in addition to .daisy, allow subfolder(s) instead of just root .opf package, and allow opening OPF directly from not-zipped filesystem
* Fixed OPDS description display (HTML markup)
* Fixed MathML support regression bug, and updated to latest MathJax version, and now check for authored MathJax to avoid conflits
* Fix: the auto-generated EPUB for "about Thorium" is now force-refreshed at every app version update
* Fixed "all books" library view which was not reliable
* Cancellable downloads (LCP, OPDS)
* Fixed MacOS window manager issue
* Fixed OPDS search (XML UTF8 BOM), en|decodeURIComponent
* Fixed support for PDF files with unicode characters in filenames
* Fixed OPDS search input field and home state which was not reset during feed browsing
* Fixed OPDS authentication dialog cancel button
* Fixed HTTP streamer, workaround for publication resource URLs / relative paths with multiple consecutive slashes
* Fixed bookmark icon, and added progression + sorting in bookmark navigation list
* ... and many more smaller changes listed below.

(previous [v1.6.0 changelog](./CHANGELOG-v1.6.0.md))

## Full Change Log

Git commit diff since `v1.6.0`:
https://github.com/edrlab/thorium-reader/compare/v1.6.0...v1.7.0
https://github.com/edrlab/thorium-reader/compare/v1.6.0...develop

=> **110** GitHub Pull Requests or high-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/1a63c2fc6ee5b6a52a94af3a413643dbb3e802aa) __fix(DB):__ database migration, removed publications / OPDS feeds now marked but preserved to avoid re-absorbing in new Redux JSON state (PR [#1452](https://github.com/edrlab/thorium-reader/pull/1452))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9e74b830091662d8218f86065e8fb36a5a9256d2) __fix:__ UUID regression (bookmarks), imports now consistent
* [(_)](https://github.com/edrlab/thorium-reader/commit/e07c02eaa33965d67da5fd7c9a285e46bbd6be77) __chore(NPM):__ package updates, notably r2-opds-js with HTML/plaintext description fixes (Fixes [#1376](https://github.com/edrlab/thorium-reader/issues/1376) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ca6cef307ec93ea932cb7764218fb1e362dced7e) __chore(NPM):__ NPM package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/86b98512ace7a9a642c7eec7985665487f1341ca) __fix:__ disabled input colour and mouse cursor (Fixes [#1459](https://github.com/edrlab/thorium-reader/issues/1459) PR [#1462](https://github.com/edrlab/thorium-reader/pull/1462))
* [(_)](https://github.com/edrlab/thorium-reader/commit/88d061f9a720c451dc940cceca0d5a695adddeed) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/edff799091a4b0081c232df377c6d27717f828ba) __fix(persistence):__ swap recovery mode from 2 to 3 (PR [#1451](https://github.com/edrlab/thorium-reader/pull/1451))
* [(_)](https://github.com/edrlab/thorium-reader/commit/95268b1a06b80ef7e98cf732d6270e75508fb846) __Revert "Revert "fix(divina):__ remove divinaReadingMode from state""
* [(_)](https://github.com/edrlab/thorium-reader/commit/37092404660f230ad3b2a1ac924d5f027f833310) __Revert "feature (divina):__ new divina player (pr [#1437](https://github.com/edrlab/thorium-reader/issues/1437))"
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b575b7746894b0bc022d6df3b9faba5bfd7a3ea) Revert "fix(divina) new build version (clean dist folder)"
* [(_)](https://github.com/edrlab/thorium-reader/commit/bb5d5522ad39b05f2fc22b752710d29d08ee0425) __Revert "fix(divina):__ Add an option to the Divina player setup (PR [#1450](https://github.com/edrlab/thorium-reader/pull/1450))"
* [(_)](https://github.com/edrlab/thorium-reader/commit/66044176548b6f23c98e40f6a0912cb70387d580) __Revert "fix(divina):__ remove divinaReadingMode from state"
* [(_)](https://github.com/edrlab/thorium-reader/commit/2ddda53ff4e88d914b054d54f4bf80f16efedba9) __fix:__ the auto-generated EPUB for "about Thorium" is now force-refreshed at every app version update (PR [#1458](https://github.com/edrlab/thorium-reader/pull/1458))
* [(_)](https://github.com/edrlab/thorium-reader/commit/775d52272c7f3d69c4f02815a6042640b5f351b0) __fix:__ "all books" library view was not reliable (PR [#1454](https://github.com/edrlab/thorium-reader/pull/1454) Fixes [#1453](https://github.com/edrlab/thorium-reader/issues/1453))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fed7a946a25661ed992204379ca726a48057ab60) __fix(l10n):__ Chinese translation update (PR [#1457](https://github.com/edrlab/thorium-reader/pull/1457))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9101a8639a3b3436fa83d6cb26cda96b2dad7ca9) __fix:__ publication removal from filesystem needed safeguard in case of non-existing UUID folder (scenario: DB migration into new JSON, but EPUB had been removed from new data format already)
* [(_)](https://github.com/edrlab/thorium-reader/commit/96a9c562e4399c1d11fa0a26332f9bf17d5c2f83) __fix(divina):__ remove divinaReadingMode from state
* [(_)](https://github.com/edrlab/thorium-reader/commit/598f71ad65b86bbca645c7c580607e9162758de3) __fix:__ rename JSON data config folder to ensure complete refresh on next launch (due to folder name mismatch, see previous commit)
* [(_)](https://github.com/edrlab/thorium-reader/commit/77b67fd966f3a3674e4be751b713f19a119b1891) __fix:__ incorrect folder name in dev / continuous integration builds
* [(_)](https://github.com/edrlab/thorium-reader/commit/d5f4c0313e6220e559ac7a510dfb4a035b844c88) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/407b85f1f3c898dddde571035ef9b3f096f4a500) __fix(persistence):__ new patch save process (PR [#1448](https://github.com/edrlab/thorium-reader/pull/1448))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d98f3c193e31bd3b316a53b2cdc3c8509824a34) __fix(divina):__ Add an option to the Divina player setup (PR [#1450](https://github.com/edrlab/thorium-reader/pull/1450))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cef727570d8cb5d3c9ed506daf7ea6bce7ccdb6d) __fix:__ bookmark ordering and percentage indicator
* [(_)](https://github.com/edrlab/thorium-reader/commit/599fac031c6fb872187d611f8233af3ef4da7ad5) __fix:__ removed ok() assertion which was generating false negatives in the console, return empty array instead (DB "find" functions)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8220648fc9eb1998f9534575b2b3a777aeb10497) __fix:__ do not brutally remove publications from filesystem in case of error, but continue to prevent database corruption
* [(_)](https://github.com/edrlab/thorium-reader/commit/644cf289cb199d3ac5a61a30c27ad43ade56e5fe) __fix:__ safeguard against crash when redux state is null/undefined + explicit object spread for code readability
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba0a8d5902b426e3254ce8578022284d441f10fc) __fix:__ bookmark progress indicator percent Fixes [#1413](https://github.com/edrlab/thorium-reader/issues/1413)
* [(_)](https://github.com/edrlab/thorium-reader/commit/08fba0c6f1a6c50cdb15dc9e321392791b10325b) __feat:__ faster audio playback rate option (2 -> 3x)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ab187a2df046859c7b37667d4be8d2e05689ecc4) __lint:__ previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/a20a76284686ecc745abffc512561a0385e5a6ce) __fix(persistence):__ bookmarks
* [(_)](https://github.com/edrlab/thorium-reader/commit/3d73ffb66f99f5fe4f1c6953e6ebbff38c4a2ad0) fix(divina) new build version (clean dist folder)
* [(_)](https://github.com/edrlab/thorium-reader/commit/df9afcba7b54e7ebcd275327f64b87370144108f) __fix:__ removed debug() log of LCP hashes
* [(_)](https://github.com/edrlab/thorium-reader/commit/2374e9cc024116de1e4b1ff622bc77963d6d5201) __fix:__ JSON persist init from DB for lazy OPDS auth, cookiejar, LSD devices, LCP passphrases
* [(_)](https://github.com/edrlab/thorium-reader/commit/cce84cd4f5697ea1d7f6db022ee211e8544dbe99) __fix(persitence):__ stringify appendFile log
* [(_)](https://github.com/edrlab/thorium-reader/commit/1f83a51c3056ae8ce82320ae3761bb42fa187754) __fix(persistence):__ undefined bookmarks array
* [(_)](https://github.com/edrlab/thorium-reader/commit/1069b4ca05857633b5b595d9c6d96f7bcf848bbe) __fix(persistence):__ log persistence
* [(_)](https://github.com/edrlab/thorium-reader/commit/a951232eb1c9fe636dcfeb654946bfe82fcd55f2) __fix(persistence):__ comment
* [(_)](https://github.com/edrlab/thorium-reader/commit/544cf24a0a9c0e16ddabeeacec0561400e271b5c) __fix:__ redux state absorb
* [(_)](https://github.com/edrlab/thorium-reader/commit/05065fd77e27345b881a9718c9de2f5b98bc0836) __fix:__ delete base64 publication and opds during clone absorb of DB
* [(_)](https://github.com/edrlab/thorium-reader/commit/03a0b8259b2e08fecc14312f54922387df6eb1a4) __fix(persistence):__ withdraws the test of i18n key
* [(_)](https://github.com/edrlab/thorium-reader/commit/4e050da73cd5877d9aa4d029e906ccac95a09e5f) __fix(persistence):__ do not erase redux state when corrupted
* [(_)](https://github.com/edrlab/thorium-reader/commit/1be21aef86cd0708e877e88a07ef6a7d400be651) __fix(persistence):__ comment
* [(_)](https://github.com/edrlab/thorium-reader/commit/a5e69a532bbc75780bc7d09fcbd23a42510e1719) __fix(persistence):__ force recovery procedure
* [(_)](https://github.com/edrlab/thorium-reader/commit/6494106bdc02813556765454b28777bfc765922f) __fix:__ dev vs. prod folder name for data config (JSON persistence)
* [(_)](https://github.com/edrlab/thorium-reader/commit/73cdd0939773c7ea2ea0bf217e483daf44737484) __fix(persistence):__ withdraws the opds key test
* [(_)](https://github.com/edrlab/thorium-reader/commit/44d5c317e2c82eca3d87840bbfee3c1ce5e0621b) __fix:__ JSON persist created from DB was containing Base64 LCP and LSD, as well as LSD events (causing huge data blobs)
* [(_)](https://github.com/edrlab/thorium-reader/commit/1a8bb8ae3efbab007c340f1eac5e7aee174f6c98) __refactor(LCP):__ LSD device manager JSON persist + data files in subfolder + added missing publication + LCP cache hydration (PR [#1446](https://github.com/edrlab/thorium-reader/pull/1446))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d3c9fe5dd9586887df87406805ff050837991611) __fix:__ previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/31988b6f2a8b11c820f756aad0942e82080d4d4b) __fix(db):__ split json file with production and development
* [(_)](https://github.com/edrlab/thorium-reader/commit/e41dc07eb6bd018f562016128e66ce4dc939d8ab) __fix:__ opds and publication db repository redux subscribe in the save function
* [(_)](https://github.com/edrlab/thorium-reader/commit/3e6f378ea88b011c6c00cd387040f9ddd312495b) __refactor(LCP):__ encrypted JSON persistence (PR [#1445](https://github.com/edrlab/thorium-reader/pull/1445) Fixes [#900](https://github.com/edrlab/thorium-reader/issues/900)  Fixes [#888](https://github.com/edrlab/thorium-reader/issues/888))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7ca9b71c7dd3b1397c1c37ad01c11c4cacf8ea5d) __chore(NPM):__ package updates and full lockfile regen
* [(_)](https://github.com/edrlab/thorium-reader/commit/7580bf24cd4016caf743e69cc6ef1c8bacdd4ba9) __refactor(downloader):__ stream pipeline cancellable (PR [#1433](https://github.com/edrlab/thorium-reader/pull/1433))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4d4dfdfd599cde8d8a69c03ba65c88d8bf3b5a5f) __refactor(persistence):__ main Redux state persistence (PR [#1421](https://github.com/edrlab/thorium-reader/pull/1421))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3b2c9c5a2babf908613dd54cbf819643c911f035) __refactor(publication):__ migration PouchDB repository to main Redux state (PR [#1415](https://github.com/edrlab/thorium-reader/pull/1415))
* [(_)](https://github.com/edrlab/thorium-reader/commit/aadf295a38cc3605ac39ebcef08a8a770679dca4) __chore(NPM):__ package updates, including fixed inversify
* [(_)](https://github.com/edrlab/thorium-reader/commit/58ef86ddb581ce37ba706f117ab986a9bbca2d30) __refactor(OPDS):__ migration PouchDB repository to main Redux state (PR [#1420](https://github.com/edrlab/thorium-reader/pull/1420))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a86385ce8a87f2ab650906636e10cd0e1b08f62c) __chore(NPM):__ package updates, inversify version upgrade is broken so stick to previous version
* [(_)](https://github.com/edrlab/thorium-reader/commit/1bc833ec2d766031c149ad3793a813abd9ea0e90) __refactor:__ removal of DB resources, LCP and manifest cache (filesystem persist + memory cache) (PR [#1443](https://github.com/edrlab/thorium-reader/pull/1443))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c1283dff9efcb93d1d4a1bcf2245547f99cf87fd) __fix:__ safe removal of LCP license JSON cache in database resources (fetched from filesystem publication just-in-time, no need to persist)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8dfd010ece8903c84f395aa33b85dbbff3f28a1) __fix:__ safe removal of LCP License Status Document (LSD) cache in database resources (fetched just-in-time, no need to persist)
* [(_)](https://github.com/edrlab/thorium-reader/commit/bee68f94d674be1503dd4d2198f457f8edfdb4f9) __chore(NPM):__ package updates (notably: MathJax)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5630f255df7344fa11fcffcfe6c991d3c35f38cb) __chore(refactor):__ replace Base64 blobs with JSON, remove duplicate state data (reduce database overhead) (PR [#1440](https://github.com/edrlab/thorium-reader/pull/1440))
* [(_)](https://github.com/edrlab/thorium-reader/commit/50e3df177c72d010d6bf06f23bae96fa368507c4) __ feat(OPDS):__ auth crypto filesystem persistence (PR [#1419](https://github.com/edrlab/thorium-reader/pull/1419))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6df88856de0b135aef00c137add70fa10fa4dd33) __feat:__ cookiejar crypto filesystem persistence (PR [#1418](https://github.com/edrlab/thorium-reader/pull/1418))
* [(_)](https://github.com/edrlab/thorium-reader/commit/79db3fca79005d45f89c0344dd38e9efea81d2bf) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/393c2dad31d33888fa3b6a0670b83ae52952cfb9) __Merge branch 'develop' of github.com:__readium/readium-desktop into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f8d3da85c70388b8a9da2c1222602e85b0510f9) __chore(NPM):__ package updates (minor change in the node-fetch Abort interface type definition)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ce7728f42b5199d1526b05be2fb512afcc577b76) __feature (divina):__ new divina player (pr [#1437](https://github.com/edrlab/thorium-reader/issues/1437))
* [(_)](https://github.com/edrlab/thorium-reader/commit/046193356f4ae2579c83a98c5073c366778b69ff) __fix(TTS):__ improved synthetic speech voice selector (follow-up to issue [#1130](https://github.com/edrlab/thorium-reader/issues/1130) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ae59fb98ddcccdf0ac64c102c891c49a797d6dcb) __feat(DAISY):__ allow opening files with .zip extension in addition to .daisy, allow subfolder(s) instead of just root .opf package, and allow opening OPF directly from not-zipped filesystem (Fixes [#1268](https://github.com/edrlab/thorium-reader/issues/1268) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8c5fa012e67726b808392ed5d212d4340428f4bf) __feat(l10n):__ korean translation (PR [#1434](https://github.com/edrlab/thorium-reader/pull/1434) Fixes [#1429](https://github.com/edrlab/thorium-reader/issues/1429))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6f832f83293eb64d980962c785fc8a34fd48dfeb) __fix(OPDS):__ support for feed description with HTML markup (PR [#1435](https://github.com/edrlab/thorium-reader/pull/1435) Fixes [#1376](https://github.com/edrlab/thorium-reader/issues/1376))
* [(_)](https://github.com/edrlab/thorium-reader/commit/83c403c390cc62b9b7019e0d83aca6fa08ab277e) __Merge branch 'develop' of github.com:__readium/readium-desktop into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba01cb6bd74b2dadf37667bc1eb27c30f4cb13d1) __feat(TTS):__ added synthetic speech voice selection (overrides engine default which selects based on language, so this is a forced preference) (Fixes [#1151](https://github.com/edrlab/thorium-reader/issues/1151) Fixes [#1130](https://github.com/edrlab/thorium-reader/issues/1130) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d95c82affbe3063a65a2139b446d4dff6f5987dc) __chore(dev):__ disable Electron remote module (deprecated)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5a3499a80c549f2d98c3f01a19aabf53f2309634) __chore(dev):__ disable Electron Devtron (unused, and problematic with more recent versions)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ebe13e27b2bcafe49d0b42986d14a7dac5a7e768) __lint:__ missing comma in di.ts
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c5a417055a72bde1b4d3fa168c384f081787659) __fix :__ macos appActivate library window is undefined with HocusFocus application. fixes the race-condition. (Fixes [#1388](https://github.com/edrlab/thorium-reader/issues/1388))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6d6578b1fb1711d70e365345c75cce2e84c303fc) __fix (opds):__ opds is not reset during browsing / navigation (fixes [#1408](https://github.com/edrlab/thorium-reader/issues/1408))
* [(_)](https://github.com/edrlab/thorium-reader/commit/eb5c5fb461ab10108789a646be2b73c910e27e99) __fix (ui):__ bookmark button with page fit button linked (fixes [#1422](https://github.com/edrlab/thorium-reader/issues/1422))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6090ffc70abf1295ed865094aebc358f57975871) __chore(NPM):__ package updates, notably classNames which broke the build, so took the opportunity to cleanup import statements (only exports.default works)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4f85f6e37da8b6599511bb93d8c39a6a61d9b27e) __chore(NPM):__ package updates, notably i18next with new init config param
* [(_)](https://github.com/edrlab/thorium-reader/commit/2db627836e92d6b9d88a47cc81e9f894bd5de965) __fix:__ check http response value undefined (HTTP ERROR) (Fixes [#1425](https://github.com/edrlab/thorium-reader/issues/1425) PR [#1425](https://github.com/edrlab/thorium-reader/pull/1425))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ef770fbb655b3d8fef6e130ad10d83f97ad2d4ea) __fix [#1424](https://github.com/edrlab/thorium-reader/issues/1424):__ dismiss cookies error (PR [#1426](https://github.com/edrlab/thorium-reader/pull/1426))
* [(_)](https://github.com/edrlab/thorium-reader/commit/746b2416658f759083130fa1f82975f2bc368887) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/05886ec47c35a43933330abd56acef82dad9a3e7) __refactor(db):__ migrate i18n config repository to the main process redux state with persistence (PR [#1416](https://github.com/edrlab/thorium-reader/pull/1416))
* [(_)](https://github.com/edrlab/thorium-reader/commit/297dcc3350d1611858b80e778bc14339dd95f787) __fix:__ delete publication in redux main state win registry
* [(_)](https://github.com/edrlab/thorium-reader/commit/e48aefec5b56de3e718c1a4165cc34fcd13d9213) __fix:__ filter the reader redux state persisted in the win registry main state
* [(_)](https://github.com/edrlab/thorium-reader/commit/7f4095a26991ef04e2850a6a5943e0b783f727ed) __chore(NPM):__ package updates (all minor)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd9d82beb95d5d2ee4c927a2eed91ebf3ffa8424) __refactor:__ getLastReadingLocaton moved to the publication view
* [(_)](https://github.com/edrlab/thorium-reader/commit/4eec8936ee017e60e19b35b95b7e780f4a3925ca) __refactor:__ readerMode synced with redux state to all readers
* [(_)](https://github.com/edrlab/thorium-reader/commit/d82cc65f71d262cbf91e6b8925252bcc22197722) __refactor:__ migrate bookmark locator repository to the reader redux state (PR [#1411](https://github.com/edrlab/thorium-reader/pull/1411))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f6b09553de520c7182764d906cd468a7ae556073) __fix:__ OPDS search (XML UTF8 BOM), en|decodeURIComponent, PDF files with unicode filenames (PR [#1385](https://github.com/edrlab/thorium-reader/pull/1385) Fixes [#1382](https://github.com/edrlab/thorium-reader/issues/1382) Fixes [#1383](https://github.com/edrlab/thorium-reader/issues/1383) Fixes [#1381](https://github.com/edrlab/thorium-reader/issues/1381) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/493c3e2f3d7301a7292e0da09ac91add5b283cce) __fix(OPDS):__ search input field was not reset during feed browsing / navigation (PR [#1389](https://github.com/edrlab/thorium-reader/pull/1389) Fixes [#1384](https://github.com/edrlab/thorium-reader/issues/1384))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c5d1060f3a96f0a470dfafdc34537fa922499c44) __fix(OPDS):__ authentication dialog cancel button now works (Fixes [#1405](https://github.com/edrlab/thorium-reader/issues/1405) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/eae3b70ff9033da7f6b2e30da84d7713da60d392) __fix(MathML):__ MathJax presence checked before injecting it from Thorium's own bundled library (Fixes [#1407](https://github.com/edrlab/thorium-reader/issues/1407) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ed6428122c84ffff9f4ac4977d2d5711a7cff1c6) __chore(NPM):__ package updates (minor)
* [(_)](https://github.com/edrlab/thorium-reader/commit/35ae859a8ffaa32bcc96de26507a843c4f489e00) __chore(NPM):__ package updates, notably Typescript 4.2 which requires significant update of "typed" Redux Saga, opportunity to cleanup codebase (PR [#1403](https://github.com/edrlab/thorium-reader/pull/1403) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/647333c57de8f0caaf886433dc2117827d3ddbcd) __chore(NPM):__ r2-streamer-js package update (notably: workaround for publication resource URLs / relative paths with multiple consecutive slashes)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8ace12177c148e7d4dd5d2722e660aaa01d27352) __chore(NPM):__ package updates, making sure to lock TypeScript to 4.1 as version 4.2 breaks typings in Redux Saga
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d70edb255fb5ce34739d0ecb9d72c847e786d73) __fix(code):__ incorrect TS import [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/15b628a49a941901109cf2c5151828d0dca3b0d1) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/67cada25fba785488d23817413960c79cffafa5c) __fix(MathML):__ regression bug, MathJax URL from static host HTTP server was broken (Fixes [#1390](https://github.com/edrlab/thorium-reader/issues/1390) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/163d989a40c6f3d58fef374f04c93d95e184858b) __fix(LCP):__ passphrase hint was incorrectly escaped (URL slashes), English grammar was incorrect (Fixes [#1386](https://github.com/edrlab/thorium-reader/issues/1386) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/48198db7a6d3e982f819f31d84e686a56b29e54f) __fix(UI):__ bookmark icon in navigation view was broken (Fixes [#1380](https://github.com/edrlab/thorium-reader/issues/1380) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8e23ae488d93b9aea225518ca904ad60064ab87) __chore(doc):__ changelog, 1.6 Windows installer code signing [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b93afed5be61a63f2fa04f014282c46f9bf95006) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/0d3a2306ea6c2de2348ef4cacbfe205e771cab38) __chore(release):__ post-1.6 version bump (1.6.1-alpha.1)

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.6.0...v1.7.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
