# https://github.com/SocketDev/sfw-free/issues/3

npm cache clear --force &&\
rm -rf node_modules/ &&\
cp package.json package-sfw-backup.json &&\
cp package-lock.json package-lock-sfw-backup.json ;\
rm -f package-lock.json &&\
# node -e 'const path = require("path"); const fs = require("fs"); const filePath = path.join(process.cwd(), "package.json"); let fileStr = fs.readFileSync(filePath, { encoding: "utf8" }); fileStr = fileStr.replace(/^\s+"readium-speech":.+$/gm, ""); fileStr = fileStr.replace(/^\s+"divina-player-js":.+$/gm, ""); fileStr = fileStr.replace(/^\s+"pdf\.js":.+$/gm, `"pdf.js": "latest",`); fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });' &&\
git --no-pager diff package.json &&\
sfw npm install --foreground-scripts ;\
cp package-lock-sfw-backup.json package-lock.json ;\
cp package-sfw-backup.json package.json ;\
rm -rf node_modules/ &&\
git status
