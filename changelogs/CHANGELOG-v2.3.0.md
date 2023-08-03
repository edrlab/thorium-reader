# Thorium Reader v2.3.0

## Summary

Version `2.3.0` was released on **03 August 2023**.

This release includes the following (notable) new features, improvements and bug fixes:

* New and updated translations: Bulgarian, Greek, Croatian, Korean, Portuguese (Portugal).
* Reader / image zoom: major feature update from initial proof of concept, better user experience (finger touch, trackpad gestures, mouse wheel, keyboard), support for raster/bitmap images as well as SVG markup.
* Reader / MathML: native rendering in Chromium (Electron v25), Thorium 2.2.0 included a version of Chromium that did not support MathML natively (MathJax was the only way to display MathML).
* Reader / MathML: MathJax dynamic aria-label (speech text) is overridden by authored alt-text (if present), Thorium TTS readaloud speaks it, screen readers do too but have the option to dig further / deeper into the MathML structure (useful with screen reader specialised plugins).
* Reader / navigation history: hyperlink activation now correctly sets the landmark for previous/next navigation.
* Reader / text display: fixed left/right/justify text alignement ("start" can be left or right depending on document language), "automatic" is now "default" with changed SVG icon to avoid confusion.
* Reader / UX: finger swipe gesture can now be used to turn pages (requires touch screen).
* Reader text selection: double-click now works (bookmarks label for now, later in upcoming annotations feature).
* Reader / TTS: fixed aria-label support on img (alongside alt attribute), epub:type pagebreak (and role doc- prefix), title/label takes precedence over inner text, same with links. NOTE: this will need future update to match W3C specifications for computation of accessible label and description.
* Reader / TTS: fixed voice selection based on user choice + language match (for example: fr-FR vs. fr-CA variants, en-US vs. en-UK, user wins over authored lang).
* Reader / TTS: fixed paused / stopped state in playback controls.
* Reader / TTS: fixed support for Japanese ruby, RT markup is now ignored.
* Reader / TTS: captions / simplified view, initial text without active word boundary was not escaped (ampersand character).
* Reader / Popup footnotes: fixed handling of SVG a@href links.
* Reader / HTML5 audio: fixed visible controls visibility.
* Reader / EPUB: navigator.epubReadingSystem object injection in iframes (including SVG).
* Reader / EPUB: FXL fixed-layout rendition-prefixed page-spread-left/center/right properties on spine item, was only parsing non-prefixed variant.
* Reader / Media Overlays: fixed click on non-synchronised HTML element which now preserves current playback location / timestamp (was reseting to begining of document).
* Reader / UX: mouse middle-click was causing opening in external Electron window.
* DAISY: fixed v2.02 and v3.0 import of ncc.html or *.opf, now works when loading from non-zipped publications.
* OPDS: feed entry fallback cascade was too permissive (publication info was incorrectly fetching borrow/buy links in some cases).
* OPDS: fixed "search" relative URLs in OPDS1(XML) and OPDS2(JSON), fixed URI Templates curly brace escaping in URL path.
* OPDS: fixed publication title which was not displayed.
* OPDS: added display of accessibility metadata.
* GUI: fixed dark/night and sepia modes in audiobook playback rate chooser and TTS + Media Overlays rate/voice choosers.
* GUI: fixed edge-case of auto-focus fail on default dialog button (e.g. invoking the delete action from the popup menu was failing to auto-focus the default ok button, whereas this worked when reaching the same modal dialog prompt via the publication info sheet).
* GUI / accessibility: improved keyboard shortcuts editor usability, for both screen reader and keyboard users
* GUI / UX: improved error message during file import, unsupported extension / document type.
* TTS: now enabled by default on Linux (Electron command line parameter "enable-speech-dispatcher").

(previous [v2.2.0 changelog](./CHANGELOG-v2.2.0.md))

## Full Change Log

Git commit diff since `v2.2.0`:
https://github.com/edrlab/thorium-reader/compare/v2.2.0...v2.3.0

