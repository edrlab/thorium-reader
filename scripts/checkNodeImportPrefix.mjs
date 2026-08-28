import fs from "fs";
import path from "path";
import module from "node:module";

// set -xv ; container --version ; container system stop ; container system start ; container system status ; container stop test-container ; container rm --force test-container ; container prune ; container list --all ; container run --cpus 4 --memory 2g --platform linux/arm64 --name test-container --volume ${PWD}:/MOUNT -w /MOUNT registry.access.redhat.com/hi/nodejs:latest sh -c 'set -xv ; node --version ; npm --version ; node scripts/checkNodeImportPrefix.mjs' ; container list --all ; container stop test-container ; container rm --force test-container ; container prune ; container system status ; container system stop ; set +xv

const regExp_fileExt = /\.(mjs|[jt]sx?)$/i;
const regExp_imports = /^(?!\s*\/\/).*((\s+from\s+)|(require\s*\(\s*))["']([^\.][^"']+)["']/gm;

const _builtinModules = module.builtinModules.filter((m) => !m.startsWith("node:"));

async function processDir(folderPath) {
    const fileNames = await fs.promises.readdir(folderPath);
    for (const fileName of fileNames) {
        const filePath = path.join(folderPath, fileName);
        const stat = await fs.promises.stat(filePath);
        const isFile = stat.isFile();
        if (isFile && regExp_fileExt.test(path.extname(fileName))) {
            const src = await fs.promises.readFile(filePath, { encoding: "utf8" });
            const matches = src.matchAll(regExp_imports);
            for (const match of matches) {
                // console.log("--> ", JSON.stringify(match, null, 4));
                let captured = match[4];
                if (_builtinModules.includes(captured)) {
                    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                    console.log(captured);
                    console.log(filePath);
                    console.log(match[0]);
                    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                    errored = true;
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
    await processDir(path.join(process.cwd(), "test"));
} catch (err) {
    console.error("ERROR!");
    console.error(err);
    errored = true;
}
if (errored) {
    console.error(">>>>>>>>>>>>>> NOK :(");
    process.exit(1);
} else {
    console.log(">>>>>>>>>>>>>> OK :)");
    process.exit(0);
}
