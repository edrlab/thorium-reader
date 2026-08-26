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

cd node_modules/electron && DEBUG=@electron/get* force_no_cache=true node install.js && cd -
#cd node_modules/fsevents && DEBUG=@electron/get* force_no_cache=true node install.js && cd -

# set -xv ; container --version ; container system stop ; container system start ; container system status ; container stop test-container ; container rm --force test-container ; container prune ; container list --all ; container run --cpus 4 --memory 2g --platform linux/arm64 --name test-container --volume ${PWD}:/MOUNT -w /MOUNT registry.access.redhat.com/hi/nodejs:latest sh -c 'set -xv ; node --version ; npm --version ; echo $PATH ; env ; npm install --global npm ; ls -als /usr/local/lib/node_modules ; export NODE_PATH=/usr/local/lib/node_modules ; export PATH="/usr/loca/bin:$PATH" ; echo $PATH ; npm --version ; npm config get cache ; npm config get prefix ; npm install --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root pac-proxy-agent' ; container list --all ; container stop test-container ; container rm --force test-container ; container prune ; container system status ; container system stop ; set +xv
