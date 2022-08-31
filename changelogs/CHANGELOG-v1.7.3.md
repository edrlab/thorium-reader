# Thorium Reader v1.7.3

## Summary

Version `1.7.3` was released on **11 October 2021**.

This release includes the following (notable) new features, improvements and bug fixes:

* Electron version 14.x (fixes HTTPS LetsEncrypt + OpenSSL/BoringSSL certificate expiry bug)
* Localisation: Georgian localization ('ka')
* Accessibility: fixes screen reader ARIA labels on HTML controls
* Keyboard interaction: left/right arrows (etc.) in contenteditable=true and textarea HTML elements must not interrupt typing / must not turn pages
* OPDS error handling: support for "problem details" HTTP response JSON
* Library search: lookup title and author data in publication bookshelf
* OPDS search: URL with {searchTerms} curly braces query/path syntax must not be escaped, due to automatic URI percent encoding
* OPDS authentication: OAuth response body was JSON content-type, must be form-urlencoded as per RFC6749

(previous [v1.7.2 changelog](./CHANGELOG-v1.7.2.md))

## Full Change Log

Git commit diff since `v1.7.2`:
https://github.com/edrlab/thorium-reader/compare/v1.7.2...v1.7.3

=> **13** GitHub Pull Requests / top-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/d1a40be402538e7665ebfe65a2bed00b83e4d98d) __chore(NPM):__ package updates, notably Electron which fixes NodeJS HTTPS OpenSSL / BoringSSL LetsEncrypt certificate expiry bug
* [(_)](https://github.com/edrlab/thorium-reader/commit/7fd03d3c1f3b876762506f63deaf78ae0d769fdd) __chore(NPM):__ minor package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/f79609d82d5e50e6cb8e324d46a40ee4d403dd9d) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/bece3f3fb8aad145a009d9ed61a9296b427d4dff) __feat(l10n):__ 'ka' Georgian localization (PR [#1568](https://github.com/edrlab/thorium-reader/pull/1568) original PR [#1557](https://github.com/edrlab/thorium-reader/pull/1557))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5e2dfe569a0915e479f560940b62168ad7e1fe38) __fix(OPDS):__ problem details HTTP response (PR [#1546](https://github.com/edrlab/thorium-reader/pull/1546) Fixes [#1536](https://github.com/edrlab/thorium-reader/issues/1536))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2d559bbf2ec525862eb91d3f332a586ba811826e) __chore(NPM):__ package updates, Electron v14 compiler target
* [(_)](https://github.com/edrlab/thorium-reader/commit/819a786a3b670f6bdf25fe90fa2cbfc742c7f5b1) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/cf41d85a2116982ca22cabfee053c38bc40953d3) __fix:__ search by title and author in publication library (PR [#1551](https://github.com/edrlab/thorium-reader/pull/1551) Fixes [#298](https://github.com/edrlab/thorium-reader/issues/298) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/19425b32fbde1f14748bda5f332931ee5810800b) __fix(a11y):__ screen reader ARIA control labels (PR [#1558](https://github.com/edrlab/thorium-reader/pull/1558))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d11eb37de704cdf36fb41d0d855d84a8c8cbdac) __fix(OPDS):__ search URL with {searchTerms} curly braces query/path syntax must not be escaped, due to automatic URI percent encoding (see PR [#1552](https://github.com/edrlab/thorium-reader/pull/1552) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8deeda2ba66cbf80ce134ffc2c1121a0330f85a) __fix:__ OAuth response body was JSON content-type, must be form-urlencoded as per RFC6749 (PR [#1555](https://github.com/edrlab/thorium-reader/pull/1555) Fixes [#1554](https://github.com/edrlab/thorium-reader/issues/1554))
* [(_)](https://github.com/edrlab/thorium-reader/commit/568a07585813218d7658bfe2e1dd27b45507fe1b) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d7bd8672794f459a51517677a25d4545de669e18) __fix:__ left/right arrow and other keyboard interactions in contenteditable=true and textarea HTML elements cause typing event skipping (e.g. no page turn action)

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.7.2...v1.7.3 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
