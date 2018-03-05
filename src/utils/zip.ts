import * as yauzl from "yauzl";
import * as yazl from "yazl";

import * as fs from "fs";

let InjectType: any;

((injectType: any) => {
    // tslint:disable-next-line
    injectType[injectType["FILE"] = 0] = "FILE";
    // tslint:disable-next-line
    injectType[injectType["BUFFER"] = 1] = "BUFFER";
    // tslint:disable-next-line
    injectType[injectType["STREAM"] = 2] = "STREAM";
})(InjectType || (InjectType = {}));

function injectObjectInZip(
    destPathTMP: string,
    destPathFINAL: string,
    contentsToInject: any,
    typeOfContentsToInject: string,
    zipEntryPath: string,
    zipError: (error: any) => void,
    doneCallback: () => void) {
    yauzl.open(destPathTMP, { lazyEntries: true, autoClose: true }, (err: any, zip: any) => {
        if (err) {
            zipError(err);
            return;
        }
        const zipfile = new yazl.ZipFile();
        zip.on("error", (erro: any) => {
            zipError(erro);
        });
        zip.readEntry();
        zip.on("entry", (entry: any) => {
            if (entry.fileName[entry.fileName.length - 1] !== "/" && entry.fileName !== zipEntryPath) {
                zip.openReadStream(entry, (errz: any, stream: any) => {
                    if (err) {
                        zipError(errz);
                        return;
                    }
                    const compress = entry.fileName !== "mimetype";
                    zipfile.addReadStream(stream, entry.fileName, { compress });
                });
            }
            zip.readEntry();
        });
        zip.on("end", () => {
            if (typeOfContentsToInject === InjectType.FILE) {
                zipfile.addFile(contentsToInject, zipEntryPath);
            } else if (typeOfContentsToInject === InjectType.BUFFER) {
                zipfile.addBuffer(contentsToInject, zipEntryPath);
            } else if (typeOfContentsToInject === InjectType.STREAM) {
                zipfile.addReadStream(contentsToInject, zipEntryPath);
            }
            zipfile.end();
            const destStream2 = fs.createWriteStream(destPathFINAL);
            zipfile.outputStream.pipe(destStream2);
            destStream2.on("finish", () => {
                doneCallback();
            });
            destStream2.on("error", (ere: any) => {
                zipError(ere);
            });
        });
    });
}

export function injectFileInZip(
    destPathTMP: string,
    destPathFINAL: string,
    filePath: string,
    zipEntryPath: string,
): Promise<any> {
    return new Promise((resolve, reject) => {
        injectObjectInZip(
            destPathTMP,
            destPathFINAL,
            filePath,
            InjectType.FILE, zipEntryPath,
            (error: any) => {
                return reject(error);
            },
            () => {
                return resolve();
            },
        );
    });
}

export function injectDataInZip(
    destPathTMP: string,
    destPathFINAL: string,
    data: string,
    zipEntryPath: string,
): Promise<any> {
    return new Promise((resolve, reject) => {
        injectObjectInZip(
            destPathTMP,
            destPathFINAL,
            Buffer.from(data, "utf8"),
            InjectType.BUFFER, zipEntryPath,
            (error: any) => {
                return reject(error);
            },
            () => {
                return resolve();
            },
        );
    });
}
