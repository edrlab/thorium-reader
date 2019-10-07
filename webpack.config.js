const util = require('util');

const mainConfig = require("./webpack.config.main");
const rendererConfig = require("./webpack.config.renderer");
const readerConfig = require("./webpack.config.reader");
const preloadConfig = require("./webpack.config.preload");

console.log("-------------------- MAIN config:");
console.log(util.inspect(mainConfig, { colors: true, depth: null, compact: false }));

console.log("-------------------- RENDERER config:");
console.log(util.inspect(rendererConfig, { colors: true, depth: null, compact: false }));

console.log("-------------------- READER config:");
console.log(util.inspect(readerConfig, { colors: true, depth: null, compact: false }));

console.log("-------------------- PRELOAD config:");
console.log(util.inspect(preloadConfig, { colors: true, depth: null, compact: false }));

module.exports =  [
    mainConfig,
    rendererConfig,
    readerConfig,
    preloadConfig
];
