---
name: build
description: "Learn how to build the application"
---

# Build the application

- To quickly check the entire TypeScript codebase, execute `npm run typescript-check-TSRS` and `npm run typescript-check-GO`. These commands use the TypeScript 7 Rust and Go implementations, respectively. The slower TypeScript 6 version (Javascript implementation) remains available to confirm errors observed with the Rust or Go implementations: `npm run typescript-check`.
- To perform the full suite of linting checks, execute `npm run lint`. This computationally-expensive operation is a prerequisite before committing code to the repository, but is not necessary during active development / programming iterations. This linting command executes the following sequence: Eslint (for TypeScript checks), stylelint (for CSS), and an ad-hoc checker for NodeJS-prefixed imports. The Eslint checks are slow, the other ones are rapid. Note that Oxlint checks are performed alongside Eslint based on a similar ruleset. Oxlint is an order of magnitude faster (20x) but unfortunately Oxlint does not implement the full spectrum of Eslint checks in this project (see for example the Redux Saga rules).
- Prettier / Oxfmt formatting checks and auto-fixes are currently not invoked during linting, but text editors may apply the project's configuration.
- A Git pre-commit hook is currently not activated but the command `npm run pre-commit-hook` is available to perform a fast minimal set of checks (compilation and linting without Eslint).
- When CSS / SCSS files are modified, make sure to execute the command `npm run style-typed` in order to regenerate the TypeScript-backed TSX classnames.
- Execute `npm run build` to validate a development sprint before committing results to the repository (do not only rely on TypeScript checks). This computationally-expensive operation is a full webpack build that generates transpiled Javascript and application artifacts into the `./dist` folder.

The above instructions apply to the entire codebase, and are generally considered the most adequate formal verification process. However note that the full Webpack build can be broken down into smaller discrete compilation units. Consider using the following options to scope verification steps for individual components, labelled in uppercase for each bullet point heading:

- MAIN PROCESS: `./node_modules/.bin/webpack-cli --config webpack.config.main.js`. Compiles for the Electron main process (i.e. files located inside the `./src/main` directory, and the entry point file `./src/main.ts` itself).
- PRELOAD: `./node_modules/.bin/webpack-cli --config webpack.config.preload.js`. Compiles for the Electron webview preload script (i.e. files located inside the `./src/r2-xxx-js` directory, and more specifically the entry point file `./src/r2-xxx-js/r2-navigator-js/electron/renderer/webview/preload.ts`).
- RENDERER PROCESS LIBRARY: `./node_modules/.bin/webpack-cli --config webpack.config.renderer-library.js`. Compiles for the "library" Electron browser window (i.e. files located inside the `./src/renderer/library` directory, more specifically the entry point file `./src/renderer/library/index_library.ts`, but also the `./src/renderer/common` and `./src/renderer/asset` folders which are shared).
- RENDERER PROCESS READER: `./node_modules/.bin/webpack-cli --config webpack.config.renderer-reader.js`. Compiles for the "reader" Electron browser window (i.e. files located inside the `./src/renderer/reader` directory, more specifically the entry point file `./src/renderer/library/index_reader.ts`, but also the `./src/renderer/common` and `./src/renderer/asset` folders which are shared).
- RENDERER PDF: `./node_modules/.bin/webpack-cli --config webpack.config.pdf.js`. Compiles for the PDF.js webview inside the "reader" Electron browser window (i.e. files located inside the `./src/renderer/reader/pdf/webview` directory, including more specifically the entry point file `./src/renderer/reader/pdf/webview/index_pdf.ts` itself).
- RENDERER PDF EXTRACT: `./node_modules/.bin/webpack-cli --config webpack.config.pdf-extract.js`. Compiles for the PDF.js integration inside the "reader" Electron browser window used to extract cover images when importing PDF files (also files located inside the `./src/renderer/reader/pdf` directory, but more specifically the entry point file `./src/renderer/reader/pdf/webview/index_pdf_extract.ts`).

Ask the user if you have doubts about which command to use after modifying files. Offer the different choices in a self-descriptive list of options.
