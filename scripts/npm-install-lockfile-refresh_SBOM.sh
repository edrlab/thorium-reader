#!/bin/sh

# https://www.npmjs.com/package/npm-scripts-lifecycle
# https://app.unpkg.com/npm-scripts-lifecycle@1.0.0/files/package.json

node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/"devDependencies":/g, `"devDependencies_":`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });'

cp package-lock.json package-lock-ORIGINAL.json

mv node_modules/ node_modules_ORIGINAL/

rm -f package-lock.json && npm install --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root

npm audit
npm outdated
(npm exec --no --offline -- taze --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd . && npm exec --no --offline -- taze major --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .) || echo OK

rm -rf node_modules/
mv node_modules_ORIGINAL/ node_modules/

node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/"devDependencies_":/g, `"devDependencies":`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });'

cp package-lock.json package-lock-SBOM.json
cp package-lock-ORIGINAL.json package-lock.json
