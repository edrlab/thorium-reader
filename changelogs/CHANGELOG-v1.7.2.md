# Thorium Reader v1.7.2

## Summary

Version `1.7.2` was released on **10 September 2021**.

This release includes the following (notable) new features, improvements and bug fixes:

* Electron version 14 (notably: web browser component Chromium  v93)
* Internal feature: HTTP streamer now replaced with custom Electron protocol (no more open port / localhost TCP-IP connections)
* Feature: basic zoom/scale user interface for fixed layout publications
* Feature: Divina updated player / rendering engine, added support for audio soundtrack nute/unmute, removed goto page navigation, added UI indicator for page turn direction
* Fix: ReadiumCSS "default" publisher / authored styling, handling of line height and spacing for letters, words, paragraphs, and margins
* Fix: search was broken when opening publications with double-click from file explorer, or via any other command line interaction
* Fix: audiobooks metadata total duration progression percentage (could be NaN in some cases)
* Fix: publication import from link (OPDS feed) was incorrectly registering LCP-PDF content type as JSON (is in fact a packaged format)
* Fix: OPDS HTTP authentication implicit flow url with fragment identifier
* Fix: some combinations of typeface + font size + line height cause edge case overflow in the body element
* Fix: goto page navigation from text input field using enter key with/without keyboard modifiers was broken due to mishandling of form submit event
* Fix: the 'assert' module of NodeJS introduced a strange bug causing high-CPU load and some sort of infinite loop/wait during usage of the ok() function, now replaced with vanilla JS equivalent
* Fix: OPDS HTTP(S) redirect agent
* Fix: selection highlights must be mounted/unmounted for previous href during location change event, in two-page spread fixed layout where clicking on displayed pages triggers the href switch
* Fix: LCP/LSD HTTP request timeouts are now 2s / 5s (was default 60s / one minute!)
* Fix: mouse wheel and trackpad gesture scroll were inverted on the vertical Y axis (note that MacOS "natural" switches both X and Y axis)

(previous [v1.7.1 changelog](./CHANGELOG-v1.7.1.md))

## Full Change Log

Git commit diff since `v1.7.1`:
https://github.com/edrlab/thorium-reader/compare/v1.7.1...v1.7.2

