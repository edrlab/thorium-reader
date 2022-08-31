# Thorium Reader v1.5.0

## Summary

Version `1.5.0` was released on **12 October 2020**.

This release includes the following (notable) new features, improvements and bug fixes:

* Added Portuguese, Lithuanian and Italian localizations
* Added search feature, to find text in publication documents (accessible paginated list of results + visual highlights with sequential navigation)
* Added support for Divina "visual narrative" publications (Readium Web Pub Manifest)
* Added preliminary integration of the PDF.js rendering engine, includes support for LCP DRM protection (Readium Web Pub Manifest packaging)
* Added support for RTL Right-To-Left in TOC Table Of Contents, Landmarks, etc. navigation panels
* Fixed support for secondary monitor (application windows on dynamic display coordinates / dimensions)
* Fixed command line and file explorer integration (opening of reader windows)
* Tweaked HTTP timeout value (request/response cycles for OPDS publication downloads, W3C Web Publications / AudioBooks and Readium Web Pub Manifest retriever / packager, etc.)
* Improved display of OPDS indirect acquisitions (now indicate file type in import button)
* Fixed issue where session settings section was not refreshing when language was changed
* Application runtime upgraded to Electron 9 (and corresponding NodeJS update too)

(previous [v1.4.0 changelog](./CHANGELOG-v1.4.0.md))

## Full Change Log

Git commit diff since `v1.4.0`:
https://github.com/edrlab/thorium-reader/compare/v1.4.0...v1.5.0

=> **55** GitHub Pull Requests or high-level Git commits.

