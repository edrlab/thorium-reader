const util = require('util');
var fs = require("fs");
var path = require("path");
var glob = require("glob");

var jsonUtils = require("r2-utils-js/dist/es8-es2017/src/_utils/JsonUtils");

const args = process.argv.slice(2);
const jsonFilePath = args[0];

const files = glob.globSync("src/**/*{.ts,.tsx}");

    if (!files || !files.length) {
        console.log("files?!");
        process.exit(1);
    }
    console.log(files.length);

    let totalMatch = 0;
    const keys = [];

    for (const file of files) {
        const fileTxt = fs.readFileSync(path.join(process.cwd(), file), { encoding: "utf8" });

        // (\.translate|__)\s*\(\s*['"]\s*([^'"]+)['"]
        const regex = new RegExp(`([\\.| |\\(]translate|__)\\s*\\(\\s*['"]([^'"]+)['"]`, "g");

        let regexMatch = regex.exec(fileTxt);
        while (regexMatch) {
            totalMatch++;
            const key = regexMatch[2];
            if (!keys.includes(key)) {
                keys.push(key);
                console.log(key);
            } else {
                console.log(`-- duplicate: ${key}`);
            }
            regexMatch = regex.exec(fileTxt);
        }

        // // dispatchToastRequest\s*\(\s*ToastType\.[^"']+['"]([^'"]+)['"]
        // const regex2 = new RegExp(`dispatchToastRequest\\s*\\(\\s*ToastType\\.[^"']+['"]([^'"]+)['"]`, "g");

        // regexMatch = regex2.exec(fileTxt);
        // while (regexMatch) {
        //     totalMatch++;
        //     const key = regexMatch[1];
        //     if (!keys.includes(key)) {
        //         keys.push(key);
        //         console.log(key);
        //     } else {
        //         console.log(`-- duplicate: ${key}`);
        //     }
        //     regexMatch = regex2.exec(fileTxt);
        // }
    }

    console.log(`${keys.length} (${totalMatch})`);

    let jsonObj = {};
    for (const key of keys) {
        let jsonRoot = jsonObj;
        const props = key.split(".");
        if (!props || !props.length) {
            console.log(`props?! ${props}`);
            continue;
        }
        for (const prop of props) {
            if (!prop || !prop.length) {
                console.log(`prop?! ${prop}`);
                continue;
            }
            if (!jsonRoot[prop]) {
                jsonRoot[prop] = {};
            }
            jsonRoot = jsonRoot[prop];
        }
    }

    jsonUtils.traverseJsonObjects(jsonObj, (obj) => {
        Object.keys(obj).forEach((prop) => {
            if (!Object.keys(obj[prop]).length) {
                obj[prop] = "";
            }
        });
    });
    jsonObj = jsonUtils.sortObject(jsonObj);

    console.log(util.inspect(jsonObj, { colors: true, depth: null, compact: false }));

    const jsonStr = JSON.stringify(jsonObj, null, "  ") + "\n";
    fs.writeFileSync(path.join(process.cwd(), jsonFilePath), jsonStr, { encoding: "utf8" });