=> **28** GitHub Pull Requests / top-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/55a1129b21c216146289ee1dcb08522ef2290351) __fix:__ audiobooks metadata total duration progression percentage (Fixes [#1349](https://github.com/edrlab/thorium-reader/issues/1349) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8db74351ee3ad94b78bba7b138779e907192249e) __chore(dev):__ convertOpdsFeedToView links and metadata conditions switch to ternary and add 2 undefined return type in function (fixes [#1522](https://github.com/edrlab/thorium-reader/issues/1522) fixes [#1402](https://github.com/edrlab/thorium-reader/issues/1402) fixes [#1397](https://github.com/edrlab/thorium-reader/issues/1397))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2f8c3610239b4d692b0ae296f35bd200dd610162) __fix:__ publication import from link (OPDS feed) was incorrectly registering LCP-PDF content type as JSON (is in fact a packaged format) (see PR [#1519](https://github.com/edrlab/thorium-reader/pull/1519) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/00609cc68c47995c608c58ea9d4ee55559899350) __fix:__ search was broken when opening publications with double-click from file explorer, or via any other command line interaction (PR [#1541](https://github.com/edrlab/thorium-reader/pull/1541) Fixes [#1517](https://github.com/edrlab/thorium-reader/issues/1517) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/3e4aa1018bbd0ae0877daa44a02b3235e2300685) __fix(auth):__ implicit flow url with fragment identifier (PR [#1538](https://github.com/edrlab/thorium-reader/pull/1538), PR https://github.com/panaC/opds2-auth-test-server/pull/1)
* [(_)](https://github.com/edrlab/thorium-reader/commit/1affa7a613532cfc7d1da2d5901d77850600eed0) __fix:__ some combinations of typeface + font size + line height cause edge case overflow in the body element (Fixes [#1535](https://github.com/edrlab/thorium-reader/issues/1535) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/298a49ce307cda769935ed51e846d6fb7c4e588c) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/592480c0c7889178c1b15ebefdda89bd694966e8) __fix:__ goto page navigation from text input field using enter key with/without keyboard modifiers was broken due to mishandling of form submit event (PR [#1540](https://github.com/edrlab/thorium-reader/pull/1540) Fixes [#1539](https://github.com/edrlab/thorium-reader/issues/1539) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/846ed882eaab32f6bcad6f90ec3a774737727f1a) __fix:__ the 'assert' module of NodeJS introduced a strange bug causing high-CPU load and some sort of infinite loop/wait during usage of the ok() function, now replaced with vanilla JS equivalent
* [(_)](https://github.com/edrlab/thorium-reader/commit/e1b8dfa0275e7ba02fe1ffd778b53b375440e1ee) __chore(dev):__ removed unused code
* [(_)](https://github.com/edrlab/thorium-reader/commit/42a35c09fceb2a69efd0a00193063f3c2ca132cb) __chore(NPM):__ Electron v14 (hopefully will fix the Windows runtime error that causes a zombie process at 30% CPU pegging!)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b095fcec33edce32fdc066474954ac4605de91a) __fix(OPDS):__ HTTP(S) redirect agents (Fixes [#1323](https://github.com/edrlab/thorium-reader/issues/1323) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d6991b095d37fbfe7121ad43f45aa0daa583ff3e) __feat(Divina):__ updated player / rendering engine, added support for audio soundtrack nute/unmute, removed goto page navigation, added UI indicator for page turn direction (PR [#1463](https://github.com/edrlab/thorium-reader/pull/1463) Fixes [#1469](https://github.com/edrlab/thorium-reader/issues/1469) Fixes [#1455](https://github.com/edrlab/thorium-reader/issues/1455))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e86bf59c1cdda85f636e484051d14e47a30c5a8c) __chore(build):__ Electron 13.3.0 postinstall rebuild target (native libs compile)
* [(_)](https://github.com/edrlab/thorium-reader/commit/d93e2abd652cc0e444269458ee40772ea1e0db5d) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/42b7738ac4e347ab3d72f19c62fe58fd4a66df6e) feat(FXL) zoom in/out on fixed layout documents, rudimentary scaling selector (button click cycle + mouse wheel up/down) (Fixes [#1228](https://github.com/edrlab/thorium-reader/issues/1228) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/cc85150b1b975aaceb8ce1f526d0489dfe7a8017) __fix:__ regression issues due to recent no-HTTP streamer implementation (special handling of custom protocol was broken in the URL converter logic, causing broken popup footnotes, nested iframes in publication documents, origin-bound localStorage, etc.) + NPM updates (notably: navigator which includes a new zoom/scale strategy for fixed layout publications)
* [(_)](https://github.com/edrlab/thorium-reader/commit/35db3c0b42b4e372e75e45eb963abd8285cf205c) __fix:__ selection highlights must be mounted/unmounted for previous href during location change event, in two-page spread fixed layout where clicking on displayed pages triggers the href switch [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/5c0c392751c7df8d0008a9104e2fcf34bfd3b65c) __fix:__ ReadiumCSS "default" publisher / authored styling, handling of line height and spacing for letters, words, paragraphs, and margins (Fixes [#1516](https://github.com/edrlab/thorium-reader/issues/1516) Fixes [#1509](https://github.com/edrlab/thorium-reader/issues/1509) Fixes [#1511](https://github.com/edrlab/thorium-reader/issues/1511) Fixes [#1477](https://github.com/edrlab/thorium-reader/issues/1477) Fixes [#1480](https://github.com/edrlab/thorium-reader/issues/1480))
* [(_)](https://github.com/edrlab/thorium-reader/commit/910de903b49c8a9f75988c31ed33a22bd02e1d97) __fix(LCP/LSD):__ HTTP request timeouts are now shorter than 60s! (2s / 5s) (Fixes [#996](https://github.com/edrlab/thorium-reader/issues/996) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/85da5c02047a703b8d433d1f3aa1f12d9838d9ff) __chore(NPM):__ package updates, including minor Electron
* [(_)](https://github.com/edrlab/thorium-reader/commit/10a8686b2fc3873e6dbec130e73ba5077d746431) __chore(dev):__ comment about CI Windows env (Visual Studio / MSBUILD 2017, not 2019) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/129904b244044a61dd6db25bc6e178bf1795cdb8) __fix(UI):__ mouse wheel and trackpad gesture scroll was inverted on the vertical Y axis (note that MacOS "natural" switches both X and Y axis)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b919a5a04b812b2c24e81f1bae84e7bfad3e518) __Fix:__ Electron 13, replaced HTTP streamer with custom protocol (PR [#1530](https://github.com/edrlab/thorium-reader/pull/1530) Fixes [#1504](https://github.com/edrlab/thorium-reader/issues/1504) Fixes [#1495](https://github.com/edrlab/thorium-reader/issues/1495) Fixes [#1417](https://github.com/edrlab/thorium-reader/issues/1417) Fixes [#1258](https://github.com/edrlab/thorium-reader/issues/1258))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5a672482b7cb0241f885615a6cbee66fa25c7cc0) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/7230ca9ab0d3d967469a8c52784d266fdd686641) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/226f762558fb4482cb7b828a491f1a02d1ef7011) __chore(release):__ version bump for new alpha stream (CI builds)

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.7.1...develop | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
