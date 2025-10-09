# https://github.com/SocketDev/sfw-free/issues/3

npm cache clear --force ;\
# rm -rf node_modules/ ;\
mv node_modules/ node_modules__/ ;\
cp package.json package-sfw-backup.json ;\
cp package-lock.json package-lock-sfw-backup.json ;\
rm -f package-lock.json ;\

# https://github.com/readium/speech/blob/build/package.json
node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/^\s+"readium-speech":.+$/gm, ""); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' ;\

# https://github.com/edrlab/divina-player-js/blob/thorium/build/package.json https://github.com/edrlab/divina-player-js/blob/4e1f859afb14b916923ec136af0284a72e22a990/package.json
node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/^\s+"divina-player-js":.+$/gm, `"hammerjs": "^2.0.8", "pixi.js-legacy": "^5.3.9",`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' ;\

# PDF.js https://github.com/edrlab/pdf.js/tree/build https://github.com/edrlab/pdf.js/blob/ed14f255842aa972d6df4812ac12d3123066d7b1/package.json ====> https://www.npmjs.com/package/pdfjs-dist https://app.unpkg.com/pdfjs-dist@5.4.296/files/package.json
# node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/^\s+"pdf\.js":.+$/gm, `"pdfjs-dist": "latest",`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' ;\
node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/^\s+"pdf\.js":.+$/gm, ""); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' ;\

git --no-pager diff package.json ;\
# SFW_DEBUG=true
sfw npm install --foreground-scripts ;\
cp package-lock-sfw-backup.json package-lock.json ;\
cp package-sfw-backup.json package.json ;\
# rm -rf node_modules/ ;\
mv node_modules__/ node_modules/ ;\
git status
