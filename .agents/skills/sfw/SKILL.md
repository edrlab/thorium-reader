---
name: sfw
description: "Learn how to use `sfw` (Socket Security Firewall) in order to manage updates available from the software supply chain"
---

# Socket Security Firewall (`sfw`)

The semantic versions declared inside `./package.json` are pinned to specific versions explicitely listed in the NPM "lockfile" `./package-lock.json` (which also specifies the exact versions of direct and transitive dependencies). In order to safely populate the `./node_modules` folder as per this versioning manifest, **DO NOT** use bare `npm ci` or `npm install` (or the shorthand `npm i`).

- To install everything: `sfw --verbose npm install --ignore-scripts --min-release-age=3 --allow-git=root --foreground-scripts` (refer to the "taze" skill to see how `--maturity-period` matches `--min-release-age`). Swap `npm install` with `npm ci` only if the user asks.
- To update a specific package (and its associated dependencies): `sfw --verbose npm update --ignore-scripts --min-release-age=3 --allow-git=root --foreground-scripts {PACKAGE_NAME}`.
- To fully refresh the NPM lockfile and automatically accept the latest available versions of every packages as per semantic versioning in this project's `./package.json` as well as the package definitions of all direct + transitive dependencies (WARNING: this operation requires user approval): `rm -rf ./node_modules/ && rm -f ./package-lock.json && sfw --verbose npm install --ignore-scripts --min-release-age=3 --allow-git=root --foreground-scripts`

Tip for the user: occasionally in order to troubleshoot rare issues it might be necessary to reset the global NPM cache with the command `npm cache clear --force`. Only tell the user in case of unresolved NPM install/update problems.

Note that the `--ignore-scripts` NPM command line argument can cause warning messages such as "packages had install scripts blocked because they are not covered by allowScripts". When this occurs, run the command `npm install-scripts ls` to review packages, and subsequently ask the user if they want to run `npm install-scripts {approve|deny} {PACKAGE_NAME}`. The local `.npmrc` NPM configuration file can be edited to include `allow-scripts={PACKAGE_NAME}`, or the command line argument `--allow-scripts={PACKAGE_NAME}` can be added after `--ignore-scripts`. Give the user the options, let them decide.
