#!/bin/sh

# https://www.npmjs.com/package/npm-scripts-lifecycle
# https://app.unpkg.com/npm-scripts-lifecycle@1.0.0/files/package.json

node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/"devDependencies":/g, `"devDependencies_":`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });'

cp package-lock.json package-lock-ORIGINAL.json

mv node_modules/ node_modules_ORIGINAL/

rm -f package-lock.json && npm install --ignore-scripts --foreground-scripts

rm -rf node_modules/
mv node_modules_ORIGINAL/ node_modules/

node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/"devDependencies_":/g, `"devDependencies":`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });'

cp package-lock.json package-lock-SBOM.json
cp package-lock-ORIGINAL.json package-lock.json
