---
name: build
description: "Learn how to build the application"
---

# Build the application

- To quickly check the entire TypeScript codebase, execute `npm run typescript-check-GO`. This uses the TypeScript 7 Go implementation. If the command fails, execute the slower TypeScript 6 version to confirm errors: `npm run typescript-check`.
- To perform the full suite of linting checks, execute `npm run lint`. This computationally-expensive operation is a prerequisite before committing code to the repository, but is not necessary during active development / programming iterations. This linting command executes the following sequence: Eslint (for TypeScript checks), stylelint (for CSS), and an ad-hoc checker for NodeJS-prefixed imports.
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
