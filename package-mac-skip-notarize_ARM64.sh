# rm -rf node_modules/ && rm -f package-lock.json &&\
rm -rf node_modules/electron &&\
npm install --foreground-scripts --arch=arm64 --cpu=arm64 &&\
node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/--x64/g, "--arm64"); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' &&\
CSC_NAME="" CSC_IDENTITY_AUTO_DISCOVERY="false" npm run package:mac:skip-notarize &&\
node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/--arm64/g, "--x64"); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });'
# && file release/mac-arm64/Thorium.app/Contents/MacOS/Thorium
