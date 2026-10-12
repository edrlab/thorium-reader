// Changelog (2026-09-30): keep generated plural variants aligned with Weblate's CLDR categories.
//
// Scanner algorithm:
// 1. Extract each translation key used by the TypeScript source code.
// 2. Inspect the key's parent object in the English reference locale.
// 3. If valid plural siblings such as `_one` and `_other` already exist, emit those siblings into
//    the generated locale instead of the unsuffixed base key; otherwise, emit the original key.
//
// Locale-sync algorithm:
// 1. Read every cardinal category exposed by Intl.PluralRules for the locale. This is the same
//    CLDR category set used by i18next and Weblate, including categories such as French `_many`.
// 2. Cache the resulting suffix set for each language and expose it through overridePluralRules.
// 3. When this file is loaded as the i18next-locales-sync config, the override keeps generated
//    locale keys aligned with the plural forms managed by Weblate.
//
// The require.main check keeps the two uses separate: executing this file runs the scanner, while
// requiring it as a module only exports the locale-sync configuration.

const util = require('util');
var fs = require("fs");
var path = require("path");
var glob = require("glob");

var jsonUtils = require("./json-utils");

const pluralSuffixOrder = ["zero", "one", "two", "few", "many", "other"];
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

    const suffixes = new Set(pluralRules.resolvedOptions().pluralCategories);
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
