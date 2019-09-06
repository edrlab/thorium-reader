# Thorium Reader v1.0.4

## Summary

Version `1.0.4` was released on **06 September 2019**.

This release includes the following (notable) new features, improvements and bug fixes:

* Restored AppX Microsoft Windows App Store application name in package.json
* User Interface improvements
  * OPDS breadcrumb navigation now top-sticky for long vertical scrolling gridlist
  * Publication tags editor / text input field now with add submit button
  * Skip failed EPUB instead of abort during mulitple publications import
  * Fixed OPDS catalog title overflow
* Developer tweaks: changelog re-organization, tooling for auto-generation from Git commit history

(previous [v1.0.3 changelog](./CHANGELOG-v1.0.3.md))

## Full Change Log

Git commit diff since `v1.0.3`:
https://github.com/readium/readium-desktop/compare/v1.0.3...v1.0.4

=> **10** GitHub Pull Requests or high-level Git commits.

Here is the complete list of commits, ordered by descending date:

* [(_)](https://github.com/readium/readium-desktop/commit/6ed7cfc9aadce6dc84466c051467dd340775f31b) __fix:__ restore application name in package.json for compatibility with Microsoft App Store (AppX), version bump 1.0.4 (PR [#687](https://github.com/readium/readium-desktop/pull/687))
* [(_)](https://github.com/readium/readium-desktop/commit/69e1776bf881f6b90e2227ae634d2d4c9d6ed875) __fix:__ OPDS breadcrumb always visible (PR [#686](https://github.com/readium/readium-desktop/pull/686) Fixes [#615](https://github.com/readium/readium-desktop/issues/615))
* [(_)](https://github.com/readium/readium-desktop/commit/f0add19b6fe3b12ff303280ed7b86647014caf9e) __feat(ui):__ submit button for publication tags (PR [#682](https://github.com/readium/readium-desktop/pull/682) Fixes [#344](https://github.com/readium/readium-desktop/issues/344))
* [(_)](https://github.com/readium/readium-desktop/commit/5ca7499f6ad30981f395f7de9271d17babfa6d32) __fix:__ skip failed EPUB during multiple publication import (PR [#680](https://github.com/readium/readium-desktop/pull/680) Fixes [#626](https://github.com/readium/readium-desktop/issues/626))
* [(_)](https://github.com/readium/readium-desktop/commit/362d0b12757ff232d179f237784c61f38b8a80bd) __fix:__ OPDS catalog view, long title overflow (PR [#684](https://github.com/readium/readium-desktop/pull/684) Fixes [#614](https://github.com/readium/readium-desktop/issues/614))
* [(_)](https://github.com/readium/readium-desktop/commit/d630092350e5a38d739844d08ff269290f2d720a) __chore(dev):__ Changelog generator now captures arbitrary issues/PRs references as well (e.g. "related to #xxx" or "follow-up to #zzz")
* [(_)](https://github.com/readium/readium-desktop/commit/0b24d181187dac82974e0975dd300a9e7f42ded4) __chore(dev):__ fixed the changelog generator script, added links to actual git commits (useful for hotfixes that do not have PRs)
* [(_)](https://github.com/readium/readium-desktop/commit/ccaca94a9e43c83848385b44bfccf30cf9357b58) __chore(dev):__ updated CHANGELOG generator script to include hyperlinks to PRs and issues
* [(_)](https://github.com/readium/readium-desktop/commit/b2fd8c9978ca7985d9e6eb972992a2da7656a9ab) __chore(dev):__ fixed changelog syntax (auto-extract script / one-liner shell command line)
* [(_)](https://github.com/readium/readium-desktop/commit/fe7d378adbf9b8f4334600f65530e2c0c989470c) __feat(dev):__ CHANGELOG re-organisation

__Tips__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.0.3...v1.0.4 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/readium\/readium-desktop\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/readium\/readium-desktop\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/readium\/readium-desktop\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
