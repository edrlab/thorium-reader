const mainConfig = require("./webpack.config.main");
const rendererConfig = require("./webpack.config.renderer");
console.log(mainConfig);
module.exports =  [
    mainConfig,
    rendererConfig,
];
