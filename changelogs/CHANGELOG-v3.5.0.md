# Thorium Reader v3.5.0

## Summary

Version `3.5.0` was released on **05 June 2026**.

This release includes the following (notable) new features, improvements and bug fixes:

* Updated translations
* Improved screen reader support in the graphical user interface (better ARIA labels, HTML structure)
* Updated EPUB Accessibility metadata display to align with the specification more strictly
* Users can now configure EPUB Media Overlays highlights with TTS styles
* Users can now disable TTS sentence/word highlighting (one or the other, or both)
* Better control of audio speed for EPUB3 Media Overlays and TTS readaloud, new keyboard shortcuts, smaller increments
* Support for self-signed certificates from operating system's CA store, for HTTP requests within corporate networks
* The search text input field is now automatically populated with the currently selected document text (if any)
* Upgraded PDF.js and added support for annotations
* Updated Readium Speech, improved synthetic voice selection (TTS readaloud)
* Fixed EPUB package.opf XML publication metadata handling: with multiple languages, the first one can be RTL (e.g. Arabic) yet the page-progression-direction may be LTR (default/auto)
* LCP-protected encrypted media streaming (also applies to large PDF files)
* Windows NSIS installer updated to a more recent revision, this should help fix some bugs related to silent installation and enterprise operating systems
* Improved networking: IPV4 250ms timeout when IPV6 addresses provided from DNS but not supported by the server
* Updated to the latest revision of Electron v41 (Chromium v146, NodeJS v24)
* New robustness feature: recovery procedure for publications present on disk but missing from the database, and also to handle publications present in the database but missing on the storage media
* Log rotation with size limitation to avoid filling up the filesystem
* New feature: configurable external publication storage / filesystem location
* Hardened dependency management, mitigation of supply chain attacks, more robust release process and semi-automated code-signing via continuous integration

(previous [v3.4.0 changelog](./CHANGELOG-v3.4.0.md))

## Full Change Log

Git commit diff since `3.4.0`:
https://github.com/edrlab/thorium-reader/compare/v3.4.0...v3.5.0

=> **152** GitHub Git commits:

