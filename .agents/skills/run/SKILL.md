---
name: run
description: "Learn how to run the application"
---

# Run the application

- The command `npm run start:dev:quick` launches the application with the WebPack development server to dynamically debug the React frontend (Electron Chromium renderer process, hot module reloading capabilities with in-memory Javascript, HTML and CSS). The Javascript bundle for the Electron NodeJS main process (as well as other application artifacts) is generated statically on the filesystem into the `./dist` folder (no fast refresh, must close and relaunch the application in order to test code changes).
- The command `npm run start` launches the application without debugging capabilities (this calls `npm run build`). This might be needed to validate bundling-related changes in the application code or configuration.
- Call `npm run clean` to clear the `./dist` folder, especially when switching between `npm run start` (or `npm run build`) and `npm run start:dev:quick`.
