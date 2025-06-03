// const path = require('path');

const { validate } = require("schema-utils");
const schema = {
    type: "object",
    properties: {
        forbids: {
            "anyOf": [
                { "type": "array", "items": { "type": "string" } },
                { "type": "string" },
                // { "instanceof": "RegExp" },
            ],
        },
    },
};

function handler(source) {
    const options = this.getOptions();
    validate(schema, options, "webpack-loader-scope-checker");

    const forbids = Array.isArray(options.forbids) ? options.forbids : [options.forbids];

    if (this.resourcePath.indexOf("node_modules") < 0) {
        // console.log("webpack-loader-scope-checker: ", this.resourcePath);

        for (const forbid of forbids) {
            if (this.resourcePath.indexOf(`${forbid}`) >= 0) {
                throw new Error(
                    `######### CODE SCOPE!! [${forbid}] => ${this.resourcePath}`
                );
            }
        }
    }

    return source;
}

module.exports = handler;
