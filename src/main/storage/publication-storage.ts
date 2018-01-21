import * as fs from "fs";
import * as path from "path";

import { injectable} from "inversify";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip.d";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { File } from "readium-desktop/models/file";
import { getFileSize, rmDirSync } from "readium-desktop/utils/fs";

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

    public getRootPath() {
        return this.rootPath;
    }

    /**
     * Store a publication in a repository
     *
     * @param identifier Identifier of publication
     * @param srcPath Path of epub to import
     */
    public async storePublication(
        identifier: string,
        srcPath: string,
    ): Promise<File[]> {
        // Create a directory whose name is equals to publication identifier
        const pubDirPath = this.buildPublicationPath(identifier);
        fs.mkdirSync(pubDirPath);

        // Store publication file and extract its cover
        const bookFile: File = await this.storePublicationBook(
            identifier, srcPath);
        const coverFile: File = await this.storePublicationCover(
            identifier, srcPath);

        let files: File[] = [];
        files.push(bookFile);

        if (coverFile != null) {
            files.push(coverFile);
        }

        return files;
    }

    public removePublication(identifier: string) {
        rmDirSync(this.buildPublicationPath(identifier));
    }

    private buildPublicationPath(identifier: string): string {
        return path.join(this.rootPath, identifier);
    }

    private async storePublicationBook(
        identifier: string,
        srcPath: string,
    ): Promise<File> {
        const filename = "book.epub";
        const dstPath = path.join(
            this.buildPublicationPath(identifier),
            "book.epub",
        );

        return new Promise<File>((resolve, reject) => {
            let writeStream = fs.createWriteStream(dstPath);
            const fileResolve = () => {
                resolve ({
                    url: `store://${identifier}/${filename}`,
                    ext: "epub",
                    contentType: "application/epub+zip",
                    size: getFileSize(dstPath),
                });
            };

            writeStream.on("finish", fileResolve);
            fs.createReadStream(srcPath).pipe(writeStream);
        });
    }

    // Extract the image cover buffer then create a file on the publication folder
    private async storePublicationCover(
        identifier: string,
        srcPath: string,
    ): Promise<File> {
        // Extract cover information from srcPath
        const pub: any = await EpubParsePromise(srcPath);
        const zipInternal = pub.Internal.find((i: any) => {
            if (i.Name === "zip") {
                return true;
            }
            return false;
        });
        const zip = zipInternal.Value as IZip;
        const coverLink = pub.GetCover();

        if (!coverLink) {
            return null;
        }

        const coverType: string = coverLink.TypeLink;
        const zipStream = await zip.entryStreamPromise(coverLink.Href);
        const zipBuffer = await streamToBufferPromise(zipStream.stream);
        const coverExt = coverType.split("/")[1];
        const coverFilename = "cover." + coverExt;
        const coverDstPath = path.join(
            this.buildPublicationPath(identifier),
            coverFilename,
        );

        // Write cover to fs
        fs.writeFileSync(coverDstPath, zipBuffer);

        // Return cover file information
        return {
            url: `store://${identifier}/${coverFilename}`,
            ext: coverExt,
            contentType: coverType,
            size: getFileSize(coverDstPath),
        };
    }
}
