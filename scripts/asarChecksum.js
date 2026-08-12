
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pickle = require('chromium-pickle-js');
const electronAsar = require('@electron/asar');

const DEBUG = false;

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
    console.log("PROD_THORIUM_HASH_MOD ...");

    if (DEBUG) {
        console.log(JSON.stringify(process.argv, null, 4));
        console.log(process.mainModule?.filename);
        console.log(require.main.filename);
        console.log(require.main);
        console.log(__filename);
        console.log(__dirname);
        console.log(process.cwd());
        console.log(asarFile);
    }

    const asarHeader = readArchiveHeaderSync(asarFile);
    if (DEBUG) {
        console.log("ASAR HEADER SIZE:", asarHeader.headerSize);
        // console.log(JSON.stringify(JSON.parse(asarHeader.header), null, 2));
    }

    // https://github.com/electron/asar/blob/0959a13120775a8c3544e698e971074e0f496988/src/disk.ts#L314-L345
    // https://github.com/electron/asar/blob/0959a13120775a8c3544e698e971074e0f496988/src/pickle.ts#L2-L240
    const asarHeaderCheck = electronAsar.getRawHeader(asarFile);
    if (DEBUG) {
        console.log("ASAR HEADER SIZE (check):", asarHeaderCheck.headerSize);
    }

    if (asarHeader.headerSize !== asarHeaderCheck.headerSize || asarHeader.header !== asarHeaderCheck.headerString) {
        if (DEBUG) {
            console.log("ASAR HEADER:", asarHeader.header);
            console.log("ASAR HEADER (check):", asarHeader.headerString);
        }
        console.log("!!!!!ERROR ASAR HEADER CHECKS!!!!");
        process.exit(1);
    }

    const checkSum = crypto.createHash("sha256");
    checkSum.update(asarHeader.header);
    let hash = checkSum.digest("hex");
    if (DEBUG) {
        console.log(hash);
    }

    const hashMod = process.env.PROD_THORIUM_HASH_MOD || `function hh(h){const c=require("crypto").createHash("sha256");c.update(h.toUpperCase());return c.digest("hex");}`;
    if (hashMod) {
        eval(hashMod);
        hash = hh(hash);
        if (DEBUG) {
            console.log(hash);
        }
    }

    // // const head = asarHeader.header.replace(/"offset":"[^"]+"/g, '"offset":"0"');
    // // console.log(JSON.stringify(JSON.parse(head), null, 2) + "\n");

    fs.writeFileSync(path.join(asarFile, "..", `${hash.toUpperCase()}.sha`), hash, { encoding: "utf8" });

    console.log("PROD_THORIUM_HASH_MOD.");
}
exports.generateSHA256 = generateSHA256;
