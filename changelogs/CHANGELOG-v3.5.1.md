# Thorium Reader v3.5.0

## Summary

Version `3.5.1` was released on **02 September 2026**.

This release includes the following (notable) new features, improvements and bug fixes:

* Updated parsing logic for Windows registry proxy discovery settings to support PAC in addition to SOCKS, HTTPS, etc.
* Upgraded PDF rendering engine to Mozilla PDF.js v6.3.289, fixes a regression from Thorium Desktop reader version 3.4.0 (typefaces were broken)
* Fixed bug where both the GUI font (Nunito) and the ReadiumCSS typeface preview were failing to load in some cases, due to incorrect handling of path encoding when routing filesystem URLs (Windows was consistently impacted due to `:` in `C:\` filepaths, MacOS and Linux were only impacted with percent-encoded characters such as space ` ` in the applicatin path)
* Optional new feature: display page breaks indicators in document margin (functionality can be turned on/off in reader settings)
* Improved OPDS feed catalog ordering logic
* Added missing ReadiumWebPubManifest metadata 'conformsTo' alongside RDF 'type', also fixes incorrect httpS (versus http) URL for schema.org when used in RDF type (HTTPS usage remains in JSON @context)
* Updated translations

(previous [v3.5.0 changelog](./CHANGELOG-v3.5.0.md))

## Full Change Log

Git commit diff since `3.5.0`:
https://github.com/edrlab/thorium-reader/compare/v3.5.0...v3.5.1

=> **26** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/82b0de02c335bf1ce13d1a3616c1dd8d3d2a838d) __Revert "feat(telemetry):__ Introduce Google Analytics Measurement Protocol (PR [#3796](https://github.com/edrlab/thorium-reader/pull/3796))"
* [(_)](https://github.com/edrlab/thorium-reader/commit/08e9c9fdda28e89bfcfd6e8a73ef8b832b37079b) __feat(telemetry):__ Introduce Google Analytics Measurement Protocol (PR [#3796](https://github.com/edrlab/thorium-reader/pull/3796))
* [(_)](https://github.com/edrlab/thorium-reader/commit/929b7da9280607b01fc73a904f530355b65ccea8) __(tag:__ v3.5.1-beta.1) fix(PDF): Math.sumPrecise() is not available in Electron v41 / Chromium v146 (Fixes [#3810](https://github.com/edrlab/thorium-reader/issues/3810) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/14f2bd5365459e21bc5555b0116a8c986423c04c) __chore(release):__ v3.5.1-beta.1 [skip cd]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b0318aac6f22e3ae2260559d8e57b111325938bc) __fix(PDF):__ regression from 3.4.0 broken typefaces, upgraded to PDF.js v6.3.289 (Fixes [#3810](https://github.com/edrlab/thorium-reader/issues/3810) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/42e879697fce69877d059dec1e7f2eddfc6bc00e) __chore(release):__ revert latest.json from 3.5.0 to 3.4.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a3c345374af2f7c599bff64096ac998f1e81923a) __fix:__ Handle missing OPDS feed sort values (https://github.com/edrlab/thorium-reader/commit/d4362842fe11c8c3ae968e071b02d832937de984#r198418716)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e870c1b7535c4b3eb0f1e6deececc85219f1407d) __chore(dev):__ NodeJS Windows Registry native addon build folder git ignore [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c3f27572a9b33328049c18068017feb8274d422d) __fix:__ PAC proxy discovery via Windows registry, flexible parsing logic
* [(_)](https://github.com/edrlab/thorium-reader/commit/d4362842fe11c8c3ae968e071b02d832937de984) __fix(opds):__ make feed ordering deterministic
* [(_)](https://github.com/edrlab/thorium-reader/commit/e78726ae014852ebea4418c8517d86010bb6768f) __fix:__ added missing RWPM metadata 'conformsTo' alongside RDF 'type', also fixes incorrect httpS versus http (not secure) URL for schema.org when used in RDF type (HTTPS usage remains in JSON @context) (Fixes [#3815](https://github.com/edrlab/thorium-reader/issues/3815) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/36ef4f3de27bb5eb6b60741e3df94379dea28c36) __fix:__ official website changelog link prompt in status bar only for production releases without alpha/beta/rc suffix (Fixes [#3817](https://github.com/edrlab/thorium-reader/issues/3817) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d849d3eb351c721092539ba2f3b341437fbd8f24) __fix(l10n):__ updated translations via Weblate - Russian, Lithuanian, Swedish, Finnish, Italian (PR [#3808](https://github.com/edrlab/thorium-reader/pull/3808))
* [(_)](https://github.com/edrlab/thorium-reader/commit/087a7938488ac19767a5b9d4ee61eaa947bed7ea) __chore(release):__ fixed latest.json 3.5.0 download link [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4c1627290b2cb37b23342cee1f88d02de00b6c22) __chore(release):__ latest.json 3.5.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/bc8d4f287ae82a1c833126d1e34a5c42319ee54f) __fix(pdf):__ reference ConformTo in pdf webpub packager (Fixes [#3814](https://github.com/edrlab/thorium-reader/issues/3814))
* [(_)](https://github.com/edrlab/thorium-reader/commit/52442b3cba5636d0b16ac9ab35503f7a70afaf82) __feat:__ optionally display page breaks indicators in document margin (PR [#3765](https://github.com/edrlab/thorium-reader/pull/3765) Fixes [#3449](https://github.com/edrlab/thorium-reader/issues/3449) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/368356585a4fed178d0801780b8a6a5c3ee8f344) __fix(l10n|):__ updated translation via Weblate - Slovenian (PR [#3807](https://github.com/edrlab/thorium-reader/pull/3807))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4436c1049c0a1c4f52744231e7621504aafc0121) __chore(dev):__ console logs [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a1273016b4b04483d43d410a227791bf2c00435b) __fix:__ nodeIntegration regression (became false) from stacked PR https://github.com/edrlab/thorium-reader/pull/3799/changes#diff-af45b30110f32744808265a13f4926da35e1f993c0531282be0b803692f77fd7
* [(_)](https://github.com/edrlab/thorium-reader/commit/b858ca62569898d4715b8385a9ef486bb391343e) __feat:__ support for PAC proxy agent, discovery via Windows registry and MacOS scutil (PR [#3802](https://github.com/edrlab/thorium-reader/pull/3802))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7044a2f82f92d1a506af4ebbdeb795af418b3f89) __fix(l10n):__ updated translated via Weblate - Slovenian (PR [#3806](https://github.com/edrlab/thorium-reader/pull/3806))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1189e8b6b0a574d48ca481cfe5844c856da2109d) __fix(l10n):__ previous commit / merged PR introduced removals in SL locale
* [(_)](https://github.com/edrlab/thorium-reader/commit/692926a877b4e622fa8f9318515cf9eb7d1b76d5) __chore(dev):__ LINTING `node:` -prefixed NodeJS built-in modules imports (PR [#3799](https://github.com/edrlab/thorium-reader/pull/3799))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8dfa8c99a29ba5d4fe14deb8d1d9110a4a03bca) __chore:__ version bump 3.5.1-beta.1 for automated builds
* [(_)](https://github.com/edrlab/thorium-reader/commit/20d2bf0aa91f05dfe4da6ff96f253924d237d131) __fix:__ Nunito GUI font loading, typeface path on filesystem URL percent encoding (Fixes [#3805](https://github.com/edrlab/thorium-reader/issues/3805) )

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v3.5.0...v3.5.1 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
