// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import { v4 as uuidv4 } from "uuid";

const debug = debug_("readium-desktop:persistCrypto");

const AES_BLOCK_SIZE = 16;

const getKey = (k: string): Buffer => {

    const checkSum = crypto.createHash("sha256");
    checkSum.update(k);
    const hash = checkSum.digest("hex").toUpperCase();
    // const salt = crypto.randomBytes(16).toString("hex");
    // const hash = crypto.pbkdf2Sync(k, salt, 1000, 32, "sha256").toString("hex");
    const keyBuff = Buffer.from(hash, "hex");

    return keyBuff;
};

const getIV = (t: string): Buffer => {

    const ivBuff_ = Buffer.from(t + uuidv4());
    const ivBuff = ivBuff_.slice(0, AES_BLOCK_SIZE);

    return ivBuff;
};

export const encryptPersist = (plainText: string, prefix: string, k: string): Buffer => {

    const keyBuff = getKey(k);
    const ivBuff = getIV(prefix);

    const encrypteds: Buffer[] = [];
    encrypteds.push(ivBuff);
    const encryptStream = crypto.createCipheriv("aes-256-cbc",
        keyBuff,
        ivBuff);
    encryptStream.setAutoPadding(true);

    const buff1 = encryptStream.update(prefix + plainText, "utf8");
    if (buff1) {
        encrypteds.push(buff1);
    }
    const buff2 = encryptStream.final();
    if (buff2) {
        encrypteds.push(buff2);
    }
    const encrypted = Buffer.concat(encrypteds);
    // const base64 = Buffer.from(encrypted).toString("base64");
    return encrypted;
};

export const decryptPersist = (encrypted_: Buffer, prefix: string, k: string): string | undefined => {

    const keyBuff = getKey(k);
    const ivBuff = encrypted_.slice(0, AES_BLOCK_SIZE);
    const encrypted = encrypted_.slice(AES_BLOCK_SIZE);

    const decrypteds: Buffer[] = [];
    const decryptStream = crypto.createDecipheriv("aes-256-cbc",
        keyBuff,
        ivBuff);
    decryptStream.setAutoPadding(false);
    const buff1 = decryptStream.update(encrypted);
    if (buff1) {
        decrypteds.push(buff1);
    }
    const buff2 = decryptStream.final();
    if (buff2) {
        decrypteds.push(buff2);
    }
    const decrypted = Buffer.concat(decrypteds);
    const nPaddingBytes = decrypted[decrypted.length - 1];
    const size = encrypted.length - nPaddingBytes;
    const decryptedStr = decrypted.slice(0, size).toString("utf8");
    if (decryptedStr.startsWith(prefix)) {
        return decryptedStr.substr(prefix.length);
    }
    return undefined;
};

export const test = () => {
    const plainText = "THORIUM";
    const prefix = "READIUM";
    const k = "EDRLAB";
    const encrypted = encryptPersist(plainText, prefix, k);
    const decrypted = decryptPersist(encrypted, prefix, k);
    if (plainText !== decrypted) {
        debug(plainText, decrypted);
        throw new Error("PERSIST CRYPTO FAIL :(");
    } else {
        debug(plainText, decrypted);
        throw new Error("PERSIST CRYPTO OKAY :)");
    }
};

// CLI test:
// npx sucrase ./src/main/fs/ -d ./dist --transforms typescript,imports
// &&
// sed -i.old 's/debug = debug_/debug = debug_.default/g' dist/persistCrypto.js
// &&
// node -e "const x = require('./dist/persistCrypto');\
// const fs = require('fs');\
// const p = '.../cookie_jar.json';\
// const txt = x.decryptPersist(fs.readFileSync(p), 'CONFIGREPOSITORY_COOKIEJAR', p); console.log(txt);\
// const p2 = '.../opds_auth.json';\
// const txt2 = x.decryptPersist(fs.readFileSync(p2), 'CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN', p2); console.log(txt2);"\
