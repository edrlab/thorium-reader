# Thorium Reader v1.8.0

## Summary

Version `1.8.0` was released on **10 January 2022**.

This release includes the following (notable) new features, improvements and bug fixes:

* Electron v16
* New feature: URL protocol handler (opds:// in addition to thorium://) and fixed command line interface / file browser actions, open multiple files
* EPUB popup footnotes: added support for external documents
* Accessibility feature: "where am i?" information in publication popup, including headings trail leading to current reading location in "where am I" section of publication info popup modal dialog, CTRL+i keyboard shortcut with SHIFT modifier key to focus
* Accessibility: much improved accessibility support in content webview, keyboard focus management with screen readers
* Accessibility: bookmark add/remove screen reader notifications (ARIA live via visual "toast" user interface), also fixed the bookmark add/remove logic based on keyboard interaction versus icon button, current text selection (for bookmark name), etc.
* Accessibility fix: screen reader hyperlink activation was causing mouse interaction in some cases, which in turn triggered false positives in some critical user interaction detection logic to establish the current reading location (for bookmarking, resuming, etc.)
* Accessible visual indicator of current reading location in table of content (navigation panel) as well as keyboard shortcut SHIFT CTRL N to focus directly on the current heading (existing CTRL N shortcut remains, which only opens the navigation panel, doesn't focus on the TOC tree)
* TTS: synthetic speech readaloud of hidden DOM fragments now skipped, also improved mouse click hit testing and handling of deep MathML text nodes when alttext is present
* TTS: MathML synthetic speech read aloud without MathJax via alttext attribute or fallback to element textual contents
* TTS: synthetic speech read aloud of MathJax / MathML + added image / SVG playback highlight
* DAISY: support for v2.02 ncc.html import and packaged / zipped fileset, audio-only with TOC and phrase granularity, as well as full-text full-audio (EPUB3 Media Overlays equivalent)
* DAISY: fixed regression bug with exploded / unzipped fileset import (publication from OPF package file was failing)
* Fixed EPUB pagebreaks (ARIA role and epub:type attributes)
* GUI fix: OPDS add dialog text input keyboard default focus + button submit click on enter, also added OPDS URL to hover tooltip
* GUI fix: keyboard usability of LCP passphrase input dialog (default focus of text input, default submit button on enter key)
* CSS fix for dialogs, scrollbars were visible even when no overflow (Windows and Linux, or MacOS with optional "show always" system setting)
* Fix for EPUBs with scripted drag-drop interactions
* Improvement of CSS styles in library window, significant refactoring under the hood to ease maintenance
* Bugfix: fixed-layout (FXL) zoom now with crisp  text / vector graphics font scaling
* OPDS: fixed a bug in W3C LPF acquisition
* OPDS: fullscreen authentication window
* OPDS: improved title+summary user interface (Atom XML)
* OPDS: import of catalog of feeds from system ENV variable
* Developer workflow: CSS styles are now "typed", i.e. static analysis of available classnames + compile-time checking, improved CSS loader / hashed classnames syntax
* Documentation: updated French readme
* LCP: localisation fixes (multilingual information)

(previous [v1.7.3 changelog](./CHANGELOG-v1.7.3.md))

## Full Change Log

Git commit diff since `v1.7.3`:
https://github.com/edrlab/thorium-reader/compare/v1.7.3...v1.8.0

=> **63** GitHub Pull Requests / top-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/5cb14e7a906e3e4a2577d71f6a5070443e910233) __feat:__ URL protocol handler (opds://) and fixed command line interface / file browser actions,  open multiple files (PR [#1573](https://github.com/edrlab/thorium-reader/pull/1573) Fixes [#1506](https://github.com/edrlab/thorium-reader/issues/1506) Fixes [#1124](https://github.com/edrlab/thorium-reader/issues/1124) Fixes [#1492](https://github.com/edrlab/thorium-reader/issues/1492) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/00e0b8d8b6369edc7bd3962d5cf4b3b57f036575) __fix(l10n):__ French readme (PR [#1610](https://github.com/edrlab/thorium-reader/pull/1610) follows PR [#1581](https://github.com/edrlab/thorium-reader/pull/1581) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/89721bc3c5f9f82b4c061fc702c6a3917f53e6cd) __chore(NPM):__ updated strategy to deal with the compromised Colors package. Electron Rebuild now uses Chalk, but we continue to remove offending node_modules folder (transitive dependencies)
* [(_)](https://github.com/edrlab/thorium-reader/commit/62efce0182bcaf4229e8fc05543e7ce8451631b2) __chore(release):__ version bump to 1.8.0 (still alpha, just preparing), and ensure Electron builds with latest point release [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/5f075d41e6b55520e8edac599695aa5c2cc006af) __chore(NPM):__ package updates, new xmldom namespaced module name, and workaround for compromised colors package (since v1.4.1)
* [(_)](https://github.com/edrlab/thorium-reader/commit/3ad0232182bdff6377209b23ac1965e29bf03d04) __fix(a11y):__ bookmark add/remove screen reader notifications (ARIA live via visual "toast" user interface), also fixed the bookmark add/remove logic based on keyboard interaction versus icon button, current text selection (for bookmark name), etc. (Fixes [#1438](https://github.com/edrlab/thorium-reader/issues/1438) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/76d0c218c873fa6b99dde6db176cf33b28062134) __fix(a11y):__ screen reader hyperlink activation was causing mouse interaction in some cases, which in turn triggered false positives in some critical user interaction detection logic to establish the current reading location (for bookmarking, resuming, etc.)
* [(_)](https://github.com/edrlab/thorium-reader/commit/16d52d14782009d05167ec34971c17ea81cb0e9e) __feat(a11y):__ visual indicator of current reading location in table of content (navigation panel) as well as keyboard shortcut SHIFT CTRL N to focus directly on the current heading (existing CTRL N shortcut remains, which only opens the navigation panel, doesn't focus on the TOC tree) (Fixes [#1521](https://github.com/edrlab/thorium-reader/issues/1521) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f5bcedf1ea091a4e153dee711ec1307959799b3) __chore(NPM):__ package updates, fixes popup footnotes and adds support for external documents (Fixes [#1606](https://github.com/edrlab/thorium-reader/issues/1606) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/1bf00ef9b5352a36901b9b6ac4258d9957ffa2c0) __fix(OPDS):__ publication info popup modal dialog was crashing (regression since recent "where am I" feature), and fullscreen auth window (see PR [#1566](https://github.com/edrlab/thorium-reader/pull/1566) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4e381fe58b6bef68b82e796886ae026eb895450c) __fix(l10n):__ LCP info (Fixes [#891](https://github.com/edrlab/thorium-reader/issues/891) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d021bc9c174c32e08d73ba5278e91a7c2a505eb0) __fix(a11y):__ support for headings hierarchy with missing heading identifiers (linkable parent / ancestor sectioning elements) Follows PR [#1608](https://github.com/edrlab/thorium-reader/pull/1608)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5907f0a1643ffe0e1bfac0d95fc02bc153a24642) __fix(a11y):__ added missing headings trail leading to current reading location in "where am I" section of publication info popup modal dialog (follows PR [#1608](https://github.com/edrlab/thorium-reader/pull/1608) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b69b722ae5279d457cafd2cf2486455d2e2bf65) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/34540141f6f554f7d8b778f14ccc4aeb1ddf2987) __fix(lint):__ code formatting errors in the previous commit, sorry
* [(_)](https://github.com/edrlab/thorium-reader/commit/c580d6a90b520a32bab295b65df2530d1b9f26c6) __feat(a11y):__ "where am i?" information in publication popup, CTRL+i keyboard shortcut with SHIFT modifier key to focus (PR [#1608](https://github.com/edrlab/thorium-reader/pull/1608))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9c0017ce447141e6a9d59146594a471438e331d7) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/c250f59cb5d2116f427937ffa6dd18a5e23242b1) __fix(TTS):__ synthetic speech readaloud of hidden DOM fragments now skipped, also improved mouse click hit testing and handling of deep MathML text nodes when alttext is present (Fixes [#1559](https://github.com/edrlab/thorium-reader/issues/1559) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c86bc39bd8c153ff635daff745c6af29773ad524) __fix(a11y):__ much improved accessibility support in content webview, keyboard focus management with screen readers
* [(_)](https://github.com/edrlab/thorium-reader/commit/8cb091c7e432b6e5a09baf762091cefb3535a09e) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/04a62dcb891cc1ecdb6075bdff94e78782c9734e) __fix(UI):__ OPDS add dialog text input keyboard default focus + button submit click on enter, also added OPDS URL to hover tooltip
* [(_)](https://github.com/edrlab/thorium-reader/commit/c79cbaf92d4b7b72b82d541f012fafde621e550f) __fix(UI):__ keyboard accessibility / usability of LCP passphrase input dialog (default focus of text input, default submit button on enter key)
* [(_)](https://github.com/edrlab/thorium-reader/commit/a0ad95db513944608dce830a91080cf7dfce7e22) __Merge branch 'develop' of github.com:__readium/readium-desktop into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/d34b21d414e2726557c9717757e74fc426fb4503) __fix(CSS):__ dialogs scrollbars were visible even when no overflow (Windows and Linux, or MacOS with optional "show always" system setting)
* [(_)](https://github.com/edrlab/thorium-reader/commit/1ed9fa42816593708c18e0f8a74acfed461dca5c) __chore(doc):__ [skip ci] updated SQLite3 and LevellDown native lib compile instructions / troubleshooting for Windows Visual Studio / MSBUILD 2017 vs. 2019
* [(_)](https://github.com/edrlab/thorium-reader/commit/ee0ad37f9b28fb04d1add3c9bb472dce2227f0c6) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/6dd8dd81a8cb936a22de895f4d79029d2249aad9) __fix:__ EPUBs with scripted drag-drop interaction were broken (Fixes [#1599](https://github.com/edrlab/thorium-reader/issues/1599) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/47c6f394e06075adf055ad28d7b05601fae1fb9d) __fix:__ EPUB pagebreaks (role and epub:type attributes) (Fixes [#1597](https://github.com/edrlab/thorium-reader/issues/1597) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/911ac1a694588f9aa307065a2ae89f3d34cc9e3c) __feat(TTS):__ MathML synthetic speech read aloud without MathJax via alttext attribute or fallback to element textual contents, NPM package updates (r2-navigator-js notably)
* [(_)](https://github.com/edrlab/thorium-reader/commit/910c3c59133d41926ee086c807029fbee5a7cac3) __fix(TTS):__ synthetic speech read aloud of MathJax / MathML + added image / SVG playback highlight + NPM package updates (Fixes [#1593](https://github.com/edrlab/thorium-reader/issues/1593) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e20ada29973866a27866bd882f3cc2945040ad85) __feat(DAISY):__ support for v2.02 ncc.html import and packaged / zipped fileset, audio-only with TOC and phrase granularity, as well as full-text full-audio (EPUB3 Media Overlays equivalent) (Fixes [#1534](https://github.com/edrlab/thorium-reader/issues/1534) Fixes [#1579](https://github.com/edrlab/thorium-reader/issues/1579) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/5d4cc3244c18c671eeacd2c76d277f0ee42a0e7c) __fix(DAISY):__ exploded / unzipped fileset import publication from OPF package file was failing (r2-utils-js regression bug in ZIP directory emulation from filesystem folder)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0c40d4d9c15f065398eba38283eec62fad5845c2) __chore(dev):__ added regex replace to nuke integrity check on Divina
* [(_)](https://github.com/edrlab/thorium-reader/commit/f11b9823c191ab9988af6551acffad191e66d65b) __chore(dev):__ CI Windows NPM cache clear (checksum integrity woes...)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b2e14729ece74ee299de97b8f501c06892d90f49) __chore(dev):__ Windows CI package-lock.json patch update (another fix attempt)
* [(_)](https://github.com/edrlab/thorium-reader/commit/34458d340855813c7baf2a95764eba1d4e0ae4b5) __chore(dev):__ GitHub Actions Windows CI fix attempt, this time via package-lock.json patching
* [(_)](https://github.com/edrlab/thorium-reader/commit/ccd6f7a41e6751818be6a0eeeb88cc4df01abeb7) __chore(NPM):__ package updates and yet another CI Windows fix attempt (see previous commits)
* [(_)](https://github.com/edrlab/thorium-reader/commit/536a4e477c70843ab1cce548284ba988eeffe9e9) __chore(dev):__ fourth Windows CI fix attempt (see previous commits)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0f3956ef1a9faee2c823f5cc6b5616a36464e287) __chore(dev):__ third CI fix attempt (see previous commits)
* [(_)](https://github.com/edrlab/thorium-reader/commit/852a56c5ec298674285f09a800e682df066f6841) __chore(dev):__ second CI fix attempt (see previous commit)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0cebea0632ea038429b2ad868792a2cf073bd865) __chore(dev):__ attempt to fix Windows CI (GitHub Actions Continuous Integration service with windows-2016 vs. windows-latest Virtual Machine environment), also includes attempted fix for git-ssh vs. https secure URLs (Divina non-NPM package fetch directly from Git revision)
* [(_)](https://github.com/edrlab/thorium-reader/commit/40a6a78ce94457dd9cbc4857469238f54c815ef0) __chore(NPM):__ package updates, including Electron v16
* [(_)](https://github.com/edrlab/thorium-reader/commit/42c7a8fe12a8e1ba9c75161f0f71f4dead4d521c) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d3b98997ee40a7d92ab7e41f64e0931e56361cd0) __fix(OPDS):__ OPDS1 title+summary UI (via r2-opds-js bugfix too), NPM package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/5fe5caeed889d32c8e9ddb75a029d4aded763fa7) __fix(dev):__ GitHub Actions NPM v7+ Git SSH vs. HTTPS authentication (Divina package)
* [(_)](https://github.com/edrlab/thorium-reader/commit/cdc607b40062e7c34a11f5baf316685028131ee8) __fix(CSS):__ library window refactor (Thibault) (PR [#1589](https://github.com/edrlab/thorium-reader/pull/1589) supersedes PR [#1571](https://github.com/edrlab/thorium-reader/pull/1571)  Fixes [#410](https://github.com/edrlab/thorium-reader/issues/410) Fixes [#1196](https://github.com/edrlab/thorium-reader/issues/1196) Fixes [#1348](https://github.com/edrlab/thorium-reader/issues/1348) Fixes [#1329](https://github.com/edrlab/thorium-reader/issues/1329) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d77a56dd054c39c7986767a382541b908f12ba13) __chore:__ removed unused package Font Awesome
* [(_)](https://github.com/edrlab/thorium-reader/commit/5a1d7aa497a6c9af3351bac0e171180969d68c63) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/9e2e95047fff00f98740cae1cdb656d4efe9afd6) __chore:__ removed unused React DropDown dependency (React DropZone remains)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0f2cb5c3aac46e88d247548d7568ab7a3a5eeaaf) __fix(FXL):__ zoom Fixed Layout text crisp vector graphics font scaling (updated NPM package R2 navigator)
* [(_)](https://github.com/edrlab/thorium-reader/commit/3ce8de819725fb5b7738a371cd4ef7130dd2fdf2) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/77eaf442162d550698b784fd8bcf00cac898f002) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/cc03966c1b9e438715742da243c8a7e708e7eb13) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/eba1de0aed4196ad7124958dec0ba5ee36bd4e32) __fix(OPDS):__ W3C LPF acquisition (Fixes [#1582](https://github.com/edrlab/thorium-reader/issues/1582) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/264316d4c6d1d2a82a155b2442ac167facb59d87) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/318a6506a3c006d641714048382903d60aa57c7b) __chore(NPM):__ package updates, notably Electron v15 (upgraded navigator to match), but no code mods due to breaking changes
* [(_)](https://github.com/edrlab/thorium-reader/commit/309707e23cefdb12d3e095914dcb17b19775a5eb) __chore(NPM):__ package updates, notably ESLINT which requires strict semicolon (default rule)
* [(_)](https://github.com/edrlab/thorium-reader/commit/81a56e7afa9c525ce952fc521cdc0982874e0cee) __chore(dev):__ improved DEV styles compiler, CSS loader / hashed classnames syntax (PROD unchanged)
* [(_)](https://github.com/edrlab/thorium-reader/commit/2fae60b44171dc033574acef92f089ca6df2970b) __chore(dev):__ eliminated redundant React Redux types during postinstall (v16 vs. v17)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b282b1187d47caed8d7f25bf92810aa3d80760db) __feat(OPDS):__ automatic import of catalog of feeds from ENV variable (PR [#1564](https://github.com/edrlab/thorium-reader/pull/1564) Fixes [#274](https://github.com/edrlab/thorium-reader/issues/274))
* [(_)](https://github.com/edrlab/thorium-reader/commit/445f73cb299602a6dfccebaeddb095546a32cfe6) __fix(dev):__ CSS styles are now "typed", i.e. static analysis of available classnames, compile-time checking (PR [#1575](https://github.com/edrlab/thorium-reader/pull/1575))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a20bc5969d579e38ccbb6a6c4f35421e9b1728a3) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/3589d8df1f00c68423f38c117886ba13dcb43d02) __chore(release):__ v1.7.4-alpha.1 version bump, new dev trunk

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.7.3...v1.8.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
