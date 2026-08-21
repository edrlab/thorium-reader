// node .github_release/LIB/checksum.js .github_release/LIB/windows/intel/lcp.node

 // console.log(JSON.stringify(process.argv, null, 2));

const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), process.argv[2]);

const sha = fs.readFileSync(path.join(p, "..", "checksum.sha256"), { encoding: "utf8" }).trim();

const hasher = require("crypto").createHash("sha256");

const readStream = fs.createReadStream(p); // autoClose === true, readStream.isPaused() === true

readStream.on("error", (e) => {
    console.log("CHECKSUM FILE STREAM ERROR", p, e);
    process.exit(1);
});

readStream.on("end", () => {
    const checksum = hasher.digest("hex");
    if (sha !== checksum) {
        console.log("CHECKSUM MISMATCH", p, sha, checksum);
        process.exit(1);
    } else {
        console.log("CHECKSUM OK", p, sha);
    }
});

readStream.pipe(hasher);
