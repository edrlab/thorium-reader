# Thorium Reader

Thorium Reader is an easy to use EPUB reading application for Windows 10/10S, MacOS and Linux. After importing e-books from a directory or OPDS feed, you'll be able to read on any screen size, customize layout settings, navigate via the table of contents or page list, set bookmarks ... A great care is taken to ensure the accessibility of the application for visual impaired people using NVDA, JAWS or Narrator.

Free application. No ads. No private data flowing anywhere.

This project is in constant evolution, corrections and new features will be added soon and your support is welcome for that. The application is based on the open-source Readium Desktop toolkit.

It is currently localized in following languages:
- English
- French
- Portuguese
- Swedish
- Russian
- Lithuanian
- Italian
- Japanese
- Dutch
- Spanish
- German
- Finnish
- Chinese (Simplified + Traditional)
- Korean
- Georgian
- Basque (Euskadi)
- Galician
- Catalan
- Croatian
- Bulgarian
- Greek

See: https://github.com/edrlab/thorium-reader/wiki/Localization-(l10n)-language-translations

![library](img/library.png)
![publication info](img/info.png)
![reader](img/reader.png)

## Prerequisites

1) NodeJS 16 (check with `node --version`)
2) NPM 8 (check with `npm --version`)

## Technologies

* typescript
* electron
* reactjs
* redux
* saga
* i18next

## Quick start

### Install dependencies

* `npm install` (or `npm ci`): initialize local `node_modules` packages from dependencies declared in `package.json` (this will also automatically call a long-running compilation stage in `npm run postinstall`)
* in case of failure to NPM "install" because of "Divina player" SHA integrity mismatch, please try running the following command in your shell: `node scripts/package-lock-patch.js && cat package-lock.json | grep -i divina-player-js`

### Start application in development environment

(with hot-reload dev server, web inspectors / debuggers)

* `npm run start:dev` (or `npm run start:dev:quick` to bypass TypeScript checks / launch the app faster)

### Start application in production environment

* `npm start` (or `npm run start`)

## Build installers

* `npm run package:win` or `npm run package:mac` or `npm run package:linux`

Code Signing information: https://github.com/edrlab/thorium-reader/wiki/Code-Signing

## Command line

```
thorium <cmd> [args]

Commands:
  thorium opds <title> <url>  import opds feed
  thorium import <path>       import epub or lpcl file
  thorium read <title>        searches already-imported publications with the
                              provided TITLE, and opens the reader with the
                              first match
  thorium [path]              import and read an epub or lcpl file     [default]
  thorium completion          generate bash completion script

Positionals:
  path  path of your publication, it can be an absolute, relative path  [string]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```
