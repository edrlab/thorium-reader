const util = require('util');
var fs = require("fs");
var path = require("path");
var jsonUtils = require("r2-utils-js/dist/es8-es2017/src/_utils/JsonUtils");

const collapsePluralKeys = (obj) => {
    if (typeof obj === "string") {
        return;
    }
    if (typeof obj !== "object") { // ??
        return;
    }
    const keys = Object.keys(obj);
    for (const key of keys) {
        const val = obj[key];
        if (typeof val !== "string") {
            collapsePluralKeys(val);
            continue;
        }
        // https://github.com/i18next/i18next/blob/485b4ec8183952b3de8fe5e79dff6467c3afd9d3/src/PluralResolver.js#L4-L11
        // https://jsfiddle.net/6bpxsgd4
        //
        if (key.endsWith("_zero") ||
            key.endsWith("_one") ||
            key.endsWith("_two") ||
            key.endsWith("_few") ||
            key.endsWith("_many") ||
            key.endsWith("_other")) {
            const collapsedKey = key.replace(/_[^_]+$/, "");
            if (!obj[collapsedKey]) {
                obj[collapsedKey] = obj[key];
            }
            delete obj[key];
        }
    }
};

const args = process.argv.slice(2);
const jsonSrcPath = args[0];
const jsonDstPath = args[1];
const jsonSrcTxt = fs.readFileSync(path.join(process.cwd(), jsonSrcPath), { encoding: "utf8" });
let obj = JSON.parse(jsonSrcTxt);
collapsePluralKeys(obj);
obj = jsonUtils.sortObject(obj);
const jsonDstObj = { "en": { "translation": obj } };
console.log(util.inspect(jsonDstObj, { colors: true, depth: null, compact: false }));
const jsonDstTxt = JSON.stringify(jsonDstObj, null, "    ") + "\n";
fs.writeFileSync(path.join(process.cwd(), jsonDstPath), jsonDstTxt, { encoding: "utf8" });