* [(_)](https://github.com/edrlab/thorium-reader/commit/4e740f2fbdc2eea8a7af47e057b1ebd45072e055) __chore(release):__ version bump back for CI builds
* [(_)](https://github.com/edrlab/thorium-reader/commit/d8a637ad008845f97ebb27ed817b256330e68669) __fix:__ added XML in addition to XHTML and HTML in search document filters (EPUB2 and EPUB3 support) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b2ca431c5d626413ce8488e6b34c90bdae2fccb2) __fix:__ CSS top toolbar in fullscreen for publications without audio playback UI buttons [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/980cc6ef8ab85b586916b3da1a10768509420261) __fix:__ text search limited to (X)HTML documents (ignore PDF, image, etc. spine items) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/aff042d8e6c58bc4fcd22d32076b93c031d048e2) __fix(release):__ PDF.js shipped in pdf-extract lib is processed by WebPack and Web Worker is extracted as additional main.js file in electron-builder bundle [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b67ef457666a01d0f5fd4cbda0af35a98752be5d) __fix:__ typo in accessible label for search matches [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f2d0a88a810dd6af32a81b2acd897371d84850c5) __fix:__ regression in PROD builds (DEV okay) due to node-fetch AbortSignal symbol name mangled by WebPack default minifier / code bundle compressor [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/254607d49a8182c420a82347dd4e543cc8d6bbdf) __chore(release):__ v1.5 bump [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d2964d1525283661ca6fc15221d14fb236d68430) __chore(doc):__ updated list of supported GUI languages (localizations) in English readme [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8c97d90207ce8e61647008ed6d510d576c9faccc) __chore(release):__ v1.5 changelog [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1bc22e4ad804e9a580e117a1255c20e55f239188) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/4362797548e4153bfc602082df4007fb3ff70aee) __feat:__ in-publication text search, accessible paginated list of results + visual highlights with sequential navigation (PR [#1086](https://github.com/edrlab/thorium-reader/pull/1086) Fixes [#173](https://github.com/edrlab/thorium-reader/issues/173))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e90a96cb1a7ef595467e973a5f6174944de5172d) __fix:__ Divina previous/left arrow keys hijacking (built-in pagination user interactions, keyboard, image touch, etc.)
* [(_)](https://github.com/edrlab/thorium-reader/commit/aa0df0a07c2d6634a6ce1990f72fb85a3f8d6c65) __fix:__ secondary monitor / dynamic display for window positioning (PR [#1202](https://github.com/edrlab/thorium-reader/pull/1202) Fixes [#1201](https://github.com/edrlab/thorium-reader/issues/1201))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d5f8bd921dcc82d3a7f99a7628ac07a2a47e4507) __fix:__ reader window launch without library (PR [#1203](https://github.com/edrlab/thorium-reader/pull/1203) Fixes [#1123](https://github.com/edrlab/thorium-reader/issues/1123))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c62aa091b244b74140cd70d31375a21ef8ca875) RTL TOC and Landmarks (PR [#1205](https://github.com/edrlab/thorium-reader/pull/1205) Fixes [#987](https://github.com/edrlab/thorium-reader/issues/987))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b3de3ee26919687d1fe0aff1ac6294469ec3f38e) __chore(NPM):__ minor package update
* [(_)](https://github.com/edrlab/thorium-reader/commit/8d609e909847ec04b9b816e9664cfa702e0b71c5) __chore(NPM):__ package updates, some development tools breaking changes
* [(_)](https://github.com/edrlab/thorium-reader/commit/297b3fe919c954b5feb87d0787d32326363910de) __fix:__ Divina player upgrade (PR [#1204](https://github.com/edrlab/thorium-reader/pull/1204))
* [(_)](https://github.com/edrlab/thorium-reader/commit/68f3195117590635495d69faccea86c95370b84a) __feat:__ preliminary support for PDF documents, including LCP DRM (PR [#1188](https://github.com/edrlab/thorium-reader/pull/1188))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e6d33860df7eab7a294b87cdb6347675e1df3a5f) upgrade npm divina-player-js
* [(_)](https://github.com/edrlab/thorium-reader/commit/75cfdea451abff45b1fdab4253e54e649f7af94e) downgrade npm divina-player-js
* [(_)](https://github.com/edrlab/thorium-reader/commit/f127eecf1cb057b96c2fe5ffab8bc241d113b04e) __update:__ npm divina github repository
* [(_)](https://github.com/edrlab/thorium-reader/commit/f038678f5c646a58bcc03de0d7fcfa993412bc98) __fix(HTTP):__ timeout value for request/response cycles
* [(_)](https://github.com/edrlab/thorium-reader/commit/28f9c9944686758be5b664ec583c539099884c59) __fix(OPDS):__ fix for empty string items, like tags
* [(_)](https://github.com/edrlab/thorium-reader/commit/da890473757c2e06312b530c32a431ea9d99d8db) __fix(OPDS):__ indirect acquisitions now indicate file type in import button, also added button CSS where missing.
* [(_)](https://github.com/edrlab/thorium-reader/commit/c51783603a374d8cbc874e27c4c4caa125d9ad57) __fix(OPDS):__ recent regression introduced by https://github.com/edrlab/thorium-reader/pull/1168/files#diff-a181f6300ec37516c6ea06f2c3757ded (LCP passphrase retrieval property)
* [(_)](https://github.com/edrlab/thorium-reader/commit/c046b990d0e8eb14483f31dfdfd32302d497c3b6) __chore(l10n):__ removed unused files (Markdown docs placeholder, missing languages)
* [(_)](https://github.com/edrlab/thorium-reader/commit/72f14dc364ac822756ca57718f85800106ec8b5c) __fix(l10n):__ Italian localization (PR [#1195](https://github.com/edrlab/thorium-reader/pull/1195) follows PR [#1187](https://github.com/edrlab/thorium-reader/pull/1187) Fixes [#1179](https://github.com/edrlab/thorium-reader/issues/1179) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/638b62e5fe94965bb413c18554e27ffcd4551973) __fix(l10n):__ case-sensitive file systems, locales of "about" Markdown file (Fixes [#1184](https://github.com/edrlab/thorium-reader/issues/1184) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4453fe80f12fc80c6a23238b8074e2f05e6f1a97) __fix(l10n):__ Portuguese language switch (Fixes [#1184](https://github.com/edrlab/thorium-reader/issues/1184) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/944509ff6fd64083b60599e02330a60e7e46a00f) __fix(l10n):__ session settings section was not refreshing when language changed (Fixes [#1172](https://github.com/edrlab/thorium-reader/issues/1172) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/08484a899475df1c3d79b19b8d655ae2b1ac1967) __chore(NPM):__ package updates and lockfile refresh
* [(_)](https://github.com/edrlab/thorium-reader/commit/fcf7ec1685da004c9fb928177076d3d006f3f713) __fix:__ downloader "end" event (PR [#1183](https://github.com/edrlab/thorium-reader/pull/1183))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ce1171e3699875cf7e5e7d84bffc4398e9da6362) __chore(NPM):__ package updates (minor)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ddf8463d81dfa2d62dd7e6c963447333be76ecb7) __chore(NPM):__ package updates, lock file refresh
* [(_)](https://github.com/edrlab/thorium-reader/commit/eb04dd3969077b58ce6bd8dca61b371e09beb332) __fix:__ run editor-config on ts and js files only
* [(_)](https://github.com/edrlab/thorium-reader/commit/1485f5e57a3c091cf749a28b25c1349677a4f937) __fix:__ languages in readme.md
* [(_)](https://github.com/edrlab/thorium-reader/commit/8b851ff25fe9adee8086073189b3bc267fb520c8) __fix:__ packager/fetcher now handles RWPM (Readium Web Pub Manifest) as well as W3C publications (PR [#1177](https://github.com/edrlab/thorium-reader/pull/1177) follows PR [#1168](https://github.com/edrlab/thorium-reader/pull/1168))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6b7836ba50800d0b706c6224b94480d67e060c96) __fix:__ remove the development feature "import link" from the settings UI (PR [#1175](https://github.com/edrlab/thorium-reader/pull/1175) follows PR [#1168](https://github.com/edrlab/thorium-reader/pull/1168))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ade15c22d4ec547cc5e393ae30e5e3289eb33808) __chore(NPM):__ minor package updates (not major PostCSS semver increment, as plugins are not ready yet).
* [(_)](https://github.com/edrlab/thorium-reader/commit/b81cf0e4f0befd19f7348f86f382837197af78cd) __chore(NPM):__ package updates and lock file refresh
* [(_)](https://github.com/edrlab/thorium-reader/commit/aff2e383085eb8846d7085cfae8da048c7fada78) __feat:__ improved support for W3C audiobooks, with downloader + packager, also fixes CLI bug (PR [#1168](https://github.com/edrlab/thorium-reader/pull/1168) Fixes [#1174](https://github.com/edrlab/thorium-reader/issues/1174))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cf57ff074c870afc1ab9b0897e6a41b99a2975e5) __feat:__ support for Divina visual narrative publications (PR [#1128](https://github.com/edrlab/thorium-reader/pull/1128))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cc09ad4c1bfc3945b3d815b34e3a460f811248b3) __chore(NPM):__ package dependency updates (some major, due to deprecation of end-of-life NodeJS versions)
* [(_)](https://github.com/edrlab/thorium-reader/commit/496d7e02a1156f6bbfc3d6787153779ee707d3d5) __chore(l10n):__ updated package.json NPM scripts for i18next normalization [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9d1db7560f0374b50e734b1014b048cc5f29084d) __feat(l10n):__ Lithuanian translation (PR [#1153](https://github.com/edrlab/thorium-reader/pull/1153))
* [(_)](https://github.com/edrlab/thorium-reader/commit/15275c990e05ab48d38fd0a9c593d7013bb6cc83) __feat(l10n):__ Portuguese UI translation (PR [#1141](https://github.com/edrlab/thorium-reader/pull/1141))
* [(_)](https://github.com/edrlab/thorium-reader/commit/39d40f3b77e3772b4a1d5f3e092b6fc95c49dd39) __fix:__ i18n error at Thorium launch after app update (PR [#1165](https://github.com/edrlab/thorium-reader/pull/1165))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c66a2a4572a9ee26be84a98d142a2241cace0d38) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d117fb696a5030fcc3cf642a05934de26c9cc5d7) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/a34cfb0c63a07dbe291f1c69d5381608a417b209) __chore(NPM):__ package dependency updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/000c0e7d5b8ad77e7329685f638690d1f75ef5b2) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/7cfe49a3cd829c604df4e424afd6723a9d94e9fb) __chore(NPM):__ package updates, including Electron 9
* [(_)](https://github.com/edrlab/thorium-reader/commit/d2dec71321f6af104d35cc74452f5236ff16ab55) __chore(dev):__ version bump post-release 1.4

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.4.0...v1.5.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
