# Thorium Reader v2.1.0

## Summary

Version `2.1.0` was released on **09 August 2022**.

This release includes the following (notable) new features, improvements and bug fixes:

* Added support for Dilicom library connector (not OPDS, special API).
* Localisation: fixed French, Spanish, Portuguese (Portugal) and Swedish translations. Added the EDRLab.org documentation website link to all locales, in the "about Thorium" XHTML (the link currently redirects to a GitHub microsite that hosts Thorium's user guide).
* Added basic "telemetry" feature: anonymous system information sent to EDRLab server on application startup.
* Fixed reader window menus which were not closed automatically when switching to fullscreen.
* Fixed README documentation, updated supported languages.

(previous [v2.0.0 changelog](./CHANGELOG-v2.1.0.md))

## Full Change Log

Git commit diff since `v2.0.0`:
https://github.com/edrlab/thorium-reader/compare/v2.0.0...v2.1.0

=> **19** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/5a2781974a4cc9dee619cece5f3f5fe6f3c0ed38) __fix(lint):__ identation!
* [(_)](https://github.com/edrlab/thorium-reader/commit/322b7aa082697d65cbe35115fcb34d3e25840e77) __chore(dev):__ WebPack JS config formatting
* [(_)](https://github.com/edrlab/thorium-reader/commit/e83fc25333fb736928a012f2890c1895e81616ff) __chore(doc):__ added EDRLab.org doc redirect link to all locales "about Thorium" XHTML
* [(_)](https://github.com/edrlab/thorium-reader/commit/412ee2a369588e36485b33d9eb99afa5a95074fa) __chore(doc):__ added language-agnostic user guide link for EN, fixed for FR
* [(_)](https://github.com/edrlab/thorium-reader/commit/d0e3dcbe7388f1eebdb3e1d4b58d46c8503b4088) __feat:__ telemetry, basic anonymous system info on startup (PR [#1711](https://github.com/edrlab/thorium-reader/pull/1711) Fixes [#1686](https://github.com/edrlab/thorium-reader/issues/1686))
* [(_)](https://github.com/edrlab/thorium-reader/commit/62285d857477993ae21cd2f348756871e30ab3a4) __feat:__ save app version in redux store, JSON filesystem persistence (PR [#1710](https://github.com/edrlab/thorium-reader/pull/1710))
* [(_)](https://github.com/edrlab/thorium-reader/commit/91f02c2885edcf93128335c8e1b15e8bac61c109) __fix(l10n):__ added missing French translations (PR [#1722](https://github.com/edrlab/thorium-reader/pull/1722))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6da869aebe120d2a11f0fa8aa59268a499fca110) __chore(NPM):__ package updates including new "vanilla extract" lib in preparation for CSS refactor in data grid bookshelf (inline styling) (PR [#1706](https://github.com/edrlab/thorium-reader/pull/1706))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a661ff7f64572cf4c1393ee517a65bc29328d3b0) __fix(doc):__ image zoom keyboard shortcut is with SHIFT key modifier, not CTRL [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c0561732c72fb698e240144fd11939b465c4f561) __fix(doc):__ typo EDROLab -- EDRLAB (PR [#1718](https://github.com/edrlab/thorium-reader/pull/1718))
* [(_)](https://github.com/edrlab/thorium-reader/commit/382bf869a1e468125e66371f1054fd79198fa6df) __fix(l10n):__ updated Swedish translation (PR [#1708](https://github.com/edrlab/thorium-reader/pull/1708) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8440ea1314bf927aa3a45c062ac24006d512b59c) __fix(l10n):__ updated Portuguese-Portugal translation (PR [#1707](https://github.com/edrlab/thorium-reader/pull/1707) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6fd9f167a00a0a930fd991100a9891c6e6b1a996) __fix(l10n):__ updated Spanish translation (PR [#1712](https://github.com/edrlab/thorium-reader/pull/1712))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fec61ed371d1616bfd0d230b5b072cd7e5b3970d) __feat:__ Dilicom API "apiapp" integration (PR [#1684](https://github.com/edrlab/thorium-reader/pull/1684))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6cda2471995fc8a66b2b09a293fec566a4c00451) __fix:__ settings menu in the reader window is now also closed automatically when switching to fullscreen (see PR [#1701](https://github.com/edrlab/thorium-reader/pull/1701) Fixes [#1699](https://github.com/edrlab/thorium-reader/issues/1699))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c3d4f57ae86e544c343c7aed64343e2b3e57f336) __fix:__ reader menu is closed automatically when switching to fullscreen (PR [#1701](https://github.com/edrlab/thorium-reader/pull/1701) Fixes [#1699](https://github.com/edrlab/thorium-reader/issues/1699))
* [(_)](https://github.com/edrlab/thorium-reader/commit/73ed5d061114faa9776fef71706a62be29e9dd03) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/03b16f62c25351d7f0ffcb9281f28d58d0b46474) __chore(doc):__ added new translations / locales, updated instructions in the README [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/96c6702c8922bb8dbec3ce4492ed52ffa3290d19) __chore(release):__ version bump

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v2.0.0...v2.1.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
