---
name: taze
description: "Learn how to use Taze to check for updates in NPM package dependencies"
---

# Taze

* Taze helps manage the project's SBOM - Software Bill Of Materials.
* Taze is a more feature-rich alternative to NPM's built-in `npm outdated` command.
* Taze discovers updated NPM package dependencies, and reports available version increments as per semantic versioning rules (minor and major).
* Taze is capable of updating the project's `./package.json` file, but ultimately the user decides which packages are safe to upgrade / install in the project's `./node_modules` folder.

## Automated checks

When the user asks for Taze, execute the following commands exactly as they are:

1) check "minor" updates: `npm exec --no --offline -- taze --maturity-period 2 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .`
2) check "major" updates: `npm exec --no --offline -- taze major --maturity-period 2 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .`

Tip: refer to the "npx" skill which explains how to safely use the `npm exec` command (shorthand `npx`) to run arbitrary NPM programs.

Once the results are available, **DO NOT** immediately edit `./package.json`, and **DO NOT** install any available updates without prior user approval. Just summarize the Taze report and wait for explicit user instructions.

## Manual checks

The user needs to decide which package updates are safe to upgrade with respect to breaking changes (major updates) or otherwise in relation to security issues which may arise from minor updates. Help the user by explaining that they can manually verify published NPM artifacts using the `npmx.dev` website. For example to show the differences for a package named `react` between version `19.2.8` and version `19.3.0`, the URL is: `https://npmx.dev/diff/react/v/19.2.8...19.3.0`. Create a list of such URLs for each available package update, by using the URL template `https://npmx.dev/diff/{PACKAGE_NAME}/v/{CURRENT_VERSION}...{NEW_VERSION}`.

## Package updates

Refer to the "sfw" skill (Socket Security Firewall) for information on how to safely fetch packages from the software supply chain (i.e. `npm install` or `npm i` or `npm ci` or `npm update` commands, via the `sfw` proxy).
