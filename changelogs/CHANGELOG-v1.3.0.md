# Thorium Reader v1.3.0

## Summary

Version `1.3.0` was released on **28 April 2020**.

This release includes the following (notable) new features, improvements and bug fixes:

* Improved audiobook user interface: removed redundant previous/next navigation arrows, playback progress indicator now with better visual styling, added rate/speed control.
* Fixed converter from W3C audiobook format (LPF packaged Web Publications) to Readium Web Pub Manifest.
* Added LCP support for audiobooks, with handling of additional file extensions, HTTP content type.
* Parsing of accessibility metadata from W3C format, native support in Readium2 data models.
* Fullscreen mode: previous/next accessible arrow buttons (mouse and keyboard), and optimal use of screen real estate (removed unnecessary margins).
* Improved accessibility of buttons with toggle state, using aria-pressed so that screen readers announce the state change adequately.
* Bugfix: language was not updated in reader window (locale Redux watcher was missing)
* Cover images in library window are now better aligned when dealing with various aspect ratios, also added visual emphasis in publication rows.
* Bugfix: in development mode, quickly going back to library window (local bookshelf) from a recently-opened reader window was causing an error popup (timeout) due to stale BrowserWindow reference (destroyed reader instance).
* TOC and detailed bottom bar info: when missing human-readable title, use link href (relative resource path)
* Fixed severe underlying issue with HTTP streamer (custom Electron protocol handler for streaming media, like audio/video), reliable handling of large resources.
* Added support for background audio looping soundtrack, also enabling of video/audio autoplay.
* Added Dutch localization.
* Spanish localization: fixed some translations and added missing readme.
* MacOS application DMG bundle now signed and notarized.

(previous [v1.2.0 changelog](./CHANGELOG-v1.2.0.md))

## Full Change Log

Git commit diff since `v1.2.0`:
https://github.com/readium/readium-desktop/compare/v1.2.0...v1.3.0

=> **44** GitHub Pull Requests or high-level Git commits.

