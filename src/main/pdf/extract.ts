import { resolve } from "path";
import { pdfJsFolderPath } from "readium-desktop/common/constant";
import * as fs from "fs";

export const extract = async (pdfPath: string = "/home/pierre/Documents/edrlab/thorium_resources/compressed.tracemonkey-pldi-09.pdf") => {

    const p = resolve(pdfJsFolderPath, "build", "pdf.js");
    // const pdfjsLib = require(p);
    // const pdfjsLib = await module.createRequire(__dirname)(p);
    // const pdfjsLib = await import(p);
    // const pdfjsLib = await import(`/${p}`);
    const pdfjsLib = eval(`require('${p}');`);

    const CMAP_URL = resolve(p, "../../cmaps/")
    const CMAP_PACKED = true;

    console.log("$$$$$$$$$$$$$$$4");
    console.log("$$$$$$$$$$$$$$$4");
    console.log("$$$$$$$$$$$$$$$4");
    console.log("$$$$$$$$$$$$$$$4");
    console.log("$$$$$$$$$$$$$$$4");
    console.log(pdfjsLib);

    console.log("$$$$$$$$$$$$$$$4");
    console.log("$$$$$$$$$$$$$$$4");
    var data = new Uint8Array(fs.readFileSync(pdfPath))

    var loadingTask = pdfjsLib.getDocument({
        data,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
    });

    console.log(loadingTask);
    // console.log(await loadingTask.promise);

    console.log("$$$$$$$$$$$$$$$4");
    console.log("$$$$$$$$$$$$$$$4");

};
