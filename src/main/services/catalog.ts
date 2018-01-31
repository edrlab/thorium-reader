import { injectable} from "inversify";

import { CustomCover, RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { Publication } from "readium-desktop/common/models/publication";

import { PublicationDb } from "readium-desktop/main/db/publication-db";
import { container } from "readium-desktop/main/di";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

@injectable()
export class CatalogService {
    /**
     * Store publication from a local path
     *
     * @param pub: publication
     * @param path: local path
     * @return: new publication
     */
    public async addPublicationFromLocalPath(pub: Publication, path: string) {
        const publicationStorage = container.get(
            "publication-storage") as PublicationStorage;
        const publicationDb = container.get(
            "publication-db") as PublicationDb;

        // Store publication on FS
        const files = await publicationStorage.storePublication(
            pub.identifier,
            path,
        );

        // Build publication object for DB
        const newPub: Publication = {
            title: pub.title, // note: can be multilingual object map (not just string)
            cover: pub.cover,
            download: pub.download,
            description: pub.description,
            identifier: pub.identifier,
            authors: pub.authors,
            languages: pub.languages,
        };

        // Extract cover
        let coverFile: File = null;
        const otherFiles: File[] = [];

        for (const file of files) {
            if (file.contentType.startsWith("image")) {
                coverFile = file;
            } else {
                otherFiles.push(file);
            }
        }

        if (coverFile !== null) {
            newPub.cover = coverFile;
        }

        newPub.files = otherFiles;

        if (coverFile === null && newPub.cover === null) {
            // No cover file found
            // Generate a random custom cover
            newPub.customCover = RandomCustomCovers[
                Math.floor(Math.random() * RandomCustomCovers.length)
            ];
        }

        // Store publication in db
        await publicationDb.put(newPub);
        return newPub;
    }
}
