#!/bin/sh

npm cache clear --force
rm -rf node_modules/ && rm -f package-lock.json && npm install --ignore-scripts --foreground-scripts && npm run build:prod

# npm install --foreground-scripts
# TODO: preinstall, install and postinstall NPM lifecycle hooks for Electron, fsevents, ParcelWatcher, etc.?

cd node_modules/electron && npm run postinstall && cd -
#cd node_modules/fsevents && npm run postinstall && cd -
