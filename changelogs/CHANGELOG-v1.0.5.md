# Thorium Reader v1.0.5

## Summary

Version `1.0.5` was released on **10 October 2019**.

This release includes the following (notable) new features, improvements and bug fixes:

* Screen reader compatibility: the webview that renders EPUB HTML documents is now hard-refreshed to ensure NVDA, etc. track DOM changes reliably
* Keyboard interaction: SHIFT+CTRL+ALT LEFT/RIGHT-ARROW to quickly navigate previous/next spine items (works on Windows, including with NVDA, but minus ALT on MacOS for VoiceOver compatibility)
* File extension `.epub` association (EPUB "open with" or double-click to launch from Windows File explorer, MacOS Finder, and Linux desktop managers)
* Fixed interaction problems in publication import (mouse vs. keyboard bugs)
* Fixed broken publication export
* Added OPDS feed pagination, including search results
* Publications imported from OPDS catalogs now have an initial list of (user-editable) tags extracted from the feed metadata
* Corrected handling of OPDS relative URLs
* Detection of internet connectivity, friendlier messages during OPDS navigation
* Support for `javascript:` hyperlinks in EPUB HTML documents
* Protection against broken hyperlinks in non-valid EPUBs (HTTP 404)
* Improved feedback during publication download, error cases
* Added dark and sepia colour themes in User Interface (was only in EPUB documents)
* Fixed Command Line Interface on MacOS
* Bookmarks labels now checked for empty string
* Publication info dialog has a "see more" expand/collapse button for long descriptions (library and reader views)
* Fixed crash when removing publication in scroll list
* Miscellaneous User Interface improvements and bug fixes: publication list alignment, goto page, OPDS search breadcrumb, bookmark display (long label ellipsis, padding), reader view settings initial state
* Significant under-the-hood code refactorings to improve the developer experience and the robustness of the codebase (TypeScript strict typing, error handling / border cases)

(previous [v1.0.4 changelog](./CHANGELOG-v1.0.4.md))

## Full Change Log

Git commit diff since `v1.0.4`:
https://github.com/readium/readium-desktop/compare/v1.0.4...v1.0.5

=> **53** GitHub Pull Requests or high-level Git commits.

Here is the complete list of commits, ordered by descending date:

