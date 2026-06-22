import * as crypto from "crypto";
import * as fs from "fs";
const hashmod = process.env.PROD_THORIUM_HASH_MOD || "";
{
    const js = fs.readFileSync("./dist/main.js", { encoding: "utf8" });
    const checkSum = crypto.createHash("sha256");
    checkSum.update(hashmod.substring(0, 20) + js + hashmod.substring(20));
    const hash = checkSum.digest("hex").toUpperCase();
    fs.writeFileSync(`./dist/01${hash}.js`, `// ${hash}`, { encoding: "utf8" });
}
{
    const js = fs.readFileSync("./dist/index_reader.js", { encoding: "utf8" });
    const checkSum = crypto.createHash("sha256");
    checkSum.update(hashmod.substring(0, 20) + js + hashmod.substring(20));
    const hash = checkSum.digest("hex").toUpperCase();
    fs.writeFileSync(`./dist/02${hash}.js`, `// ${hash}`, { encoding: "utf8" });
}
{
    const js = fs.readFileSync("./dist/index_library.js", { encoding: "utf8" });
    const checkSum = crypto.createHash("sha256");
    checkSum.update(hashmod.substring(0, 20) + js + hashmod.substring(20));
    const hash = checkSum.digest("hex").toUpperCase();
    fs.writeFileSync(`./dist/03${hash}.js`, `// ${hash}`, { encoding: "utf8" });
}
