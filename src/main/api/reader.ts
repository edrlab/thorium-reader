// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";

import { LocatorView } from "readium-desktop/common/views/locator";

import { LocatorViewConverter } from "readium-desktop/main/converter/locator";

import { LocatorRepository } from "readium-desktop/main/db/repository/locator";

import { LocatorType } from "readium-desktop/common/models/locator";

import { LocatorDocument } from "readium-desktop/main/db/document/locator";

@injectable()
export class ReaderApi {
    private bookmarkList: any = {};
    private locatorRepository: LocatorRepository;
    private locatorViewConverter: LocatorViewConverter;

    constructor(
        locatorRepository: LocatorRepository,
        locatorViewConverter: LocatorViewConverter,
    ) {
        this.locatorRepository = locatorRepository;
        this.locatorViewConverter = locatorViewConverter;
    }

    public async setLastReadingLocation(data: any): Promise<LocatorView> {
        const { publication, locator } = data;
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publication.identifier,
            LocatorType.LastReadingLocation,
        );

        let newDoc = null;

        if (docs.length === 0) {
            // Create new locator
            newDoc = {
                publicationIdentifier: publication.identifier,
                locatorType: LocatorType.LastReadingLocation,
                locator: Object.assign({}, locator),
            };
        } else {
            // Update locator
            newDoc = Object.assign(
                {},
                docs[0],
                {
                    locator: Object.assign({}, locator),
                },
            );
        }

        const savedDoc = await this.locatorRepository.save(newDoc);
        return this.locatorViewConverter.convertDocumentToView(savedDoc);
    }

    public async getLastReadingLocation(data: any): Promise<LocatorView> {
        const { publication } = data;
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publication.identifier,
            LocatorType.LastReadingLocation,
        );

        if (docs.length === 0) {
            return null;
        }

        return this.locatorViewConverter.convertDocumentToView(docs[0]);
    }

    public async findBookmarks(data: any): Promise<LocatorView[]> {
        const { publication } = data;
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publication.identifier,
            LocatorType.Bookmark,
        );

        return docs.map((doc) => {
            return this.locatorViewConverter.convertDocumentToView(doc);
        });
    }

    public async addBookmark(data: any): Promise<void> {
        const { publication, locator } = data;
        const doc = {
            publicationIdentifier: publication.identifier,
            locatorType: LocatorType.Bookmark,
            locator: Object.assign({}, locator),
        };
        await this.locatorRepository.save(doc);
    }

    public async deleteBookmark(data: any): Promise<void> {
        const { identifier } = data;
        await this.locatorRepository.delete(identifier);
    }
}
