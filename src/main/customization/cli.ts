
// import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { createProfilePackageZip } from "./packager";

// const debug = debug_("readium-desktop:main#customization/cli");

function main() {
    // console.log(require.main);
    // console.log(process.argv[1]);

    if (process.argv.length !== 5) {
        console.error(`usage: ${process.argv[0]} ${process.argv[1]} --signed=[false|true] inputDirectory outputDirectory`);
        process.exit(1);
    }
    const signed = process.argv[2] === "--signed=true";
    const inputDir = path.resolve(process.cwd(), process.argv[3]);
    const outputDir = path.resolve(process.cwd(), process.argv[4]);

    const resourcesMap: Array<[string, string]> = [];

    const toBeVisit = ["./"];
    while (toBeVisit.length) {

        const dirPath = toBeVisit.shift();
        const dirAbsolutePath = path.join(inputDir, dirPath);
        const fileNameArray = fs.readdirSync(dirAbsolutePath);
        for (const fileName of fileNameArray) {
            const filePath = path.join(dirPath, fileName);
            const fileAbsolutePath = path.join(inputDir, filePath);
            const stat = fs.statSync(fileAbsolutePath);
            if (stat.isDirectory()) {
                toBeVisit.push(filePath);
            } else {
                if (filePath !== "manifest.json")
                    resourcesMap.push([fileAbsolutePath, filePath]);
            }
        }
    } // BFS


    let manifest: ICustomizationManifest;
    try {
        manifest = JSON.parse(fs.readFileSync(path.join(inputDir, "manifest.json"), "utf-8"));
    } catch {
        console.error("manifest not found!!!");
        process.exit(1);
    }


    createProfilePackageZip(manifest, resourcesMap, outputDir, signed, true).then((outPath) => {
        console.log("OUTPUT=", outPath);
    }).catch((e) => console.error("ERROR!? ", e));

}

if (require.main === module) {
  main();
}