=> **60** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/23b60dfa611a3b10cca61f534f7900634d27513a) __fix(l10n):__ Portuguese Portugal pt-PT locale update (PR [#1966](https://github.com/edrlab/thorium-reader/pull/1966))
* [(_)](https://github.com/edrlab/thorium-reader/commit/32d0a377451ebc4e8fc487e4b15af568f3df2763) __fixes [#1964](https://github.com/edrlab/thorium-reader/issues/1964):__ fallback cascade too permissive on entryLink and catalogLinkView
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a30bc3a5cefe792945730f3a0c71de3c4614f34) __fix(l10n):__ Korean update, Hyun-Young Kim / BoinIT (PR [#1965](https://github.com/edrlab/thorium-reader/pull/1965))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5a4e6d72a81cb4a81e27b9f515e3e386d75bca34) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/b7b240a3fb1bf1d247671e555c7d18ba1269b85a) __chore(NPM):__ updated packages, notably navigator component with many fixes (TTS, image zoom, etc.)
* [(_)](https://github.com/edrlab/thorium-reader/commit/f1419920f0db3d6091e5956a1b8386f882888e7d) __chore(NPM):__ updated packages, notably navigator component which brings important TTS fixes
* [(_)](https://github.com/edrlab/thorium-reader/commit/07174c1e073a7be54017f0e9136b853e417bc297) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/90e52174ec96c67d77dc733d3400f307e9b5f0ef) __chore(NPM):__ package updates, notably navigator with updated SVG support
* [(_)](https://github.com/edrlab/thorium-reader/commit/d77f0cbd4c873cf365c797de4e76b97d82111d8c) __chore(NPM):__ updated packages, notably navigator component with improved SVG support for image zoom
* [(_)](https://github.com/edrlab/thorium-reader/commit/9bc424a488b0fc42314c194a5af538e50b7f9d95) __chore(doc):__ updated README with complete list of locales / languages [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a4f6fb79808c64a6ece74c0d5c610abc2b6c1fe6) __chore(NPM):__ package updates, notably navigator component with image zoom feature and finger gesture swipe to turn pages
* [(_)](https://github.com/edrlab/thorium-reader/commit/2bc00c0065bf1c3db5f78ede63af04e25a5cfa66) __chore(l10n):__ remove unnecessary translated label by reusing existing
* [(_)](https://github.com/edrlab/thorium-reader/commit/e91bc85c4ffac913756d48fb39f98a49c39ee955) __fix(GUI):__ dark/night and sepia modes HTML select/option for audio book playback rate chooser (Fixes [#1890](https://github.com/edrlab/thorium-reader/issues/1890) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d78b8126ed090833eeab8728ae9fcb0d38f9bc46) __fix(GUI):__ dark/night and sepia modes HTML select/option for TTS and Media Overlays rate /voice choosers (Fixes [#1890](https://github.com/edrlab/thorium-reader/issues/1890) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/5f6fe81212cd5b6093255be668514e18542e6823) __feat:__ force left or right text alignement in reader (actually "start" which depends on document locale), "automatic" is now "default" with change of SVG icon to avoid confusion (Fixes [#1230](https://github.com/edrlab/thorium-reader/issues/1230) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d9d2f26ce5f51d081931cf2914efc1eeee8b8875) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/7b19e27c6a298588487dae5223d22a96f9b78553) __fix:__ locator visibility can be called prematurily, must fence function calling with try/catch promise rejection handler (async) in case navigator webview not fully initialised yet
* [(_)](https://github.com/edrlab/thorium-reader/commit/dfb9e67607eaa20dc1ea3bb49545535ea7c02488) __feat(l10n):__ Croatian translation - HR hrvatski (PR [#1956](https://github.com/edrlab/thorium-reader/pull/1956) - original PR [#1955](https://github.com/edrlab/thorium-reader/pull/1955) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8cf571e69239bba6009f03b47e1c72924a934144) __chore(NPM):__ package updates, ESLINT + PRETTIER
* [(_)](https://github.com/edrlab/thorium-reader/commit/0375a80d13feedae96ee4566f52c0b310ad5abd5) __fix:__ Apple notarization TEAM ID [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/5605d0851d9410a135f67c5778fb1eb09f37d33c) __chore(NPM):__ package updates, Electron 25
* [(_)](https://github.com/edrlab/thorium-reader/commit/e79fa0398e54119306ac75ee3ef192b6463533fc) __Fix(TTS):__ Linux Electron command line parameter enable-speech-dispatcher (also on Windows and Mac but with no effect)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4e62aeca5a231a68b7940d17b62a0c656eeabf52) __fix(OPDS):__ search with relative URLs in OPDS1(XML) and OPDS2(JSON), URI Templates curly brace escaping in URL path
* [(_)](https://github.com/edrlab/thorium-reader/commit/5104bb8e633d62eed85807d0401280cfaed81826) __fix(OPDS):__ publication title was not displayed
* [(_)](https://github.com/edrlab/thorium-reader/commit/3a47d7fdf6ccb6f355bbbc4fb139a5ca4d89aba8) __chore(NPM):__ package updates, fixes SVG a@href links popup footnote handling
* [(_)](https://github.com/edrlab/thorium-reader/commit/906bb843c4e917692bf3a9a0239e4ff62aa3512e) __chore(NPM):__ package updates (Electron 24)
* [(_)](https://github.com/edrlab/thorium-reader/commit/068ee8b3d869f7921c6d8a0ce4cbb526d522544b) __chore(NPM):__ TypeScript v5 package update
* [(_)](https://github.com/edrlab/thorium-reader/commit/37cfb10ad719327802e0deed4837621f3e0bcf90) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2caefcb4c701161295d49ea1b8e5b1ba2189884e) __chore(NPM):__ updated packages and fixed linting (previous commit was error'ing on unused var)
* [(_)](https://github.com/edrlab/thorium-reader/commit/7bed8c0fd0c0030b3f7cd0f2f99a701183755eb5) __fix(dev):__ Chrome(ium) extensions, React Devtools and Redux Devtools now work in Library and Reader windows
* [(_)](https://github.com/edrlab/thorium-reader/commit/321971789b9b02e900fe5ce987f5f482c861eceb) __fix:__ double-click to select text (annotations and bookmarks) Fixes [#1927](https://github.com/edrlab/thorium-reader/issues/1927)
* [(_)](https://github.com/edrlab/thorium-reader/commit/3943ebd5231bf50f05eaa92710de180d556fae2e) __fix(TTS):__ voice selection based on user choice + language match (partial fr-FR vs. fr-CA handling, for example) Fixes [#1921](https://github.com/edrlab/thorium-reader/issues/1921)
* [(_)](https://github.com/edrlab/thorium-reader/commit/260e904c244caea51148a478c5da7047befb75f7) __chore(NPM):__ package updates, minor TTS character escaping fix and HTML5 audio controls fix
* [(_)](https://github.com/edrlab/thorium-reader/commit/004b6f06c67fc05db18e0f7c36081e63d8b59985) __fix:__ DAISY 2.02 and 3.0 import of ncc.html or *.opf now works in Windows when loading from non-zipped publications (Fixes [#1905](https://github.com/edrlab/thorium-reader/issues/1905) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/da0950482f3ded393179851292f673fe8c861513) __fix(a11y):__ in some cases, auto-focus on HTML element default button of dialog was failing due to React race condition (e.g. invoking the delete action from the popup menu failed to auto-focus the default ok button, whereas this worked when reaching the same modal dialog prompt via the publication info sheet)
* [(_)](https://github.com/edrlab/thorium-reader/commit/7d680e20318e64567f1b83ee6fd33a5cdd080080) __fix:__ DAISY 2.02 ncc.html publication import from non-zipped packages (Fixes [#1924](https://github.com/edrlab/thorium-reader/issues/1924) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/eca473d70b3706aca2372e8b697d50949e99dbcf) __fix(a11y):__ OPDS accessibility metadata (Fixes [#1899](https://github.com/edrlab/thorium-reader/issues/1899) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4bb698f1cf4b49a0fd1fcbff8286e5eb384ade28) __fix(a11y):__ keyboard shortcuts editor usability improved, for both screen reader and keyboard users (Fixes [#1913](https://github.com/edrlab/thorium-reader/issues/1913) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ff4aaaca2b78dbdb4f304b57d0a678b8629eadd9) __fix(l10n):__ typed JSON property keys were out of date
* [(_)](https://github.com/edrlab/thorium-reader/commit/4916b47677545121c68e93d8f3af9a5c97ca3280) __feat(l10n):__ Bulgarian translation (original PR [#1914](https://github.com/edrlab/thorium-reader/pull/1914) PR [#1919](https://github.com/edrlab/thorium-reader/pull/1919) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/3cf9f5a8babc812dc33c74b4da437bb8751a9ce2) __feat(l10n):__ Greek translation (PR [#1918](https://github.com/edrlab/thorium-reader/pull/1918) original PR [#1909](https://github.com/edrlab/thorium-reader/pull/1909) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/cce814c516d1c7dbbf31aa3babf47812b278b980) __fix(l10n):__ updated pt-PT translation (PR [#1900](https://github.com/edrlab/thorium-reader/pull/1900) Fixes [#1849](https://github.com/edrlab/thorium-reader/issues/1849) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0220b168acf5f82425e218599d8f774553475f41) __chore(NPM):__ package update (DOM purify)
* [(_)](https://github.com/edrlab/thorium-reader/commit/497598fb3c35a5326150b53a15813462d7af73d2) __chore(NPM):__ package updates, major Electron version upgrade, some breaking API changes in a few places (see code diff), fixed console messages for import CLI
* [(_)](https://github.com/edrlab/thorium-reader/commit/7733d4a0269c35a70a88af15705667cdd0bea36e) __chore(NPM):__ package updates, also fixed a yargs CLI typing error
* [(_)](https://github.com/edrlab/thorium-reader/commit/f666301e5e1031c625bba94f443b0c83f7debe07) __fix:__ file import, unsupported extension / document type, error message (Fixes [#1903](https://github.com/edrlab/thorium-reader/issues/1903) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/cbe2b019adf32b3764a7fd90335050496dc027dd) __fix(ci):__ GitHub Action Ubuntu env var mapping
* [(_)](https://github.com/edrlab/thorium-reader/commit/e4de62e866e1193fd853cf8a6dadee3b78f812cd) __chore(ci):__ Ubuntu 20.04 pin (see [#1910](https://github.com/edrlab/thorium-reader/issues/1910)) and Node 18 + NPM 9 (updated checkout and setup-node actions to v3)
* [(_)](https://github.com/edrlab/thorium-reader/commit/38ef54cd20035bef962db3a9319072c5d8a0398d) __fix:__ navigator.epubReadingSystem object injection in iframes (SVG)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4269a69ce72e561eeeae027b8b2e47ab4bb1de71) __fix:__ navigator.epubReadingSystem object injection in iframes
* [(_)](https://github.com/edrlab/thorium-reader/commit/1286716197a27520d2d8b750334fc3de9075fafa) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/cbce33e6f466f585d91844c6b0db38fa1624804b) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/d0152ba34379e2bd7176b98824985b87420eede9) __fix(build):__ @electron/notarize NPM package renaming
* [(_)](https://github.com/edrlab/thorium-reader/commit/ffa6b953b2d039e9194e258fd826fe8ea296d991) __fix:__ WebSQL is deprecated, works in Electron BrowserWindow but completely broken in embedded webview, so better disable it (Fixes [#1897](https://github.com/edrlab/thorium-reader/issues/1897) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/4509b4b948740f9aeb3d0d82872cc8c8ddeebbe4) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/46ef9832d7671f9b2d0fbf00a74c06eb0ba09742) __fix:__ MathJax dynamic aria-label (speech text) is overridden by authored alt-text (if present), Thorium TTS readaloud speaks it, screen readers do too but have the option to dig further / deeper into the MathML structure (useful with screen reader specialised plugins)
* [(_)](https://github.com/edrlab/thorium-reader/commit/027a8467f88229bbd758099ded9bc4f81578da10) __chore(NPM):__ package updates, including Electron v22 (was v21)
* [(_)](https://github.com/edrlab/thorium-reader/commit/54584aeed225c262e4db495c4ae9b1933e744ced) __fix:__ EPUB FXL rendition-prefixed page-spread-left/center/right properties on spine item (was only parsing non-prefixed variant)
* [(_)](https://github.com/edrlab/thorium-reader/commit/34b37946a7ea6cb2256da4c9bb0fbbee3cb3b1b7) __chore(release):__ additional logo images with white solid background, Microsoft Windows Store (PR [#1891](https://github.com/edrlab/thorium-reader/pull/1891) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6f891c4b3edd0921ec6ba9f1cb8bba569c5615be) __chore(release):__ v2.3.0-alpha.1 version bump for continuous integration builds (master is release-tagged at v2.2.0)

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v2.2.0...v2.3.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
