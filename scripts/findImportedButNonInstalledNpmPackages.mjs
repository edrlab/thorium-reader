import fs from "fs";
import path from "path";

const importedNpmPackages = new Set();
// /^@lunr-languages\//
const ignoreds = [/^@r2-.+-js\//, /^test\//, /^readium-desktop\//, /^fs/, /^url/, /^path/, /^util/, /^os/, /^https?/, /^assert/, /^crypto/, /^node:/];

const regExp_fileExt = /\.tsx?$/i;
const regExp_imports = /\s+(from|require)\s+["']([^\.][^"']+)["']/g;

async function processDir(folderPath) {
    const fileNames = await fs.promises.readdir(folderPath);
    for (const fileName of fileNames) {
        const filePath = path.join(folderPath, fileName);
        const stat = await fs.promises.stat(filePath);
        if (stat.isFile() && regExp_fileExt.test(path.extname(fileName))) {
            const src = await fs.promises.readFile(filePath, { encoding: "utf8" });
            const matches = src.matchAll(regExp_imports);
            for (const match of matches) {
                let captured = match[2];
                if (captured.startsWith("@lunr-languages")) {
                    captured = captured.substring(1);
                }
                if (!ignoreds.find((ignored) => ignored.test(captured))) {
                    // console.log("--> ", JSON.stringify(match, null, 4));
                    const slashIndex = captured.indexOf("/");
                    if (slashIndex > 0) {
                        if (!captured.startsWith("@")) {
                            captured = captured.substring(0, slashIndex);
                        } else {
                            const slashIndex2 = captured.indexOf("/", slashIndex + 1);
                            if (slashIndex2 > 0) {
                                captured = captured.substring(0, slashIndex2);
                            }
                        }
                    }
                    // console.log("============> ", captured);
                    importedNpmPackages.add(captured);
                }
            }
        } else if (stat.isDirectory()) {
            await processDir(filePath);
        }
    }
}
let errored = false;
try {
    await processDir(path.join(process.cwd(), "src"));
    // importedNpmPackages.forEach((imported) => console.log(imported));
    const jsonStr = await fs.promises.readFile(path.join(process.cwd(), "package.json"), { encoding: "utf8" });
    const json = JSON.parse(jsonStr);
    // console.log(JSON.stringify(json.dependencies, null, 4));
    // console.log(JSON.stringify(json.devDpendencies, null, 4));
    // console.log(JSON.stringify(json.peerDpendencies, null, 4));
    const deps = Object.keys(json.dependencies).concat(Object.keys(json.devDependencies).concat(Object.keys(json.peerDependencies || {})));
    for (const importedNpmPackage of importedNpmPackages) {
        if (!deps.find((dep) => dep === importedNpmPackage)) {
            console.error("Package imported but not in package.json dependencies!", importedNpmPackage);
            errored = true;
        }
    }
} catch (err) {
    console.error("ERROR!");
    console.error(err);
    errored = true;
}
if (errored) {
    process.exit(1);
} else {
    console.log("OK :)");
    process.exit(0);
}
