const mainConfig = require("./webpack.config.main");
const rendererConfig = require("./webpack.config.renderer");
const readerConfig = require("./webpack.config.reader");
console.log(mainConfig);
console.log(rendererConfig);
console.log(readerConfig);
module.exports =  [
    mainConfig,
    rendererConfig,
    readerConfig
];
