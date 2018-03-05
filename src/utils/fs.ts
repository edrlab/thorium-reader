import * as fs from "fs";
import * as path from "path";

export function rmDirSync(dirPath: string): void {
    let filenames = [];

    try {
        filenames = fs.readdirSync(dirPath);
    } catch (err) {
        return;
    }

    for (const filename of filenames) {
        const filePath = path.join(dirPath, filename);

        if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
        } else {
            rmDirSync(filePath);
        }
    }

    fs.rmdirSync(dirPath);
}

export function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}
