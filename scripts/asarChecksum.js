
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pickle = require('chromium-pickle-js');

const readArchiveHeaderSync = function (archive) {
    const fd = fs.openSync(archive, 'r');
    let size;
    let headerBuf;
    try {
        const sizeBuf = new Buffer(8);
        if (fs.readSync(fd, sizeBuf, 0, 8, null) !== 8) {
            throw new Error('header size');
        }
        // console.log(sizeBuf.toString("hex"));

        const sizePickle = pickle.createFromBuffer(sizeBuf);
        size = sizePickle.createIterator().readUInt32();
        // console.log(size);

        headerBuf = new Buffer(size);
        if (fs.readSync(fd, headerBuf, 0, size, null) !== size) {
            throw new Error('header');
        }
    } finally {
        fs.closeSync(fd);
    }

    const headerPickle = pickle.createFromBuffer(headerBuf);
    const header = headerPickle.createIterator().readString();
    return { header: header, headerSize: size };
}

function generateSHA256(asarFile) {
    console.log(JSON.stringify(process.argv, null, 4));
    console.log(process.mainModule?.filename);
    console.log(require.main.filename);
    console.log(require.main);
    console.log(__filename);
    console.log(__dirname);
    console.log(process.cwd());
    console.log(asarFile);

    const asarHeader = readArchiveHeaderSync(asarFile);
    console.log(asarHeader.headerSize);
    // console.log(JSON.stringify(JSON.parse(asarHeader.header), null, 2));

    const checkSum = crypto.createHash("sha256");
    checkSum.update(asarHeader.header);
    let hash = checkSum.digest("hex");
    console.log(hash);

    const hashMod = process.env.PROD_THORIUM_HASH_MOD || `function hh(h){const c=require("crypto").createHash("sha256");c.update(h.toUpperCase());return c.digest("hex");}`;
    if (hashMod) {
        console.log("PROD_THORIUM_HASH_MOD ...");
        eval(hashMod);
        hash = hh(hash);
        console.log(hash);
    }

    // // const head = asarHeader.header.replace(/"offset":"[^"]+"/g, '"offset":"0"');
    // // console.log(JSON.stringify(JSON.parse(head), null, 2) + "\n");

    fs.writeFileSync(path.join(asarFile, "..", `${hash.toUpperCase()}.sha`), hash, { encoding: "utf8" });
}
exports.generateSHA256 = generateSHA256;
