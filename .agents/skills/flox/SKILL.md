---
name: flox
description: "Learn how to use Flox to manage a development environment with Nix packages"
---

# Flox, the `flox` command line tool

If there is a `.flox` subfolder inside the project's root directory, the software development project is configured to use (Flox)[https://flox.dev] to setup the environment. Flox defines the locally-scoped requirements specifically for this project folder. Flox is not required, there are other methods to configure a suitable global or local development environment (for example Homebrew, DevEnv, Mise, etc.).

The command `flox activate` reads the configuration file `./.flox/env/manifest.toml` which defines initialization tasks, such as making project-related commands available in the shell with a higher order to precedence on the PATH than the system-wide commands (e.g. `node`, `npm`, `sfw`, `jq`, `python`, `go`, etc.). Flox project fetches dependencies from Nix packages.

For instance in the case of a NodeJS project, the Flox initialization script typically configures the NPM "cache" and "prefix" directories locally in this project folder, so as to not pollute the global operating system scope. For example the folders `./.flox/cache/NPM_CACHE/` and `./.flox/cache/NPM_PREFIX/` will contain a large number of files so the entire directory `./.flox/cache/` is git-ignored, and the `npm cache clear --force` "global" command will in fact act locally in this project's folder.

Troubleshooting notes, reseting cached data:

- `rm -rf .flox/cache/ && rm -rf .flox/log/ && rm -rf .flox/run/` (nukes project-local folders, the files will be recreated at the next `flox activate`).
- `rm -rf ~/.cache/flox/ && rm -rf ~/.local/share/flox/ && rm -rf ~/.local/state/flox/` (nukes user-local Flox-related folders).
- `flox gc ; nix-store --gc --print-roots ; nix-store --gc ; nix --extra-experimental-features nix-command store gc ; nix-collect-garbage --delete-older-than 1d` (nukes global operating system Flox/Nix stores).

Other possibly-useful commands (the Nix store is a complicated system!):

- `nix-store --optimise ; nix --extra-experimental-features nix-command store optimise`
- `nix --extra-experimental-features nix-command store verify --all`
- `nix --extra-experimental-features nix-command store repair` or `sudo nix-store --verify --check-contents --repair`
