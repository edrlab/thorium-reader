# Thorium Reader v3.2.1

## Summary

Version `3.2.1` was released on **11 August 2025**.

**NOTE:** version `3.2.0` was published as a pre-release with only Linux and Windows installers (MacOS was missing at that point). This pre-release was removed when a fixed-layout zoom bug was discovered. This bug is now fixed and will be published in patched version `3.2.1`. Apologies for the inconvenience, especially to the few Linux or Windows users who downloaded Thorium version `3.2.0`. You will get the notification when `3.2.1` is available.

This release includes the following (notable) new features, improvements and bug fixes:

* Thorium is now based on Electron v37 (and its updated Chromium version). Version 37 introduced a regression bug with audio/video streaming (time seeking) but this was fixed in time for this Thorium release.
* Localisation: added and updated translations, fixed Chinese handling (was incorrectly triggering RTL)
* PDF: new print feature, updated PDF.js rendering library
* Annotations/bookmarks: exports raw data (JSON format, W3C standard) as well as HTML template. Export is possible outside of a reader window (from the library / local bookshelf)
* Annotation highlights: support for EPUB CFI in data import/export (Colibrio open-source lib)
* Annotations/bookmarks: added a warning message when a publication that contains bookmarks/annotations is about to be removed (suggestion to export the notes)
* Annotations/bookmarks: harmonized models, editor GUI for textual notes, tag, etc.,
* Annotations/bookmarks: support for emojis via GitHub-flavoured Markdown
* Annotations/bookmarks: rendering engine displays floating popup with text excerpt on mouse hover
* Annotation highlights: now with named colours as opposed to just arbitrary RGB triplets
* Bookmarks: new visual indicator in document margins
* Bookmarks: fine-grain "current reading location" detection (mouse click) for precise character-level bookmarking (still default to implicit leading text position in visible text)
* Annotations: when highlights are hidden (not even in margin), and the user selects text + creates annotation, nothing was displayed which was causing confusion and multiple user attempts to create (duplicates). This forces the display of annotations when the user creates.
* GUI: improved the horizontal publication strips in the library window, now scrolls natively and snaps to publication covers boundaries (panning works with mouse wheel, touch swipe, arrow keys etc.)
* TTS: new highlight styles configuration GUI
* TTS readaloud fixes: on last spine item natural play ending (publication finish), turn off TTS "play on click" behaviour, also: hide annotations while playing, restore after stop. Also fixed race condition during play, click, auto forward progression, switch document backwards/forwards, and natural document/publication end (handles annotations hide/restore, continues to ignore hyperlink clicks during active readaloud, until stopped by user or automatically by TTS engine)
* TTS: fixed potential crash in Linux when selecting synthetic speech voices
* TTS: horizontally-centered TTS utterance with minimal jittering in scrolling mode
* TTS: improved readaloud mouse tracking with paragraph spanning across page boundary
* TTS: fixed pause/stop event which was causing GUI flicker
* TTS: voice selection supports multiple per-language user preferences
* Keyboard shortcuts: list / editor now with search filtering by keyword, duplicate detection, and localized labels.
* Keyboard shortcuts: user overrides now persist correctly in json partial data structure on filesystem (was incorrecty serialising all shortcuts including defaults).
* Keyboard shortcuts: display correct characters for non-QWERTY keyboard
* Navigation: fixed hyperlinking into search results which wasn't inserting history events for go back/forward
* Navigation: fixed popup footnotes back/forward hyperlinking history
* OPDS: fixed the OAuth flow which needed to be restarted when a refresh token was revoked or invalid
* Accessibility: updated support for the display guide specification
* LCP: improved LSD network timeout, added async loading spinner (GUI)
* DAISY import: fixed virtual zip archive handling of subfolders (DAISY2.02 NCC.html non-zipped publication folder, for example)
* EPUB3 Media Overlays: fixed playback of precorded audio clips with implicit natural stream ending, also fixed edge case of HTML documents that start with markup that doesn't participate in SMIL synchronization (seek ahead algorithm)
* EPUB3 Media Overlays: added GUI control checkbox for "ignore MO and read with TTS instead"
* EPUB3 Media Overlays (and DAISY2.02 DAISY3.0): improved synchronised text-audio talking books, which now fallback on TTS when pre-recorded audio clips are not present in SMIL par pairs (only text reference). Can be full SMIL-TTS book, or partial interspersed / mixed TTS / audio-clips.
* GUI: fixed the bottom progression bar which was not capable of handling great numbers of spine items, now minimum mouse cursor hit size (width) required
* Accessibility: fixed keyboard focus handling inside HTML documents, screen reader detection to avoid interfering during scroll repositioning, also avoiding element focus during selection change.
* Screen reader fix: left/right arrow hot key binding to "page turn" interferes potentially with current reading location during screen reader usage
* Accessibility fix: "skip link" in reader window is equivalent to FocusMainDeep CTRL F10 with SHIFT
* Fixed TTS Japanese Ruby handling, baseline text DOMRange-rendered but not spoken, unless Ruby is hidden/disabled. Also increased underline gap hoping to eliminate rendering artefacts in Windows
* Fix: DAISY3 DTBOOK parser was choking on 60,000 lines / 8MB frontmatter
* LCP fix: PDF import workaround for servers that respond with HTTP header content-disposition for PDF filename instead of LCPDF
* Fixed Windows publication export filename which cannot contain ":" colon
* Added support for PNLD EPUB extension (in addition to .epub and .epub3)
* Accessibility fix: automatically disable pagination (CSS columns in reflowable documents) when screen reader is detected
* Fixed AccessibleDfA typeface (dyslexic)
* Adopted ReadiumCSS font-size / zoom fix
* Image zoom/pan GUI now implemented in Thorium via localizable React GUI
* Fixed Arabic and other Right To Left metadata accessibility summary and author/publisher/contributor in publication info dialog
* Fixed zoom in pre-paginated / fixed-layout EPUB, and keyboard shortcuts for zoom in/out/reset which were not working in "zen mode"
* Fixed HTTP header content-disposition filename handling (sanitization for cross-platform Windows, Linux, Mac filesystems)

(previous [v3.1.0 changelog](./CHANGELOG-v3.1.0.md))

## Full Change Log

Git commit diff since `3.1.0`:
https://github.com/edrlab/thorium-reader/compare/v3.1.0...v3.2.1

