# AGENTS.md

The documentation is for Ai coding harnesses and LLM brains, but also for humans!

## Project technology stack

Thorium Desktop reader is a software application for "desktop" operating systems: Windows, MacOS, and Linux.

- Electron framework = NodeJS for the "backend" and Chromium webview APIs for the "frontend".
- TypeScript programming language (plus some occasional Javascript for utility jobs, and a minute amount of C++ for a native Windows module).
- React user interface, Adobe's React ARIA Components.
- Redux for state management, Redux Saga for side effects orchestration.
- SCSS for styling.
- Webpack as the build system and to provide a debugging / development environment.

NodeJS 22+ and NPM 11+ are required to work on this project.

## How to install software dependencies, SBOM (Software Bill Of Materials)

This project uses NPM (not PNPM, not Bun, not Yarn, etc.)

* Read the ["sfw" skill](./.agents/skills/sfw/SKILL.md) (Socket Security Firewall to safely install dependencies from the NPM package supply chain).
* Read the ["taze" skill](./.agents/skills/taze/SKILL.md) (Taze to check for updates and apply them selectively once approved for the package lockfile).
* Read the ["npx" skill](./.agents/skills/npx/SKILL.md) (NPM "exec" to safely run arbitrary code from the NPM registry, as part of this project's approved dependencies).

Optionally, to learn about using Flox (Nix packages) for setting up the development environment, read the ["flox" skill](./.agents/skills/flox/SKILL.md).

## How to build and run the software, and how to create installers

* Read the ["build" skill](./.agents/skills/build/SKILL.md)
* Read the ["run" skill](./.agents/skills/run/SKILL.md)
* Read the ["release" skill](./.agents/skills/release/SKILL.md)

## Localization / internationalization

* Read the ["localize" skill](./.agents/skills/localize/SKILL.md)
* Read the ["weblate" skill](./.agents/skills/weblate/SKILL.md)

## Source code organisation

The Typescript source tree is located in the `./src` directory, the tests are not colocated, they are inside a separate `./test` folder.

You must ignore the `./.flox/` and `./.git/` directories inside the current working directory, unless explicitly instructed by the user to do so.

You are not allowed to read or write files outside the project folder. Your read/write access to the filesystem is strictly limited to the current working folder, and the operating system's temporary directory.

Changes must be compatible with all three supported operating systems: filesystem paths, keyboard shortcuts, commands, native integrations, etc.

Code styling rules are checked by linting tools executed during a build. The deterministic ESLINT ruleset is combined with a few project-specific ad-hoc checks, for example to flag incorrect usage of `import { xxx } from "src/**/*"` statements instead of `import { xxx } from "readium-desktop/**/*"` Your role is to help remediate reported linting issues, and to apply additional constraints not already expressed via linting:

- Do not introduce unnecessary single-use function wrappers when the code could be inlined instead.
- Avoid writing small trivial tests, focus your tokens on tricky edge cases.
- Refrain from over-commenting when the source code is already sufficiently expressive.
- Prefer `undefined` over `null` for absent optional values when the existing type or runtime contract allows it (note that the TypeScript compiler settings currently do not enforce `strictNullChecks`).

To learn how to organise additional project folders in order to work on features and fixes inside separate worktrees / branches, read the ["git" skill](./.agents/skills/git/SKILL.md).

## Runtime boundaries, codebase scopes

During a code design / programming task, you will need to learn about the source tree structure and logical partitioning. If so, read the ["boundaries" skill](./.agents/skills/boundaries/SKILL.md).
