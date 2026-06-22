# rm -rf node_modules/ && rm -f package-lock.json &&\
rm -rf node_modules/electron &&\
npm ci --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root --arch=x64 --cpu=x64 && cd node_modules/electron && DEBUG=@electron/get* force_no_cache=true npm_config_arch=x64 ELECTRON_INSTALL_ARCH=x64 node install.js --arch=x64 --cpu=x64 && cd - &&\
node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/--arm64/g, "--x64"); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' &&\
RELEASE_TAG="xxx" CSC_NAME="" CSC_IDENTITY_AUTO_DISCOVERY="false" npm run package:win
# node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/--x64/g, "--arm64"); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });'
# && file release/mac/Thorium.app/Contents/MacOS/Thorium
