// Changelog (2026-09-25): detect existing plural variants and avoid generating duplicate base keys.
// For every translation key found in the source code, inspect its parent object in the English
// reference locale. If siblings with i18next plural suffixes (_zero, _one, _two, _few, _many,
// or _other) exist, add those variants to the generated locale instead of the unsuffixed key.
// Otherwise, add the original key unchanged. This makes plural detection data-driven and keeps
// newly introduced plural messages from requiring entries in a hard-coded exception list.

const util = require('util');
var fs = require("fs");
var path = require("path");
var glob = require("glob");

var jsonUtils = require("./json-utils");

const pluralSuffixes = ["zero", "one", "two", "few", "many", "other"];
const referenceLocalePath = path.join(process.cwd(), "src/resources/locales/en.json");
const referenceLocale = JSON.parse(fs.readFileSync(referenceLocalePath, { encoding: "utf8" }));

const getPluralKeys = (key) => {
    const props = key.split(".");
    const leaf = props.pop();
    let referenceRoot = referenceLocale;

    for (const prop of props) {
        referenceRoot = referenceRoot[prop];
        if (!referenceRoot || typeof referenceRoot !== "object") {
            return [];
        }
    }

    return pluralSuffixes
        .map((suffix) => `${leaf}_${suffix}`)
        .filter((pluralLeaf) => Object.hasOwn(referenceRoot, pluralLeaf))
        .map((pluralLeaf) => [...props, pluralLeaf].join("."));
};

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
        const pluralKeys = getPluralKeys(key);
        const keysToAdd = pluralKeys.length ? pluralKeys : [key];

        for (const keyToAdd of keysToAdd) {
            let jsonRoot = jsonObj;
            const props = keyToAdd.split(".");
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

    const jsonStr = JSON.stringify(jsonObj, null, "    ") + "\n";
    fs.writeFileSync(path.join(process.cwd(), jsonFilePath), jsonStr, { encoding: "utf8" });
