# Thorium Reader v2.4.1

## Summary

Version `2.4.1` was released on **22 March 2024**.

This release includes the following (notable) new features, improvements and bug fixes:

* HOTFIX: regression bug from v2.3 publication metadata title can be empty / missing (was previously handled gracefully, but causes a crash and empty bookshelf in v2.4 ... bookshelf library still exists if just close Thorium without adding books)

(previous [v2.4.0 changelog](./CHANGELOG-v2.4.0.md))

## Full Change Log

Git commit diff since `v2.4.0`:
https://github.com/edrlab/thorium-reader/compare/v2.4.0...v2.4.1

=> **7** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/f96efddc8efc7b529cf437faa38d10da74eb37a5) __hotfix:__ regression bug from v2.3 publication metadata title can be empty / missing (was previously handled gracefully, but causes a crash and empty bookshelf in v2.4 ... bookshelf library still exists if just close Thorium without adding books)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4f18bec6c6bd6df16edf4fd5119609032e77e36e) __chore(NPM):__ updated packages [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/620731ea902482a6ab7aa8978bb47e1f5ae95725) __chore(release):__ Linux Docker with optional debug mode [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/46285ff392479d2f4d2569ca6da1e7c6c6c719e4) __chore(release):__ Linux Docker builder [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b792c5d0881aea2735583a2bad0248743ac2ed7f) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/80dd5355ac405cd7e7afa0421b0c4478309dc954) __chore(release):__ v2.5.0-alpha.1 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/aecc3f2354e0347e5e255f61f561b16ec1fa4d89) __(master) hotfix(release):__ MacOS DMG app code-sign Apple Silicon entitlements [skip ci]

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v2.4.0...v2.4.1 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
