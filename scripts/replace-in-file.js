const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
console.log("REPLACE IN FILE: ", args[0]);
const filePath = path.join(process.cwd(), args[0]);
let fileStr = fs.readFileSync(filePath, { encoding: "utf8" });
// console.log(fileStr.substr(0, 100));
console.log("REGEXP: ", args[1]);
const regex = new RegExp(args[1], "g");
console.log("...WITH: ", args[2]);
fileStr = fileStr.replace(regex, args[2]);
// console.log(fileStr.substr(0, 100));
fs.writeFileSync(filePath, fileStr, { encoding: "utf8" });
