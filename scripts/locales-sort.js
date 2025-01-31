const util = require('util');
var fs = require("fs");
var path = require("path");
var glob = require("glob");

var jsonUtils = require("r2-utils-js/dist/es8-es2017/src/_utils/JsonUtils");

const files = glob.globSync("src/resources/locales/*.json");

    if (!files || !files.length) {
        console.log("files?!");
        process.exit(1);
    }
    console.log(files.length);

    for (const file of files) {
        console.log("#######################");
        console.log(file);
        const p = path.join(process.cwd(), file);
        const fileTxt = fs.readFileSync(p, { encoding: "utf8" });
        let fileJson = JSON.parse(fileTxt);
        fileJson = jsonUtils.sortObject(fileJson);
        console.log(util.inspect(fileJson, { colors: true, depth: null, compact: false }));
        console.log("#######################");
        const jsonStr = JSON.stringify(fileJson, null, "  ") + "\n";
        fs.writeFileSync(p, jsonStr, { encoding: "utf8" });
    }
