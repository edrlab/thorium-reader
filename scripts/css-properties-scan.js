var fs = require("fs");
var path = require("path");
var glob = require("glob");

const regexpDeclareVar = /(--[a-z][a-z0-9_-]+)\s*:/gi;
const regexpUseVar = /(--[a-z][a-z0-9_-]+.*?)[^a-z0-9_-]/gi;

const files = glob.globSync("src/**/*{.ts,.tsx,.scss,.svg,.css,.html,.sass,.htm,.md,.js}");
// const files = glob.globSync("src/**/*{.scss,.css,.sass}");
// const files = glob.globSync("src/**/*.scss");
// const files = glob.globSync("src/**/*{.ts,.tsx}");

if (!files || !files.length) {
console.log("files?!");
process.exit(1);
}
console.log(files.length);
const setDeclareVar = new Set();
const setUseVar = new Set();
const setUseVarWithoutDeclare = new Set();

// ICustomizationManifestColor
["neutral", "primary", "secondary", "border", "background", "appName", "scrollbarThumb", "buttonsBorder"].forEach((key) => {
  setDeclareVar.add(`--theme-${key}_${"light"}`);
  setDeclareVar.add(`--theme-${key}_${"dark"}`);
});

for (const file of files) {
// console.log("#######################");
// console.log(file);
const p = path.join(process.cwd(), file);
const fileTxt = fs.readFileSync(p, { encoding: "utf8" });
const matchesDeclareVar = fileTxt.matchAll(regexpDeclareVar);
for (const matchDeclareVar of matchesDeclareVar) {
// console.log("--> ", JSON.stringify(matchDeclareVar, null, 4));
  setDeclareVar.add(matchDeclareVar[1]);
}
const matchesUseVar = fileTxt.matchAll(regexpUseVar);
for (const matchUseVar of matchesUseVar) {
// console.log("--> ", JSON.stringify(matchUseVar, null, 4));
  setUseVar.add(matchUseVar[1]);
}
// console.log("#######################");
}
const blockListStartWith = ["--inspect", "--protocolHandler", ,"--remote", "--js"];
const blockList = ["--theme-", "--transforms", "--IRangeInfo", "--debug", "--config", "--version", "--ts-ignore", "--signed", "--pending", "--experimental-network-inspector", "--gtk-version", "--help"];
for (const useVar of setUseVar) {
  if (!setDeclareVar.has(useVar) && !blockListStartWith.find((prefix) => useVar.startsWith(prefix)) && !blockList.includes(useVar)) {
    setUseVarWithoutDeclare.add(useVar);
  }
}
console.log("DECLARATIONS #######################");
console.log("--> ", JSON.stringify(Array.from(setDeclareVar).sort(), null, 4));
console.log("USAGES #######################");
console.log("--> ", JSON.stringify(Array.from(setUseVar).sort(), null, 4));
console.log("USAGES WITHOUT DECLARE #######################");
console.log("--> ", JSON.stringify(Array.from(setUseVarWithoutDeclare).sort(), null, 4));
