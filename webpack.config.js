const mainConfig = require("./webpack.config.main");
const rendererConfig = require("./webpack.config.renderer");
const readerConfig = require("./webpack.config.reader");
const preloadConfig = require("./webpack.config.preload");

console.log("-------------------- MAIN config:");
console.log(mainConfig);

console.log("-------------------- RENDERER config:");
console.log(rendererConfig);

console.log("-------------------- READER config:");
console.log(readerConfig);

console.log("-------------------- PRELOAD config:");
console.log(preloadConfig);

module.exports =  [
    mainConfig,
    rendererConfig,
    readerConfig,
    preloadConfig
];
