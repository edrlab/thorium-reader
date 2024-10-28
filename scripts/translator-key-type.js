var fs = require("fs");
var path = require("path");

const args = process.argv.slice(2);
const dtsSrcPath = args[0];
const dtsDstPath = args[1];
const dtsSrcTxt = fs.readFileSync(path.join(process.cwd(), dtsSrcPath), { encoding: "utf8" });
let keys = [];
for (const l of dtsSrcTxt.split("\n")) {
    const regexp = /\_\:\ \"(.*?)\"\,\ /g;
    const matches = l.matchAll(regexp);
    const matchesArray = Array(...matches);
    for (const [, key] of matchesArray) {
        console.log(`"${key}" | Line: ${l}`);
        keys.push(key);
    }
}
console.log("Number of keys : ", keys.length);
const dtsDstTxt = `declare namespace typed_i18n_keys {
    type TTranslatorKeyParameter = "${keys.join("\" | \"")}";
}
export = typed_i18n_keys;`;
console.log(dtsDstTxt);
fs.writeFileSync(path.join(process.cwd(), dtsDstPath), dtsDstTxt, { encoding: "utf8" });
