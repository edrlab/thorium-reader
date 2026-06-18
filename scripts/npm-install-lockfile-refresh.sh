#!/bin/sh

# https://www.npmjs.com/package/npm-scripts-lifecycle
# https://app.unpkg.com/npm-scripts-lifecycle@1.0.0/files/package.json

npm cache clear --force
rm -rf node_modules/ && rm -f package-lock.json && sfw npm install --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root && npm run build:prod

npm audit
npm outdated
(npm exec --no --offline -- taze --maturity-period 3 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd . && npm exec --no --offline -- taze major --maturity-period 3 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .) || echo OK

# npm install --foreground-scripts
# TODO: preinstall, install and postinstall NPM lifecycle hooks for Electron, fsevents, ParcelWatcher, etc.?

cd node_modules/electron && node install.js && cd -
#cd node_modules/fsevents && node install.js && cd -
