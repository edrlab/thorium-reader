const util = require('util');
var fs = require("fs");
var path = require("path");
var glob = require("glob");

var jsonUtils = require("./json-utils");

const files = glob.globSync("src/resources/locales/*.json");

async function writeLocale(p, jsonStr) {
    for (let attempt = 0; ; attempt++) {
        try {
            fs.writeFileSync(p, jsonStr, { encoding: "utf8" });
            return;
        } catch (error) {
            // Windows can briefly deny an open immediately after locale syncing.
            // Only retry failed opens: a failed write may have changed the file.
            if (process.platform !== "win32" || error.syscall !== "open" ||
                !["UNKNOWN", "EBUSY", "EPERM", "EACCES"].includes(error.code) || attempt >= 4) {
                throw error;
            }
            console.warn(`Retrying locale write (${error.code}): ${p}`);
            await new Promise((resolve) => setTimeout(resolve, 100 * (2 ** attempt)));
        }
    }
}

async function main() {
    if (!files || !files.length) {
        console.log("files?!");
        process.exit(1);
    }
    console.log(files.length);

    for (const file of files) {
        console.log("#######################");
        console.log(file);
        const p = path.join(process.cwd(), file);
        const fileTxt = fs.readFileSync(p, { encoding: "utf8" });
        let fileJson = JSON.parse(fileTxt);
        fileJson = jsonUtils.sortObject(fileJson);
        console.log(util.inspect(fileJson, { colors: true, depth: null, compact: false }));
        console.log("#######################");
        const jsonStr = JSON.stringify(fileJson, null, "    ") + "\n";
        if (fileTxt !== jsonStr) {
            await writeLocale(p, jsonStr);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