* [(_)](https://github.com/readium/readium-desktop/commit/c83a7412d1efe058e656920a052cf00dde9ba9f8) __chore(NPM):__ package updates, including r2-navigator (improved audiobook UI) and notably: the TMP package fixes security issues with temp files outside the OS temp folder
* [(_)](https://github.com/readium/readium-desktop/commit/059797f06b9bf09870e53f2a48f64a7e199f9b10) __fix:__ incorrect conformsTo URL in the audiobooks LPF to RWPM converter (PR [#1020](https://github.com/readium/readium-desktop/pull/1020))
* [(_)](https://github.com/readium/readium-desktop/commit/40ed7ac45f02aba5fd4f590c2890cf22f9f2cdcf) __chore(lint):__ spaces ... [skip ci]
* [(_)](https://github.com/readium/readium-desktop/commit/8ad260dbec2d5133c31b942f26a837dfad74498d) __chore(release):__ MacOS signing and notarization setup [skip ci]
* [(_)](https://github.com/readium/readium-desktop/commit/53bc0c8289a3a95a0d6e33da47687c1fcf014037) __fix(ui):__ fullscreen previous/next accessible arrow buttons (mouse and keyboard), and optimal use of screen real estate (removed unnecessary margins) (Fixes [#904](https://github.com/readium/readium-desktop/issues/904) Fixes [#1017](https://github.com/readium/readium-desktop/issues/1017))
* [(_)](https://github.com/readium/readium-desktop/commit/df779cf272691aa4b06407b52cd995757fe03aaf) __chore(NPM):__ package updates and lock file refresh
* [(_)](https://github.com/readium/readium-desktop/commit/70772cb2c5cacb96a7355f9497121996fed1b5b1) __fix:__ misc. LPF converter improvements, notably parsing from W3C format of accessibility metadata (PR [#1009](https://github.com/readium/readium-desktop/pull/1009))
* [(_)](https://github.com/readium/readium-desktop/commit/df31b3a02c4820fe27daa2f28deb9b6e6c52a8af) __fix(a11y):__ do not use button aria-pressed state for show/hide keyboard shortcuts editor (PR [#1013](https://github.com/readium/readium-desktop/pull/1013))
* [(_)](https://github.com/readium/readium-desktop/commit/9e3b13a84e5ef0f3bdbb506e73c50e59719b1cb4) __chore(NPM):__ updated packages, notably r2-shared-js which fixes accessibility metadata bugs (summary, and access mode sufficient normalization)
* [(_)](https://github.com/readium/readium-desktop/commit/6a6fad8faa33e5a1c517beda4057ad0f3e5f5314) __fix(a11y):__ buttons and UI links with on/off state are now announced by screen readers as toggles, via aria-pressed (Fixes [#1005](https://github.com/readium/readium-desktop/issues/1005))
* [(_)](https://github.com/readium/readium-desktop/commit/d6b9d8fe183cd7ddf45b5cd6b2a86c48b56c799b) __fix(NPM):__ updated R2 shared-js package which had a severe regression bug (publications without metadata links could not open)
* [(_)](https://github.com/readium/readium-desktop/commit/5bc9338f78651f15e09cc9926bd60c50e9b6ec48) __chore(NPM):__ R2 package update (shared-js) with Link "alternate" property [skip ci]
* [(_)](https://github.com/readium/readium-desktop/commit/b671b0996a8cab2e8e27b4659bef0343caf1926f) __chore(NPM):__ R2 shared packaged update (metadata parsing feature)
* [(_)](https://github.com/readium/readium-desktop/commit/98d1ed628527dbc6016dcb04dee5bce81f2e594d) __chore(NPM):__ package updates, notably R2 shared models with support for accessibility metadata and parsing from EPUB
* [(_)](https://github.com/readium/readium-desktop/commit/8f1943e8e45f76458b3d9783b7b4a293c4558026) __fix:__ display list of supported file extensions in the welcome screen (Fix [#995](https://github.com/readium/readium-desktop/issues/995) PR [#998](https://github.com/readium/readium-desktop/pull/998))
* [(_)](https://github.com/readium/readium-desktop/commit/a38d3e12bbf20379d022cff838de9eb07bef65dc) __fix(l10n):__ language was not updated in reader window (locale Redux watcher was missing) Fixes [#1008](https://github.com/readium/readium-desktop/issues/1008)
* [(_)](https://github.com/readium/readium-desktop/commit/4cf91a5fa77b5e45fd98a426d9e3fc650dda69ae) __chore(NPM):__ package updates (including Electron)
* [(_)](https://github.com/readium/readium-desktop/commit/1a987efcf9db7893ed36a2f8f8c7cab8c9921f6e) __fix:__ LPF converter / importer (PR [#1001](https://github.com/readium/readium-desktop/pull/1001))
* [(_)](https://github.com/readium/readium-desktop/commit/bc4126728770267a830e96d8ea98536a926d6815) __fix:__ cover images, aspect ratios, visual emphasis (PR [#1002](https://github.com/readium/readium-desktop/pull/1002) Fixes [#993](https://github.com/readium/readium-desktop/issues/993))
* [(_)](https://github.com/readium/readium-desktop/commit/bbb0f1e9367d02d05d48341bcb861cb3636a41d7) __fix(l10n):__ Spanish, fixed some translations and added missing readme (PR [#1006](https://github.com/readium/readium-desktop/pull/1006))
* [(_)](https://github.com/readium/readium-desktop/commit/24998b7d7fca65abd04ba73abc4f9e0cec178065) __fix(audiobooks):__ removed redundant previous/next navigation arrows
* [(_)](https://github.com/readium/readium-desktop/commit/c38cbd4860c84334f182d5059fb93107cd8ed709) __fix:__ in dev mode, quickly going back to library window (local bookshelf) from a recently-opened reader window was causing an error popup (timeout) due to stale BrowserWindow reference (destroyed reader instance)
* [(_)](https://github.com/readium/readium-desktop/commit/a9e798c90b2395d8f30c7a3070b6f7be5a2de759) __fix:__ support for additional LCP audiobooks file extensions, and HTTP content type (misc. NPM updates too)
* [(_)](https://github.com/readium/readium-desktop/commit/cbb4fa55e51de00f09da1410e35a0eadbb9f7315) __fix:__ TOC and detailed bottom bar info, when missing human-readable title, use link href (relative resource path) [skip ci]
* [(_)](https://github.com/readium/readium-desktop/commit/08a9871c0a731edceae71cd0b13be4b5cf7f4426) __chore(dev):__ electron-devtools-installer NPM package update (Redux and React inspectors / debuggers), see https://github.com/MarshallOfSound/electron-devtools-installer/releases/tag/v3.0.0
* [(_)](https://github.com/readium/readium-desktop/commit/fc9970649e7843882531de5ae07e3b1cc3d61dc1) __feat(audiobooks):__ updated R2 navigator NPM package (improved player UI, speed / rate control), and Electron (minor semver increment)
* [(_)](https://github.com/readium/readium-desktop/commit/c8a8d5d28f5bcc77a4dcd857a750bb4353b96249) __fix(lint):__ incorrect indentation (PR [#997](https://github.com/readium/readium-desktop/pull/997))
* [(_)](https://github.com/readium/readium-desktop/commit/6b489aac17022a6c7a332160d7e13cb2d0f423fe) __feat(LCP):__ protected audiobooks, with LSD support (license.lcpl replacement)
* [(_)](https://github.com/readium/readium-desktop/commit/994b69cd5687f73567e31ec7f2dba36bccd7581c) __fix(lint):__ incorrect indentation
* [(_)](https://github.com/readium/readium-desktop/commit/f332fafc6565b1e8f42cacd4b833cc3ea94f23be) __chore(NPM):__ package updates following the previous PR merge (minor semver)
* [(_)](https://github.com/readium/readium-desktop/commit/093ac3bd2e375ac95eaf3b270bd81069fe4647df) __feat:__ support for W3C packaged audiobook (.lpf with publication.json), internally: conversion to Readium format (.audiobook with manifest.json) (PR [#985](https://github.com/readium/readium-desktop/pull/985) Fixes [#979](https://github.com/readium/readium-desktop/issues/979))
* [(_)](https://github.com/readium/readium-desktop/commit/08e699501a308a66a6fe2eb707a28a8af4800ffe) __hotfix(l10n):__ follow-up to PR [#989](https://github.com/readium/readium-desktop/pull/989) (Dutch translation) added missing new label
* [(_)](https://github.com/readium/readium-desktop/commit/41f27f9bf785cb917b4bde688017124e9390c92b) __feat(l10n):__ Dutch nl translation (PR [#989](https://github.com/readium/readium-desktop/pull/989) Fixes [#988](https://github.com/readium/readium-desktop/issues/988))
* [(_)](https://github.com/readium/readium-desktop/commit/a2863145e3873b38028202f95a67ac654a707f51) __fix:__ application name "Thorium" now displayed correctly, with localized labels too (PR [#994](https://github.com/readium/readium-desktop/pull/994) Fixes [#991](https://github.com/readium/readium-desktop/issues/991) )
* [(_)](https://github.com/readium/readium-desktop/commit/cc45203efebadaad1f270c1d637542bc7ec827e2) __fix:__ NPM package updates, mainly R2 navigator with major fix for semi-infinite linking loop introduced by the HTTP URL workaround for registerStreamProtocol(), and improved masking technique for slow-loading publication documents
* [(_)](https://github.com/readium/readium-desktop/commit/6bdfd94ab611887fdc5e150d0b7dacc2c019dac2) __fix:__ scripted audio/video with DOM mutations, support for background audio looping soundtrack, enabling video/audio autoplay, handling of nested iframes origin (sandboxing), ... see https://github.com/readium/r2-navigator-js/blob/develop/CHANGELOG.md#1152 +  misc. NPM package updates (fixes [#990](https://github.com/readium/readium-desktop/issues/990))
* [(_)](https://github.com/readium/readium-desktop/commit/9781496f00881590d2d3f21027abad774a386a3a) __chore(dev):__ Electron allowRendererProcessReuse to true, see https://github.com/electron/electron/issues/18397
* [(_)](https://github.com/readium/readium-desktop/commit/f1251186bd99cd7f9c6bca5fe9f3563f548a9d31) __fix:__ NPM package updates, including R2 components which fix issues with large resources (images, fonts, audio/video) not being handled reliably
* [(_)](https://github.com/readium/readium-desktop/commit/6e33c16d29a351467060eeb4e326366bb843593a) __hotfix:__ guard against undefined publication CSS selector or progression in URL query params (otherwise base64 atob caught exception in console)
* [(_)](https://github.com/readium/readium-desktop/commit/44c64f8c3abe01becbb656cc3aa4b8013e19266e) __hotfix:__ Electron background window throttling disabled in reader view
* [(_)](https://github.com/readium/readium-desktop/commit/3609091d0caf3c0e09b7eb961cbbd6b07f13add1) __hotfix:__ IPC cannot serialize Javascript objects (breaking change in Electron 9+)
* [(_)](https://github.com/readium/readium-desktop/commit/0ea0a84c067d3d1352ca73caaab03601c4307e3d) __fix(code):__ publication service name, and removed unnecessary zip CRC calculation in LCP book import (PR [#984](https://github.com/readium/readium-desktop/pull/984))
* [(_)](https://github.com/readium/readium-desktop/commit/4e6dd99de6c1f452ab18d7bd3d6efedf9acdafc0) __hotfix(changelog):__ added missing feature [skip ci]
* [(_)](https://github.com/readium/readium-desktop/commit/0718edbd56fad0e4884fd029f0b3b0ef398fc8f1) __chore(dev):__ version increment for dev builds (alpha 1.3.0)

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v1.2.0...v1.3.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/readium\/readium-desktop\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/readium\/readium-desktop\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/readium\/readium-desktop\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/readium\/readium-desktop\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
