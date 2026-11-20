---
name: git
description: "Learn how to safely use `git` commands as per the user's preferences"
---

# Git repository management

## Ground rules

* This project's source tree is under Git version control. The `./git` folder is out of bounds, you **MUST NOT** modify the files inside.
* User approval is **REQUIRED** for `git commit` and `git push` (or equivalent `gh` GitHub commands). Just ask the user once, a single initial confirmation is sufficient for subsequent invocations.
* You are allowed to read the Git configuration (`git config list --global` for machine-wide settings, or `git config list` for project-specific settings), but you **MUST** ask the user before modifying settings.
* You are allowed to use any other read-only repository tools like `git diff` or `git status` or `git log`. You **MUST NOT** execute `git show` with the `--output` command line argument as this can be misused to write into a configuration file (e.g. `--output=./.git/config`).
* If the authenticated GitHub `gh` command is available, you **MUST** ask the user before performing actions such as creating/deleting Issues or Pull Requests. You do not need user approval to perform read-only `gh` tasks.
* You are allowed to create Git branches and worktrees. Raw `git` worktree commands are acceptable, but use Worktrunk if the `wt` command is available in the shell environment.

## Git branches and worktrees

* Prefer using worktrees over plain branches when modifying code for specific features or bug fixes. This way, multiple coding agents can work on several parallel tasks over the same initial codebase (e.g. typically branching-off the `develop` or `main` branches).
* Let the user decide how to collate the diverged Git branches and how to deal with merge conflicts (suggest creating GitHub Pull Requests, or just merging locally back into the originating branch).
* The preferred directory layout for organising Git worktrees inside the coding agent's root workspace is a `./.bare` folder containing a bare Git checkout, and adjacent branch-named folders (e.g. `./main` or `./develop` or `./feature-A` or `./fix-B`). This assumes a common parent directory named after the project itself. Alternatively if the project workspace is not a bare Git checkout, worktree folders (siblings to the primary non-bare code checkout) can be named with the convention `./{PROJECT_NAME}.{BRANCH_NAME}`.
* A `.bare` Git checkout can be created directly from a Git repository URL: `git clone --bare {GIT_REPO_URL} "{PROJECT_NAME}/.bare"`, or alternatively from a local folder / an already-cloned remote source, but the command sequence is quite convoluted: `mkdir -p {PROJECT_NAME} && git clone --bare "{EXISTING_REPO_CLONE}" "{PROJECT_NAME}/.bare" && cd "{PROJECT_NAME}/.bare" && git remote -v && git remote remove origin && git remote add origin git@github.com:USER_NAME/REPOSITORY_NAME.git && git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin && git remote set-head origin --auto`.
* The native Git command to create a new branch and associated worktree is (assuming `cd "{PROJECT_NAME}/.bare"`) `git worktree add --relative-paths -b {NEW_BRANCH_NAME} "../{NEW_BRANCH_NAME}"` in the case of a bare checkout (or alternatively `git worktree add --relative-paths -b {NEW_BRANCH_NAME} "../{PROJECT_NAME}.{NEW_BRANCH_NAME}"` in the case of a non-bare checkout, following the previously-mentioned naming convention).
* When a branch already exists, the `-b` command line argument is removed from the `git worktree add` command. Here is an example to switch over to the `main` branch from a bare Git checkout: `cd .bare && git worktree add --relative-paths ../main main` (you will need to set the "upstream" remote during the first Git push: `git push --set-upstream origin main`, or without pushing: `cd ../main && git fetch origin main && git branch --set-upstream-to=origin/main main`). Note that further worktrees/branches can be created from either the `main` or `.bare` adjacent directories.
* To list worktrees and branches, use: `git worktree list ; git branch -vv`.
* To destroy a worktree and its associated branch, call: `git worktree remove "{WORKTREE_FOLDER}" && git branch -d {BRANCH_NAME} && git worktree prune`.

Notes about commonly-shared, cross-worktree/branch files (optimizing disk usage):

