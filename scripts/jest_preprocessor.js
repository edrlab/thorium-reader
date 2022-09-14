// const crypto = require("crypto");
const tsJest = require("ts-jest");
const tsJestTransformer = tsJest.default.createTransformer();

const webpackConfig = require("../webpack.config-preprocessor-directives");
// console.log(webpackConfig.definePlugin.definitions);
const preProcessorKeys = Object.keys(webpackConfig.definePlugin.definitions);

module.exports = {
    // getCacheKey: function(fileData, filename, ...rest) {
    //     console.log(`================ JEST TRANSFORM CACHE KEY: ${filename}`);

    //     const tsJestCacheKey = tsJest.getCacheKey(fileData, filename, ...rest);

    //     return crypto.createHash('md5')
    //         .update(tsJestCacheKey)
    //         .update(filename)
    //         .digest('hex');
    // },
    process: function (src, filename, ...rest) {
        src = tsJestTransformer.process(src, filename, ...rest).code;

        let needsPatching = false;
        for (const key of preProcessorKeys) {
            needsPatching = src.indexOf(key) >= 0;
            if (needsPatching) {
                // console.log(`================ JEST TRANSFORM PROCESS: ${filename}`);
                break;
            }
        }
        // if (needsPatching) {
        //     console.log("--- BEFORE: ---");
        //     console.log("--- BEFORE: ---");
        //     console.log("--- BEFORE: ---");
        //     console.log("--- BEFORE: ---");
        //     console.log(src);
        //     console.log("--- /BEFORE ---");
        //     console.log("--- /BEFORE ---");
        //     console.log("--- /BEFORE ---");
        //     console.log("--- /BEFORE ---");
        // }

        preProcessorKeys.forEach((key) => {
            const value = webpackConfig.definePlugin.definitions[key];

            if (src.indexOf(key) >= 0) {
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log(`------> : ${key} => ${value}`);
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");
                // console.log("------>");

                const regexp = new RegExp(`${key}`, "g");
                // console.log(regexp);

                src = src.replace(regexp, value);

                if (src.indexOf(key) >= 0) {
                    console.log("???????????");
                    console.log("???????????");
                    console.log("???????????");
                    console.log("???????????");
                    console.log("???????????");
                    console.log("???????????");
                    console.log("???????????");
                    console.log("???????????");
                    console.log(`------> : ${key} => ${value}`);
                    console.log(regexp);
                }
            }
        });

        // if (needsPatching) {
        //     console.log("--- AFTER: ---");
        //     console.log("--- AFTER: ---");
        //     console.log("--- AFTER: ---");
        //     console.log("--- AFTER: ---");
        //     console.log(src);
        //     console.log("--- /AFTER ---");
        //     console.log("--- /AFTER ---");
        //     console.log("--- /AFTER ---");
        //     console.log("--- /AFTER ---");
        // }

        return {code: src};
    }
};
