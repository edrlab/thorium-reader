# Thorium Reader v3.3.0

## Summary

Version `3.3.0` was released on **09 December 2025**.

____
____

THIS RELEASE FIXES A CRITICAL SECURITY BUG. There is no known exploit in the wild, but the risk does exist and must be taken seriously. It is therefore extremely recommended to update Thorium Desktop reader and to stop using previous releases. The bugfix will not be "backported" to earlier versions.

This is a high-severity vulnerability in the sense that a successful attack would require no user interaction other than opening and reading an EPUB file containing malicious Javascript (for example by double-clicking on the EPUB from the file explorer, or by clicking on a web link associated with Thorium Desktop reader). If such hypothetical attack occured, it would likely be silent and hard to detect.

The security hole would allow malicious Javascript to escape the web browser sandbox and to run programs on the victim's computer. This type of attack is known as RCE "Remote Code Execution", which could potentially result in personal information being exfiltrated, backdoors being installed, files being deleted, etc.

The security hole was first discovered by Thorium Desktop developers, immediately followed by a wider audit of the potential attack surface across the application's software stack. This led to further security fixes listed in the itemized changelog below.

The vulnerability was also reported by security researchers who provided an example script to demonstrate the method. This will be documented and the reporters will be credited for their input. A detailed technical report will be published and kept up-to-date directly in the source code repository. Maintainers of Thorium Desktop forks will be strongly encouraged to integrate fixes in their own codebase.

Note that when EPUB publications are distributed by trusted publishers, it is unlikely that users might fall victims of such malicious EPUBs / Javascript. However, many e-books are distributed via alternative channels that could be targeted by ill-intentioned actors to exploit the vulnerabilities present in older Thorium Desktop releases. For this reason, it is strongly recommended to update the application.

____
____

This release includes the following (notable) new features, improvements and bug fixes:

* Upgraded to Electron v38
* Updated translations
* New feature: "customization profiles". This offers an alternative to forking the Thorium Desktop codebase, via a plugin mechanism that declaratively expresses modifications to "vanilla" Thorium Desktop reader (color themes, bundled publications and feeds, application logo, etc.).
* Fix: more performant filesystem persistence of "notes" (annotations and bookmarks) via a dedicated SQLite database, backward compatibility with the JSON format of older versions of the application (this currently causes a delay when the software closes, but this will be fixed in a near-future revision)
* Fix: improved integration of OPDS with the local bookshelf, ability to navigate to the downloaded publication.
* Fix: HTML tables that are constrained by the viewport height now take into account the zoom / font size.
* Fix: pages.xml pagemap support, handling of encrypted resources (does not crash XML parser anymore)
* Fix: page list GUI was crashing because of missing link title (page break name).
* Fix(internationalization): locale-dependent date display.
* Fix(OPDS): filter buy/borrow/subscribe links based on supported content type.
* Fix(OPDS): authentication NONCE and ID handled identically, i.e. both present triggers the match check, any missing means that the check is skipped.
* Fix(PDF): persistent user configuration for zoom level, layout, etc.
* Feature(PDF): 2-page spread with even/odd user-configurable option.
* Feature(TTS): faster speech rates are now available.
* Fix(LCP): persisted hashed passphrase was not resolved correctly when importing from OPDS feeds due to lack of license provider information. Also fixed asynchronous filesystem input/output which was causing race conditions.
* Fix(TTS): readaloud voice selection was broken when no language was specified in the HTML markup.
* Fix(filesystem): cross-platform file naming rules / filename sanitization, was slugification which is for URLs and eliminates useful information (affects OPDS temporary file download, annotations and bookmarks notes export, publication save-as).
* Fix(notes): annotations and bookmark import/export, handling of CSSSelector and ProgressionSelector.
* Fix(OPDS): improved user interface, better catalog navigation experience.
* Feature(OPDS): added login/logout button in catalog entries.
* Fix(accessibility): screen reader detection was resulting in false positives because of keyboard utility apps (for example) so now assisitive technology continues to be automatically detected but users must explicitely activate support in global application settings.
* Fix(regression): password-protected PDF files are now supported again (Mozilla PDF.js integration).
* Fix(supply chain security): NPM packages now checked via Socket Firewall more regularly to verify direct and transitive dependencies. Also disabled package.json NPM install pre/post scripts execution to protect developer environments.
* Fix(security): Electron Fuses cookie encrypt-on-write (Chromium store) and ASAR integrity check (Windows and Mac, no Linux support)
* Fix(security): stricter permissions for notifications, clipboard, fullscreen, etc. in HTML webview renderer.
* Fix(security): HTTP requests safeguard fence with isURL utility which explicitly prevents non-HTTP(S) links.
* Fix(security): some type of hyperlink activation was causing the external web browser to open (keyboard modifiers).
* Fix(security): stricter Electron webview partionning to manage individual browsing sessions.
* Fix(security): disabled Javascript entirely in PDF files (Mozilla PDF.js integration).
* Fix(security): additional downstream safeguards to prevent filesystem access above root folder for protocol handlers of ReadiumCSS and PDF.js (URL syntax is already implicitly normalised upstream to prevent ../../ backpaths, but better include some explicit redundancy)
* Fix(security): serve publication UUID to webview instead of base64-encoded filesystem path in order to avoid leaking user home folder name in scripted contexts such as EPUB HTML documents (window.location).
* Fix(security): more secure extraction of PDF cover images, via an Electron sandboxed webview and a context-isolated preload script.
* Fix(security): OPDS feed authentication now defaults to the user's installed web browser instead of the internal webview (which remains available as a less-secure alternative fallback authentication flow, just in case operating-system integration of OPDS callback URL from external web browser into Thorium Desktop does not work as intended).
* Fix(security): added redundant safeguards for Electron `shell.openExternal()` in application code, to prevent injection of unwanted behaviour from third-party content (e.g. publication metadata).

(previous [v3.2.2 changelog](./CHANGELOG-v3.2.2.md))

## Full Change Log

