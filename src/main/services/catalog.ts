import * as uuid from "uuid";

import { injectable} from "inversify";

import { Contributor } from "readium-desktop/common/models/contributor";
import { CustomCover, RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { Publication } from "readium-desktop/common/models/publication";

import { Publication as Epub } from "@r2-shared-js/models/publication";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";

import { PublicationDb } from "readium-desktop/main/db/publication-db";
import { container } from "readium-desktop/main/di";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import nearMe from "material-ui/svg-icons/maps/near-me";

@injectable()
export class CatalogService {
    /**
     * Parse epub from a local path
     *
     * @param path: local path of an epub
     * @return: new publication
     */
    public async parseEpub(path: string) {
        const parsedEpub: Epub = await EpubParsePromise(path);
        const authors: Contributor[] = [];

        if (parsedEpub.Metadata && parsedEpub.Metadata.Author) {
            for (const author of parsedEpub.Metadata.Author) {
                const contributor: Contributor = {
                    name: author.Name as string, // note: can be multilingual object map (not just string)
                };

                authors.push(contributor);
            }
        }

        const newPub: Publication = {
            title: parsedEpub.Metadata.Title as string, // note: can be multilingual object map (not just string)
            description: parsedEpub.Metadata.Description,
            identifier: uuid.v4(),
            authors,
            languages: parsedEpub.Metadata.Language.map(
                (code) => { return { code };
            }),
        };

        return newPub;
    }

    /**
     * Store publication from a local path
     *
     * @param pubId: publication identifier
     * @param path: local path
     * @return: new publication
     */
    public async addPublicationFromLocalPath(pubId: string, path: string) {
        const publicationStorage = container.get(
            "publication-storage") as PublicationStorage;
        const publicationDb = container.get(
            "publication-db") as PublicationDb;

        // Store publication on FS
        const files = await publicationStorage.storePublication(
            pubId,
            path,
        );

        // Build publication object from epub file
        const newPub: Publication = await this.parseEpub(path);

        // Keep the given publication identifier
        newPub.identifier = pubId;

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