* [(_)](https://github.com/readium/readium-desktop/commit/c692b34ad0882cf106908e9869bd41a7a1469dbf) __chore(doc):__ README (PR [#778](https://github.com/readium/readium-desktop/pull/778))
* [(_)](https://github.com/readium/readium-desktop/commit/d30dd198e5a937bcfa9509588ce947df4de1c3cb) __fix(ui):__ improved publication list view, row items alignement (PR [#777](https://github.com/readium/readium-desktop/pull/777) Fixes [#691](https://github.com/readium/readium-desktop/issues/691))
* [(_)](https://github.com/readium/readium-desktop/commit/e5ba1f4b348d9c264fed1ea59a8d390d516dad16) __fix(CLI):__ MacOS command line argument with single dash/hyphen `-psn` is now filtered out (PR [#775](https://github.com/readium/readium-desktop/pull/775))
* [(_)](https://github.com/readium/readium-desktop/commit/e0d3e935d290cd11e2befc6abdc49c32560bcdd3) __hotfix(lint):__ fixes minor linting errors introduced by the previous commit (electron-builder patch)
* [(_)](https://github.com/readium/readium-desktop/commit/d2b55b3ee127d6472cfc17e23ab03694741d2a17) __fix:__ Windows AppX electron-builder patch to support fileAssociations (Fixes [#697](https://github.com/readium/readium-desktop/issues/697))
* [(_)](https://github.com/readium/readium-desktop/commit/da141ac7982023119463b2cd6e21c9837f74d68e) __hotfix(npm):__ package updates to include latest r2-navigator-js component which fixes support for javascript: hyperlinks.
* [(_)](https://github.com/readium/readium-desktop/commit/852b82637490ee9fee32a4b6de25924b91dbfb10) __chore:__ replace MSI with NSIS electron-builder target for Windows installer (PR [#776](https://github.com/readium/readium-desktop/pull/776))
* [(_)](https://github.com/readium/readium-desktop/commit/a3fdddedeefc48b4f9ef354f7261a9dfa9ebe3c2) __fix:__ publication export (PR [#746](https://github.com/readium/readium-desktop/pull/746) Fixes [#724](https://github.com/readium/readium-desktop/issues/724))
* [(_)](https://github.com/readium/readium-desktop/commit/6005000b8f4203b6fdc062701a77af44bcfc40ba) __fix(ui):__ "go to page" disabled mouse cursor (PR [#774](https://github.com/readium/readium-desktop/pull/774) Fixes [#760](https://github.com/readium/readium-desktop/issues/760))
* [(_)](https://github.com/readium/readium-desktop/commit/b3f68839a107ddb11c0756d4b2362aa40b05034a) __hotfix(npm):__ the "inner" package.json was lacking the yargs update, follow-up to PR [#771](https://github.com/readium/readium-desktop/pull/771)
* [(_)](https://github.com/readium/readium-desktop/commit/af8500a23348826d40c328c79c10e6e0fb4a0b85) __fix(opds):__ breadcrumb path for search keywords was percent-encoded (PR [#767](https://github.com/readium/readium-desktop/pull/767) Fixes [#751](https://github.com/readium/readium-desktop/issues/751))
* [(_)](https://github.com/readium/readium-desktop/commit/7f688e733dd86f6c2839447c32326d0605a1b4ef) __chore(npm):__ latest "safe" package updates, minor semver + one safe major (PR [#771](https://github.com/readium/readium-desktop/pull/771))
* [(_)](https://github.com/readium/readium-desktop/commit/29d55105f1d750166932a5d9ab00700e82380bc2) __fix:__ in library view, deleting + scrolling publications does not crash anymore (PR [#768](https://github.com/readium/readium-desktop/pull/768) Fixes [#750](https://github.com/readium/readium-desktop/issues/750))
* [(_)](https://github.com/readium/readium-desktop/commit/555ad7eca571559da976c7439ad9feb9d50d1e57) __fix(ui):__ corrected hairline misalignment of icon buttons in reader window (PR [#764](https://github.com/readium/readium-desktop/pull/764) Fixes [#741](https://github.com/readium/readium-desktop/issues/741))
* [(_)](https://github.com/readium/readium-desktop/commit/1d4bc4fc439cbd5be1d4270c0cf987928b7559c6) __fix(ui):__ dark / sepia colour schemes applied to reader interface (PR [#755](https://github.com/readium/readium-desktop/pull/755) Fixes [#83](https://github.com/readium/readium-desktop/issues/83))
* [(_)](https://github.com/readium/readium-desktop/commit/b5a28c712e2f23df5f69f7dbbeecc393b2d357a9) __fix(opds):__ publication tags are now imported from the feed source (PR [#757](https://github.com/readium/readium-desktop/pull/757) Fixes [#299](https://github.com/readium/readium-desktop/issues/299))
* [(_)](https://github.com/readium/readium-desktop/commit/fbc0d11aaef5cfcb5a316d9e4d7e30038184c6d1) __hotfix(ui):__ publication "info" dialog in reader window, now correct "see more" button state (Fixes [#759](https://github.com/readium/readium-desktop/issues/759) )
* [(_)](https://github.com/readium/readium-desktop/commit/1ac2c33705ca2d12dc06d9e92b6587e3535eba06) __hotfix(a11y):__ special treatment on MacOS for spine-level navigation keyboard shortcut (no ALT modifier key, just CTRL+SHIFT with LEFT/RIGHT arrows)
* [(_)](https://github.com/readium/readium-desktop/commit/bc0931076c224cedcc967f5c8d20dfb6194da13d) __hotfix(a11y):__ NVDA SHIFT+CTRL+ALT LEFT/RIGHT-ARROW works to navigate spine items
* [(_)](https://github.com/readium/readium-desktop/commit/66bb0a2d1649fd1ae5716b52065e9912ef87b2f7) __fix(a11y):__ NVDA screen reader now reliably detects changed EPUB documents (HTML URLs) during WebView refresh (PR [#758](https://github.com/readium/readium-desktop/pull/758))
* [(_)](https://github.com/readium/readium-desktop/commit/ebd7eee62b86b115fcded1e465815450005f723e) __fix(ui):__ popup modal dialogs did not include all CSS (PR [#756](https://github.com/readium/readium-desktop/pull/756))
* [(_)](https://github.com/readium/readium-desktop/commit/d3b3de5947f67cb19f075ab157ae0a95b4d1bcbd) __fix(opds):__ feed pagination, including search results (PR [#733](https://github.com/readium/readium-desktop/pull/733) Fixes [#462](https://github.com/readium/readium-desktop/issues/462))
* [(_)](https://github.com/readium/readium-desktop/commit/2d4b87598b5c401f6157439158d64858dae5d3cc) __fix(opds):__ feed URLs can be relative, now resolve to absolute (PR [#753](https://github.com/readium/readium-desktop/pull/753) Fixes [#748](https://github.com/readium/readium-desktop/issues/748))
* [(_)](https://github.com/readium/readium-desktop/commit/2f200e3e2781f9389e2f85fbe7dbd27a43c4ba46) __fix(bookmarks):__ empty string label now rejected (PR [#737](https://github.com/readium/readium-desktop/pull/737) Fixes [#723](https://github.com/readium/readium-desktop/issues/723))
* [(_)](https://github.com/readium/readium-desktop/commit/b3cbdcf04c29280263c5765e2b30aea6d3a18d88) __fix(ui):__ bookmark label was overflowing, now ellipsis (PR [#754](https://github.com/readium/readium-desktop/pull/754) Fixes [#745](https://github.com/readium/readium-desktop/issues/745))
* [(_)](https://github.com/readium/readium-desktop/commit/f5d7854125a740ea709e38adc889cb26e8781d1f) __hotfix(opds):__ NPM package update r2-opds-js (Fixes [#752](https://github.com/readium/readium-desktop/issues/752))
* [(_)](https://github.com/readium/readium-desktop/commit/654959de813710a2624fada926d3b735a096f231) __hotfix:__ publication import using the + plus button was failing when used multiple times for the same file (Fixes [#740](https://github.com/readium/readium-desktop/issues/740))
* [(_)](https://github.com/readium/readium-desktop/commit/88cac7fd5df397bb1147b1289da21e47714a08e0) __hotfix:__ prevent badly-authored EPUB links to trigger external web browser handler, r2-navigator-js package update (Fixes [#738](https://github.com/readium/readium-desktop/issues/738))
* [(_)](https://github.com/readium/readium-desktop/commit/f077a4eab52f2ab62d6043a16288485d89514a80) __fix(opds):__ publication download, error feedback (PR [#749](https://github.com/readium/readium-desktop/pull/749) Fixes [#743](https://github.com/readium/readium-desktop/issues/743))
* [(_)](https://github.com/readium/readium-desktop/commit/e65e2a5ce848aae05119148d85592989a553a078) __fix(opds):__ updated NPM packages + minor follow-up to PR [#696](https://github.com/readium/readium-desktop/pull/696) (PR [#747](https://github.com/readium/readium-desktop/pull/747) Fixes [#744](https://github.com/readium/readium-desktop/issues/744))
* [(_)](https://github.com/readium/readium-desktop/commit/5f9ceca63561894aabeff00534e8890f70dce59c) __chore(refactor):__ replace "withApi" React HigherOrderComponent (Redux state management layer, over Electron IPC main/renderer process sync), improved TypeScript API, strong types (PR [#696](https://github.com/readium/readium-desktop/pull/696))
* [(_)](https://github.com/readium/readium-desktop/commit/ef1a83425e5ef58482893cb990a469e799d75348) __fix:__ mouse and keyboard interaction for bookmarks (PR [#734](https://github.com/readium/readium-desktop/pull/734) Fixes [#722](https://github.com/readium/readium-desktop/issues/722) Fixes [#721](https://github.com/readium/readium-desktop/issues/721))
* [(_)](https://github.com/readium/readium-desktop/commit/0f7701e2866a17ba7413075312db3dbe4afddcc1) __hotfix(security):__ Electron BrowserWindow webSecurity enabled in webPreferences (Fixes [#736](https://github.com/readium/readium-desktop/issues/736))
* [(_)](https://github.com/readium/readium-desktop/commit/97e5f5122050f60a7e169a8d7aba2a434b82c379) __chore:__ NPM package updates (PR [#731](https://github.com/readium/readium-desktop/pull/731))
* [(_)](https://github.com/readium/readium-desktop/commit/54685000999c2802fa5f3a068f2a1f535eff5fd8) __fix:__ improved OPDS network connectivity message display (PR [#729](https://github.com/readium/readium-desktop/pull/729) follows PR [#727](https://github.com/readium/readium-desktop/pull/727))
* [(_)](https://github.com/readium/readium-desktop/commit/9c38ecade4c89e3814d718016cdd18f7f04acb58) __fix:__ OPDS view, detection of internet connectivity to avoid scary / hard-to-understand error messages (PR [#727](https://github.com/readium/readium-desktop/pull/727) Fixes [#726](https://github.com/readium/readium-desktop/issues/726))
* [(_)](https://github.com/readium/readium-desktop/commit/d78a8827069f3a74bf1da9d974fd264d9ab3e0c3) __fix:__ reader view, default settings / initial configuration state (PR [#716](https://github.com/readium/readium-desktop/pull/716) Fixes [#685](https://github.com/readium/readium-desktop/issues/685))
* [(_)](https://github.com/readium/readium-desktop/commit/f5942e2946db9495ab417116f5d3302328e980ad) __fix(ui):__ extra padding in bookmarks section when empty (PR [#720](https://github.com/readium/readium-desktop/pull/720) Fixes [#507](https://github.com/readium/readium-desktop/issues/507))
* [(_)](https://github.com/readium/readium-desktop/commit/adac9fd033fd15874be1628b32c3a8582cdbfc86) __fix(a11y):__ accessible label for bookmark button (PR [#719](https://github.com/readium/readium-desktop/pull/719) Fixes [#571](https://github.com/readium/readium-desktop/issues/571))
* [(_)](https://github.com/readium/readium-desktop/commit/1d46e2f6f108b6172e9b1ed146c094c098d84ba9) __fix(CLI):__ "default command" now more explicit (PR [#715](https://github.com/readium/readium-desktop/pull/715) Fixes [#699](https://github.com/readium/readium-desktop/issues/699))
* [(_)](https://github.com/readium/readium-desktop/commit/164673ee109d8cc3c1753f9bd6c19fa0569fbef8) __fix(CLI):__ import EPUB and OPDS feed (PR [#714](https://github.com/readium/readium-desktop/pull/714) Fixes [#701](https://github.com/readium/readium-desktop/issues/701))
* [(_)](https://github.com/readium/readium-desktop/commit/7b02fecb3a98c5870fecf4e02238a148a4e34bba) __fix:__ follow-up to PR [#659](https://github.com/readium/readium-desktop/pull/659), regression bug "about publication / info box" (PR [#713](https://github.com/readium/readium-desktop/pull/713) Fixes [#712](https://github.com/readium/readium-desktop/issues/712))
* [(_)](https://github.com/readium/readium-desktop/commit/3c2229015ab50e3926dfaae998fba27e100dfe01) __hotfix:__ follow-up to PR [#659](https://github.com/readium/readium-desktop/pull/659), fixes [#709](https://github.com/readium/readium-desktop/issues/709), fixes [#711](https://github.com/readium/readium-desktop/issues/711)
* [(_)](https://github.com/readium/readium-desktop/commit/baa17321404985e5d721f8894203a745091df73b) __hotfix:__ follow-up to PR [#659](https://github.com/readium/readium-desktop/pull/659), fixes [#709](https://github.com/readium/readium-desktop/issues/709)
* [(_)](https://github.com/readium/readium-desktop/commit/926000f851597e4cbe6cd3b51a8748ce585b7790) __hotfix:__ follow-up to PR [#489](https://github.com/readium/readium-desktop/pull/489) await illegal on non-promise function return type, see comment https://github.com/readium/readium-desktop/commit/bc3f1337bf50c857bf7a0a48f57e1c076056a697#r35171002
* [(_)](https://github.com/readium/readium-desktop/commit/12fcce9de927a37cc8b0c17731d78b3cc46546bb) __hotfix:__ follow-up to PR [#659](https://github.com/readium/readium-desktop/pull/659) see comment https://github.com/readium/readium-desktop/pull/659/#pullrequestreview-291271701
* [(_)](https://github.com/readium/readium-desktop/commit/4308b077671e091eabcee2bb7d559396e16c3a4d) __chore:__ NPM updates - r2-xxx-js packages, ReduxSaga with better typings, CrossEnv which drops support for older NodeJS versions (PR [#707](https://github.com/readium/readium-desktop/pull/707))
* [(_)](https://github.com/readium/readium-desktop/commit/c8e676697c8d03434287e1bd897d63a672fb2bc7) __fix(typing):__ Dependency Injection, Higher Order Component API and Translator (PR [#659](https://github.com/readium/readium-desktop/pull/659))
* [(_)](https://github.com/readium/readium-desktop/commit/51fbc0aaef5da8613335d51f98c3b69e0b0038fd) __chore(npm):__ updated package dependencies, fixed --help CLI in package.json script (PR [#703](https://github.com/readium/readium-desktop/pull/703))
* [(_)](https://github.com/readium/readium-desktop/commit/9799be240bd18a6dde9bc064b8c762e77953d08b) __fix(ui):__ publication description metadata, long text height computation after CSS layout/render pass (PR [#694](https://github.com/readium/readium-desktop/pull/694) Fixes [#689](https://github.com/readium/readium-desktop/issues/689))
* [(_)](https://github.com/readium/readium-desktop/commit/56f352c85c186a402e2db9a4a18e3a89cb532d7c) __fix(ui):__ publication tags, visual spacing (PR [#693](https://github.com/readium/readium-desktop/pull/693) Fixes [#690](https://github.com/readium/readium-desktop/issues/690))
* [(_)](https://github.com/readium/readium-desktop/commit/bfda8ee8de4a0c2b6005bcfc9ac5d4415c8bd54f) __fix:__ OPDS breadcrumb line-breaking path separators (PR [#688](https://github.com/readium/readium-desktop/pull/688) Fixes [#621](https://github.com/readium/readium-desktop/issues/621))
* [(_)](https://github.com/readium/readium-desktop/commit/c98698e21174802edb4f62ebc228c1961cb14d37) __chore:__ version bump 1.0.5-rc.0

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.0.4...v1.0.5 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/readium\/readium-desktop\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/readium\/readium-desktop\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/readium\/readium-desktop\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
