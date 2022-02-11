const util = require('util');

const mainConfig = require("./webpack.config.main");
const libraryConfig = require("./webpack.config.renderer-library");
const readerConfig = require("./webpack.config.renderer-reader");
const pdfConfig = require("./webpack.config.renderer-pdf");
const preloadConfig = require("./webpack.config.preload");

// console.log("-------------------- MAIN config:");
// console.log(util.inspect(mainConfig, { colors: true, depth: null, compact: false, customInspect: true }));

console.log("-------------------- LIBRARY config:");
console.log(util.inspect(libraryConfig, { colors: true, depth: null, compact: false, customInspect: true }));

// console.log("-------------------- READER config:");
// console.log(util.inspect(readerConfig, { colors: true, depth: null, compact: false, customInspect: true }));

// console.log("-------------------- PDF config:");
// console.log(util.inspect(pdfConfig, { colors: true, depth: null, compact: false, customInspect: true }));

// console.log("-------------------- PRELOAD config:");
// console.log(util.inspect(preloadConfig, { colors: true, depth: null, compact: false, customInspect: true }));

module.exports =  [
    mainConfig,
    libraryConfig,
    readerConfig,
    pdfConfig,
    preloadConfig
];
