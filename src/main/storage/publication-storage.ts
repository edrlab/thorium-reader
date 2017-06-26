import * as fs from "fs";
import * as path from "path";

import { injectable} from "inversify";

import { rmDirSync } from "readium-desktop/utils/fs";

// Store publications in a repository on filesystem
// Each file of publication is stored in a directory whose name is the
// publication uuid
// repository
// |- <publication 1 uuid>
//   |- epub file
//   |- cover file
// |- <publication 2 uuid>
@injectable()
export class PublicationStorage {
    private rootPath: string;

    public constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    /**
     * Store a publication in a repository
     *
     * @param identifier Identifier of publication
     * @param srcPath Path of epub to import
     */
    public storePublication(identifier: string, srcPath: string) {
        // Create a directory whose name is equals to publication identifier
        const pubDirPath = this.buildPublicationPath(identifier);
        fs.mkdirSync(pubDirPath);
        const dstPath = path.join(pubDirPath, "book.epub");
        fs.createReadStream(srcPath).pipe(fs.createWriteStream(dstPath));
    }

    public removePublication(identifier: string) {
        rmDirSync(this.buildPublicationPath(identifier));
    }

    private buildPublicationPath(identifier: string): string {
        return path.join(this.rootPath, identifier);
    }
}
