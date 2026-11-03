// Match the SVG sprite module shape provided by Webpack without loading SVG markup as JavaScript.
const path = require("node:path");

module.exports = {
    process(source, filename) {
        const sprite = {
            id: path.basename(filename, ".svg"),
            viewBox: source.match(/\bviewBox="([^"]*)"/)?.[1],
        };
        return { code: `module.exports = { __esModule: true, default: ${JSON.stringify(sprite)} };` };
    },
};
