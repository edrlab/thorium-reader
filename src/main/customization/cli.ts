
// import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { customizationManifestJsonSchema, ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { createProfilePackageZip } from "./packager";

// do not import "./provisioning" : build chain too heavy, lots of unused import
// import { __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS, isCustomizationProfileManifest } from "./provisioning";

let __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = "";
function isCustomizationProfileManifest(data: any): data is ICustomizationManifest {

    const ajv = new Ajv();
    addFormats(ajv);

    const valid = ajv.validate(customizationManifestJsonSchema, data);

    __CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}

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

    if (!isCustomizationProfileManifest(manifest)) {

        console.error(__CUSTOMIZATION_PROFILE_MANIFEST_AJV_ERRORS);
        process.exit(1);
    }

    const manifestResources: string[] = [];

    for (const img of manifest.images || []) {
        const href = img.href;
        if (href.startsWith("./")) {
            manifestResources.push(path.join("./", href));
        }
    }
    for (const ln of manifest.links || []) {
        const href = ln.href;
        if (href.startsWith("./")) {
            manifestResources.push(path.join("./", href));
        }
    }
    for (const pub of manifest.publications || []) {
        for (const ln of (pub as any).images || []) {
            const href = ln.href;
            if (href.startsWith("./")) {
                manifestResources.push(path.join("./", href));
            }
        }
        for (const ln of (pub as any).links || []) {
            const href = ln.href;
            if (href.startsWith("./")) {
                manifestResources.push(path.join("./", href));
            }
        }
    }
    // TODO: Do you need to block external request (http) to ressources, local only !?

    const resourcesFiltered = resourcesMap.filter(([, filePath]) => manifestResources.includes(filePath));

    console.log("ressourcesMapFromDirectory:");
    console.log(resourcesMap)

    console.log("manifestRessources:");
    console.log(manifestResources);

    console.log("resourcesFiltered:");
    console.log(resourcesFiltered);

    createProfilePackageZip(manifest, resourcesFiltered, outputDir, signed, true).then((outPath) => {
        console.log("OUTPUT=", outPath);
    }).catch((e) => console.error("ERROR!? ", e));

        // await createZip(packagePath, resourcesMapFs, [[manifestBuffer, "manifest.json"]]);

}

if (require.main === module) {
  main();
}
