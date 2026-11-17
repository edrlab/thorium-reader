---
name: npx
description: "Learn how to use `npx` or `npm exec` safely (executing arbitrary programs from the NPM package registry)"
---

# NPM execution - `npm exec` / `npx` 

* The `npx` command is a shorthand alias for the `npm exec` command which is available in NPM (NodeJS package manager).
* This command executes arbitrary, potentially unsafe code from the NPM package registry.
* The code fetched by `npx` is imported into the global system-level cache of packages, including all direct and transitive dependencies.
* Unlike project-level package dependencies, this automatically-installed software stack is not subject to a vetted "lockfile". As such, it is an unmitigated software supply chain security risk.
* Conversely, the local project-level `./package-lock.json` (which is derived from the semantic versions defined in `./package.json`) is approved at consecutive points in time by project maintainers.

Strict instruction: **NEVER** use `npx` or `npm exec` for NPM packages that are not included in the project's own `./package.json`. When a package is explicitely declared as a project dependency, then `npx` can be used as follows: `npm exec --no --offline --cache /tmp/empty-npm-cache -- {PACKAGE_NAME} {ADDITIONAL_ARGUMENTS}`. Refer to the "taze" skill which showcases safe `npx` usage.

As the executed NPM package and its dependencies must present locally inside the `./node_modules` folder, safe `npx` usage requires an initial `npm ci` or `npm install` or `npm i`. Refer to the "sfw" skill which explains how to securely fetch NPM package dependencies via the Socket Security Firewall proxy.

If in doubt, ask the user what to do.
