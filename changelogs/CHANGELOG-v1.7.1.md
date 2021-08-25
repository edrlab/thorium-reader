# Thorium Reader v1.7.1

## Summary

Version `1.7.1` was released on **18 June 2021**.

This release includes the following (notable) new features, improvements and bug fixes:

* MathML support: updated to latest MathJax library (3.2.0)
* OPDS catalog: prevent adding the same feed URL multiple times
* Publication rendering: automatically hide mouse cursor in document viewport when inactive for 1 second
* OPDS authentication: title was not human-readable in some cases
* User interface: in fullscreen mode, automatically hide bottom and top user interface controls after 1 second of inactivity (reactivated during keyboard activity)
* Text To Speech: support for SVG aria-label attribute and title element, new "read aloud" option for enabling/disabling utterance splitting (textual sentence detection), and possibility to skip fragmented text when invoking the previous/next navigation commands using the alt+shift key modifiers on button click, or using the available alternative keyboard shortcut
* Content navigation UX: modal overlay panel (table of contents, landmarks, bookmarks, search, goto page) automatically closes on button/hyperlink click and keyboard enter events, except when trigerred with key modifiers shift+alt
* OS integration: removed installer association of PDF, OPF and ZIP file extensions to avoid hijacking existing file type handlers (Thorium icon and default app launcher). This removes the "open with.." menu and double click from file explorer / Finder, but Thorium continues to support these file types via drag and drop and file chooser
* Localization: new Swedish translation, and updated Portuguese (Portugal)
* Fixed audio/video "track" support (CORS cross origin media URL)
* Publication information (modal dialog overlay): now displays audiobook tracks and duration
* PDF: removed broken paginated / column options
* Library / bookshelf tags: avoid showing the special "about Thorium" auto-generated publication

(previous [v1.7.0 changelog](./CHANGELOG-v1.7.0.md))

## Full Change Log

Git commit diff since `v1.7.0`:
https://github.com/edrlab/thorium-reader/compare/v1.7.0...v1.7.1
https://github.com/edrlab/thorium-reader/compare/v1.7.0...develop

