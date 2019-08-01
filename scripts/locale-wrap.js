const util = require('util');
var fs = require("fs");
var path = require("path");

const args = process.argv.slice(2);
const jsonSrcPath = args[0];
const jsonDstPath = args[1];
const jsonSrcTxt = fs.readFileSync(path.join(process.cwd(), jsonSrcPath), { encoding: "utf8" });
const jsonDstObj = { "en": { "translation": JSON.parse(jsonSrcTxt) } };
console.log(util.inspect(jsonDstObj, { colors: true, depth: null, compact: false }));
const jsonDstTxt = JSON.stringify(jsonDstObj, null, "    ") + "\n";
fs.writeFileSync(path.join(process.cwd(), jsonDstPath), jsonDstTxt, { encoding: "utf8" });