=> **356** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/d848b9c751efa55daf9a79f2d4b1ff664dc4605f) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/7557d44790215c3cee5a727725ebb33eb634bc19) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/4907bb1ba3d2f3856b59e8b4470396764f6c7cc7) __fix(l10n):__ updated Turkish translation via Weblate (PR [#3103](https://github.com/edrlab/thorium-reader/pull/3103))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fb33f10f7030b2ca236da11c1c30a23a3af1ff0b) __chore(NPM):__ package updates, notably Electron v37 (Fixes [#3089](https://github.com/edrlab/thorium-reader/issues/3089) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/a22a8a96a589bdfdf7795b99d1b273672333e5a8) __chore(NPM):__ package updates, notably navigator which fixes popup footnotes recall via navigation history back/forward (just like actual hyperlinking)
* [(_)](https://github.com/edrlab/thorium-reader/commit/f385a828001fe194a45b4990c6107e815be1c2da) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/7d27824181da618370c3ea42c1e29bdd282f4f2f) __fix(l10n):__ updated translations via Weblate: Arabic, Turkish (PR [#3098](https://github.com/edrlab/thorium-reader/pull/3098))
* [(_)](https://github.com/edrlab/thorium-reader/commit/87bd9756543c5dcce012bb849754e49e3e571bd2) __feat(customization):__ customization profile package mainfest interface
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a8bfd2f8865c73140f4e6b8013e9592f165fb50) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c4a80a244129cc9a27b73d41c81d93b78a01f94) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/5c39098adc56876aae2bc291572e72135d862761) __fix(l10n):__ updated translations via Weblate: Lithuanian, Tamil, Arabic (PR [#3094](https://github.com/edrlab/thorium-reader/pull/3094))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ab0115ef57fd8ef1ccb1994c53be0a21101ab21c) __fix:__ fixed-layout zoom was broken on Windows (and Mac or Linux also when scrollbars are permanently visible) (Fixes [#3093](https://github.com/edrlab/thorium-reader/issues/3093) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d99e4f7d7e387e2f13c29f4434f1fda81d6fc869) __chore(release):__ v3.3.0-alpha.1 CI trigger
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b0d63ee986f2154c1a58db757a9c8f0fbe42853) __(tag:__ v3.2.0, origin/master, master) chore(release): v3.2.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c8a8aa9e153447acff11054788d79db6f60ff1ed) __(origin/customization) chore(dev):__ handy shell scripts for ARM64 vs. x64 build/package [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1f65a954254b84371cc993dca3db806f7a8ac84a) __chore(dev):__ Electron rebuild versions [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba29c9bf3062113accc36d4eae2bc307f5404fd1) __chore(release):__ changelog [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/fef4238fc7dec3f8e2978a05bbe62b3a60518f23) __chore(CI):__ after windows-2025 successful checks, restore normal build matrix
* [(_)](https://github.com/edrlab/thorium-reader/commit/6e35022a926fcf41bc6b0028d87b23160437881f) __chore(CI):__ Windows 2022 dumpbin.exe discovery
* [(_)](https://github.com/edrlab/thorium-reader/commit/384b4aeedd3003e4ba364b097d7bfa99d35bc74a) __chore(CI):__ Windows Microsoft Visual Studio 2022 Enterprise MSVC versions discovery (dumpbin.exe)
* [(_)](https://github.com/edrlab/thorium-reader/commit/2c576de36cddc2d345496485659760b99a0b1020) __chore(CI):__ testing windows-2025 which will become default for windows-latest in September, windows-2022 will remain supported for 3 years
* [(_)](https://github.com/edrlab/thorium-reader/commit/855cf5f63f39f1eda4448d4544a8638890433203) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/14d2a60065f5e5c444abeefcadd24e3d0fcaf446) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/ffffebfb5ee1433287e68aae070f23add6b2a69c) __fix(l10n):__ updated translation via Weblate, Lithuanian and Polish (new) (PR [#3091](https://github.com/edrlab/thorium-reader/pull/3091))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a5007603a5a8f6c761b4c4f59ffbd56c09c02c33) __fix(l10n):__ updated translations via Weblate, Lithuanian (PR [#3081](https://github.com/edrlab/thorium-reader/pull/3081))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b16c8f24f7fde79f966d2ff4fa665b8c7c301a7) __fix(audio/video):__ downgrade to Electron v36 (was 37) (Fixes [#3066](https://github.com/edrlab/thorium-reader/issues/3066) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/650042a313d852c9fad73baa8964e21c8a74141a) __fix:__ HTTP header content-disposition filename sanitization, follow-up to previous commit 60baf89a34f6f5274073d4ad89561bef8e14d699
* [(_)](https://github.com/edrlab/thorium-reader/commit/60baf89a34f6f5274073d4ad89561bef8e14d699) __fix(opds):__ sanitize http content-disposition filename when publication downloaded and imported
* [(_)](https://github.com/edrlab/thorium-reader/commit/39d736f56721ad1b391865b94b96c817e5d7d0d0) __fix:__ opds and thorium URL protocol handlers now work in DEV mode too (from PR [#3076](https://github.com/edrlab/thorium-reader/pull/3076) thank you)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b8823408664df3da320e280dba5a9d031bee423d) __fix(lint):__ sorry, unused imports in previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/c11aaa5201e52d4352c1bf1ef82ca2c7a1010d93) __fix:__ protocol stream handler API deprecation preparation for evolution (related to regression bug Electron v37+ broken audio/video stream seeking) (PR [#3079](https://github.com/edrlab/thorium-reader/pull/3079))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b4085f18d055256028fac7131bccaf2ff39c57fc) __chore(release):__ changelog v3.2.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/3ad695b6ce73b3d8b8e2fb6c5042d7fa36d058a5) __fix(GUI):__ modal dialogs stretched responsive height, annotations list background color (PR [#3052](https://github.com/edrlab/thorium-reader/pull/3052) Fixes [#3017](https://github.com/edrlab/thorium-reader/issues/3017) Fixes [#3006](https://github.com/edrlab/thorium-reader/issues/3006))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f8a0b96a590fd067dbd3f7beec6e82286ba3bae7) __fix(l10n):__ updated translations via Weblate: Lithuanian, Turkish, Portuguese (Portugal), Finnish (PR [#3073](https://github.com/edrlab/thorium-reader/pull/3073))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8f6b368eb2fbc8bc9fabc30bf1a17a507147318) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/3e7bf808320e32178b5a3b027642d1a140c7b394) __chore(dev):__ Flox/Nix 1.6.0 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/896155cbf13143bfe67272b11db130eb6acb08a0) __fix(PDF):__ null characters and unicode normalization during clipboard copy (mimics PDF.js logic)
* [(_)](https://github.com/edrlab/thorium-reader/commit/22d1b595e8880977d7b6117f3f8949ab83f74999) __fix(PDF):__ clipoard copy event must be captured (regression since after v3.0.0, probably PDF.js intercept?)
* [(_)](https://github.com/edrlab/thorium-reader/commit/131d446fcf093d5d3c2089261d7166e4bc5bcec9) __chore(dev):__ empty-commit test (sorry :)
* [(_)](https://github.com/edrlab/thorium-reader/commit/f5b1b14bdf66c9db813c7d74fb5857fcc33fe2a0) __chore(dev):__ introduce shell.nix and .envrc with direnv [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/ed0232e40794e18895fd02d19202d0a3c9b17122) __chore(NPM):__ package updates, notably r2-navigator-js that fixes Electron v37+ CSS Columns regression bug (Fixes [#3072](https://github.com/edrlab/thorium-reader/issues/3072) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/cdd821a60304b7a307dfd6d4d46d6cf9ddb59c34) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9eac039e0fc509aa50fe24499328e98b0cf111f6) __chore(NPM):__ package update, minor Electron bump
* [(_)](https://github.com/edrlab/thorium-reader/commit/7c319b729aa75eaeefeccf1f506d89905a384d52) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/f62dfed6c43e4b116d9b9025b3f1d9e8a8329fd6) __chore(release):__ changelog [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9ccadc2af740146e71050ae030d5b06507c61a93) [skip ci] Merge remote-tracking branch 'weblate/develop' into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/cdb49e73ffa4d102e7f6c78c82352d3a171f625c) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ab1ea3f422fc544cae58d79297b964be4944c656) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ff9ced1a1cba6f4c0c56e43327dc127e9e01b9f2) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/66436741586bdfa66b90a3d259f06813568d4d27) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/59a1bc800c383950f279168b3d3665c966acdbfa) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/255cc4c0fdfb4633001ebfed5e3963e44f0fa5fa) (weblate/develop) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/2c474d4785232b50d005ff3814529db1a3ff00b6) __fix(l10n):__ updated translations via Weblate, Lithuanian + Chinese (Traditional Han script) + Turkish + Portuguese (Portugal) + Lithuanian (PR [#3067](https://github.com/edrlab/thorium-reader/pull/3067))
* [(_)](https://github.com/edrlab/thorium-reader/commit/92405b36175d8da117c2643f42af1c4593545e00) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/946eb1a1ccb8fb86bd3716d7222b7924316512a2) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dc5f444176ec49416ceae34b16827c647d3b0f16) Translated using Weblate (Portuguese (Portugal))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7e55a11178f77a3c20ffe43c6bb67e361e3eb5b2) Translated using Weblate (Portuguese (Portugal))
* [(_)](https://github.com/edrlab/thorium-reader/commit/54b06de3cd1985d585104f6507d05ae2da8071e6) Translated using Weblate (Lithuanian)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b2368ec0f9334dc943ed4693fe103b458c183fd2) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2331baa9fb9098ac5cce0ac7cc88343e86d0dc83) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5c4efc58ff5e357dbeabb7b68d8ac93ae683848b) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ae27e6879d32fb8d8f90f508f05342c15a3cd4c9) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/040966618786df32df7ce082b41aad7dda25ff4e) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/43c1cf883ab8b29a776500bcff1afefcf1a8d49d) Translated using Weblate (Chinese (Traditional Han script))
* [(_)](https://github.com/edrlab/thorium-reader/commit/06547b7ba9f2ede521b27eb8a99b9e04944877d5) Translated using Weblate (Lithuanian)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f0d816bbfaa3e0e541050a750450b14fa454df5) __feat(l10n):__ added Turkish now that the WebLate translation has progressed significantly
* [(_)](https://github.com/edrlab/thorium-reader/commit/e5a9b5b50b39f2b21ff31f12a5bf08c4b3565b3f) __chore(dev):__ Zed auto-indent 4 spaces instead of 2! [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/7f3b2f6694509df87424fb625039d11c1caeec77) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/cf40c718c45e2409a2e7123d45061697e0f12d3c) __fix(GUI):__ library view, horizontal publication strips, left/right arrow buttons state update (PR [#3061](https://github.com/edrlab/thorium-reader/pull/3061))
* [(_)](https://github.com/edrlab/thorium-reader/commit/828d2511bcc60cc5d2605df86cc31cdfb9439295) __fix(l10n):__ updated translations via Weblate - Greek, Finnish, Lithuanian, Turkish, Dutch (PR [#3057](https://github.com/edrlab/thorium-reader/pull/3057))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b99a57e5d1625c05e02690ac2bdd89e1da35f0b5) __fix:__ library windows horizontally-panning strips of publication items now slide with scroll, works with mouse wheel, touch swipe, arrow keys etc. (PR [#3051](https://github.com/edrlab/thorium-reader/pull/3051) Fixes [#3037](https://github.com/edrlab/thorium-reader/issues/3037))
* [(_)](https://github.com/edrlab/thorium-reader/commit/405ddbfcde9318482aad04e8cacc2f42e4f30172) __fix(l10n):__ removed unused translation
* [(_)](https://github.com/edrlab/thorium-reader/commit/7abbe9b9edfb4ed1e4881e026cec31f79440a5ea) __fix(l10n):__ updated translations via Weblate - Greek, Finnish (PR [#3056](https://github.com/edrlab/thorium-reader/pull/3056))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4681e81fd056ff20aab5b0f3584dcfc40ec3443d) __fix(print):__ print dialog new design (PR [#3018](https://github.com/edrlab/thorium-reader/pull/3018) Fixes [#3012](https://github.com/edrlab/thorium-reader/issues/3012))
* [(_)](https://github.com/edrlab/thorium-reader/commit/114df756a02cc036712adc2c71072b1a34e940b6) __fix(l10n):__ updated translations via Weblate - Greek, Finnish (PR [#3054](https://github.com/edrlab/thorium-reader/pull/3054))
* [(_)](https://github.com/edrlab/thorium-reader/commit/afb5ca2e496c692b9bb59efd5c2141101c15c318) __fix(notes):__ Mustach template update (PR [#2999](https://github.com/edrlab/thorium-reader/pull/2999))
* [(_)](https://github.com/edrlab/thorium-reader/commit/33ac55e69c523f8c9bf25e6b6718afc80a91799f) __fix(notes):__ readium annotations export has now a default motivation for annotation as "highlighting"
* [(_)](https://github.com/edrlab/thorium-reader/commit/75b2664144aaa06442b18d25867370054b28d231) __fix(library):__ reset continue reading slider to the left position when publication was opened ( and refresh at the top of the queue )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ec547be174025f81889d45cf585f22c572e8dcee) __fix(dev):__ fully working VSCode debugging for main process [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/eff75c5f11c3f5a17831b7064d662214a3002094) __fix:__ added a warning message when a publication that contains bookmarks/annotations is about to be removed, suggestion to export the notes (PR [#3049](https://github.com/edrlab/thorium-reader/pull/3049) Fixes [#2880](https://github.com/edrlab/thorium-reader/issues/2880))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0d7f0fc5f2c7218c6b15625d01e4c4a4072f209f) __fix(audiobooks):__ disable search button and shortcut for audiobooks (PR [#3050](https://github.com/edrlab/thorium-reader/pull/3050) Fixes [#3047](https://github.com/edrlab/thorium-reader/issues/3047))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e0b6f77f5fab7c8b0b051d851d5ed70d9c09553e) __fix(l10n):__ updated translations via Weblate - Turkish, Finnish (PR [#3048](https://github.com/edrlab/thorium-reader/pull/3048))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b69d53fc037cff53757a3f1d0e9ad73b48d158b3) __fix(dev):__ sourcemaps were broken
* [(_)](https://github.com/edrlab/thorium-reader/commit/ce2f0613802ed2acbc740338ee5617ce39220a8e) __fix(a11y):__ settings dialog had no title (visually hidden)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fa218a0676c75acf535a8046ed590255cd378c0e) __fix(TTS):__ VoiceSelection Combobox unique id Key from readium-speech aka speechsynthesis api on linux with espeak (PR [#3046](https://github.com/edrlab/thorium-reader/pull/3046) Fixes 2972)
* [(_)](https://github.com/edrlab/thorium-reader/commit/17b7bf175f7cbf5d5b856dd13b95becc5ca66a85) __fix:__ NPM updates inc. r2-navigator-js package ( Fixes [#2936](https://github.com/edrlab/thorium-reader/issues/2936) Fixes [#3029](https://github.com/edrlab/thorium-reader/issues/3029) Fixes [#2996](https://github.com/edrlab/thorium-reader/issues/2996) Fixes [#2914](https://github.com/edrlab/thorium-reader/issues/2914) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/61f4ad1eda0253f91d0dab79fc6ad4795143e2bb) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b395047756477d7f5b049852c0d8c6d3cbb12565) [skip ci] Merge remote-tracking branch 'weblate/develop' into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/e43ed9fc9fc8b50d0d1721d877f2a51b2da46eef) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/617d1eb1cccdeb4712c83388b0a78a286a45f8e8) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/dfe489b58c07f68de2e26562e3023cae66d4af86) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b54a448789fd97be883ce0faf7ae31e72d215f4) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/de34996d1482b3dd52473d379b331f9b8b75e6f4) __fix(LCP):__ error message when license issued date is after provider certificate expiration (Fixes [#2748](https://github.com/edrlab/thorium-reader/issues/2748) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/384e03fd884ca6d12530d6647b0d9d2ed689314c) __fix(l10n):__ updated translations via Hosted Weblate - German, Greek, Finnish, Croatian, Swedish, Turkish (PR [#3045](https://github.com/edrlab/thorium-reader/pull/3045))
* [(_)](https://github.com/edrlab/thorium-reader/commit/84a2aa9977811cf7a83ed143faa5a9018fa891fd) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/d5cf0c5023c375f1fc3d3f223c9c4f384ad18ca9) Translated using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b65df4b6b6a7d00a3cbcd309f0fb2292f8bd7f72) Translated using Weblate (Swedish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4341e294db9d8867df6e8640697b589430a1f0d6) Translated using Weblate (Croatian)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd271f8d5636105dfbfd0aca0c220623f7f8dd1e) Translated using Weblate (Finnish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/97e69623c58ca41624d73b06212056da22963f15) Translated using Weblate (Greek)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b908e0c9a87f1aa2614f7f057cde789577506b40) Translated using Weblate (German)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0b1593a57907b9d9a9e956670e0835f1db2dd340) __fix:__ Chinese RTL error, updated NPM packages (shared-js and navigator-js which also include the fix), updated other NPM packages (Fixes [#3027](https://github.com/edrlab/thorium-reader/issues/3027) Fixes [#1987](https://github.com/edrlab/thorium-reader/issues/1987) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/06b924fa32ac33cfb0d71cb9a2fbe5e830da4d0a) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/77382588396db789365196984eb2da578f1e2051) __fix(GUI):__ improved styles (PR [#3026](https://github.com/edrlab/thorium-reader/pull/3026) Fixes [#3013](https://github.com/edrlab/thorium-reader/issues/3013) Fixes [#3014](https://github.com/edrlab/thorium-reader/issues/3014) Fixes [#3025](https://github.com/edrlab/thorium-reader/issues/3025) Fixes [#3024](https://github.com/edrlab/thorium-reader/issues/3024) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/b66d5e1d18abc2ea0e1ad27d476d64784e4e2376) __fix(release):__ build-time feature flags, WebPack define plugin and Terser minification with dead code elimination (PR [#3028](https://github.com/edrlab/thorium-reader/pull/3028) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/48cbb92d11f606e7a498ce4f912cc6f7e4db60b1) __fix:__ missing typed i18next update
* [(_)](https://github.com/edrlab/thorium-reader/commit/103e4090f7ef465a94913a8c0cf4b9a528b4a659) __fix:__ miscellaneous CSS and GUI updates (PR [#3011](https://github.com/edrlab/thorium-reader/pull/3011) Fixes [#3002](https://github.com/edrlab/thorium-reader/issues/3002) Fixes [#3003](https://github.com/edrlab/thorium-reader/issues/3003) Fixes [#3005](https://github.com/edrlab/thorium-reader/issues/3005) Fixes [#3007](https://github.com/edrlab/thorium-reader/issues/3007) Fixes [#3008](https://github.com/edrlab/thorium-reader/issues/3008) Fixes [#3009](https://github.com/edrlab/thorium-reader/issues/3009) Fixes [#3010](https://github.com/edrlab/thorium-reader/issues/3010) Fixes [#3020](https://github.com/edrlab/thorium-reader/issues/3020) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/c02ad036458c1c88094c7d31024989f23f50b73e) __fix(l10n):__ update translations via Weblate - Tamil, Greek, Turkish, Danish, Finnish (PR [#2998](https://github.com/edrlab/thorium-reader/pull/2998))
* [(_)](https://github.com/edrlab/thorium-reader/commit/df65bbff5aeee008a6cf6a8b15cf3936780a1d78) __fix(a11y):__ keyboard focus was trapped in annotation text area editor (PR [#3022](https://github.com/edrlab/thorium-reader/pull/3022) Fixes [#3021](https://github.com/edrlab/thorium-reader/issues/3021) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8c7b2497500b042c26a65334cfbb07435516896e) __chore(NPM):__ package updates, notably Electron v37
* [(_)](https://github.com/edrlab/thorium-reader/commit/3aff40e440cff09897256b1c06b658770b339e4d) __chore(dev):__ Typescript tsc and Go compiler now work fine with esnext + bundler moduleResolution, matches WebPack configuration [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1b6e82ea31cc4b15b8247bd3dd8bc9214fe2d3a2) __chore(dev):__ Typescript checker (Go compiler and standard tsc) failed to compile marked/marked-emoji types due to CommonJS / ECMAScript modules discrepancy, marked-emoji exports do not include dual CJS / ESM types (unlike marked) so the types were either missing or were conflicting because of identical names but different CJS/ESM origins ... brute force solution: disable exports given that the compiler works on nodenext modules/modulesResolution, and fallback on package.json types field which thanfully is ESM by default (*.d.ts vs. *.d.cts automatic filename lookup makes troubleshooting hard even the exports fields are explicit!) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c556d63beea7143c79bae7f8b09f2bb19367da92) __fix(note):__ import note as annotation with one character and no bookmark flag (Fixes [#2988](https://github.com/edrlab/thorium-reader/issues/2988) PR [#3016](https://github.com/edrlab/thorium-reader/pull/3016))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ae1dde2ac3f5ffa7506cc28ed7565ba114d217f) __feat(note):__ CFI annotations import/export (PR [#3000](https://github.com/edrlab/thorium-reader/pull/3000))
* [(_)](https://github.com/edrlab/thorium-reader/commit/eca828d5fd57d6d56e0fc7a9ad058ba5dcad4e29) __chore(CI):__ attempt to solve Windows dumpbin.exe path
* [(_)](https://github.com/edrlab/thorium-reader/commit/866c0470c13b0c7aa4cd05fded376476f6ae76c6) __fix(lint):__ sorry, previous commit useEffect dependency array
* [(_)](https://github.com/edrlab/thorium-reader/commit/420ba8de5ba2409b2d7539ca8350dc0dfab56ddf) __fix:__ tags click activates search in publication bookshelf (Fixes [#3001](https://github.com/edrlab/thorium-reader/issues/3001) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/7f129438d641d2528dbd30f05411b640ff496665) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/192ba9251637a059d04f91e09fe6b1c525ea06ba) __chore(dev):__ shell script utility builder x64/arm64 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a0bef1a143c88f9efa729d82db79218c8df32aa) __fix:__ regression in previous commit (updated package, now CFI migrated)
* [(_)](https://github.com/edrlab/thorium-reader/commit/10355a1842d74a9d82044d9be9facc16deec883a) __feat:__ Colibrio CFI from navigator Dom Range locators
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f6f34d0b439f8e5d3d0ac1cb45c414cd44649da) __fix:__ lint (trailing comma!)
* [(_)](https://github.com/edrlab/thorium-reader/commit/c84f496fe159a60ccc495c4c6706e71489039219) __feat:__ keyboard shortcuts editor accessibility improvements and added search filterning by keyword and added duplicate detection (PR [#2967](https://github.com/edrlab/thorium-reader/pull/2967))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b666188de8b93d549a375f12ff751126d72886d5) __feat:__ keyboard shortcut editor now searchable and localized (PR [#2938](https://github.com/edrlab/thorium-reader/pull/2938))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f67ec1f2c1ccee0ba1cab8d0ca3aeac33f8b977a) __fix(l10n):__ improved English for notes export HTML template customisation
* [(_)](https://github.com/edrlab/thorium-reader/commit/001ef46d1f6cac210d63456483a8641b62b90539) __fix(l10n):__ minor English tweak image zoom viewer [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/480ec669331e341a50de8699e63cca7900641bf3) __fix(l10n):__ PDF print dialog English translation, text structure tweaks
* [(_)](https://github.com/edrlab/thorium-reader/commit/a6106a74554791296179ede397079b4760dcbf11) __fix:__ crash when printing LCP-protected PDF
* [(_)](https://github.com/edrlab/thorium-reader/commit/cc0e0f25243a2984d8ef79b64a1ea0db46de5002) __fix(GUI):__ css in reader dock (PR [#2984](https://github.com/edrlab/thorium-reader/pull/2984) Fixes [#2982](https://github.com/edrlab/thorium-reader/issues/2982) Fixes [#2981](https://github.com/edrlab/thorium-reader/issues/2981) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/9252075634c37683aec9a87b15736389fd4667f3) __feat:__ add emoji support in annotations GitHub Flavored Markdown (PR [#2990](https://github.com/edrlab/thorium-reader/pull/2990))
* [(_)](https://github.com/edrlab/thorium-reader/commit/01288d32ad7d0f8ced540f8ff4a8aafd6105111e) __fix (l10n):__ updated Spanish translation (PR [#2964](https://github.com/edrlab/thorium-reader/pull/2964))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3fbb759ea76f1cdd23bafc8957c10782fa966ac1) __fix(l10n):__ updated translations via Weblate - Danish, Finnish, Swedish, Turkish, Italian, Dutch (PR [#2992](https://github.com/edrlab/thorium-reader/pull/2992))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea8a725e71fde050905f480d41d7a1629a82c27b) __chore(NPM):__ package updates, notably all r2-*-js
* [(_)](https://github.com/edrlab/thorium-reader/commit/fc23802fc017e85b278d1ebe80ba633513c69415) __chore(NPM):__ updated packages, moved TypeScript Go compiler out of start:dev:quick to avoid arm64/x64 compatibility issues when testing in cross-compiled environments (rm -rf node_modules/electron && npm i electron --arch=x64 --cpu=arm64)
* [(_)](https://github.com/edrlab/thorium-reader/commit/379c78288f28655d1923ad6fe162b453dc870f3c) __fix:__ navigation to search results wasn't inserting history events for go back/forward (see https://github.com/edrlab/thorium-reader/issues/2970#issuecomment-2965740199 )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea38c21384c28db0aab57b96e3c46c4ba71e2dd4) __chore(dev):__ Flox/Nix manifest lock update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4624ddfd1212097cb0b5fa1c91f583c3486f8b54) __chore(dev):__ annotation markdown remove double URL Regexp parsing
* [(_)](https://github.com/edrlab/thorium-reader/commit/9634ee7cef2fdcfd5a6f229cf00f4a8a3edef3d6) __chore(dev):__ disable resourceCache debug [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/27a3ce93b5f7fab60cca21a97dcb9667b1657bca) __chore(i18n):__ fr local missing accents on capital A (A propos) (PR [#2995](https://github.com/edrlab/thorium-reader/pull/2995))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e217af580e265f05160c13a875af54a751f4eb0f) __fix(l10n):__ updated translations via Weblate, Bulgarian + Russian + Turkish + Greek (PR [#2986](https://github.com/edrlab/thorium-reader/pull/2986))
* [(_)](https://github.com/edrlab/thorium-reader/commit/23f4061b4eef087cd869ccca00b6181599f56180) __fix:__ keyboard shortcuts user overrides now persist correctly in json partial data structure on filesystem (was incorrecty serialising all shortcuts including defaults) (PR [#2991](https://github.com/edrlab/thorium-reader/pull/2991))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ac96a6f6648925a776434b25ba84dd1c524d4995) __chore(dev):__ lint for @ts-ignore (normally use @ts-expect-error but we need dual support for TypeScript TS/Go compilers)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e50896f3d40e4f5fd4c19c4a5eb5aa1de7bd33c4) __chore(dev):__ TypeScript Go compiler correcty idenfifies ESMvs. CJS mismatch (package.json type=module for ECMAScript modules), unlike TypeScript standard compiler which ignores this [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9951e48ddd5c59ba4a2d7c9923cb4dba80b2a812) __chore(dev):__ webpack bundle scope checker (main and renderer processes, source tree realm verification), also made the bundle analyser opt-in (was activated by default => unnecessary processing cost at build time)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fc5ba36c5962d098587e2cf397941c64644f7466) __fix:__ duplicate command line arg
* [(_)](https://github.com/edrlab/thorium-reader/commit/1e42dd3afaddd02c2e97e89f0f2a12efc5e29a74) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/d74e04e4fb18636e7a884cf139dfd05e8c8185aa) __fix:__ Linux GTk 3 vs. 4 see https://github.com/electron/electron/issues/46538
* [(_)](https://github.com/edrlab/thorium-reader/commit/4adf80df21e653b7542c1ce71fc3203d81c95e10) __fix:__ linux gtk 3
* [(_)](https://github.com/edrlab/thorium-reader/commit/718d9d11a4643dd3ed720e42c66dac26f08e8a7c) __fix:__ rogue Keyboard code in previous commit! (sorry)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0588f0d0f447e2c21cb4781b72b6634d72fa1ab5) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/a15d41b676cc817bfccb7c41cdb180cc3de62990) __fix(dev):__ fixes ISearchResult interface not imported from common state
* [(_)](https://github.com/edrlab/thorium-reader/commit/77566964face71c8ced8bf619a21988572bc410d) __fix:__ resourceCache optimisation (Fixes [#2840](https://github.com/edrlab/thorium-reader/issues/2840) PR [#2959](https://github.com/edrlab/thorium-reader/pull/2959))
* [(_)](https://github.com/edrlab/thorium-reader/commit/eb34c63e53f5bf80a4ee4533856e1f623f91f3af) __fix(opds):__ start a new OAuth flow process when refreshToken revoked/invalid (PR [#2985](https://github.com/edrlab/thorium-reader/pull/2985) Fixes [#2983](https://github.com/edrlab/thorium-reader/issues/2983))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4f3c2256a10e781f91aca3e75752b8475ec8ac3a) __fix(pdf):__ minor fixes pdf print on Print.tsx component
* [(_)](https://github.com/edrlab/thorium-reader/commit/1a1b2f88973cd6cfd4808d835529ce2bfa9d20bd) __feat(pdf):__ Print (PR [#2965](https://github.com/edrlab/thorium-reader/pull/2965))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0e986650aa03e2767cab81bb7ef128abbf606548) Merge branch 'master' into develop [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/e9a0de8284c2f606376ef94fa4fb68deeb8a50a5) __chore(release):__ latest.json version downgrade to v3.1.0 (was v3.1.1 hotfix for MacOS Apple Silicon ARM64 M1/M2/M3/M4 users)
* [(_)](https://github.com/edrlab/thorium-reader/commit/87e7cd52b202d640730bec917ceb67c678df5eb5) __fix:__ previous commit introduced a regression in search/replace of arm64-x64 toggle
* [(_)](https://github.com/edrlab/thorium-reader/commit/9b3729a53ce8760068837421b556198cf30112ec) __chore(NPM):__ updated packages, added MacOS ARM64/x64 build scripts for testing CLI or just packaged prod application on differents archs
* [(_)](https://github.com/edrlab/thorium-reader/commit/4d8077f48ba9c89b0e9df2eda303514503736183) __chore(dev):__ run i18n & style-typed command
* [(_)](https://github.com/edrlab/thorium-reader/commit/4ac0f13b0b5bcd7d4199eee336d4b89ed4b93a2a) __chore(dev):__ disable proxy-agent debuging message in dev mode [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6c98bb28f92b414a70f5b7fda46425e212807c79) __fix(auth):__ increase OPDS Authentication modal timeout to 4 minutes (PR [#2983](https://github.com/edrlab/thorium-reader/pull/2983)) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/0ceb2592fe5bd9c46bfe9c5daacd4ae1de24b874) __fix(CLI):__ disable import pdf file from Command Line (PR [#2977](https://github.com/edrlab/thorium-reader/pull/2977))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d18ce24efc8d29a2d97b9dc73d83a08632f1d26c) __fix:__ font prefetching based on media type declared in EPUB OPF XML package / publication manifest, removed duplicate and added new x-extension [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/10c80fbf3c86ee9f5c099b3ec43b212717f72458) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/95ba12682a2a9e50286389901895a2a9ef4a3ab3) __fix(css):__ imgViewer min height to 350px (Fixes [#2980](https://github.com/edrlab/thorium-reader/issues/2980))
* [(_)](https://github.com/edrlab/thorium-reader/commit/42d26c31ef968955effa4759319503d23df57ec2) __ fix(l10n):__ run 18n- script on previous commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/a8bcd87a301b097871accc1a6288762c44210fff) __fix:__ img viewer (PR [#2979](https://github.com/edrlab/thorium-reader/pull/2979) Fixes [#2976](https://github.com/edrlab/thorium-reader/issues/2976))
* [(_)](https://github.com/edrlab/thorium-reader/commit/704d2585b48c4c3239789e5dcf8ce9d6631f4964) __fix(l10n):__ updated translations via Weblate - Arabic, Japanese, Turkish, Greek, Portuguese (Portugal), Swedish (PR [#2962](https://github.com/edrlab/thorium-reader/pull/2962))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c615f9505cf74012bab30f308416ce9bb2cec4d) __fix(dev):__ [skip ci] npm run start:dev:quick NOT prefixed with tsgo TypeScript type checker, instead using concurrently and tsgo watch mode, therefore removing the need for WebPack's own watcher and child_process spawn
* [(_)](https://github.com/edrlab/thorium-reader/commit/bcde9d930df27260197f362691c95c196fc9dda2) __fix(dev):__ node-pty replaced with vanilla NodeJS child_process spawn (for TypeScript Go typechecker / compiler)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e78410ceeac7bf281738b419a9add6b13fa2066b) __fix(dev):__ node-pty fails on Windows (ironically as this is a Microsoft package), but the beta version should fix this...
* [(_)](https://github.com/edrlab/thorium-reader/commit/d3a98d83f3131593336c1d564620909a75a1ba3b) __fix:__ MacOS x64 / arm64 package.json script regression
* [(_)](https://github.com/edrlab/thorium-reader/commit/ab870b0bdc2b60817d2f179662b26987350f725a) __fix(dev):__ GitHub Actions CI x86 / arm64 mismatch in TypeScript Go checker WebPack plugin (pty shell spawn binary)
* [(_)](https://github.com/edrlab/thorium-reader/commit/aa7adcfc9006cf18fc294f4b7669eb3066453a9e) __fix(dev):__ using TypeScript Go typechecker / compiler in "start:dev:quick" mode during watcher process (single pass for entire codebase, in-terminal reporting, not interrupting in React GUI, unlike "start:dev")
* [(_)](https://github.com/edrlab/thorium-reader/commit/7c374187fb486c3472791aa09ad1056c0ad7eca6) __chore(NPM):__ package updates, Electron v36, TypeScript Go compiler alternative to TSC in dev mode (production builds unchanged)
* [(_)](https://github.com/edrlab/thorium-reader/commit/89ba729e745c2dceb415e81476072dab5711086b) __fix(note):__ fixes bookmark/unbookmark/note crash when locatorExtended doesn't have selectorInfo (Fixes [#2974](https://github.com/edrlab/thorium-reader/issues/2974))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b7c929c3fd226787526a0874b0ca22c977db7aaa) __fix(pdf):__ fixes difference between PageNumber (number one based) and PageLabel (string)
* [(_)](https://github.com/edrlab/thorium-reader/commit/cfa7abccab9850a832cebb54e7ab544b71c954cc) __chore(release):__ v3.1.0 latest.json (was 3.1.1 hotfix for AppleSilicon, now sufficiently announced) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/99b250d214dec01295791b7bff6bb72b42cbe77b) __fix(a11y):__ 400% maximum font size / zoom (PR [#2966](https://github.com/edrlab/thorium-reader/pull/2966) Fixes [#2960](https://github.com/edrlab/thorium-reader/issues/2960))
* [(_)](https://github.com/edrlab/thorium-reader/commit/13da4eb7f6e66b415552c71ed5136b0b2a128701) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d368f3b482791fee97aa7b8e4ad0e2ab1c2c8eda) __fix(l10n):__ updated translations, Greek, Finnish, Portuguese-Portugal, Danish, Turkish, Swedish (PR [#2957](https://github.com/edrlab/thorium-reader/pull/2957))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5d022dbb4c27796ffa07bda08fbacb96793f78e5) __chore(dev):__ removed a couple of problematic console logs [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/282052cb237f8ae1a4272c092ce7c5a8f96c9b3c) __fix(pdf):__ fixes presentation mode & first/last page & pdf.js search wipe (build https://github.com/edrlab/pdf.js/commit/34b069f0427eded76091a65409d4536e6ba3fbde)
* [(_)](https://github.com/edrlab/thorium-reader/commit/a395f85d8efb1bc98766e1be837e38b674cad283) __fix(pdf):__ fixes pdf.js initialization (pdf.js build https://github.com/edrlab/pdf.js/commit/e798b148027fea37e04261e6d4d90b7ab9fdccba)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b9dd66964db4c55f479f86ed4633879f006c0f7d) __fix(reader):__ remove pdf search/annotation section and divina GoToPage section in readerMenu (Fixes [#2954](https://github.com/edrlab/thorium-reader/issues/2954))
* [(_)](https://github.com/edrlab/thorium-reader/commit/97e28f28b401d331a48b236e427f7ee5d60d2626) __fix(pdf):__ pdf.js migration to v5.2.133 https://github.com/edrlab/pdf.js/commit/166c3517f3185e00da196d3326298b3026ef4391
* [(_)](https://github.com/edrlab/thorium-reader/commit/020318f6dfdc70252db062ff5fb369f7626c9e97) __chore(dev):__ documented Electron https-like privileged custom protocol handlers [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/990332d1bdff178377009f226cb2ea4c82937147) __fix(opds):__ fixes regression with opdsPublication auto update when entryLink (self) are provided (Fixes [#2952](https://github.com/edrlab/thorium-reader/issues/2952))
* [(_)](https://github.com/edrlab/thorium-reader/commit/38e6f2c8f20c5167a0a7b3c93922e3a22842903f) __fix(a11y):__ fixes a11y crash with opds feed not implementing it, check if each array is defined
* [(_)](https://github.com/edrlab/thorium-reader/commit/d5c089cd1d2b165330584665e68a3e8ab4663185) __fix(l10n):__ Updated translations via Weblate, Finnish + Lithuanian + Greek (PR [#2930](https://github.com/edrlab/thorium-reader/pull/2930))
* [(_)](https://github.com/edrlab/thorium-reader/commit/bc931beca09c736c6d2e849a65174d4d7bf81a82) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/ebc38c4b18716cbd0b07e5dd09b65852461e636d) __fix(i18n):__ Accessibility metadata display, french and italian localisations (PR [#2950](https://github.com/edrlab/thorium-reader/pull/2950))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fb6c379a73fc10df40b26c89bfa2146084696c27) __chore(dev):__ Flox/Nix [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b9daf64d2e2f828e85ceef4bd7eaca25e4859a8) __fix(notes):__ note addUpdate sync action across same publicationIdentifier renderer
* [(_)](https://github.com/edrlab/thorium-reader/commit/912d21d4ec6d8ccbeb2ba7091b21a0d59da645bc) __fix(dev):__ remove shiftFromAnnotationImportQueue forgotten to be deleted from previous commit https://github.com/edrlab/thorium-reader/commit/5414c006089e5383000199c27af8bd80b87b0855
* [(_)](https://github.com/edrlab/thorium-reader/commit/5414c006089e5383000199c27af8bd80b87b0855) __fix(notes):__ import notes (PR [#2944](https://github.com/edrlab/thorium-reader/pull/2944))
* [(_)](https://github.com/edrlab/thorium-reader/commit/478f16520fe08de12fd676cce7c8f59925cb7ce0) __chore(dev):__ remove reduxState push to readerRegistry on readerClosing & improve readerState typing between main/renderer (PR [#2946](https://github.com/edrlab/thorium-reader/pull/2946) Fixes [#2947](https://github.com/edrlab/thorium-reader/issues/2947) Fixes [#1444](https://github.com/edrlab/thorium-reader/issues/1444) Fixes [#1762](https://github.com/edrlab/thorium-reader/issues/1762))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7d54223e388503c40df181920e54245647cfcda2) __fix:__ Mustache esModuleInterop / TypeScript types for default
* [(_)](https://github.com/edrlab/thorium-reader/commit/033a184389dfaed425abb4273afc73d26dfc3be1) __chore(dev):__ typed i18n update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/59c3ea7cf1d37defb62cce78aedbe024682f6628) __fix(PDF):__ increase cover image extraction timeout for low-performance hardware (Fixes [#2877](https://github.com/edrlab/thorium-reader/issues/2877))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3b84471c2e53dcfa46a808c29fe843bc79d2ee4e) __fix(a11y):__ `printPageNumbers` mapped to `pageBreakMarkers` (Fixes [#2942](https://github.com/edrlab/thorium-reader/issues/2942))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3ac971a39d00d4324332dbc21f48b84d671c8f90) __fix(css):__ allow user to select text in publicationInfo (Fixes 2943)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fe5dd0f2841fc971fabe2443cf297720b14566c7) __fix(notes):__ export notes from library window (PR [#2934](https://github.com/edrlab/thorium-reader/pull/2934) Fixes [#2924](https://github.com/edrlab/thorium-reader/issues/2924))
* [(_)](https://github.com/edrlab/thorium-reader/commit/bc4b304c5fed363977c6c3bb635a002ae0e5db49) __feat(a11y):__ spec implementation of the new a11y meta display guide for epub (PR [#2937](https://github.com/edrlab/thorium-reader/pull/2937) Fixes [#2536](https://github.com/edrlab/thorium-reader/issues/2536))
* [(_)](https://github.com/edrlab/thorium-reader/commit/00cc65a19f9e3801e2da312e569bd7e1f62e3b10) __fix(doc):__ NodeJS and NPM versions, NVM usage (Fixes [#2929](https://github.com/edrlab/thorium-reader/issues/2929)) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/355e1c96e3cdb0056e450c1595b45ce98112c150) __fix(css/notes):__ allow the user to select text from the notes list
* [(_)](https://github.com/edrlab/thorium-reader/commit/aac98a4cd975103dc620e662b20c4ff499e5e60b) __feat(note):__ textualValue compatible with gfm markdown format (PR [#2920](https://github.com/edrlab/thorium-reader/pull/2920))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d0009860ec031d1350474cd91b173a9e818aef60) __chore(i18n):__ run npm i18n-typed, typing keys missing from previous commit!?
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a22be8e6b884f178d4fe683afcf546a28de8eac) __fix(note):__ bookmarkEdit textArea defaultValue & set textArea cursor at the end
* [(_)](https://github.com/edrlab/thorium-reader/commit/89e23ae88d67b36445d286eada3fab2162cfef00) __fix(note):__ fixes export note UI (select/textAreaRef) follow up previous commit https://github.com/edrlab/thorium-reader/commit/7283056eeae353856fc00b3ea441fb93ef8057d0
* [(_)](https://github.com/edrlab/thorium-reader/commit/7283056eeae353856fc00b3ea441fb93ef8057d0) __feat(note):__ export to html with the mustache.js template (PR [#2928](https://github.com/edrlab/thorium-reader/pull/2928))
* [(_)](https://github.com/edrlab/thorium-reader/commit/db3365781aceb5f1bc6bca79b584019b440d1e40) __fix(note):__ annotation/bookmark filter "all"
* [(_)](https://github.com/edrlab/thorium-reader/commit/6839206314353aae2de43816ddf2b4af3ce0bad9) __fix(css):__ note export input text
* [(_)](https://github.com/edrlab/thorium-reader/commit/b2503ac39137d336f531ebddc0af3790d3c2b7e4) __fix(note):__ creator filtering crash, filter on creator name and not on the urn/uuid (Fixes [#2878](https://github.com/edrlab/thorium-reader/issues/2878))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2b38be95593da7225cfb0f999f3e78d03f75e01b) __fix(ci):__ GitHub Actions Windows runner woes (regression?)
* [(_)](https://github.com/edrlab/thorium-reader/commit/9d6ad8d56f8b8692ff0e3bd00591b33a3ebb764b) __chore(ci):__ electron builder regression with Linux config syntax, also node-gyp in Windows GitHub Actions runner
* [(_)](https://github.com/edrlab/thorium-reader/commit/37c5d16ba8a786daa7eb0114f78918ea2ad485f1) __fix(l10n):__ out of date typings, mutated JSON structure, regression bug from 86441682966b8e2a6fb52e2ec0b105acbfe0fcf1
* [(_)](https://github.com/edrlab/thorium-reader/commit/98d7b70ed03a6bc16ee1ef21d53af65135b68f5b) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/2f6cdea70e362e37bca89b2f70dcbce7ac376774) __chore(dev):__ Flox/Nix [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c3d1d51bf418769a7ecbaaa9318b71295a1fbee0) __fix(note):__ bookmark import/export (PR [#2919](https://github.com/edrlab/thorium-reader/pull/2919))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8719679e0442e434b6f40941bce7b8d58d043849) __fix(note):__ annotation/bookmark filter (PR [#2918](https://github.com/edrlab/thorium-reader/pull/2918))
* [(_)](https://github.com/edrlab/thorium-reader/commit/139f9bf81e68f7b02eb9d856d7c245d2f0ab17b7) __fix/refactor(note):__ bookmark/annotation merge to note (PR [#2916](https://github.com/edrlab/thorium-reader/pull/2916))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0dba9a826c097df183cb596d88364ed5ac765a53) __fix(l10n):__ Weblate git rebase dance resulted in merge conflict marker
* [(_)](https://github.com/edrlab/thorium-reader/commit/c517602132a12cfef473e81841613eb935fb4f77) Added translation using Weblate (Turkish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/723d08cc9a17f7514856184fcf2e8208f4eb2cd3) Translated using Weblate (Swedish)
* [(_)](https://github.com/edrlab/thorium-reader/commit/78b793560c32f00baa9a495943cdfe2d5e05f896) Translated using Weblate (Portuguese (Portugal))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea280e52faab0850a012b9b2b19ba0b76744662b) __fix(redux):__ force a payload object from the Action type & remove unused net action (PR [#2912](https://github.com/edrlab/thorium-reader/pull/2912))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fee6b1eb0c143bac1953b72084bee540cd4891cc) __fix(annotation):__ check readium/annotation `body` when undefined
* [(_)](https://github.com/edrlab/thorium-reader/commit/a343b35163fc78cdcc7051570f648e892ded5ff4) __Revert "feat:__ notification toast now contains link to publication in library (PR [#2884](https://github.com/edrlab/thorium-reader/pull/2884))"
* [(_)](https://github.com/edrlab/thorium-reader/commit/91f11c68c0eafa70999c0f2c951a8373190a9c61) __fix(l10n):__ updated translations Portuguese (Portugal) and Lithuanian via Hosted Weblate (PR [#2898](https://github.com/edrlab/thorium-reader/pull/2898))
* [(_)](https://github.com/edrlab/thorium-reader/commit/07182c58d4414022f7b4ac0040a38c3bec42cbf8) __fix:__ at rendering time, darken bookmark colours (default yellow bookmark indicator was near invisible in white margin), currently works fine in light and dark color themes...also updated NPM packages (added color manipulation lib)
* [(_)](https://github.com/edrlab/thorium-reader/commit/9ff5505a1c915474cf5257e95eacbb0060b5e529) __feat:__ notification toast now contains link to publication in library (PR [#2884](https://github.com/edrlab/thorium-reader/pull/2884))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cfd8f71dcc0e509f0f1e606b92da2bdc9516a6bc) __feat(bookmark):__ bookmark tags (PR [#2902](https://github.com/edrlab/thorium-reader/pull/2902))
* [(_)](https://github.com/edrlab/thorium-reader/commit/86441682966b8e2a6fb52e2ec0b105acbfe0fcf1) __fix(note):__ bookmark/annotation color feature and fixes (PR [#2894](https://github.com/edrlab/thorium-reader/pull/2894))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ffb19a6e29587245ed8f059d4f774b3ffbd65fb6) __chore(dev):__ removed obsolete tslint comments, now eslint (PR [#2889](https://github.com/edrlab/thorium-reader/pull/2889))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2e0b3614b2ba202f775ccc719da59522ddb55671) __fix:__ README updates, information about translation / localization (PR [#2897](https://github.com/edrlab/thorium-reader/pull/2897))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2e6195cb3181b44f8273a227234d7e4d94780a45) __fix:__ EPUB FXL fixed-layout page layout rendering performance, updated NPM packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/16ccce4da1e5d0f82486d7eb68b2ad8338caa2d7) __chore(dev):__ Flox/Nix updates [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8069ae9d3b6c52036304d79cb35bb0886428031e) __fix:__ strictNullChecks on bookmark.name which can be undefined
* [(_)](https://github.com/edrlab/thorium-reader/commit/b99321a028c143d8658c9a552beccba640af470a) __fix:__ hard crash when bookmark "name" (now based on text snippet before/after caret) is undefined, from previously-created bookmarks
* [(_)](https://github.com/edrlab/thorium-reader/commit/30371b1551ef7b117cc4d452ed2b20254a08952e) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/1d754188649d3087db3b7d19a8078047c91f9afb) __fix:__ bookmark and annotations UX harmonization, keyboard shortcuts and accessibility improved (PR [#2875](https://github.com/edrlab/thorium-reader/pull/2875) Fixes [#2869](https://github.com/edrlab/thorium-reader/issues/2869) Fixes [#2861](https://github.com/edrlab/thorium-reader/issues/2861))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5bdcae641572236dddce705dfa189a1429a6a18d) __fix(l10n):__ updated Tamil translation via Weblate (PR [#2876](https://github.com/edrlab/thorium-reader/pull/2876))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7e46b14c9777bc12f43da72db996326ce7a5b3c7) __fix(LCP):__ LSD network timeout, async loading spinner (PR [#2885](https://github.com/edrlab/thorium-reader/pull/2885) Fixes [#2841](https://github.com/edrlab/thorium-reader/issues/2841))
* [(_)](https://github.com/edrlab/thorium-reader/commit/342ff54d0f287b789e914f897ca62d1c0f7be3fb) __chore(NPM):__ package updates, navigator, highlights edge-case for cursor click on blank space on leading horizontal edge of CSS column, causing collapsed caret
* [(_)](https://github.com/edrlab/thorium-reader/commit/b65d79b1bb7f1ab5048ccbd474fba0d0dad9abdb) __fix(l10n):__ added Tamil ta.json
* [(_)](https://github.com/edrlab/thorium-reader/commit/e27e905da07f3b013ff3785862e00e675a4ef3f8) __fix(l10n):__ ta.json after i18n-check [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/29dd9960dd9241ae57759a49cd334e6507ce1983) __fix(l10n):__ re-adding ta.json from WebLate [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d28995f1e633e8a4170809d5f94831d0c96e7a06) __fix(l10n):__ attempting to fix the rebase error at WebLate caused by https://github.com/edrlab/thorium-reader/commit/ba3d7e0851dce3acb02c5d92eea7017c3bea9738 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a0934198c9fdbd93f8f33b3d6900c3d655915408) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/0249e4b1c4a1fa6371887348487869d56b132118) __fix:__ Electron Fuse for ASAR constraint (doesn't hurt to activate this one) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/99302f0d7bf74ab7e4dc51452f36ecdd63110b9b) __fix:__ command line arguments that are useful in development mode are disabled in production builds (app exit). This supplements Electron Fuses
* [(_)](https://github.com/edrlab/thorium-reader/commit/3cae8ca3fd333142e7775457c331a51e0a197ae8) __chore(release):__ latest.json version bump to v3.1.1 (v3.1.0 hotfix for MacOS Apple Silicon ARM64 M1/M2/M3/M4 users)
* [(_)](https://github.com/edrlab/thorium-reader/commit/1feda41283a7571f0a8988c6cd9df527fcd39cbd) __chore(release):__ latest.json version bump to v3.1.1 (v3.1.0 hotfix for MacOS Apple Silicon ARM64 M1/M2/M3/M4 users)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba3d7e0851dce3acb02c5d92eea7017c3bea9738) __(tag:__ v3.1.1) chore(l10n): push new keys to ta.json with `npm run i18n-check`
* [(_)](https://github.com/edrlab/thorium-reader/commit/23c039cd6e25b7d7ef29caf56d1c4a6f63db9c77) __fix:__ minor insignificant version bump in electron rebuild (unused scripts) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/448003afed153a1fc03ab55658414fb0788c29d0) __fix:__ updated NodeJS and NPM requirements (v22 and v11, respectively)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4e13e4c892b4ac1f0a10579ae2004438324e9cd5) __fix(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/c52b3101e93a31744960543cdad0eb8e375baf2b) __fix:__ Flox/Nix manifest update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d0dc7ad6c362723be0b71e7802aafbb46b24bb56) __fix(l10n):__ updated translations via Weblate, Lithuanian, Portuguese-Portugal, Portuguese-Brazil (PR [#2868](https://github.com/edrlab/thorium-reader/pull/2868))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a183f8f7bdfe71c78c8d7f32294ca9326f372136) __fix(bookmark):__ revert part of the previous commit  2069b17ccb559ba6d83c6011fca52012bc80f0e9 bookmark name can be an empty string, replace with an index number key to formally identify a bookmark with an id number
* [(_)](https://github.com/edrlab/thorium-reader/commit/66812ffa0af76dbc71b79b33552573213da7b3c4) __feat(bookmark):__ SHIFT-CTRL-B keyboard shortcut open a bookmark edit/save popover (PR [#2874](https://github.com/edrlab/thorium-reader/pull/2874) Fixes [#2859](https://github.com/edrlab/thorium-reader/issues/2859))
* [(_)](https://github.com/edrlab/thorium-reader/commit/87406020f9a2f94f594a42f635b376b6a63569f9) __hotfix:__ NPM package lock file was out of sync
* [(_)](https://github.com/edrlab/thorium-reader/commit/feef5e2b6bd85c694b72ded141f3d1b83254a392) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/208d55ced0a258bde56628c1d5317b55a102fa4e) __chore(NPM):__ package updates, r2-utils-js fake / virtual zip archive handling of subfolders (DAISY2.02 NCC.html non-zipped publication folder, for example)
* [(_)](https://github.com/edrlab/thorium-reader/commit/6307e4ab4406b2af8ece81a3b19af64f173386ac) __fix(bookmark):__ set an index on bookmark empty name during hydratation/migration of the reader bookmarks state follow up of the previous commit https://github.com/edrlab/thorium-reader/pull/2872#discussion_r1991653893
* [(_)](https://github.com/edrlab/thorium-reader/commit/6c378522b5ac60dcaddbac9d7b92ace1c090dc0b) __chore(NPM):__ package updates, notably navigator with critical edge case fixes related to Chromium bugs when rendering empty page breaks in CSS Columns at certain places, also fixed TTS sentence-level click-bound play start, also added CSS Selector/CFI/XPath caching, also fixed a subtle time-related debouncing bug when turning pages
* [(_)](https://github.com/edrlab/thorium-reader/commit/2069b17ccb559ba6d83c6011fca52012bc80f0e9) __fix(bookmark):__ auto-numbering and update the state of bookmarks as created/modified/creator keys and forces the presence of the bookmark name (PR [#2872](https://github.com/edrlab/thorium-reader/pull/2872) Fixes [#2860](https://github.com/edrlab/thorium-reader/issues/2860))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a53b91db88ce3ea8eb38482cd01245e65bd7d7a6) __fix(GUI):__ refactor and fixes of the reader dialog/dock settings/menu data state and keyboard focus handling (PR [#2871](https://github.com/edrlab/thorium-reader/pull/2871))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8f3f96002594f0a112fcfd783540ca9d1ea9df90) __hotfix:__ sorry, linting errors in previous commits
* [(_)](https://github.com/edrlab/thorium-reader/commit/a9968639629f2f519d1d799f4792d7bcc700a819) __fix(NPM):__ package updates, notably navigator which fixes EPUB3 Media Overlays playback of precorded audio clips with implicit natural stream ending, also fixed edge case of HTML documents that start with markup that doesn't participate in SMIL synchronization (seek ahead algorithm)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b647b2acf5e65fc4c57b05584ac32456623b305) __fix:__ disable bookmarks and annotations creation during TTS and EPUB3 Media Overlays playback, as both hide annotations which conflicts with highlights creation which forces drawing
* [(_)](https://github.com/edrlab/thorium-reader/commit/b236eff1b6595c8cb2613467ae63d62c76ea4079) __fix(l10n):__ updated Dutch translation via Weblate, also new Tamil empty placeholder (PR [#2862](https://github.com/edrlab/thorium-reader/pull/2862))
* [(_)](https://github.com/edrlab/thorium-reader/commit/315e019803ae63790b4d78693c7c6e7fa02aef42) __hotfix:__ linting error prevented automated build
* [(_)](https://github.com/edrlab/thorium-reader/commit/3c60a89a47066791914967cf7a26b6eebaf8df37) __feat:__ GUI control checkbox for "ignore EPUB Media Overlays and read with TTS instead", added French and English translations (Fixes [#2845](https://github.com/edrlab/thorium-reader/issues/2845) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/312aa1ec8c1ae394970e7411d5892980fa2a5833) __fix:__ bug in highlight engine's floating popup logic, added arrows, and anchoring on inline geometry when hovering on margin indicators
* [(_)](https://github.com/edrlab/thorium-reader/commit/e9ea73b9eeaf67768ccf7491681cb7dac8a62ffc) __feat:__ highlights for annotations and bookmarks now provide floating popup text info on mouse hover
* [(_)](https://github.com/edrlab/thorium-reader/commit/03546e619e76b646df4c4940ff9a56baeedcf555) __chore(Flox):__ Updated Nix package lockfile [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6f1018ed4392829da6974f01d7842894c6d5d47c) __fix:__ ARIA hidden on highlights div at the bottom of HTML body (publication documents), and centered scrolling TTS utterance with minimal jittering
* [(_)](https://github.com/edrlab/thorium-reader/commit/c5af766e4aebb8ee2332aef0cc496ea20a56db79) __fix(l10n):__ updated Spanish translation (PR [#2855](https://github.com/edrlab/thorium-reader/pull/2855))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9269d27307b16e729aaaa4c741b6240ab27e3389) __fix(l10n):__ updated Japanese translated via Weblate (PR [#2854](https://github.com/edrlab/thorium-reader/pull/2854))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3d2d1854ed6c386a1d3baf47e21f1e52de95f9d2) __feat:__ bookmark margin indicators / highlights (PR [#2857](https://github.com/edrlab/thorium-reader/pull/2857))
* [(_)](https://github.com/edrlab/thorium-reader/commit/55d17d998f2eecfe2439ddfa4067a92f046d3c3c) __fix:__ annotations highlights and search results, hiding annotations was also hiding search hits
* [(_)](https://github.com/edrlab/thorium-reader/commit/3fadff4c43ed7336f910b0f30cd3bfc7f80ffe69) __fix:__ EPUB3 Media Overlays playback hides annotations, and restores when stopped (margin or inline, whichever was active). Same as TTS (parity feature)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b03d7c3b40393cc3f1d584538a74d70bb946152c) __chore(clean):__ remove unused reader picker state redux
* [(_)](https://github.com/edrlab/thorium-reader/commit/e5183541eceeceec26e1dcf93b4dd69b153750f8) __fix(NPM):__ navigator package update, RTL Arabic/Hebrew/etc. CSS column pagination TTS readaloud with paragraph spanning across page boundary (previous column to the right) hit-testing mouse click allowing for partial visibility
* [(_)](https://github.com/edrlab/thorium-reader/commit/3cc5fb212b80424ef93a8fda404ce20f085a8cbe) __fix(NPM):__ package updates, notably navigator with addressed TTS readaloud edge-cases when paragraphs span across page boundaries (with or without sentence split), word-level highlighting used to restore fine-grain focus. Also fixed bookmark visibility calculations in scroll mode (same-locator but different scroll offset)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8397f31799e298227d1667384c45d572d9955f19) __fix:__ isLocatorVisible is async/await (returns a Promise), this is the fallback error case which should never occur, but still a coding error
* [(_)](https://github.com/edrlab/thorium-reader/commit/78c5dba4ba6f425b6f647b468c4e142000c7b0da) __fix(l10n):__ updated translations via Weblate, Finnish and Portuguese-Portugal (PR [#2853](https://github.com/edrlab/thorium-reader/pull/2853))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5aba21618578c7d0c197bf501c4791c0d72d4e1c) __fix(GUI):__ TTS configuration panel responsive layout for narrow reader window (PR [#2851](https://github.com/edrlab/thorium-reader/pull/2851))
* [(_)](https://github.com/edrlab/thorium-reader/commit/190273f8b2df609a2c5f433e777ca0acb0f77893) __fix:__ bookmark toggle button GUI affordance now with proactive feedback (hover not required), fixed add/remove logic based on current location, improved locator visibility detection (PR [#2848](https://github.com/edrlab/thorium-reader/pull/2848))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ca3b8cba87f73de24524899cfc581b83dd446434) __chore(NPM):__ some fixes from package r2-navigator-js (Japanese Vertical Writing Mode / Right To Left scroll-to-sync-reading-location, and event concurrency in ping+pong IPC comms)
* [(_)](https://github.com/edrlab/thorium-reader/commit/a35e69e252f8d2e63b8d65fddfc89273291ab4c9) __fix(l10n):__ updated French translation via Weblate (PR [#2852](https://github.com/edrlab/thorium-reader/pull/2852))
* [(_)](https://github.com/edrlab/thorium-reader/commit/26dc72ec0953268b9062e623345f98f20405b1f8) __fix(l10n):__ updated translations via Weblate, German, Japanese, Lithuanian, Portuguese-Portugal (PR [#2850](https://github.com/edrlab/thorium-reader/pull/2850))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0a2b749a3a873266359c2c5d53e8e037f3c36fe8) __fix(a11y):__ screen reader ARIA hidden on unnecessary HTML elements (color and highlight type pickers)
* [(_)](https://github.com/edrlab/thorium-reader/commit/d94a51e5b77ed1d8f8d34601ecf9d120ebcc41d1) __fix(l10n):__ updated translations via Weblate, Portuguese (Portugal), Lithuanian, Japanese (PR [#2838](https://github.com/edrlab/thorium-reader/pull/2838))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c625d2af932f82865149405c027a1c141c2c41a) __fix:__ TTS highlights incorrect key names (typos), added missing combos
* [(_)](https://github.com/edrlab/thorium-reader/commit/1c8a5032d4358b9e5e752cd395934d06946ed38d) __fix(l10n):__ translated the TTS highlight styles (English only, ready for Weblate)
* [(_)](https://github.com/edrlab/thorium-reader/commit/01527fadd3d424a40aa6a16d8210e559e87c565c) __chore(NPM):__ package updates, notably r2-navigator-js with edge-case EPUB FXL SVG rendering bug
* [(_)](https://github.com/edrlab/thorium-reader/commit/a572f0dab980591ad1a2f0946349600b38c0c68c) __fix(lint):__ sorry, last commit
* [(_)](https://github.com/edrlab/thorium-reader/commit/1f1442d3577519395f68b7dddad8faf94fd8bc85) __fix:__ GUI bottom progression bar was not handling great numbers of spine items, now minimum mouse cursor hit size (width) required (Fixes [#2673](https://github.com/edrlab/thorium-reader/issues/2673) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/840b1473ccc9570e9b346f453aa87c8e7b5715e2) __fix:__ revert parts of https://github.com/edrlab/thorium-reader/commit/7d9fe2471789a36528401d1c74d4f7483272018a#r153279093
* [(_)](https://github.com/edrlab/thorium-reader/commit/7d9fe2471789a36528401d1c74d4f7483272018a) __chore(clean):__ Reader mapStateToProps remove unused state computation
* [(_)](https://github.com/edrlab/thorium-reader/commit/c760f7d73cb472dc47620622afbf1b3f87b7d1c9) __fix(bookmark):__ avoid too many call of `boomkarkIsVisible` function from the Reader DidUpdate method, only ref was checked not the value
* [(_)](https://github.com/edrlab/thorium-reader/commit/2dac67eb25f9fd3b8904131c4c50ac4caf17124c) __fix:__ audiobook reader had playback toolbar active (Fixes [#2843](https://github.com/edrlab/thorium-reader/issues/2843) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b1b353f48f8b6d871f69722016f8279e7963bd6) __chore(clean):__ remove Thorium:DialogClose window event
* [(_)](https://github.com/edrlab/thorium-reader/commit/60e2e4574a02d1b8132ce55bd6831297c30b6dba) __fix(TTS):__ refactor TTS pause resume  to avoid STOP event
* [(_)](https://github.com/edrlab/thorium-reader/commit/9663ebcd76364cb98e96cf998a13ad54371fc96b) __fix:__ improve fixing TTS and GUI TTS Popover Follow fixes on fd9555ca03ac0013110ca085362b5aaf0539775b (Fixes [#2389](https://github.com/edrlab/thorium-reader/issues/2389))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e7afdd32c18f6d3abc1a17473cb86e8d0a2571c2) __fix:__ crash with PDF and Divina due to ttsVoices() navigator call (Fixes [#2842](https://github.com/edrlab/thorium-reader/issues/2842) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd9555ca03ac0013110ca085362b5aaf0539775b) __fix(TTS):__ GUI flicker in configuration popup panel due to STOP event (Fixes [#2839](https://github.com/edrlab/thorium-reader/issues/2839) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0bdc78324f60e5f09f212217a9342e5a25422386) __chore:__ Electron rebuild v35 [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/3c9dd8d3ae0e93f701a701a712a83a5d8f119684) __chore(NPM):__ package updates, notably Electron 35 (Chromium 134, NodeJS 22)
* [(_)](https://github.com/edrlab/thorium-reader/commit/21cb07989cccb01fbaa53f0c3c0f52f1f16d1e1e) __fix(TTS):__ TTS voice selection with multiple preferences and persistence / GUI refactor (Fixes [#2811](https://github.com/edrlab/thorium-reader/issues/2811) PR [#2823](https://github.com/edrlab/thorium-reader/pull/2823))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7493aedffbc8d1659cc5abc372e508e7b3e2a7c7) __fix(a11y):__ bookmark and annotation navigation button was incorrectly labelled for screen readers (Fixes [#2829](https://github.com/edrlab/thorium-reader/issues/2829) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/165854bc97c0657278a4d98a2a25bb5cdbf75910) __feat:__ EPUB3 Media Overlays (and DAISY2.02 DAISY3.0) synchronised text-audio talking books now fallback on TTS when pre-recorded audio clips are not present in SMIL par pairs (only text reference). Can be full SMIL-TTS book, or partial interspersed / mixed TTS / audio-clips.
* [(_)](https://github.com/edrlab/thorium-reader/commit/b8a109b1870bb210ce2eb7bf8a75d6495532c376) __fix(l10n):__ French for "reduce motion" was referring to "speed" instead of "animation" [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/fc43fca4c4b17042528a31a29e89961c5c3f8599) __fix(l10n):__ "disable footnotes" is incorrect, this is "disable popup footnotes" (corrected French and English)
* [(_)](https://github.com/edrlab/thorium-reader/commit/bb645641541807d9934764f5c25bacb230966ffc) __fix(l10n):__ enable Arabic language (needs testing), also added Czech to doc (PR [#2827](https://github.com/edrlab/thorium-reader/pull/2827))
* [(_)](https://github.com/edrlab/thorium-reader/commit/671c2b47256a913fca263e8bf8b8f6d4019edb57) __fix(a11y):__ keyboard focus handling inside HTML documents, screen reader detection to avoid interfering during scroll repositioning, also avoiding element focus during selection change. NPM package updates (r2-navigator-js provides the actual fixes)
* [(_)](https://github.com/edrlab/thorium-reader/commit/ddc355bd7e1b384294356eb1e940ce14f93eb46a) __fix(CI):__ GitHub Actions Windows Intel and ARM builders, Microsoft Visual Studio MSVC new version in path
* [(_)](https://github.com/edrlab/thorium-reader/commit/8068d86f6943406a49ca7263c23d7575b1f9a5e1) __fix(a11y):__ left/right arrow hot key binding to "page turn" interferes potentially with current reading location during screen reader usage
* [(_)](https://github.com/edrlab/thorium-reader/commit/d6138dd06727233d49f16ae39cb578bbb0d38f7c) __fix(a11y):__ skip link in reader window is equivalent to FocusMainDeep CTRL F10 with SHIFT
* [(_)](https://github.com/edrlab/thorium-reader/commit/7659b46cd3c136a06d8d0eda36ef3e4f432b114f) __fix:__ TTS Japanese Ruby handling, baseline text DOMRange-rendered but not spoken, unless Ruby is hidden/disabled. Also increased underline gap hoping to eliminate rendering artefacts in Windows (Fixes [#2818](https://github.com/edrlab/thorium-reader/issues/2818) Fixes [#2820](https://github.com/edrlab/thorium-reader/issues/2820) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/512aa625842e2c09ea2cb5af5dc02756152e8525) __fix:__ DAISY3 DTBOOK parser was choking on 60,000 lines / 8MB frontmatter (Fixes [#2814](https://github.com/edrlab/thorium-reader/issues/2814) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b7b8b1eeaa434cfdf6fbccd496ae979747eaa5c) __fix(l10n):__ i18next maintenance scripts, cleanup JSON locales (check, scan, sort, typed)
* [(_)](https://github.com/edrlab/thorium-reader/commit/1519ba4b34586bf4a41bf840cb9a9a5aae4691cf) __fix(l10n):__ Czech language enabling
* [(_)](https://github.com/edrlab/thorium-reader/commit/239eec06d3bda8c6f560c41ed78f29860a21c73d) __fix(l10n):__ added Czech translations via Weblate (PR [#2822](https://github.com/edrlab/thorium-reader/pull/2822))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e8eb6cc0015091422d69fa507ef172d16296a67f) __fix:__ LCP PDF import workaround for servers that respond with HTTP header content-disposition for PDF filename instead of LCPDF
* [(_)](https://github.com/edrlab/thorium-reader/commit/26cbe130919c8c09d390a993190baeeb5a80253d) __fix:__ Windows publication export filename cannot contain : colon, slugify was leaving it in, MacOS file saver was automatically replacing with slash (the path separator, funnily enough)
* [(_)](https://github.com/edrlab/thorium-reader/commit/fdbb61ded55b6f67fdfcd84d4f20bcf146832645) __fix:__ EPUB extensions .epub and .epub3 now have .pnld (trial)
* [(_)](https://github.com/edrlab/thorium-reader/commit/443f7fb8dd8c6f5da7bf437f9e346fbd44b8998b) __fix(annotation):__ import/export annotation color reserved to a set of colors name as spec required it (Fixes [#2806](https://github.com/edrlab/thorium-reader/issues/2806))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a088715c838969b9c04ea6db3178090799ab945d) __fix(a11):__ automatically disable pagination (CSS columns in reflowable documents) when screen reader is detected (Fixes [#2821](https://github.com/edrlab/thorium-reader/issues/2821))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3d0f97cf9cc2c8c59e068a08fd65019c815403dd) __fix(l10n):__ updated Japanese and Portuguese-Portugal translations via Weblate (PR [#2805](https://github.com/edrlab/thorium-reader/pull/2805))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d7c934da2b50e2e3344c16c3182b7b011f1ea06b) __feat:__ TTS highlight styles configurator (test implementation, not final), updated NPM packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/b437d349cfa926edfa6f0d3258c33e40be995fff) __fix:__ AccessibleDfA typeface (dyslexic) and updated NPM packages, notably navigator with font-size / zoom fix (ReadiumCSS v2) (Fixes [#2747](https://github.com/edrlab/thorium-reader/issues/2747) Fixes [#2815](https://github.com/edrlab/thorium-reader/issues/2815))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e6a1dd732bf6bf08a40bf67ba7481ada13388bbe) __feat:__ TTS highlight style user configuration (GUI for beta testing only, not production-ready) (PR [#2816](https://github.com/edrlab/thorium-reader/pull/2816))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c03487f6b87c5102232fb41860e3f46f933a619c) __feat:__ image zoom/pan GUI, was in navigator, now in Thorium ... styling and l10n needs fixing, this is initial implementation (PR [#2786](https://github.com/edrlab/thorium-reader/pull/2786))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ec81d73a965e458f6ba02dca09397958d08d85ea) __fix:__ annotations initial display after force-show when user creates
* [(_)](https://github.com/edrlab/thorium-reader/commit/62138d1da98360ac53f87b501cf968365d784920) __fix(annotations):__ when highlights are hidden (not even in margin), and the user selects text + creates annotation, nothing is displayed which causes confusion and multiple user attempts to create (duplicates). This forces the display of annotations when the user ccreates.
* [(_)](https://github.com/edrlab/thorium-reader/commit/52b04e0a528491c158f7ccd2b4117c8aaca02cda) __fix(TTS):__ race condition during play, click, auto forward progression, switch document backwards/forwards, and natural document/publication end (handles annotations hide/restore, continues to ignore hyperlink clicks during active readaloud, until stopped by user or automatically by TTS engine)
* [(_)](https://github.com/edrlab/thorium-reader/commit/a690e86720cca5a99f319a3388d21c0824e031b9) __fix(TTS):__ on last spine item natural play ending (publication finish), turn off TTS "play on click" behaviour, also: hide annotations while playing, restore after stop
* [(_)](https://github.com/edrlab/thorium-reader/commit/15d52b083aa0b1aade7d55a9e4c1359c5c8395d8) __fix:__ Arabic and other Right-To-Left metadata author/publisher/contributor (PR [#2809](https://github.com/edrlab/thorium-reader/pull/2809) Fixes [#2491](https://github.com/edrlab/thorium-reader/issues/2491))
* [(_)](https://github.com/edrlab/thorium-reader/commit/2d9db2cf1ab601539d211269362974f5217d9cb6) __fix:__ Arabic and other Right To Left metadata accessibility summary in publication info dialog (Fixes [#2491](https://github.com/edrlab/thorium-reader/issues/2491))
* [(_)](https://github.com/edrlab/thorium-reader/commit/46ac9231e6d283dc0fa35683285602cb15a719b2) __fix:__ annotation named colours (removed 2 blue hues, kept translated "cyan"), now need to handle import/export (Issue [#2806](https://github.com/edrlab/thorium-reader/issues/2806) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/8acc43e543f804ff1c33b051a46baddf451ce0f3) __fix:__ keyboard shortcuts for fixed-layout zoom in/out/reset were not working in "zen mode" (Fixes [#2803](https://github.com/edrlab/thorium-reader/issues/2803) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/366b5b90f838bd4d4598612b8689efd1c7908e37) __chore(release):__ latest.json version bump [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2869ef2678fc003ee03bba4d34f926e94cca2982) __fix(l10n):__ updated translations via Weblate, Greek, Italian, Portuguese-Portugal (PR [#2802](https://github.com/edrlab/thorium-reader/pull/2802))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7fc2d6da194d10a1123eb5ca0345f4bcca0cef0c) __fix:__ Fixed Layout EPUB zoom (Fixes [#2803](https://github.com/edrlab/thorium-reader/issues/2803))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fd4854bcb14e0691592deb64c7457c842030eeb1) __chore(release):__ oops, src/package.json needs version-bumping too!
* [(_)](https://github.com/edrlab/thorium-reader/commit/b9689ab8395a5f3c30cc6f8011ba3f7df3a2a9c7) __chore(release):__ version bump 3.2.0-alpha.1 for CI builds, latest.json to 3.1.0 for production release
* [(_)](https://github.com/edrlab/thorium-reader/commit/b55169d1a420ed31bd2888aa86af0f12d6f8df06) Merge branch 'develop'
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b7c10f4cfcfdf0efb6a3459131a1140534bb8b3) Merge branch 'develop'
* [(_)](https://github.com/edrlab/thorium-reader/commit/96872d9187ddeede31fd19232a78cae3420bf32f) __hotfix(merge):__ removed duplicate fields
* [(_)](https://github.com/edrlab/thorium-reader/commit/8babec5ece8f12565ef542d3b2208056a7452498) Merge branch 'develop'
* [(_)](https://github.com/edrlab/thorium-reader/commit/e828405e8d80e5e19e083c50da0d1a08c346bf17) __(tag:__ v2.4.2, origin/v2.4.2_hotfix, v2.4.2_hotfix) chore(NPM): package updates, Electron30 major update

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v3.1.0...v3.2.1 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
