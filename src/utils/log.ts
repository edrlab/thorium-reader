// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";

// const DEFAULT_MAX_LOG_BYTES = 1024;
const DEFAULT_MAX_LOG_BYTES = 1024 * 1024;

const rotateLogFileSync = (filePath: string, backupFilePath: string) => {
    try {
        fs.rmSync(backupFilePath, { force: true });
    } catch {
        // ignore
    }
    try {
        fs.renameSync(filePath, backupFilePath);
    } catch {
        // ignore
    }
};

const rotateLogFile = async (filePath: string, backupFilePath: string) => {
    try {
        await fs.promises.rm(backupFilePath, { force: true });
    } catch {
        // ignore
    }
    try {
        await fs.promises.rename(filePath, backupFilePath);
    } catch {
        // ignore
    }
};

export const appendFileSyncWithRotation = (
    filePath: string,
    data: string,
    maxBytes = DEFAULT_MAX_LOG_BYTES,
    backupFilePath = `${filePath}.1`,
) => {
    try {
        const stats = fs.statSync(filePath);
        const dataSize = Buffer.byteLength(data);
        if (stats.size > 0 && stats.size + dataSize > maxBytes) {
            rotateLogFileSync(filePath, backupFilePath);
        }
    } catch {
        // ignore
    }
    fs.appendFileSync(filePath, data);
};

export const appendFileWithRotation = async (
    filePath: string,
    data: string,
    maxBytes = DEFAULT_MAX_LOG_BYTES,
    backupFilePath = `${filePath}.1`,
) => {
    try {
        const stats = await fs.promises.stat(filePath);
        const dataSize = Buffer.byteLength(data);
        if (stats.size > 0 && stats.size + dataSize > maxBytes) {
            await rotateLogFile(filePath, backupFilePath);
        }
    } catch {
        // ignore
    }
    await fs.promises.appendFile(filePath, data);
};