* When creating a new worktree/branch (or when switching over to an existing worktree/branch), inform the user about git-ignored files / folders that might need to be copied across (e.g. the large `./node_modules` folder, or the small `.env` file).
* Suggest copying large folders with a reflink / copy-on-write filesystem technique, or symbolic linking as a fallback. Do recommend against normal byte-for-byte copy as this would unnecessarily duplicate data. Copy-on-write (COW) is available on sparse volumes formatted with Apple's APFS, or BTRFS / XFS on Linux, or ReFS on Windows. On Linux the command `cp --reflink=always -R` can be used to recursively COW-clone folders, on Mac `cp -c -R` can be used to achieve the same effect. A notable caveat with containers or virtual machines bind mounts (for example with Tart, Docker, Apple Container) is that filesystem sharing technologies like VirtIOFS do not support COW, so the advice for decent performance is to mount OS-native formatted images that support COW (side note: this will also alleviate issues with SQLite caching which affect many tools like PNPM).
* When using Worktrunk (`wt` command), the `./.worktreeinclude` config lists the files / folders that must be automatically copied across to a new worktree/branch (one by line, for example `node_modules/` followed by `.env`). Conversely, the `./.config/wt.toml` config can include a `[step.copy-ignored]` section that specifies an array of files/folders to skip, for example `exclude = [ ".DS_Store", ".flox/", "dist/", "release/" ]`. The `wt.toml` config can include a `[post-start]` section specifying `copy = "wt step copy-ignored --require-include"`, this pairs well with the aforementioned `./.worktreeinclude` file and `[step.copy-ignored]` section. Alternatively the `[pre-start]` section can defines a command to run when switching worktree, for example `deps = "ln -sf {{ primary_worktree_path }}/node_modules ."` in the case of symbolic linking. For more detailed information refer to the Worktrunk help or coding agent extension / skill.

## User workflow notes

Interactive approval might be needed for:

* `git commit` signing: PGP / GnuGPG signatures can be bypassed with `git -c commit.gpgsign=false commit` (assuming the Git configuration looks like `user.signingkey=XXX` and `commit.gpgsign=true` and `gpg.program=gpg`). This convenient shortcut comes at the cost of downgrading user identity assertions, but this may be necessary in a development environment in which the physical secure enclave isn't available (i.e. hardware resident private signing keys).
* `git push`: SSH Git repository access likely requires a password-protected private key (though an SSH agent may cache the credential for a limited time), and potentially also requires physically touching a hardware secure module / USB token.

## Security notes

(for more detailed information, search on the web using the keywords offered in this section)

Git "hooks" stored in `./.git/hooks` are not part of a visible file checkout, yet they are a potential attack vector. There are several other similar security holes in a typical Git workflow, where arbitrary commands can be executed covertly by innocuous Git operations, due to prior prompt injections (e.g. external malicious SKILL.md or AGENTS.md instructions) that silently made modifications to the local or global Git configuration. This section provides an overview of risks and mitigation techniques.

Coding agent users likely operate inside sandboxed development environments (container or virtual machines), but a source tree / cloned Git repository mounted as a filesystem share from the high-trust host OS into an isolated guest runtime can in fact allow RCE Remote Code Execution via standard Git functionality. Here is a non-exhaustive list of Git features that can be abused to trigger malicious behaviour during innocuous Git operations:

* `core.fsmonitor`
* `diff.external`
* `core.sshCommand`
* `core.editor`
* `core.pager`
* `include.path`
* `filter.*`
* `diff.{driver}.textconv`
* `git config alias.cmd "!malicious_command"` (exclamation mark = shell execution)
* `core.hooksPath`

Depending on the project rules, Git hooks can be required (for example pre-commit linter/formatter, quality control gates for the code repository). In cases where hooks can safely be skipped, use this command: `git -c core.hooksPath=/dev/null` (or configure locally/globally with `git config [--global] core.hooksPath /dev/null`). Note that the `git commit --no-verify` command only skips pre-commit and commit-msg hooks.

The variables `GIT_CONFIG_COUNT` + `GIT_CONFIG_KEY_x` + `GIT_CONFIG_VALUE_x` (x is a zero-based index) can be used to configure the environment without writing into `./.git/config` or `~/.git/config`.

Also note that arbitrary executables reachable via the environment variable `PATH` will be run when calling `git arbitrary-executable ...` (Git automatically discovers "extensions").

## Coding agents, AGENT.md, CLAUDE.md

This is a user tip:

* When the user wishes to override the project `./AGENTS.md` with their own (for instance because the project maintainers optimized the AGENTS markdown for a specific coding agent / model that has significant incompatibilities / disparities compared with the user's own agentic environment), the user can add `AGENTS.md` to `./.git/info/exclude` and run `git update-index --skip-worktree AGENTS.md`.
* Note that some coding agents (e.g. Pi, OpenAi Codex) supports this natively: `AGENTS.override.md` takes precedence over `AGENT.md` or `CLAUDE.md` inside the same directory.