* [(_)](https://github.com/edrlab/thorium-reader/commit/ba7a2b8089b1ba124697378f5792dc9c1c42de40) __chore(NPM):__ package updates checked with Socket Security Firewall, also added lockfile to Electron Builder src/package.json for Webpack "externals" node_modules/ require CJS modules
* [(_)](https://github.com/edrlab/thorium-reader/commit/a6489b784b7b546479a78270f04e42e026ff2778) __fix:__ "telemetry" anonymous ping parametrized in CI
* [(_)](https://github.com/edrlab/thorium-reader/commit/d8da6d8f89e7a4860be35fec44e006e777979c6d) __fix(l10n):__ updated translations via Weblate - German, Chinese (Simplified Han script) (PR [#3636](https://github.com/edrlab/thorium-reader/pull/3636))
* [(_)](https://github.com/edrlab/thorium-reader/commit/addf59251bf4970d84b03f4d9fcb40b8fe630872) __fix(CI):__ GitHub draft release [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/7ebbd78c6c2de5a877668e7d2a46c2caf8d6d16b) __fix(CI):__ Apple Notarize tests
* [(_)](https://github.com/edrlab/thorium-reader/commit/fc80e67eb7f5f772bdd3940f3351c86c1a737437) __chore(CI):__ troubleshooting KeyChain
* [(_)](https://github.com/edrlab/thorium-reader/commit/6dab99a517675fe49b1ad68ccb44568e8564335a) __fix(CI):__ Apple SKIP_NOTARIZE
* [(_)](https://github.com/edrlab/thorium-reader/commit/a320a63614e17f4686cdfc65bfadc753550236ba) __fix(CI):__ MacOS Notarization skip
* [(_)](https://github.com/edrlab/thorium-reader/commit/04374417fb425d7244ca0e6d251153d9965fbaa6) __fix(CI):__ ref_name is not the branch name, it is the tag name in this case
* [(_)](https://github.com/edrlab/thorium-reader/commit/26b6c4494609872e6c6853daa3c26bd8895b2ebb) __chore(CI):__ another attempt at env deploy release
* [(_)](https://github.com/edrlab/thorium-reader/commit/098049cc99e23fc989a144a6b9535b71296211dc) __chore(CI):__ manually-cancelled runs (continuous integration automatic builds) also cancel the release tag run (which also builds) ... trying again
* [(_)](https://github.com/edrlab/thorium-reader/commit/a7f692b30ed5ed7c1a67ec39f39c290ed603a462) __fix(CI):__ copy-paste error in Workflow YAML (release header)
* [(_)](https://github.com/edrlab/thorium-reader/commit/95b10c3dbf56634489415cbfbce44b2e91d52cea) __feat(CI):__ release Workflow triggered by v* tag
* [(_)](https://github.com/edrlab/thorium-reader/commit/e26f9a7cc1a1abe22032688db828eee14dde0f3c) __chore(CI):__ minor Workflow YAML tweak [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/45913babf17eb70dc196e01975c2607907101ae6) __chore(dev):__ electron builder script in package.json now separated [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/a9ee5c8e28ab2ae7889b294216bfb5863a33c70f) __fix(l10n):__ updated translations via Weblate - Swedish, Russian, Italian, Portuguese (Portugal) (PR [#3632](https://github.com/edrlab/thorium-reader/pull/3632))
* [(_)](https://github.com/edrlab/thorium-reader/commit/61ac6dcce682dab70bafbc5f76e49c9b23371e11) __chore(NPM):__ updated electron-builder package to fix Windows NSIS packaging
* [(_)](https://github.com/edrlab/thorium-reader/commit/f30ac20446a139fcdd267960020a6728b6271104) __fix:__ Discord link (Fixes [#3594](https://github.com/edrlab/thorium-reader/issues/3594) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/eb7ac8c85f4679e3154600bb3b52f4f4927cbafc) __fix(HTTP):__ self-signed system-wide certificates from the CA store are now supported (Fixes [#3566](https://github.com/edrlab/thorium-reader/issues/3566))
* [(_)](https://github.com/edrlab/thorium-reader/commit/38425be8d832dedb0a080e1b5a8d4f1352f67f3b) __fix(search):__ automatically populate text input field with currently selected document text (if any) (Fixes [#3512](https://github.com/edrlab/thorium-reader/issues/3512) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/497dd25a5fdd1e2b6c5dc86c32cf19e832beacdf) __fix(l10n):__ inconsistencies between Weblate plurals and our tooling [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/6e421602f8e36d4e86dd016a30993ea0ae118354) __fix(l10n):__ English label was missing ... for "catalog.missing" (also added French) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/532daa3360d90938eb7d19b2954b20b68cf34671) __chore(NPM):__ package updates, scanned with Socket Security Firewall
* [(_)](https://github.com/edrlab/thorium-reader/commit/b256c338208f318ac8660d9ffdc8e9791e0f5a0c) __fix(l10n):__ updated translations via Weblate - Korean, Japanese, Russian, Swedish, Polish, Lithuanian, Italian, Czech, Chinese (Traditional Han script)  (PR [#3631](https://github.com/edrlab/thorium-reader/pull/3631))
* [(_)](https://github.com/edrlab/thorium-reader/commit/660cc9865625bdce682498e3695a45782fdcdcc8) __fix(l10n):__ updated translations via Weblate - Swedish, Italian, Danish, Russian (PR [#3629](https://github.com/edrlab/thorium-reader/pull/3629))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1b0e0204f111f1d0c9e06dd7f1e36c14fd4b70a4) __fix(css):__ various css button regressions (PR [#3628](https://github.com/edrlab/thorium-reader/pull/3628) Fixes [#3626](https://github.com/edrlab/thorium-reader/issues/3626))
* [(_)](https://github.com/edrlab/thorium-reader/commit/fe865edbdf9dfe7c23dbaf5163c528485e2a0e2f) __chore(dev):__ Flox/Nix lockfile update (minor change) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/301287bac68168b400213485d6e9e27c9e1e0d10) __fix(l10n):__ updated translations via Weblate - Turkish, Russian (PR [#3627](https://github.com/edrlab/thorium-reader/pull/3627))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cdc07e3239757ae11197512a728ceddbec7a15fc) __fix(NPM):__ electron-builder updates were not published with 'latest' tag, which explains why toolsets/nsis configuration failed, see https://github.com/edrlab/thorium-reader/commit/51cd338a5239bc8092ffb617a33720f3a74aaf3d see https://github.com/electron-userland/electron-builder/issues/9789
* [(_)](https://github.com/edrlab/thorium-reader/commit/ced9106fa2538e1d27c189708d3eb48dadc73f54) __fix(l10n):__ updated translation using Weblate - Russian (PR [#3625](https://github.com/edrlab/thorium-reader/pull/3625))
* [(_)](https://github.com/edrlab/thorium-reader/commit/51cd338a5239bc8092ffb617a33720f3a74aaf3d) __fix(windows):__ NSIS update, see https://github.com/electron-userland/electron-builder/pull/9768 see https://github.com/electron-userland/electron-builder-binaries/releases?q=nsis&expanded=true see https://github.com/electron-userland/electron-builder-binaries/pull/167 see https://github.com/electron-userland/electron-builder/issues/9141#issuecomment-4513772963 also see https://www.electron.build/docs/nsis/#customnsisbinary
* [(_)](https://github.com/edrlab/thorium-reader/commit/57d8bf485e10ee7616f7e2d0c7895db429262bc7) __chore(NPM):__ package updates, scanned with Socket Security Firewall
* [(_)](https://github.com/edrlab/thorium-reader/commit/5ef1172f3eb6fcf9fc813cafb0d00e5b977f4895) __fix(webpack):__ terser minimizer regression, usedExports default changed (Fixes [#3619](https://github.com/edrlab/thorium-reader/issues/3619) See [#3620](https://github.com/edrlab/thorium-reader/issues/3620) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/07557e31aad50f51e6c2e9dc7d7f0212892c7554) __fix(l10n):__ some Greek labels were removed in the previous commit, not sure why? (sync script) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/994adfb73ec56aab1a21ec021deaaae0aeecd1b5) __fix(l10n):__ translated LCP warning message (see [#3551](https://github.com/edrlab/thorium-reader/issues/3551) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/16b5575bf30dbf1438bc9b7c6f6aa5a34b10ceb9) __fix(LCP):__ warning message when attempting to open production LCP licenses with non-compatible builds of Thorium Desktop reader (Fixes [#3551](https://github.com/edrlab/thorium-reader/issues/3551))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cfe8408e922006bf148dcbdfdc540fbe40565978) __fix(di):__ avoid DI store lookup before initialization (Fixes [#3621](https://github.com/edrlab/thorium-reader/issues/3621))
* [(_)](https://github.com/edrlab/thorium-reader/commit/061a720ba75ec08c4e7e813f8918902c0b844090) __feat:__ audio speed for EPUB3 Media Overlays and TTS readaloud, keyboard shortcuts, 0.1 increments from 0.2 to 6.0 (PR [#3622](https://github.com/edrlab/thorium-reader/pull/3622) Fixes [#1154](https://github.com/edrlab/thorium-reader/issues/1154) Fixes [#3589](https://github.com/edrlab/thorium-reader/issues/3589) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/0691c7abc5e29edc1a40f5f3ffa713a2463f7f71) __fix(l10n):__ updated Greek translation via Weblate (PR [#3618](https://github.com/edrlab/thorium-reader/pull/3618))
* [(_)](https://github.com/edrlab/thorium-reader/commit/9add2a98cb5b41b57598e742ea78de861311f148) __chore(CI):__ update Zizmor
* [(_)](https://github.com/edrlab/thorium-reader/commit/4a0526ca5371fe433a4c10202604103f3640e77c) __fix(ux):__ lost of focus in settings recovery button (PR [#3617](https://github.com/edrlab/thorium-reader/pull/3617) Fixes [#3591](https://github.com/edrlab/thorium-reader/issues/3591))
* [(_)](https://github.com/edrlab/thorium-reader/commit/28bb10f037d76acc52fa9b0c691c6f632087be5a) __fix(css):__ minor styles in annotations filters (PR [#3605](https://github.com/edrlab/thorium-reader/pull/3605))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f5d0960ef38742795dc32e140494496db1006761) __fix(opds):__ add Thorium identifier to auth requests (Fix [#3585](https://github.com/edrlab/thorium-reader/issues/3585))
* [(_)](https://github.com/edrlab/thorium-reader/commit/a76fea5670d0b1396ac2669f0826ad828ab8b31e) __fix(UX):__ add target source/os query params on thorium.edrlab.org URL (Fixes [#3522](https://github.com/edrlab/thorium-reader/issues/3522))
* [(_)](https://github.com/edrlab/thorium-reader/commit/23d9c093b4a367578856289152c127053003fb58) __feat(pdf):__ add support for text selection annotations (PR [#3599](https://github.com/edrlab/thorium-reader/pull/3599))
* [(_)](https://github.com/edrlab/thorium-reader/commit/8755b1b1ea71393d2f24ad24a46fc91b22a655bf) __fix(i18n):__ Localization of A11y issues, Storage/Recovery for new 3.5 Features, and label Fixes across the Project (PR [#3534](https://github.com/edrlab/thorium-reader/pull/3534) Fixes [#3533](https://github.com/edrlab/thorium-reader/issues/3533) Fixes [#3517](https://github.com/edrlab/thorium-reader/issues/3517) Fixes [#3518](https://github.com/edrlab/thorium-reader/issues/3518))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1f029bc599a403bfb584f44167123d47b1aea74b) __fix:__ Readium Speech upgrade to proper NPM package (PR [#3541](https://github.com/edrlab/thorium-reader/pull/3541) Fixes [#3458](https://github.com/edrlab/thorium-reader/issues/3458))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5a71756cbdc912b388fecec8285ece36da0ab041) __chore(l10n):__ follow-up to https://github.com/edrlab/thorium-reader/pull/3570 JSON locales cleanup [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/161a3416e3a41399a6083897ba6a04b798284b84) __chore(NPM):__ updated package dependencies, semantic versions checked with Taze, 3 days maturity / minimum release date, scanned with Socket Security Firewall (a few important updates in Webpack, Sass Loader, etc. will need updating in the next few days once the maturity threshold is met)
* [(_)](https://github.com/edrlab/thorium-reader/commit/f77b993db2f3b2ade2d29373e052930a88402124) __chore(dev):__ added maturity-period to Taze to match NPM minimum-release-age [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4560fb704d973c370ad506c5a237002b89efd3b8) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c4442d1b469298508a8284f68887434fe6d43c94) __fix(CI):__ GitHub Actions deletion of non-existing release causes entire job to fail [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/543f9c13c2565cb50a47a13f924c0c5bfe2e8e99) __fix(l10n):__ updated translations via Weblate - Polish, Italian (PR [#3602](https://github.com/edrlab/thorium-reader/pull/3602))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b6ba38063342d0feb5fe87f6e828fa28b7ade12e) __chore(dev):__ introduce AGENTS.md
* [(_)](https://github.com/edrlab/thorium-reader/commit/d34bed68b9a279978220f2e49e95ff666f6ac89a) __fix(l10n):__ updated translations via Weblate - Italian, Chinese (Simplified Han script), Swedish (PR [#3584](https://github.com/edrlab/thorium-reader/pull/3584))
* [(_)](https://github.com/edrlab/thorium-reader/commit/dc7a00e162c1180ee7a410d6eb9f6f3e8ad1d884) __fix(CI):__ packageManager version range 11.15.x
* [(_)](https://github.com/edrlab/thorium-reader/commit/77b6e8dd5690b2c038cf492d56aa7a7abf5c4b9c) __fix(net):__ IPV4 250ms timeout when IPV6 addresses provided from DNS but not supported from the server (PR [#3540](https://github.com/edrlab/thorium-reader/pull/3540) Fixes [#3444](https://github.com/edrlab/thorium-reader/issues/3444))
* [(_)](https://github.com/edrlab/thorium-reader/commit/36713d87f1d610b4b8b26da9d0804d39ead278f8) __fix:__ collision between navigation arrow and scroll in reader (PR [#3598](https://github.com/edrlab/thorium-reader/pull/3598) Fixes [#3590](https://github.com/edrlab/thorium-reader/issues/3590))
* [(_)](https://github.com/edrlab/thorium-reader/commit/32aa53ade238568cb6a4f7c539cfc9cb81118d73) __fix(ui):__ focus cycle in library and reader modals and css h4 to h3 in readerSettings (PR [#3553](https://github.com/edrlab/thorium-reader/pull/3553) Fixes [#3120](https://github.com/edrlab/thorium-reader/issues/3120))
* [(_)](https://github.com/edrlab/thorium-reader/commit/346f83fb8a3ff62f7f3bb26feeec496ac62fec8e) __chore(pdf):__ update pdf,js edrlab fork (PR [#3577](https://github.com/edrlab/thorium-reader/pull/3577) Fixes [#3515](https://github.com/edrlab/thorium-reader/issues/3515))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f091c9a497d12ea36b2630bae9a90d75f880e105) __fix(storage):__ styles and remove one of the two change directory steps (PR Closes [#3576](https://github.com/edrlab/thorium-reader/issues/3576) Fixes [#3571](https://github.com/edrlab/thorium-reader/issues/3571) Fixes [#3572](https://github.com/edrlab/thorium-reader/issues/3572) Fixes [#3573](https://github.com/edrlab/thorium-reader/issues/3573))
* [(_)](https://github.com/edrlab/thorium-reader/commit/11a97bac7a1f2c04db1795818d09b0345bc21013) __fix(tts):__ playback rate combobox and container width in highlight preview (PR [#3583](https://github.com/edrlab/thorium-reader/pull/3583) Fixes [#3579](https://github.com/edrlab/thorium-reader/issues/3579))
* [(_)](https://github.com/edrlab/thorium-reader/commit/46b551095a0dddaadd0fd0ee08d1d472fe282c43) __fix(CI):__ line breaks in release notes [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4ede621af23c6ad92f256b6a6013acbce8f49fbc) __fix(l10n):__ updated translations via Weblate - Swedish, Russian, Italian, Chinese (Simplified Han script), Estonian (PR [#3568](https://github.com/edrlab/thorium-reader/pull/3568))
* [(_)](https://github.com/edrlab/thorium-reader/commit/cbc7cc3bcbd100cb6511814f2e3764c1e0cadcc6) __chore(CI):__ gh command needs git repo checkout, and renamed Windows .exe installer to add ARM64 otherwise will conflict with same Intel filename (Electron Builder sometimes adds amd64 / arm64, sometimes not)
* [(_)](https://github.com/edrlab/thorium-reader/commit/e4e718c8ac93481e255b20cd3174dca7666607d9) __chore(CI):__ remove unnecessary env var [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/fab1d79f596a2f67fd69a23db50645b993111b69) __chore(CI):__ YAML syntax error and Linux release artifacts file extensions
* [(_)](https://github.com/edrlab/thorium-reader/commit/b475d22af877ddc9cb919a787f3b10c72df35a33) __chore(CI):__ separation of build vs. release via GitHub Artifacts, fine-grain permission contents:write only for release job which depends on completed steps of build job (release matrix matches build matrix to upload individual os/arch "latest" tags)
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a27a373a7ff8530981f935e501925aff7da9a99) __chore(dev):__ CODEOWNERS [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/18974d39db0baea5a713b2b269681ff48bc1b22f) __chore(CI):__ Zizmor integration GitHub Actions Workflow
* [(_)](https://github.com/edrlab/thorium-reader/commit/0dacd9a2f1aae18cb73b30529e2fa4f9e47c2896) __chore(NPM):__ package updates, notably Divina github: dependency without lockfile patching for integrity sha, all checked with SocketSecurityFirewall and NPM Audit (note minor TypScript configs update for TS-Jest)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8ab47d721a49c09f1e42840a244cfa1e6aab783b) __chore(dev):__ Flox/Nix lockfile manifest update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/819f893ff1c7831d9593781871ded6758ec80a2d) __chore(CI):__ GitHub Actions Workflows, one for Pull Requests (just build/lint), the other for push to develop branch (build/lint, package, upload release)
* [(_)](https://github.com/edrlab/thorium-reader/commit/7cb542e680f92436ee101e4bf7417f0bb2bc1c9c) __chore(dev):__ explicit --allow-git=root so as to not rely entirely on magic .npmrc root-level config file
* [(_)](https://github.com/edrlab/thorium-reader/commit/511d7ff4f666731598ea63a11185183eda8630d2) __chore(dev):__ allow-git=root in .npmrc (testing CI without explicit command line flag)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b8b071a6407f5cc5c050a2ea69bc7f212654d001) __chore(CI):__ automated builds were broken due to copy-paste from another project name (GitHub repo release target)
* [(_)](https://github.com/edrlab/thorium-reader/commit/8b315be944b3f559100d8b8da9c22c68dcfe4563) __chore(dev):__ explicit --min-release-age so as to not rely entirely on magic .npmrc root-level config file [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/4450c6ba185e4d5bb582caefe71e45365a6de306) __chore(dev):__ migrated pre/post NPM scripts to explicit calls (mitigates global .npmrc --ignore-scripts=true)
* [(_)](https://github.com/edrlab/thorium-reader/commit/38269864379af3671fa6e14905b7846046661ae1) __chore(dev):__ NPM RC config ignore-scripts and min-release-age [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/950fc1966809e0b515af0793597e79f2e8dd3490) __fix(storage):__ missing type guard error messages in publication storage cleanup
* [(_)](https://github.com/edrlab/thorium-reader/commit/613192ee8e330ddd96bc9bda63c3e50ea439a5bd) __fix(publication):__ the database record is removed only after publication storage cleanup succeeds (PR [#3574](https://github.com/edrlab/thorium-reader/pull/3574) Fixes [#3542](https://github.com/edrlab/thorium-reader/issues/3542))
* [(_)](https://github.com/edrlab/thorium-reader/commit/023d817abd4c7bd746b022fa364e1ef8da6193ca) __fix(storage):__ design of the storage settings tab (PR [#3561](https://github.com/edrlab/thorium-reader/pull/3561) Fixes [#3555](https://github.com/edrlab/thorium-reader/issues/3555))
* [(_)](https://github.com/edrlab/thorium-reader/commit/03cd176a6f39ec855428eb623355dbe8d48b168f) __fix(a11y):__ Omit display of "No information about prerecorded audio is available" (PR [#3570](https://github.com/edrlab/thorium-reader/pull/3570) Fixes [#3563](https://github.com/edrlab/thorium-reader/issues/3563))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6ab10d683b33616a4e8f37d8816265ec2d8e28ec) __chore(NPM):__ package dependency updates, checked with Socket Security Firewall in addition to NPM audit, direct dependencies versions analysed with Taze in addition to NPM outdated
* [(_)](https://github.com/edrlab/thorium-reader/commit/5cf87fa209e0b4006ef31b93ba725033b47ffb32) __chore(dev):__ Flox/Nix lockfile update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/d6af1a83bcc5f3bee70893fe39a4e79a9e00edf1) __fix(l10n):__ removed unused locale key `accessibility.importFile` (see `header.importTitle`) was caused by https://github.com/edrlab/thorium-reader/commit/b48c4b5b1e7c42eb9dac300517389384bf9232f7
* [(_)](https://github.com/edrlab/thorium-reader/commit/97c6860ae04fb2a01639bf02ad03b02697c7177e) __fix(l10n):__ added new locale Hebrew [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/9bfd19efb5da7dcaf0833df3a1a0dafa1d04193d) __fix(l10n):__ updated translation via Weblate - Swedish (PR [#3565](https://github.com/edrlab/thorium-reader/pull/3565))
* [(_)](https://github.com/edrlab/thorium-reader/commit/57f886d1457e0f823dc22214e9a3ab425499dc72) __fix(l10n):__ updated translations via Weblate - Hebrew, Spanish, Chinese (Simplified Han script) (PR [#3557](https://github.com/edrlab/thorium-reader/pull/3557))
* [(_)](https://github.com/edrlab/thorium-reader/commit/7eb85cfc95a9d0e50c58f01c832184a89a9d695e) __fix:__ LCP streaming (PR [#3556](https://github.com/edrlab/thorium-reader/pull/3556) Fixes [#3390](https://github.com/edrlab/thorium-reader/issues/3390))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0e45cc23c6877deb7bcb4a7688eaab3bc95791bc) __chore(CI):__ remove unnecessary shell output [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/8429c46bdbbf1715dd94c872ea525a3da97cc6e9) __chore(dev):__ TypeScript lib.DOM should be excluded in main process but currently included because transitive dependency automatically imports the DOM types
* [(_)](https://github.com/edrlab/thorium-reader/commit/78306d209bab361d593980a67df8e58cb3fa1afb) __chore(CI):__ ensure repository owner is "edrlab" [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/23d82a36021f1dd954c305a4aacab0bfb5040d25) __chore(NPM):__ package updates
* [(_)](https://github.com/edrlab/thorium-reader/commit/b23f0bb408cfd18a2688cdf377450d53f9b7df89) __fix(publication-storage):__ review async file storage (Fixes [#3554](https://github.com/edrlab/thorium-reader/issues/3554))
* [(_)](https://github.com/edrlab/thorium-reader/commit/99b9aafd2367241a305b04b66c37e7752e68ed83) __chore(dev):__ Flox/Nix update [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/496afabde6ea9fd2568819dced48d10df2c43385) __fix(publication-storage):__ review publication extension usage
* [(_)](https://github.com/edrlab/thorium-reader/commit/5970550444f904fe91338e05e83c8bf2cdb3c1c7) __chore(CI):__ pin GitHub Actions actions/setup-node and actions/checkout [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/43f5f5989548b148713eedebbe9adc9fa628dc80) __fix(l10n):__ updated translations via Weblate - Lithuanian, Estonian, Turkish, Danish, Italian, Finnish (PR [#3530](https://github.com/edrlab/thorium-reader/pull/3530))
* [(_)](https://github.com/edrlab/thorium-reader/commit/67482b271c8e7af0c6bdde064a55a58f2e5710d2) __fix(publication-storage):__ centralize directory lookup caching (PR [#3548](https://github.com/edrlab/thorium-reader/pull/3548) Fixes [#3545](https://github.com/edrlab/thorium-reader/issues/3545))
* [(_)](https://github.com/edrlab/thorium-reader/commit/77dbf08fb377cd716a11b1a71fbfe947b80d7216) __fix(uuid):__ add crypto.getRandomValues fallback (Fixes [#357](https://github.com/edrlab/thorium-reader/issues/357))
* [(_)](https://github.com/edrlab/thorium-reader/commit/201072387417dba78828a287ef03a5964c0aad9b) __fix(uuid):__ use globalThis.crypto (Fixes [#3547](https://github.com/edrlab/thorium-reader/issues/3547))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0546ca6ba0a1e8e60be5d247ed7243ae34316d94) __fix(library):__ add missing publication file picker API module (follow-up b48c4b5)
* [(_)](https://github.com/edrlab/thorium-reader/commit/b48c4b5b1e7c42eb9dac300517389384bf9232f7) __fix(library):__ move publication file selection to main-process API [#3550](https://github.com/edrlab/thorium-reader/issues/3550)
* [(_)](https://github.com/edrlab/thorium-reader/commit/228c877e0e6ad4c7175d53e86a6f359785f9cfbb) __fix(uuid):__ explicit string type assertion on the UUID template literal type
* [(_)](https://github.com/edrlab/thorium-reader/commit/58f034745b450c6cdcf3e21aa40c8185b04d2bf8) __fix(publication-storage):__ storePublicationBook set directory size instead of book size
* [(_)](https://github.com/edrlab/thorium-reader/commit/52d587a58bc23eaa77279e620d7048adfd6812dd) __chore(dev):__ replace uuid package with native randomUUID (Fixes [#3547](https://github.com/edrlab/thorium-reader/issues/3547))
* [(_)](https://github.com/edrlab/thorium-reader/commit/28f315243affc2701ed0620921723742f17d2c48) __fix(uuid):__ canonicalize publication UUIDs reads from disk
* [(_)](https://github.com/edrlab/thorium-reader/commit/45f8923c1e9800c9eaeb88afe68a4f199a553879) __fix(publication):__ recovery procedure for publications present on disk but missing from the database (PR [#3543](https://github.com/edrlab/thorium-reader/pull/3543) Fixes [#3394](https://github.com/edrlab/thorium-reader/issues/3394))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e0f3f1e9889b819d02c3926805a47a675b58aa46) __feat(logs):__ add appendFileRotation helper to rotate logs over 1 MB (PR [#3539](https://github.com/edrlab/thorium-reader/pull/3539) Fixes [#3429](https://github.com/edrlab/thorium-reader/issues/3429))
* [(_)](https://github.com/edrlab/thorium-reader/commit/36e66a428fda9d6bdef5ee8a410f54874b9e9c57) __fix(note):__ remove the wrong TODO comment regarding the starting condition for drawing notes (Fixes [#3507](https://github.com/edrlab/thorium-reader/issues/3507))
* [(_)](https://github.com/edrlab/thorium-reader/commit/78701e4affb229a245c61551412248ff3c2323b1) __fix(UI/catalog-menu):__ dispatch a toast error when publication folder is missing on OpenFolder button (Fixes [#3532](https://github.com/edrlab/thorium-reader/issues/3532))
* [(_)](https://github.com/edrlab/thorium-reader/commit/6a300ae69a4a7f1b427186daaec70625e0306268) __fix:__ refresh all publications after reading status or storage directory changes (PR [#3537](https://github.com/edrlab/thorium-reader/pull/3537) Fixes [#3536](https://github.com/edrlab/thorium-reader/issues/3536))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0a2c91c6df7a6600c6b86bfdaa29cc27ac6b55b8) __fix(a11y):__ fix crash caused by missing type guard in accessModeSufficient
* [(_)](https://github.com/edrlab/thorium-reader/commit/f156fa48cf60176c3556efb47c31acb962c54ee1) __fix(ui):__ guard unavailable publications from opening (PR [#3535](https://github.com/edrlab/thorium-reader/pull/3535) Fixes [#3531](https://github.com/edrlab/thorium-reader/issues/3531))
* [(_)](https://github.com/edrlab/thorium-reader/commit/f80a3e3db30650c3ad8c3c5f1108fa37e18c2c5c) __feat(publication-storage):__ add a configurable external publication storage in Library Settings (PR [#3529](https://github.com/edrlab/thorium-reader/pull/3529) Fixes [#3506](https://github.com/edrlab/thorium-reader/issues/3506))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d3f8c9fd99db81311dff6b6609c0a4de2af60abb) __fix(dev):__ Electron/Fuses checks
* [(_)](https://github.com/edrlab/thorium-reader/commit/42ac0e93aa24fb90460f6369c3e0cf6cdc4b70b2) __chore(dev):__ non-critical Electron version sync (unused script) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/823d411d0742d574fd7c1e2d8ece7d15adf375db) __fix(a11y):__ add aria-label to differentiate reader vs. library/main application settings (PR [#3527](https://github.com/edrlab/thorium-reader/pull/3527) Fixes [#3145](https://github.com/edrlab/thorium-reader/issues/3145))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e453456b2e7c436b209bc4931add343ded975c2a) __fix(GUI):__ incorrect checkbox state in custom profile dialog (PR [#3525](https://github.com/edrlab/thorium-reader/pull/3525) Fixes [#3520](https://github.com/edrlab/thorium-reader/issues/3520) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/dfa1dcbfc336f1e69e3bf7045cd94bebbf8b3820) __fix(l10):__ Discord URL update + i18next interpolation (Fixes [#3528](https://github.com/edrlab/thorium-reader/issues/3528))
* [(_)](https://github.com/edrlab/thorium-reader/commit/e1c0e9faf44b371ca925c64ebe565eddc7557f77) __fix(l10n):__ updated translations via Weblate - Estonian, Swedish (PR [#3521](https://github.com/edrlab/thorium-reader/pull/3521))
* [(_)](https://github.com/edrlab/thorium-reader/commit/b5b1d1dd8c6b59e3f3861857b25cf0c5328d981d) __fix(a11y):__ support substring matching for accessModeSufficient metadata
* [(_)](https://github.com/edrlab/thorium-reader/commit/88451bfc499e2cac1475fd22b48b4e67202556e7) __fix:__ accessibility metadata access mode sufficient match (Fixes [#3219](https://github.com/edrlab/thorium-reader/issues/3219) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/70d72cb1514819215ace3cb7c93a0ce8b37a85b9) __fix:__ EPUB Accessibility metadata access mode sufficient (some) was incorrect / not matching the specification (See [#3219](https://github.com/edrlab/thorium-reader/issues/3219) ) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/44afef32964f710d79fa5f40fb64cb1b5db44060) __fix:__ EPUB package.opf XML publication metadata can list multiple languages, the first one can be RTL (e.g. Arabic) yet the page-progression-direction may be LTR (default/auto) (Fixes [#3519](https://github.com/edrlab/thorium-reader/issues/3519) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/bf6bef9f2e122b09c6c0ec30b31d52b288a16872) __chore(NPM):__ updated package dependencies
* [(_)](https://github.com/edrlab/thorium-reader/commit/9f1529c4c08660529b25c49471fa9dadb7129e6a) __fix(l10n):__ updated translations via Weblate - Italian, Spanish, Finnish, Estonian (PR [#3501](https://github.com/edrlab/thorium-reader/pull/3501))
* [(_)](https://github.com/edrlab/thorium-reader/commit/198b8fb33fd606e11d741dd50ec3a6a386517df1) __chore(dev):__ Flox/Nix lockfile [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/96c5c00c059c1a958b1f54f18bde43684dfcbb43) __chore(dev):__ create a script to convert annotation state from 3.1.x to .annotation files (target [#3472](https://github.com/edrlab/thorium-reader/issues/3472))
* [(_)](https://github.com/edrlab/thorium-reader/commit/5befb6403b1f0202e72f54143c1f0ce12daba4f1) __fix(l10n):__ updated translations via Weblate - Italian, French, Russian (PR [#3499](https://github.com/edrlab/thorium-reader/pull/3499))
* [(_)](https://github.com/edrlab/thorium-reader/commit/bd52782d23da12a6aee6443bb9c4ac1d0b22758e) __fix(GUI):__ hide text input field when no search available in OPDS feed (PR [#3500](https://github.com/edrlab/thorium-reader/pull/3500) Fixes [#3457](https://github.com/edrlab/thorium-reader/issues/3457))
* [(_)](https://github.com/edrlab/thorium-reader/commit/0ea65b8e766031e747630d8bafffa1ed2ff26a9b) __fix(l10n):__ add missing translation for "display column headers" (PR [#3498](https://github.com/edrlab/thorium-reader/pull/3498) Fixes [#3487](https://github.com/edrlab/thorium-reader/issues/3487))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c94e64c6026fd29b4ddeb26e79d231de6778b35c) __fix(a11y):__ notes (annotations/bookmarks) creator input label settings (PR [#3497](https://github.com/edrlab/thorium-reader/pull/3497) Fixes [#3492](https://github.com/edrlab/thorium-reader/issues/3492))
* [(_)](https://github.com/edrlab/thorium-reader/commit/c9da412d8ca8873f50a372af854818cf9d34d891) __fix(a11y):__ aria-label for reduce/increase font size buttons in the reader settings (PR [#3496](https://github.com/edrlab/thorium-reader/pull/3496) Fixes [#3493](https://github.com/edrlab/thorium-reader/issues/3493))
* [(_)](https://github.com/edrlab/thorium-reader/commit/d464ecd21138cd471f33d21ca2f67418298b13b1) __fix(l10n):__ updated translations via Weblate - Portuguese (Portugal), Russian, Finnish (PR [#3495](https://github.com/edrlab/thorium-reader/pull/3495))
* [(_)](https://github.com/edrlab/thorium-reader/commit/1a63f33b6a5be9a131f1a2a75081fa8d9f3edee3) __chore(dev):__ NPX ==> npm exec --no --offline (@electron/fuses local node_modules installation dev NPM package dependency) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f777851d30a8dc5b0858b627b4f6deb1816fc0f1) __feat:__ experimental support for EPUB Media Overlays TextFragments (highlighting works, bi-directional click-on-text-to-play doesn't as there is no ID lookup on the element ancestor chain)
* [(_)](https://github.com/edrlab/thorium-reader/commit/36e770ed71f3f13646eadd16f0efcb78a2d62bdc) __chore(dev):__ updated TextFragment polyfill (currently unused, initially tested to create TextFragments for DOMRanges when exporting annotation selectors) [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/c4aa4d57a99822a7d8b6f07280606281400b03e7) __feat:__ EPUB Media Overlays highlights now optionally using TTS styles (Fixes [#3460](https://github.com/edrlab/thorium-reader/issues/3460) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/6c53e05ee3329f7032763ba5f5365fe6549f40ed) Merge remote-tracking branch 'refs/remotes/origin/develop' into develop
* [(_)](https://github.com/edrlab/thorium-reader/commit/3d379c335bb22e70b024c8c16c31abe09884d81c) __feat:__ users can now disable TTS sentence/word highlighting (one or the other, or both) (Fixes [#3459](https://github.com/edrlab/thorium-reader/issues/3459) )
* [(_)](https://github.com/edrlab/thorium-reader/commit/d226c9fdc2c36b0a9962340ae03650c56edcf50a) __chore(dev):__ removed double semi colons [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/f949ef19ef998ddf5da32bf6e5ab81d2917de76d) __fix(l10n):__ updated translations via Weblate - Italian, Swedish, Italian (PR [#3490](https://github.com/edrlab/thorium-reader/pull/3490))
* [(_)](https://github.com/edrlab/thorium-reader/commit/42e8d2c371a3accf17b96c9c84698dcd0d238b6e) __chore(NPM):__ updated package dependencies (checked with SFW Socket Security Firewall and NPM Audit)
* [(_)](https://github.com/edrlab/thorium-reader/commit/0fc529e661261139676ec9339cb0004a5c4b341a) __chore(dev):__ Zed code editor auto-format [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/2d108329fb4f763ad29268c98534eec74aa3e841) __chore(CI):__ latest GitHub Actions for checkout and setup-node, also persist-credentials disabled (unnecessary)
* [(_)](https://github.com/edrlab/thorium-reader/commit/5e96483f65ab9ce4811bbae9996b584cb7ab4058) __fix(dev):__ GitHub Actions Workflow CI YAML script with GITHUB_TOKEN forwarded to 'env' and associated 'permissions' now not hoisted to job anymore, but scoped to step
* [(_)](https://github.com/edrlab/thorium-reader/commit/24b0e49704b912402ab3a9aad27d3f7ebab368f9) __chore(dev):__ commented-out DevTron now with modern @electron/devtron package [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/41f8f1afb9ba0719a4cf2136b17fc992d3b42a7f) __chore(dev):__ remove unused code [skip ci]
* [(_)](https://github.com/edrlab/thorium-reader/commit/30f120f09c34651b0391f63b24dcfac27095460e) __chore(post-release):__ version bump to 3.4.1-alpha.1
* [(_)](https://github.com/edrlab/thorium-reader/commit/4526850e726a5030ecb4de2fda33502c0c1ceec1) __chore(release):__ latest.json [skip ci]

__Developer Notes__:

* The [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog) utility (`npx standard-changelog --first-release`) somehow only generates a limited number of commits, so we use a one-liner command line / shell script instead:
* `git --no-pager log --decorate=short --pretty=oneline v3.4.0...v3.5.0 | cut -d " " -f 1- | sed -En '/^([0-9a-zA-Z]+)[[:space:]]([^:]+):(.+)$/!p;s//\1 __\2:__\3/p' | sed -En 's/^(.+)$/* \1/p' | sed -En '/PR[[:space:]]*#([0-9]+)/!p;s//PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/\(#([0-9]+)/!p;s//(PR [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/pull\/\1)/gp' | sed -En '/(Fixes|See|Fix|Fixed)[[:space:]]*#([0-9]+)/!p;s//\1 [#\2](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\2)/gp' | sed -En '/^.[[:space:]]([0-9a-zA-Z]+)[[:space:]]/!p;s//* [(_)](https:\/\/github.com\/edrlab\/thorium-reader\/commit\/\1) /p' | sed -En '/[[:space:]]#([0-9]+)/!p;s// [#\1](https:\/\/github.com\/edrlab\/thorium-reader\/issues\/\1)/gp'`
* ...append `| pbcopy` on MacOS to copy the result into the clipboard.
* ...append `| wc -l` to verify that the result actually matches the number of Git commits.
