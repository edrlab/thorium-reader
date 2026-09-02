import fs from "fs";
import path from "path";

const js = fs.readFileSync(path.join(process.cwd(), "scripts/Math-sumPrecise.js"), { encoding: "utf8" });

const pdfJS1_path = path.join(process.cwd(), "node_modules/pdf.js/build/gh-pages/build/pdf.mjs");
const pdfJS1 = fs.readFileSync(pdfJS1_path, { encoding: "utf8" });
if (pdfJS1.indexOf("@licstart The") >= 0) {
    const pdfJS1_ = pdfJS1.replace("@licstart The", "@licstart*/\n\n" + js + "\n\n/*The");
    fs.writeFileSync(pdfJS1_path, pdfJS1_, { encoding: "utf8" });
}

const pdfJS2_path = path.join(process.cwd(), "node_modules/pdf.js/build/gh-pages/build/pdf.worker.mjs");
const pdfJS2 = fs.readFileSync(pdfJS2_path, { encoding: "utf8" });
if (pdfJS2.indexOf("@licstart The") >= 0) {
    const pdfJS2_ = pdfJS2.replace("@licstart The", "@licstart*/\n\n" + js + "\n\n/*The");
    fs.writeFileSync(pdfJS2_path, pdfJS2_, { encoding: "utf8" });
}
