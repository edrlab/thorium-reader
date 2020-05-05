// const path = require('path');

const { getOptions } = require("loader-utils");
const validateOptions = require("schema-utils");

const schema = {
    type: "object",
    properties: {
        forbid: {
            type: "string",
        },
    },
};

function handler(source) {
    const options = getOptions(this);

    if (this.resourcePath.indexOf("node_modules") < 0) {
        // console.log("webpack-loader-scope-checker: ", this.resourcePath);
        if (this.resourcePath.indexOf(`src/renderer/${options.forbid}/`) >= 0) {
            throw new Error(
                `######### CODE SCOPE!! [${options.forbid}] => ${this.resourcePath}`
            );
        }
    }

    validateOptions(schema, options, "webpack-loader-scope-checker");

    return source;
}

module.exports = handler;
