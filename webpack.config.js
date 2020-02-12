const util = require('util');

const mainConfig = require("./webpack.config.main");
const libraryConfig = require("./webpack.config.renderer-library");
const readerConfig = require("./webpack.config.renderer-reader");
const preloadConfig = require("./webpack.config.preload");

console.log("-------------------- MAIN config:");
console.log(util.inspect(mainConfig, { colors: true, depth: null, compact: false }));

console.log("-------------------- LIBRARY config:");
console.log(util.inspect(libraryConfig, { colors: true, depth: null, compact: false }));

console.log("-------------------- READER config:");
console.log(util.inspect(readerConfig, { colors: true, depth: null, compact: false }));

console.log("-------------------- PRELOAD config:");
console.log(util.inspect(preloadConfig, { colors: true, depth: null, compact: false }));

module.exports =  [
    mainConfig,
    libraryConfig,
    readerConfig,
    preloadConfig
];
