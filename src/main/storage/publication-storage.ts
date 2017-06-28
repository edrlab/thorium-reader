import * as fs from "fs";
import * as path from "path";

import { injectable} from "inversify";

import { rmDirSync } from "readium-desktop/utils/fs";

import { EpubParsePromise } from "r2-streamer-js/dist/es5/src/parser/epub";

import { IZip } from "r2-streamer-js/dist/es5/src/_utils/zip/zip.d";

import { streamToBufferPromise } from "r2-streamer-js/dist/es6-es2015/src/_utils/stream/BufferUtils";

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

        Promise.resolve(this.storeCover(srcPath, pubDirPath).then((lol: any) => {
            console.log("Cover created");
        }));
    }

    // Delete a publication with its identifier
    public async deletePublication (identifier: string) {
        const pubDirPath = this.buildPublicationPath(identifier);

        if (fs.existsSync(pubDirPath)) {
            const filesName = fs.readdirSync(pubDirPath);
            for (let fileName of filesName) {
                fs.unlinkSync (path.join(pubDirPath, fileName));
            }
            fs.rmdirSync(pubDirPath);
        } else {
            console.log ("**Impossible to delete the folder  " + pubDirPath + " because the folder doesn't exist.");
        }
    }

    public removePublication(identifier: string) {
        rmDirSync(this.buildPublicationPath(identifier));
    }

    private buildPublicationPath(identifier: string): string {
        return path.join(this.rootPath, identifier);
    }

    // Extract the image cover buffer then create a file on the publication folder
    private async storeCover (srcPath: string, pubDirPath: string) {
        const pub: any = await EpubParsePromise(srcPath);
        const zipInternal = pub.Internal.find((i: any) => {
        if (i.Name === "zip") {
            return true;
        }
        return false;
        });
        const zip = zipInternal.Value as IZip;
        const coverLink = pub.GetCover();
        const coverType: string = coverLink.TypeLink;
        const zipStream = await zip.entryStreamPromise(coverLink.Href);
        const zipBuffer = await streamToBufferPromise(zipStream.stream);

        fs.writeFileSync(path.join(pubDirPath, "cover." + coverType.split("/")[1]), zipBuffer);
    }
}