=> **24** GitHub Pull Requests or high-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/a496ee6764bc0a9275d4b93487a12735129344db) __chore(NPM):__ package updates, including MathJax [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f5463c6aae973860a818f7f3743e4c74f4278b31) __fix(OPDS):__ prevent adding same feed URL multiple times in catalog (even if different titles). This will be necessary for bare opds:// handler (load feed from web browser URL callback)
* [(_)](https://github.com/edrlab/thorium-reader/commit/bda8f0ae218fd8fbdde4aca1ad9c454b91c73e41) __feat(UI):__ automatically hide mouse cursor in publication document viewport when inactive for 1 second, and in fullscreen mode also hide bottom and top user interface controls (automatically reactivated during keyboard activity) (Fixes [#1430](https://github.com/edrlab/thorium-reader/issues/1430) Fixes [#1505](https://github.com/edrlab/thorium-reader/issues/1505) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a9807bca7d34c05d9719d823ae55bbf2a250478) __fix(TTS):__ SVG aria-label attribute and title element support, enable/disable text split, and skip sentence detection option during previous/next navigation with alt+shift key modifiers on button click or alt keyboard shortcut (Fixes [#1501](https://github.com/edrlab/thorium-reader/issues/1501) Fixes [#1502](https://github.com/edrlab/thorium-reader/issues/1502) Fixes [#1488](https://github.com/edrlab/thorium-reader/issues/1488) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6617b1165ce700bf3a8322e90fbfabd8ef5efd02) __fix:__ removed handling of PDf and OPF file extensions (Fixes [#1474](https://github.com/edrlab/thorium-reader/issues/1474) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8adaaf6809cb4590b9202f5e6fa661475be4491d) __fix(OPDS):__ authentication title was not human-readable in some cases (Fixes [#1409](https://github.com/edrlab/thorium-reader/issues/1409) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/27f1588b342e26520dd174986783719899a50f34) __fix:__ navigation panel closes on button/hyperlink click and enter events with key modifiers shift+alt (TOC, landmarks, bookmarks, search, goto page) (PR [#1512](https://github.com/edrlab/thorium-reader/pull/1512) Fixes [#1449](https://github.com/edrlab/thorium-reader/issues/1449) Follows PR [#1484](https://github.com/edrlab/thorium-reader/pull/1484) and PR [#1478](https://github.com/edrlab/thorium-reader/pull/1478) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/076046fff196864036c6b21e560f96e55cc1b9f2) __chore(NPM):__ package updates (inc. electron-builder for creating Thorium executables/installers)
* [(_)](https://github.com/edrlab/thorium-reader/commit/cbfecb9799356927c6c738bc94347bae315f643b) __fix(UI):__ bookmarks navigation, close modal overlay panel depending on user interaction, regular vs. alternative hyperlink activation (mouse click, keyboard enter, modifier keys)  (PR [#1484](https://github.com/edrlab/thorium-reader/pull/1484) Fixes [#1449](https://github.com/edrlab/thorium-reader/issues/1449))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5ccb8f1cbc438379ea3a15581cf69cc5ab2d9908) __fix:__ disable ZIP file extension association (DAISY Digital Talking Books), which disables "open with.." and double click from file explorer, but continue to support ZIP files via drag and drop, file chooser, etc. (Fixes [#1468](https://github.com/edrlab/thorium-reader/issues/1468))
* [(_)](https://github.com/edrlab/thorium-reader/commit/23a3ce4e1e0cf32bce0a788a9f764712ccbf9f55) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b508328c85a86613bc2db5596b715a67afda8be) __feat(l10n):__ Swedish translation (PR [#1491](https://github.com/edrlab/thorium-reader/pull/1491) PR [#1500](https://github.com/edrlab/thorium-reader/pull/1500))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ff24155e177e99acda20e35bf747f79873df968b) __fix(l10n):__ pt-PT Portuguese-Portugal language update (PR [#1497](https://github.com/edrlab/thorium-reader/pull/1497) PR [#1499](https://github.com/edrlab/thorium-reader/pull/1499))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6dd83919577e45edf2fa0b2450c40dd22e78ee20) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/4dcfbaa4f75093d9ba7abedf34d34613afac9c34) __chore(NPM):__ package updates, notably R2 navigator with audio/video track CORS cross origin src URL fix (Fixes [#1487](https://github.com/edrlab/thorium-reader/issues/1487) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c31b7bd4b33c421291d65d867f6e93d3041a6c1d) __fix(about):__ tag create in thorium "about" is not show in library view (PR [#1482](https://github.com/edrlab/thorium-reader/pull/1482), fixes [#1464](https://github.com/edrlab/thorium-reader/issues/1464))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f9ca0acd40e8af3743ff13a0e79de2ce104692c9) __fix(opds):__ audiobooks tracks and duration in OPDS publication info (PR [#1479](https://github.com/edrlab/thorium-reader/pull/1479), fixes [#1394](https://github.com/edrlab/thorium-reader/issues/1394) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8536a0a2feeb98f410ac3c4f98febb2c6b15575b) __chore(lint):__ lint:fix
* [(_)](https://github.com/edrlab/thorium-reader/commit/606bb107cecf710b84cead00dfd093bbbac9ce92) __chore(lint) :__ eslint and eclint autofix (PR [#1471](https://github.com/edrlab/thorium-reader/pull/1471))
* [(_)](https://github.com/edrlab/thorium-reader/commit/92a5f8f11dc542e1934f67b4f18d2ae10967d582) __TOC:__ keep the menu open during toc browsing (PR [#1478](https://github.com/edrlab/thorium-reader/pull/1478), fixes [#1449](https://github.com/edrlab/thorium-reader/issues/1449))
* [(_)](https://github.com/edrlab/thorium-reader/commit/618603ca7dd2fa52a2b1346540be61ebe09baad7) __pdf:__ remove pagination mode (PR [#1476](https://github.com/edrlab/thorium-reader/pull/1476)m fixes [#1423](https://github.com/edrlab/thorium-reader/issues/1423))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1eab5d8768b0be037599c723e418e471a5ea721c) __PDF:__ column locked in EPUB reflow mode (PR [#1475](https://github.com/edrlab/thorium-reader/pull/1475), fixes [#1470](https://github.com/edrlab/thorium-reader/issues/1470)))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b0121f2fbbf4c28f51b6caa06e5a78e843c76d9) __chore(CI):__ NodeJS v14 in GitHub Actions Workflow YAML
* [(_)](https://github.com/edrlab/thorium-reader/commit/5aab62c2358ff12a189e64026c2c392c8a734f0f) __chore(release):__ version bump 1.7.1-alpha.1

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.7.0...v1.7.1 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
