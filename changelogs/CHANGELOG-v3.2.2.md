# Thorium Reader v3.2.2

## Summary

Version `3.2.2` was released on **18 August 2025**.

This release includes the following (notable) new features, improvements and bug fixes:

* Upgraded to Electron v37 (was 36) which fixes the screen reader detection regression introduced in Thorium v3.2.1
* Fixed accessibility issues related to previous/next backward/forward GUI buttons (labelling and semantic region containers for screen readers, and inert/disabled commands)
* Updated translations

(previous [v3.2.1 changelog](./CHANGELOG-v3.2.1.md))

## Full Change Log

Git commit diff since `3.2.1`:
https://github.com/edrlab/thorium-reader/compare/v3.2.1...v3.2.2

=> **14** GitHub Git commits:
* [(_)](https://github.com/edrlab/thorium-reader/commit/d605763e4ba19ad1159c049e17d3215c72a6e549) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8a36fb5f455d1960ffa42b727612037b92bf31c) __chore(NPM):__ package updates, notably Electron v37 (was 36) which fixes the screen reader detection regression (Fixes [#3106](https://github.com/edrlab/thorium-reader/issues/3106) Fixes [#3105](https://github.com/edrlab/thorium-reader/issues/3105) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ee0e3869157540886e183913704733fbd195c332) __fix(a11y):__ added navigation region container for left/right previous/next arrow icon buttons (Fixes [#3108](https://github.com/edrlab/thorium-reader/issues/3108) Fixes [#3110](https://github.com/edrlab/thorium-reader/issues/3110))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2fb24eddb55bc3b0e40e536267d44bd4ccd73fc2) __fix(l10n):__ French for Go Forward / Backward (Fixes [#3108](https://github.com/edrlab/thorium-reader/issues/3108) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/a995dc2cf6d9c44bd61ddb27f6c31831728b73a1) __fix(a11y):__ navigation history back/forward buttons were visually dimmed and non-clickable but screen readers perceived them as active, now with ARIA disabled boolean (Fixes [#3110](https://github.com/edrlab/thorium-reader/issues/3110))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f730490048294368ad9cdb0ebd30f0692def4a8a) __fix(l10n):__ Thorium 3.0 welcome screen now less-specific v3 [skip ci] (Fixes [#3111](https://github.com/edrlab/thorium-reader/issues/3111) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/3418f92c47ad0330a3869d118e5a2b55c913999b) __fix(l10n):__ updated translations via Weblate, Arabic and Turkish (PR [#3118](https://github.com/edrlab/thorium-reader/pull/3118))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7a861215ed5f4c03f81d78810d5c62795a59c3c2) __fix(l10n):__ updated translations via Weblate: Turkish, Italian, Lithuanian, Danish, Swedish, English (PR [#3107](https://github.com/edrlab/thorium-reader/pull/3107))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9e5b40848fb598bd108c89582f86ff423b3c1df3) __fix(Electron):__ v37 regression bug screen reader detection --> rollback to v36 for now, so we can run tests (See [#3106](https://github.com/edrlab/thorium-reader/issues/3106))
* [(_)](https://github.com/edrlab/thorium-reader/commit/da8e2a5b56967c421cc471d02978bf2581c6300e) __fix(a11y):__ will fix [#3105](https://github.com/edrlab/thorium-reader/issues/3105) once the Electron v37 regression bug is squashed (detection of screen readers)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e49ad640e91c540fc9af4aa177afd98000b6ce72) __fix:__ start/end chapter navigation (SHIFT key modifier on arrow icon buttons) now accounts for page progression direction RTL vs. LTR
* [(_)](https://github.com/edrlab/thorium-reader/commit/3f83fb5b22c7fe69077cd1871d89bb8b86e67e7f) __fix(a11y):__ left/right arrow icon buttons are now labelled properly to indicate their function (previous/next page or backward/forward scroll depending on progression direction RTL/LTR) (Fixes [#3104](https://github.com/edrlab/thorium-reader/issues/3104) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/3c82fc1ea49bd1519a2f47c3fd3bb22be02054f1) __chore(release):__ v3.3.0-alpha.1 CI trigger
* [(_)](https://github.com/edrlab/thorium-reader/commit/4ac40230f2e43c6a15bb4ec9952832439dd047ec) __chore(release):__ latest.json v3.2.1 [skip ci]

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v3.2.1...v3.2.2 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
