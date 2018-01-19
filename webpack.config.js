const mainConfig = require("./webpack.config.main");
const rendererConfig = require("./webpack.config.renderer");
console.log(mainConfig);
console.log(rendererConfig);
module.exports =  [
    mainConfig,
    rendererConfig,
];
