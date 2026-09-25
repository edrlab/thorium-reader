// Changelog (2026-09-25): detect plural variants without generating duplicate or invalid keys.
//
// Scanner algorithm:
// 1. Extract each translation key used by the TypeScript source code.
// 2. Inspect the key's parent object in the English reference locale.
// 3. If valid plural siblings such as `_one` and `_other` already exist, emit those siblings into
//    the generated locale instead of the unsuffixed base key; otherwise, emit the original key.
//
// Locale-sync algorithm:
// 1. Evaluate Intl.PluralRules for integer counts from 0 through 200. This covers rules based on
//    n, n % 10, and n % 100 while excluding plural categories that are reachable only by decimals.
// 2. Cache the resulting suffix set for each language and expose it through overridePluralRules.
// 3. When this file is loaded as the i18next-locales-sync config, the override prevents invalid
//    integer-count keys such as Lithuanian `_many` and Russian `_other` from being generated.
//
// The require.main check keeps the two uses separate: executing this file runs the scanner, while
// requiring it as a module only exports the locale-sync configuration.
// Reference: https://github.com/mmntm/weblate-mcp/blob/6743b2189755690744592d20cac40943a053816a/src/services/weblate/translations.service.ts#L421-L449

const util = require('util');
var fs = require("fs");
var path = require("path");
var glob = require("glob");

var jsonUtils = require("./json-utils");

const pluralSuffixOrder = ["zero", "one", "two", "few", "many", "other"];
// The referenced integer rules depend on n, n % 10, and n % 100, so this range
// exercises every result without introducing fractional-only plural categories.
const pluralRuleSampleMax = 200;
const referenceLocaleLanguage = "en";
const pluralSuffixCache = new Map();
const referenceLocalePath = path.join(process.cwd(), "src/resources/locales/en.json");
const referenceLocale = JSON.parse(fs.readFileSync(referenceLocalePath, { encoding: "utf8" }));

const getPluralSuffixes = (languageCode) => {
    const locale = languageCode || referenceLocaleLanguage;
    if (pluralSuffixCache.has(locale)) {
        return pluralSuffixCache.get(locale);
    }

    let pluralRules;
    try {
        pluralRules = new Intl.PluralRules(locale);
    } catch {
        pluralRules = new Intl.PluralRules(referenceLocaleLanguage);
    }

    const suffixes = new Set();
    for (let count = 0; count <= pluralRuleSampleMax; count++) {
        suffixes.add(pluralRules.select(count));
    }
    const result = pluralSuffixOrder.filter((suffix) => suffixes.has(suffix));
    pluralSuffixCache.set(locale, result);
    return result;
};

const overridePluralRules = (pluralResolver) => {
    pluralResolver.getSuffixes = (languageCode) =>
        getPluralSuffixes(languageCode).map((suffix) => `_${suffix}`);
    pluralResolver.needsPlural = (languageCode) => getPluralSuffixes(languageCode).length > 1;
};

module.exports = { overridePluralRules };

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

    return getPluralSuffixes(referenceLocaleLanguage)
        .map((suffix) => `${leaf}_${suffix}`)
        .filter((pluralLeaf) => Object.hasOwn(referenceRoot, pluralLeaf))
        .map((pluralLeaf) => [...props, pluralLeaf].join("."));
};

if (require.main === module) {
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

}