Git commit diff since `3.2.2`:
https://github.com/edrlab/thorium-reader/compare/v3.2.2...v3.3.0

=> **186** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/d16d5f0ec0ce41cdb4c271a866efed4e1c6e3b79) __fix(lint):__ minor code formatting issue [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c48bf9d820aadda46e41a7c0ba1c5dd31cd218f5) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/ed583f078238c03772b0bcdff4369eb8475677c9) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/a032fa9418210e39facf3c2d35e81486a02553d0) __chore(dev):__ Flox/Nix update (enforce no-script NPM install) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/94a635be764ad43294afa6968b97db2f3fb6da55) __fix(l10n):__ updated Greek Translation via Weblate (PR [#3307](https://github.com/edrlab/thorium-reader/pull/3307))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d2c246f0096e9f0ff6451b628b6562282bc666d3) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/b042690899671f029e48387255f00374fb919b14) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6520cbc6a995a2329f87f3667cf291d532a240d0) __fix(customization):__ alpha sort of provisioned profiles list in Settings.tsx & publish a test production signed profile for test purpose before release
* [(_)](https://github.com/edrlab/thorium-reader/commit/61db1f44f582057f2fa61f561570a70344c4fcc4) __fix(customization):__ migrate from semVer to date-time versionning (PR [#3301](https://github.com/edrlab/thorium-reader/pull/3301))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9189758ca8881ac05ff18c9b4bc019df619aebd9) __chore(dev):__ Flox/Nix [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2cd91238ef51f04e433a08e8a60d693700b92828) __fix(customization):__ change to a minimal profile validation schema (not generation validation only for the runtime validation) & fixes title/description (string|IStringMap) type (PR [#3289](https://github.com/edrlab/thorium-reader/pull/3289))
* [(_)](https://github.com/edrlab/thorium-reader/commit/72c51e2462bd87ffab6d8a9516eea79325164daf) __fix(css):__ set login label text clipping in opds html login template
* [(_)](https://github.com/edrlab/thorium-reader/commit/9233750db2e3c0b6f51d8d45bf8ea6abc8ddf229) __chore(dev):__ minor comment regarding NPM install [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/3aa1e1d845f72591469b5bcd5c0013f6b2e1ed7a) __fix:__ HTML tables that are constrained by the viewport height now take into account the zoom / font size (Fixes [#3165](https://github.com/edrlab/thorium-reader/issues/3165) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/2e0d5087d75fe5c34e9aa3c265258fa229c560b3) __chore(npm):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/8a18b8cd8ac3f0e5bacc74fd9b6f4aabe996380f) __fix(l10n):__ French typo (PR [#3295](https://github.com/edrlab/thorium-reader/pull/3295)) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/ad2a5132509327111f3ffeabf0b36340966f7b8b) __fix(l10n):__ French mot-clef => mot-clé (PR [#3296](https://github.com/edrlab/thorium-reader/pull/3296)) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9b6fb179fae98fbbc928f587ff31384a8931bcae) __fix(l10n):__ updated translations via Weblate, Finnish - Portuguese (Portugal) - Swedish - Turkish (PR [#3275](https://github.com/edrlab/thorium-reader/pull/3275))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6c86040fe06dc0c517482ccd7709202b044ff942) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/63fc4b62ab9c32229beb70c9794a208d3900b4b7) __chore(dev):__ Flox/Nix env lockfile (no significant change) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/cd66498924d8022c3b5b4f27590904664ece809c) __chore(NPM):__ package updates, this time with --ignore-scripts and selective Electron postinstall [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c245ff0c78c6dd4e6f9779c83ebcc850bef69b1a) __chore(dev):__ NPM ignore-scripts for the Socket Firewall install [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/0a782a90e443bb8ae3ffb3039717176b9392a6d1) __chore(NPM:__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/191b32f8a91d88f0b7a3273aaf898644c0088e37) __chore(dev):__ Flox/Nix updates [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6c3cb4b966848b9ac016102658ce317616e12569) __fix(customization):__ improve profile packaging command line build chain (PR [#3280](https://github.com/edrlab/thorium-reader/pull/3280))
* [(_)](https://github.com/edrlab/thorium-reader/commit/177fd671cad322c7905286e107c3ed070efca9fa) __fix(customization):__ remove on error or older profiles at startup and refactor latest profile previsioning (PR [#3278](https://github.com/edrlab/thorium-reader/pull/3278))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f949dd027d6a91ac42d82805e58526e1f46ba4ba) __fix(saga):__ explicitly set eventChannel buffer size
* [(_)](https://github.com/edrlab/thorium-reader/commit/fdefbbf473f491da80fef9af11fd78fc8745d6d1) __fix(customization):__ profile update polling & review downloadProfile async logic (PR [#3277](https://github.com/edrlab/thorium-reader/pull/3277) Fixes [#3157](https://github.com/edrlab/thorium-reader/issues/3157))
* [(_)](https://github.com/edrlab/thorium-reader/commit/87b9631df5814cec9849cc0e34608992902950b3) __chore(NPM):__ package updates, notably Electron 38.5.0 which improves accessibility support detection (assistive technology hooks and screen readers)
* [(_)](https://github.com/edrlab/thorium-reader/commit/bcd1695f931ed04976efaba2687cf83f22a626ed) fixes
* [(_)](https://github.com/edrlab/thorium-reader/commit/986089c9e0f26f6d55c28ab91ec2b80691802ee0) __chore(NPM):__ package updates, notably the r2-shared dependency with pages.xml pagemap fix (improved handling of encrypted resources, does not crash XML parser anymore)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e761f153fcecd78d0c3fd5de0f6fafb90fe2baec) __fix(GUI):__ page list crash because of missing link title (page break name)
* [(_)](https://github.com/edrlab/thorium-reader/commit/45e89375214b4f73b7831dbff3b2e20dcdb6af69) __chore(dev):__ node_modules external NPM package dependencies in DEV mode (WebPack partial bundling, DevServer optimization) see https://github.com/edrlab/thorium-reader/commit/e50896f3d40e4f5fd4c19c4a5eb5aa1de7bd33c4 and https://github.com/edrlab/thorium-reader/commit/0206425d2053187ac6d0ae833243e26afbc8b88c#r168905089
* [(_)](https://github.com/edrlab/thorium-reader/commit/5a58064ba1cf1a7f032dcc1f1a85226faf1949da) __chore(dev):__ disabled TypeScript compiler ignore instructions as these now pass both the TS and Go compiler [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c0c0bc59ab17b2742dca74d3525d3c6235b7fe97) __fix:__ application crash after importing bookmark on a non-opened publication, then open the epub
* [(_)](https://github.com/edrlab/thorium-reader/commit/0206425d2053187ac6d0ae833243e26afbc8b88c) __fix(dev):__ strange regression with "color" NPM package, CommonJS vs. ECMAScript module, node_module externals
* [(_)](https://github.com/edrlab/thorium-reader/commit/3e09b47f638570b38d3189b215815a93c2dafbb4) __fix:__ typo in previously-merged PR, breaking cookiejar etc. app launch hydration
* [(_)](https://github.com/edrlab/thorium-reader/commit/66ca7ed42c6701007980c75292498aa81aa9b38d) __chore(NPM):__ major package update React Hooks ESLINT plugin (works without changes in legacy config with ESLINT v8, Thorium not on flat config / ESLINT v9 yet)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b50757d35ecccd490ebf3a6ca0be4919d58d595e) __chore(NPM):__ package updates [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/b577196b46201bab2495741b2f8b19dee83c13f9) __fix(l10n):__ updated translations via Weblate - Lithuanian, Russian (PR [#3274](https://github.com/edrlab/thorium-reader/pull/3274))
* [(_)](https://github.com/edrlab/thorium-reader/commit/90fb9014da678d18b67b037503be2be80707a5b3) __fix(LCP):__ OPDS publication feed with passphrase hash now stored with provider mapping (not just pub doc id), also fixes async filesystem read/write concurrency (PR [#3271](https://github.com/edrlab/thorium-reader/pull/3271) Fixes [#3249](https://github.com/edrlab/thorium-reader/issues/3249) Fixes [#3132](https://github.com/edrlab/thorium-reader/issues/3132) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/59af947a3884447d585dcced319a8ac5ab767214) __chore(dev):__ add action-validator dev package to validate github action CI
* [(_)](https://github.com/edrlab/thorium-reader/commit/3558d1a50bced3d0aada3e7fa2d66a88aed17e14) __Revert "chore(dev):__ add action-validator dev package to validate github action CI"
* [(_)](https://github.com/edrlab/thorium-reader/commit/03556d4b371d1aaca86427ed583cdc6521cdf576) __fix(css):__ remove the background of cover images in publication info to align with library view (PR [#3270](https://github.com/edrlab/thorium-reader/pull/3270) Fixes [#3123](https://github.com/edrlab/thorium-reader/issues/3123))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f62f45a199025f35e9f350b13bd6411667e372c9) __chore(dev):__ add action-validator dev package to validate github action CI
* [(_)](https://github.com/edrlab/thorium-reader/commit/91112b4bd0f1eade2a206d0ceb7ef0ebbffb5241) __fix(l10n|):__ updated translation via Weblate - Turkish (PR [#3269](https://github.com/edrlab/thorium-reader/pull/3269))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b616cb2b78fbb7eb0ac03adb04c2bc8a050e3b1d) __fix(GUI):__ unused and incorrect css variables (PR [#3267](https://github.com/edrlab/thorium-reader/pull/3267) Fixes [#3258](https://github.com/edrlab/thorium-reader/issues/3258))
* [(_)](https://github.com/edrlab/thorium-reader/commit/00d4d111b757d7b915e3d79f7caff65dabdf4667) __fix(GUI):__ publication card popover text ellipsis (PR [#3268](https://github.com/edrlab/thorium-reader/pull/3268))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f35960c4c07562fe071c2f8ee895964e6ab68fdc) __fix(PDF):__ mouse click drag+drop handler (same as EPUB)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8e9eed21fe8a658a998806e58ca4e0cbd07b0283) __fix(l10n):__ updated translations via Weblate, Danish, Greek, Lithuanian, Russian, Turkish, Portuguese (Portugal) (PR [#3260](https://github.com/edrlab/thorium-reader/pull/3260))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5182b24da32f524a406656c60b9bead0931fedd1) __fix(l10n):__ missing translation for profiles, and first pass to improve Arabic RTL direction in settings GUI (Fixes [#3264](https://github.com/edrlab/thorium-reader/issues/3264) See https://github.com/edrlab/thorium-reader/discussions/3177 )
* [(_)](https://github.com/edrlab/thorium-reader/commit/48ed2610a97b52e31ba077900eedbf2c031ea192) __fix(UI):__ update moment locale globally and locally, follow up b1c67a1e200dba8dea2bc089d647b3f124b649a1
* [(_)](https://github.com/edrlab/thorium-reader/commit/b1c67a1e200dba8dea2bc089d647b3f124b649a1) __fix(UI):__ update moment locale initialisation, follow up https://github.com/edrlab/thorium-reader/commit/dffaabe54e8f67c3c8f5de11a5b1623652b62456
* [(_)](https://github.com/edrlab/thorium-reader/commit/640c84a31939e69727bf3b0b155be8ff7c8279cd) __fix(opds):__ bypass undefined type link in filterLink function (PR [#3261](https://github.com/edrlab/thorium-reader/pull/3261))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9c28ab0eaa4cfd20094fd9b0d96fcf0f2749ebc3) __fix(l10n):__ English tweak [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d729ea7ff92d7b0ff824970ca17343dd4192baa5) __fix(opds):__ filter buy/borrow/subscribe link with supported mime-type (PR [#3257](https://github.com/edrlab/thorium-reader/pull/3257) Fixes [#3032](https://github.com/edrlab/thorium-reader/issues/3032))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e4014bad0edddbe6535ea81a0475dff47e448d9a) __fix(UI):__ add a localized toast message for wipe data process (Fixes [#2958](https://github.com/edrlab/thorium-reader/issues/2958))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dffaabe54e8f67c3c8f5de11a5b1623652b62456) __fix(UI):__ set locale to moment in OpdsLinkProperties (Fixes [#3259](https://github.com/edrlab/thorium-reader/issues/3259))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a681d7a6c5553ef0ac58b99ec2bf168420190a5) __chore(dev):__ script to scan for undeclared CSS properties [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/85f4f2272189cf670b724c881c7cda6b8718c56a) __fix(CSS):__ variable name of pdf settings checkbox (PR [#3253](https://github.com/edrlab/thorium-reader/pull/3253) Fixes [#3252](https://github.com/edrlab/thorium-reader/issues/3252))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4f588d694094506be48505d9361cbfde6395f78e) __fix(GUI):__ color and alignement of zoom radiobox svg in pdf settings (PR [#3251](https://github.com/edrlab/thorium-reader/pull/3251) Fixes [#3242](https://github.com/edrlab/thorium-reader/issues/3242))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3f1b5f4193fbebc7138017dbfa812a51dc3e13af) __fix(OPDS):__ in case authorize callback does not work (non-Thorium app URL protocol association), fallback to internal BrowserWindow instead of external web browser (PR [#3250](https://github.com/edrlab/thorium-reader/pull/3250))
* [(_)](https://github.com/edrlab/thorium-reader/commit/40f501ef0772dabb9597a90c4ecffb094b21a173) __fix(l10n):__ updated translations via Hosted Weblate - Lithuanian, Russian, Turkish (PR [#3248](https://github.com/edrlab/thorium-reader/pull/3248))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ecfd5502b633caf77e21c0fa274745c5b56dae1) __fix:__ update css variables names (PR [#3190](https://github.com/edrlab/thorium-reader/pull/3190))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fca7946481c32287af10a0e57ce9c9e47eafbbe9) __fix(customization):__ open profile from CLI (Fixes [#3230](https://github.com/edrlab/thorium-reader/issues/3230))
* [(_)](https://github.com/edrlab/thorium-reader/commit/22680d6633ae05e85447569ac261702c49d58307) __fix:__ string normalization, trimming, whitespace collapsing (harmonised implementation and edge case covering for non-space whitespace)
* [(_)](https://github.com/edrlab/thorium-reader/commit/c7ba383baeb186158936feb9bf047890c20c30e1) __fix:__ ReadiumCSS styling issues, updates r2-navigator package (Fixes [#3247](https://github.com/edrlab/thorium-reader/issues/3247) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/44f7128f0065c7edfd86ce3e55c08bf03ab887dd) __fix:__ BrowserWindow check for isDestroyed (sanity check)
* [(_)](https://github.com/edrlab/thorium-reader/commit/9262004c2f532e8f4df8e0516c89335bf7017526) __fix:__ Readium Speech pin dependency due to breaking changes in 'build' branch (see https://github.com/readium/speech/issues/19 )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0edff9bacb2b2c1047bbf6d18f21a0304d1f13d7) __fix(GUI):__ color of the close dock button in dark mode (PR [#3245](https://github.com/edrlab/thorium-reader/pull/3245))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6353416371633843c60a0c1e6bbb2ab914ddfbec) __fix(OPDS):__ authentication externalised to web browser to allow full user sign-in experience (+ password reset, etc.), also make sure NONCE is handled the same as ID, i.e. both present triggers match check, any missing means check is skipped (PR [#3246](https://github.com/edrlab/thorium-reader/pull/3246))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5b472da28bd7ed243ae3c5f7d9f463a2c6ad5b9c) __fix(l10n):__ updated translations via Weblate - Lithuanian, Russian, Turkish (PR [#3238](https://github.com/edrlab/thorium-reader/pull/3238))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c7a0ab3d4dc580dc90c701381fe915d0a9765d44) __fix(OPDS):__ same-origin will-navigate events in OAuth Implicit with redirects (see PR [#3244](https://github.com/edrlab/thorium-reader/pull/3244) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/ddd5d48551f5aaf107f583c20861fc7b68d57a6c) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/8061d9da116db662338405b367824df8eef62704) __fix(PDF):__ some files caused Thorium not to handle the "write to storage" event (savePreferences) in time, there was an async dela (Fixes [#3243](https://github.com/edrlab/thorium-reader/issues/3243) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/9ddb6ff4462d818ec7d5733ad9c35cfdc9e65c7e) __fix(pdf):__ config scale/spreadmode global persistence (PR [#3241](https://github.com/edrlab/thorium-reader/pull/3241)  Fixes [#3236](https://github.com/edrlab/thorium-reader/issues/3236))
* [(_)](https://github.com/edrlab/thorium-reader/commit/748b452f76ebb3f44ec049ba4cacb3cd54c05473) __fix(pdf):__ local reader persistence zoom/scale and column/spreadmode & commment unused paginated/scrolled view mode
* [(_)](https://github.com/edrlab/thorium-reader/commit/491480555252e18de0a536a76080f74d3f74c1e4) __fix(css):__ pdf reader docked setting combobox style (PR [#3240](https://github.com/edrlab/thorium-reader/pull/3240))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6b853cc04e7329ca1d4301b30496f4babf94801c) __fix(css):__ opds catalog buttons layout in secondary nav for small window (PR [#3239](https://github.com/edrlab/thorium-reader/pull/3239))
* [(_)](https://github.com/edrlab/thorium-reader/commit/af60c9829238bb59a3bdb7ad300221098f3b8109) __fix(apiapp):__ apiapp logout in feedList card
* [(_)](https://github.com/edrlab/thorium-reader/commit/ff0efcbee02ff7df9d996765a50d6c4ffbe6c416) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/6f346232ca8b943cbf77204e3decfe14fcaaafcc) __fix:__ layout shifting in custom profile settings, card hover background, and typo (PR [#3232](https://github.com/edrlab/thorium-reader/pull/3232))
* [(_)](https://github.com/edrlab/thorium-reader/commit/3ade6bd58e925eb33dbba48a3c5f9c6592a86d06) __fix(OPDS):__ pagination when publications and groups on the same screen (PR [#3192](https://github.com/edrlab/thorium-reader/pull/3192))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c1d97c4e2886dd6e377174fc164f2ade130ecac8) __fix(PDF):__ incorrect use of setPdfState in functional React component (was treated like this.setState in class components) was fixed in previous commit but this optimises by removing unnecessary useCallbacks and by avoiding using an object state (spread the individual values instead)
* [(_)](https://github.com/edrlab/thorium-reader/commit/928c385df48acd87235fec76dca3158b3e789809) __feat(PDF):__ 2-page spread with even/odd user-configurable option (Fixes [#3235](https://github.com/edrlab/thorium-reader/issues/3235))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a1d23b1ffe122dc5914dd8034d317dc94a22f2e) __fix(OPDS):__ OAuth2 Implicit will-navigate must allow form submit to same URL, and also fixed ID check in auth doc and URL param
* [(_)](https://github.com/edrlab/thorium-reader/commit/a3e624e9228c5f4a9e6e688d595d3a8424390f2f) __fix(OPDS):__ child auth window was causing Electron app to stay alive when CMD+Q (Mac)
* [(_)](https://github.com/edrlab/thorium-reader/commit/f4f09da3a931a21805313ab73cdff6bcd60eebc2) __feat(OPDS):__ added feed login action alongside logout (PR [#3233](https://github.com/edrlab/thorium-reader/pull/3233) Fixes [#3035](https://github.com/edrlab/thorium-reader/issues/3035))
* [(_)](https://github.com/edrlab/thorium-reader/commit/245feb56265a518cf68112b647e44a350abebc8c) __fix(l10n):__ Translations from Weblate - Dutch, Russian (PR [#3234](https://github.com/edrlab/thorium-reader/pull/3234))
* [(_)](https://github.com/edrlab/thorium-reader/commit/035c65e07bc362493fc6e42711626c5e385b27a3) __chore(dev):__ Flox/Nix added 'jq' command line utility [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f386e791b1f8a5d73389286ce973b1a0daa01c49) __feat(TTS):__ faster speech rates available (Fixes [#2895](https://github.com/edrlab/thorium-reader/issues/2895) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/188e0b6de6382cfe4e575c72b8c225e50e9daed8) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/d52d6e093f04b14ab722e4b0d44ebe0101c00bdd) __fix(l10n):__ updated translations via Weblate - Lithuanian, Russian, Turkish, Greek, Portuguese (Portugal) (PR [#3226](https://github.com/edrlab/thorium-reader/pull/3226))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dae19bd4a7533d35a189af1345ffae0d4b3b64ed) __fix:__ Electron sessions and URL protocols, added missing cache clearing in some partitions, cleaned code for file extensions and other hard-coded strings (PR [#3231](https://github.com/edrlab/thorium-reader/pull/3231))
* [(_)](https://github.com/edrlab/thorium-reader/commit/05f617c648a3ec959083544670740d41662cd8bf) __fix(customization):__ importFromLink undefined profile check
* [(_)](https://github.com/edrlab/thorium-reader/commit/951b8fb258b3b643727b6ae4051e2943819d349b) __fix:__ permissions for notifications, clipboard, fullscreen, etc. were too generous, now blocking by default
* [(_)](https://github.com/edrlab/thorium-reader/commit/647fb6cecdb71dbd73bb960db99cf8f0c5661933) __fix(customization):__ import profile from CLI (PR [#3229](https://github.com/edrlab/thorium-reader/pull/3229), Fixes [#3149](https://github.com/edrlab/thorium-reader/issues/3149))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0b3b7cf3d464e03c4dbe1e4fdd01c7c47b33257e) __chore(dev):__ code comments for JSON.stringify() with sorted object keys [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/69d90ced4f1156ca92913466dff20747dda2efd4) __fix(customization):__ remove isUrl test on profile loaded by http localhost with thorium:// custom protocol
* [(_)](https://github.com/edrlab/thorium-reader/commit/1e2820fcabe1adb1a4f9f702abe66f334eadefa5) __fix(customization):__ footer transparency & bookshelf welcome-screen removed when profile contains publications (PR [#3225](https://github.com/edrlab/thorium-reader/pull/3225), Fixes [#3221](https://github.com/edrlab/thorium-reader/issues/3221), Tackle [#3224](https://github.com/edrlab/thorium-reader/issues/3224)))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a92ffed0f8fb81650b7e6609927700dee08fcad3) __fix(customization):__ import publication inside zip package profile (PR [#3228](https://github.com/edrlab/thorium-reader/pull/3228))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4b1205d3ff329b0bca75d6c74f32f138ac2029fb) __chore(dev):__ comments in Electron Builder Fuses [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d818afa71018777d7690910c01fbaf2832e46bf9) __fix:__ JSON.stringify with sorted keys but no mutation of the input object (via replacer transform)
* [(_)](https://github.com/edrlab/thorium-reader/commit/32e12656fb2ec17e34098a9846eb274e4587c98e) __fix:__ incorrect import
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba42a29fe1a86e38f8aa8c6686a2f637434d7365) __fix(LCP):__ avoid duplicated sha256 hash of plain text passphrase in resolved array for publication ID and provider ID (which typically returns more than one search hit)
* [(_)](https://github.com/edrlab/thorium-reader/commit/619c22a9b6fdb37184b174e24db057bc29bebb96) __fix:__ Electron Fuses cookie encrypt-on-write (Chromium store) and ASAR integrity check (Windows and Mac, no Linux support)
* [(_)](https://github.com/edrlab/thorium-reader/commit/7294ad377adf410eaee331cbc8356c9570effc6c) __chore(NPM):__ package updates, notably r2-navigator with TTS voice / language selection fix
* [(_)](https://github.com/edrlab/thorium-reader/commit/b947319df426c8546b92241b2373bcb3174d2523) __fix:__ filename sanitization (was slugify which is for URLs) - OPDS temp file download, annotations and bookmark notes export, publication save-as (PR [#3227](https://github.com/edrlab/thorium-reader/pull/3227) Fixes [#3186](https://github.com/edrlab/thorium-reader/issues/3186))
* [(_)](https://github.com/edrlab/thorium-reader/commit/09dc705a50d789ad2b0b613514d62343d8d3c043) __fix(OPDS):__ improved layout, breadcrumb, resume browsing feature (PR [#3211](https://github.com/edrlab/thorium-reader/pull/3211))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f68777c8a10a63303635e5d1d19c1926c25a9558) __fix(lint):__ sorry
* [(_)](https://github.com/edrlab/thorium-reader/commit/bdf261db24bb42740fb6cab827488631bad0bc75) __fix(notes):__ import from CssSelector, export ProgressionSelector only if available
* [(_)](https://github.com/edrlab/thorium-reader/commit/de4128713160e381ad8bd9d5ae882baf886cbe88) __fix(notes):__ annotations and bookmark import/export (Fixes [#3203](https://github.com/edrlab/thorium-reader/issues/3203) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/589c50646e179942ffc89e359d2b1e41df20ded1) __fix:__ HTTP requests fencing with isURL() (PR [#3222](https://github.com/edrlab/thorium-reader/pull/3222))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e7a76beadd8e2f73c5a367bddf5529025f6dcb73) __fix(dev):__ process.env.NODE_ENV mismatch warning with DefinePlugin in WebPack config for PDF build scripts [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/1812fbb7058e351a1428cb1889178af2f11b34f6) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/dc29207cb4d9c88c79eed22c971f4289c5756f98) __chore(dev):__ node_modules removal in Socket Security Firewall script [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/e55120c204fa7a21e5a730c9c2d104e03189b638) __(weblate/develop, weblate/HEAD) fix(l10n):__ updated Russian translation via Weblate (PR [#3220](https://github.com/edrlab/thorium-reader/pull/3220))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e2524d45d406689cb8b3c99b61ff3611c82e1c8b) __fix(l10n):__ updated translations via Weblate, Lithuanian (PR [#3218](https://github.com/edrlab/thorium-reader/pull/3218))
* [(_)](https://github.com/edrlab/thorium-reader/commit/79989d44204af3d43d22e51a5a8197372c5e27e2) __fix(l10n):__ cleanup scripts
* [(_)](https://github.com/edrlab/thorium-reader/commit/7f77e982f70024697594a285dde8838d52ec4512) __fix(l10n):__ updated translations via Weblate - Greek, Lithuanian, Turkish, Swedish, Danish, Russian (PR [#3217](https://github.com/edrlab/thorium-reader/pull/3217))
* [(_)](https://github.com/edrlab/thorium-reader/commit/032750129c107d7a7e7509bf218d296e722f0b32) Translated using Weblate (Russian)
* [(_)](https://github.com/edrlab/thorium-reader/commit/9cb16e910d0da55c9db9be6c3bd49a41e0cc0461) __chore(dev):__ SFW update
* [(_)](https://github.com/edrlab/thorium-reader/commit/f1127b5dc8bc4039988ba8bc064d6bb353f2bd24) __fix(customization):__ settings.tsx profile selection (PR [#3216](https://github.com/edrlab/thorium-reader/pull/3216) Fixes [#3198](https://github.com/edrlab/thorium-reader/issues/3198))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b02ba34c6cb9aa670d4c7b0b0f08afd27c6be950) __fix(customization):__ aboutThorium customization info commented && customization catalog icon replaced with globeIcon
* [(_)](https://github.com/edrlab/thorium-reader/commit/2d80213675b0355d6b5fede05a6a1894aa8f1085) __fix(customization):__ screen (PR [#3215](https://github.com/edrlab/thorium-reader/pull/3215))
* [(_)](https://github.com/edrlab/thorium-reader/commit/94e0ee7a54e3c5ba0adbdc5fe9bee02edf3e8dd9) __fix(customization):__ welcome-screen (PR [#3214](https://github.com/edrlab/thorium-reader/pull/3214) FIxes [#3153](https://github.com/edrlab/thorium-reader/issues/3153))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8ce3189ec7cd7d2139a73b6a5d0ce7aa1e0fa1cc) __fix:__ in dev mode the WebPack dev server with hot reload was causing a navigation event which triggered the HTTP handler to external web browser [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/002917309bb5d0bdfc9c69c539a4f5b9eb97472d) __fix:__ Electron WebBrowser and WebView devtools must be all enabled in CI
* [(_)](https://github.com/edrlab/thorium-reader/commit/f9fa2b64b89ff31f63d1e6886f629ff61b7cf08f) __fix:__ hyperlink handling, interception of window open and navigation events, webview partitioning (PR [#3213](https://github.com/edrlab/thorium-reader/pull/3213))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7fb60c3f0fb5a69c61b4630310b1e29fbf48e37e) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/9c1bc131521c472c4702669a63dd26378518c629) __fix:__ undefined provisioning custom profile in packaged application
* [(_)](https://github.com/edrlab/thorium-reader/commit/0c2c06919913d1fbe05e1665d0371164fab6a695) __chore(dev):__ package build convenience scripts now activate debug dev mode (like CI) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8cf2ee55888c4010bebe5e8566bf92b6f7a221b1) __chore(dev):__ code-signing disabling in rebuild scripts [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/0446453a3f1b79849663d6392a394ce124c6aaa3) __fix(customization):__ home section publication catalog css & labels (PR [#3199](https://github.com/edrlab/thorium-reader/pull/3199))
* [(_)](https://github.com/edrlab/thorium-reader/commit/59bd2d5bc6ea4843410cfa43f6e28b4d9aebbf1e) __fix(customization):__ profile downloader (PR [#3204](https://github.com/edrlab/thorium-reader/pull/3204) Fixes [#3146](https://github.com/edrlab/thorium-reader/issues/3146))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f69df06ccedb48fc6f6f3e04e420f4aa14a8c5d8) __chore(dev):__ Flox/Nix NodeJS derivation update (lockfile)
* [(_)](https://github.com/edrlab/thorium-reader/commit/6fb11c21530e8279fe494a1145963246d9428dd8) __    fix(notes):__ SQLite removal of dangling / orphan annotations and bookmarks when publication is deleted. Fixes [#3182](https://github.com/edrlab/thorium-reader/issues/3182) See [#3200](https://github.com/edrlab/thorium-reader/issues/3200) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/66cd89e4a350e87247ab13137899e66e909d04f8) __fix(opds):__ logout button in feedList opds card (PR [#3201](https://github.com/edrlab/thorium-reader/pull/3201), [#3069](https://github.com/edrlab/thorium-reader/issues/3069))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b2b97cfefd0e8efe9bfa879100dd5c1fbf04456d) __fix(notes):__ SQLite column with JSON.stringify alphanumerical sorting of JSON properties (keys ordering for easier debugging) See [#3200](https://github.com/edrlab/thorium-reader/issues/3200) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c5fad816253501c9c11f93769a588a5dbbb15d16) __fix(l10n):__ udpated translations via Weblate - Greek, Lithuanian, Turkish, Swedish, Danish, Russian (PR [#3171](https://github.com/edrlab/thorium-reader/pull/3171))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ff635206097e9e77374172bf1692b5c0fb4767d8) __fix(l10n):__ cleanup scripts (i18n-check/scan/sort/typed)
* [(_)](https://github.com/edrlab/thorium-reader/commit/4bec1f1407c6cbf72058f694cf31bdad3ea1db2b) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/2efa3c47de357c3d90dd18b7029b9abcf7f1dec7) __chore(NPM):__ updated packages, and Socket Firewall security checks now ignore git dependencies and work with electron-builder
* [(_)](https://github.com/edrlab/thorium-reader/commit/ea1fbd32a4be30c9d8ebc64c586cbac04fca61ee) __fix(customization):__ delete a profile from settings (PR [#3197](https://github.com/edrlab/thorium-reader/pull/3197), Fixes [#3150](https://github.com/edrlab/thorium-reader/issues/3150))
* [(_)](https://github.com/edrlab/thorium-reader/commit/39645695170f808113b2924a798df890370b48f4) __fix(customization):__ drag&drop remove old provisioned profile and activate the last one (PR [#3196](https://github.com/edrlab/thorium-reader/pull/3196) Fixes [#3166](https://github.com/edrlab/thorium-reader/issues/3166))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c7db1d6dbd5262f4cc8b218080828153af2a1c34) __fix(customization):__ splash-screen cancel (Fixes [#3168](https://github.com/edrlab/thorium-reader/issues/3168))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b2f93803ee04c849c58f500146842335150aacfa) __fix(customization):__ welcome-screen/splash-screen machine state
* [(_)](https://github.com/edrlab/thorium-reader/commit/f71ed486ff947c8ec315a798e387951ecbce5720) __fix(customization):__ css reader theme (PR [#3193](https://github.com/edrlab/thorium-reader/pull/3193))
* [(_)](https://github.com/edrlab/thorium-reader/commit/28b4cddd6fec5d0d4f6c71faf9a0d5c4445bdc3b) __fix(customization):__ profile publications (PR [#3195](https://github.com/edrlab/thorium-reader/pull/3195), [#3156](https://github.com/edrlab/thorium-reader/issues/3156))
* [(_)](https://github.com/edrlab/thorium-reader/commit/947ff68dbac01871c5a078f72c6c348db1aee631) __fix(customization):__ added typeguard when no network connection in the authentication checking
* [(_)](https://github.com/edrlab/thorium-reader/commit/088d6ea4174d01f167b947c8b86135fcbb3cb63b) __Merge branch 'develop' of github.com:__edrlab/thorium-reader into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/e86c557a7c4fe58e912a29ad642cca4654034a5a) __chore(dev):__ added Socket Firewall to check NPM direct and transitive dependencies for security vulnerabilities / supply chain attacks (also minor NPM package update, and Flox/Nix env update)
* [(_)](https://github.com/edrlab/thorium-reader/commit/80060c07fb3aa7d038c5dddb6e1874ad5029eb7b) __fix(customization):__ opds catalogs in library header navigation (PR [#3191](https://github.com/edrlab/thorium-reader/pull/3191), [#3155](https://github.com/edrlab/thorium-reader/issues/3155))
* [(_)](https://github.com/edrlab/thorium-reader/commit/65d2d0aec9875920b1edf620f9f6bed745372234) __fix(a11y):__ screen reader detection was resulting in false positives because of keyboard utility apps (for example) so now assisitive technology continues to be automatically detected but users must explicitely activate support in global application settings (boolean option) (Fixes [#3163](https://github.com/edrlab/thorium-reader/issues/3163) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/f5eac69be41d8ce049c28f8dc5923bb2dcf599a1) __chore(dev):__ Flox/Nix update [skip ci] 	#
* [(_)](https://github.com/edrlab/thorium-reader/commit/152ef5c657969497973aea0940b29bdaa784fb02) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/84c2de2ca8f719e992a0a64002ee1193c5430d9e) __fix(customization):__ trigger opds authentication at activation on first profile catalog (PR [#3188](https://github.com/edrlab/thorium-reader/pull/3188))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5055b796b19512de6090040c7e3e881ee01bda20) __fix(customization):__ improve welcome-screen & settings profile selection UI/UX design (PR [#3183](https://github.com/edrlab/thorium-reader/pull/3183), Fixes [#3158](https://github.com/edrlab/thorium-reader/issues/3158), Tackle [#3153](https://github.com/edrlab/thorium-reader/issues/3153))
* [(_)](https://github.com/edrlab/thorium-reader/commit/db81f4e10e9d19c1126896d11ded50cfeb42265c) __chore(NPM):__ updated packages, notably security fixes via PDF.js and r2-navigator (hyperlink handling, browser window opening, shell.external safeguards)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0bbbe0e0b5ad4ce683f13e97e8eb42548ebe9ddb) __fix:__ now serve publication UUID to webview instead of full base64 path (avoid leaking OS user folder in scripted context), fixed ReadiumCSS and manifest.json root and self base URLs, fixed incorrect usage of decodeUriComponent in customisation profile handler, added downstream safeguards to prevent filesystem access above root folder for protocol handlers of ReadiumCSS and PDF.js (better safe than sorry, even if URL syntax is normalised upstream to prevent ../../ backpaths)
* [(_)](https://github.com/edrlab/thorium-reader/commit/6f100e1e690b5a22e9a96f2ff47a1537dd9d0cbf) __fix:__ added shell.openExternal safeguards (https?:// only)
* [(_)](https://github.com/edrlab/thorium-reader/commit/20ad0e5616c3cbc7f389151ffc8efb15e8e80b80) __fix(customization):__ implement json-schema validation on profile manifest (PR [#3185](https://github.com/edrlab/thorium-reader/pull/3185))
* [(_)](https://github.com/edrlab/thorium-reader/commit/ba967f4a3d7a66707a802c8aeb6d2211bc91c10b) __fix(customization):__ add profile logoUrl and profile name to provisioned profile in Settings.tsx Profile list
* [(_)](https://github.com/edrlab/thorium-reader/commit/e244bd35daf94bcd8a6c78fa32e34e6c3213e148) __fix(customization):__ welcome-screen state management, improve fine-grained customization persistence, fixes bad variable naming & import path (PR [#3184](https://github.com/edrlab/thorium-reader/pull/3184))
* [(_)](https://github.com/edrlab/thorium-reader/commit/4729fce31385846c803ce352b83bf6f4c91a32a7) __chore(dev):__ navigator webview preload now always bundled to avoid require() node_modules, some script cleanup
* [(_)](https://github.com/edrlab/thorium-reader/commit/0933612067d25039b492a33578b3ecfc35f58588) __chore:__ Electron contextIsolation, sandbox, nodeIntegration mutual interactions (no logic change, just comments) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/28de26bd100988eb50bbf176ea64652b8214dce7) __fix(OPDS):__ contextIsolation and sandbox on auth browser window [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8600e06a72034f1f9e17987bd3ae888cce4d1cc8) __chore(NPM):__ package updates, notably EDRLab's PDF.js fork with (re)enabled password-protection (Fixes [#3113](https://github.com/edrlab/thorium-reader/issues/3113) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/32af6aefda049ba9538c56dd9686401d37eb4a34) __fix(PDF):__ using preload to extract PDF cover image (contextIsolation and sandbox security)
* [(_)](https://github.com/edrlab/thorium-reader/commit/511d11931de67038cbb349344af3ec303b63c1f3) __chore(dev):__ npm i -> update package-lock.json [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/40f51168b167a88caff1b8039d72258fb8eb9561) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/915cf25061cec2adacd41198f625b540b7baa1cf) __chore(NPM):__ updated packages, reverted JSDOM v27 --> v26 (Fixes [#3175](https://github.com/edrlab/thorium-reader/issues/3175) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/132546086f1080b1672230d3d6a654b9041867c2) __ fix(opds):__ OPDSPublication download links associated with local bookshelf publication (PR [#3170](https://github.com/edrlab/thorium-reader/pull/3170) Fixes [#3034](https://github.com/edrlab/thorium-reader/issues/3034))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9206e9f0c5f65cf347503c88f2f773331ec7d369) __chore(NPM):__ updated package dependencies
* [(_)](https://github.com/edrlab/thorium-reader/commit/682d70955957d3b2f0461cfac6a8872f1b5a7a1f) __fix:__ custom profile theme undefined guard (Fixes [#3172](https://github.com/edrlab/thorium-reader/issues/3172) ) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/209df3c392ea879eff8e797eaa5479bf7dde2f44) __chore(l10n):__ tidy up and fixed English typo [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a3fb46090dc576979a16f68f11819b8844db5018) __chore(dev):__ Flox/Nix lockfile updates [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/81d6872da2c21a7ab131e2ad681f310eed7b6ae8) __fix(l10n):__ updated Translations via Weblate - Turkish, German, Greek, French, Italian, Dutch, Portuguese (Brazil), Russian, Chinese (Simplified Han script), Arabic, Swedish (PR [#3124](https://github.com/edrlab/thorium-reader/pull/3124))
* [(_)](https://github.com/edrlab/thorium-reader/commit/df1d4920bd33a8ac8f8dc1d806536bcbe36f789e) __fix(db):__ switching reader notes persistence to sqlite with backward compatibility (PR [#3144](https://github.com/edrlab/thorium-reader/pull/3144) FIxes [#3136](https://github.com/edrlab/thorium-reader/issues/3136))
* [(_)](https://github.com/edrlab/thorium-reader/commit/17ccfd7a3cb5766b0d30ec1b448ede8d9657f47f) __feat(customization):__ thorium-customization provision/activate (PR [#3101](https://github.com/edrlab/thorium-reader/pull/3101))
* [(_)](https://github.com/edrlab/thorium-reader/commit/02b677550c361bd8e94006fd25415d0684622a78) __chore:__ clean codebase, remove unused exception class
* [(_)](https://github.com/edrlab/thorium-reader/commit/5ac9ff717a36f0d2c98335ac9c1a3ba8b7a2c42c) __chore(NPM):__ updated packages
* [(_)](https://github.com/edrlab/thorium-reader/commit/06c88553cc023f78ffaf3ff1ff2b7f0e64b5d026) __chore(NPM):__ updated packages, notably Electron v38
* [(_)](https://github.com/edrlab/thorium-reader/commit/99bbfcb6b2644fd76af5a99ed6568ebe524888ad) Merge branch 'master' into develop [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/725d2a5acf8614fe2325227d20984470dcecad74) __(origin/master, master) chore(release):__ latest.json [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/daff2b9e9e4f5c884c7586a726f6486f17e5a29c) __chore(release):__ v3.3.0-alpha.1 bump [skip ci]

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v3.2.2...v3.3.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
