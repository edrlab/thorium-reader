// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";
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

@injectable()
export class CatalogService {
    /**
     * Parse epub from a local path
     *
     * @param pubPath: local path of an epub
     * @return: new publication
     */
    public async parseEpub(pubPath: string): Promise<Publication> {
        const parsedEpub: Epub = await EpubParsePromise(pubPath);
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

        if (parsedEpub.LCP) {
            // Add Lcp info
            newPub.lcp = {
                provider: parsedEpub.LCP.Provider,
                issued: parsedEpub.LCP.Issued,
                updated: parsedEpub.LCP.Updated,
                rights: {
                    copy: parsedEpub.LCP.Rights.Copy,
                    print: parsedEpub.LCP.Rights.Print,
                    start: parsedEpub.LCP.Rights.Start,
                    end: parsedEpub.LCP.Rights.End,
                },
            };

            // Search for lsd status url
            for (const link of parsedEpub.LCP.Links) {
                if (link.Rel === "status") {
                    // This is the lsd status url link
                    newPub.lcp.lsd = {
                        statusUrl: link.Href,
                    };
                    break;
                }
            }
        }

        return newPub;
    }

    /**
     * Refresh publication metadata
     *
     * @param publication Publication to refresh
     * @return: Refreshed publication
     */
    public async refreshPublicationMetadata(publication: Publication) {
        const pubStorage = container.get(
            "publication-storage") as PublicationStorage;
        const publicationDb = container.get(
            "publication-db") as PublicationDb;

        const pubPath = path.join(
            pubStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );

        const refreshedPublication = await this.parseEpub(pubPath);

        refreshedPublication.identifier = publication.identifier;
        refreshedPublication.cover = publication.cover;
        refreshedPublication.files = publication.files;

        // Store refreshed metadata in db
        await publicationDb.putOrChange(refreshedPublication);
        return refreshedPublication;
    }

    /**
     * Store publication from a local path
     *
     * @param pubId: publication identifier
     * @param pubPath: local path
     * @return: new publication
     */
    public async addPublicationFromLocalPath(pubId: string, pubPath: string) {
        const publicationStorage = container.get(
            "publication-storage") as PublicationStorage;
        const publicationDb = container.get(
            "publication-db") as PublicationDb;

        // Store publication on FS
        const files = await publicationStorage.storePublication(
            pubId,
            pubPath,
        );

        // Build publication object from epub file
        const newPub: Publication = await this.parseEpub(pubPath);

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
