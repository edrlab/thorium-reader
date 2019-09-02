// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable} from "inversify";

import { LocatorView } from "readium-desktop/common/views/locator";

import { LocatorViewConverter } from "readium-desktop/main/converter/locator";

import { LocatorRepository } from "readium-desktop/main/db/repository/locator";

import { LocatorType } from "readium-desktop/common/models/locator";

import { Locator } from "@r2-shared-js/models/locator";

export interface IReaderApi {
    setLastReadingLocation: (publicationIdentifier: string, locator: Locator) => Promise<LocatorView> | void;
    getLastReadingLocation: (publicationIdentifier: string) => Promise<LocatorView> | void;
    findBookmarks: (publicationIdentifier: string) => Promise<LocatorView[]> | void;
    updateBookmark: (
        identifier: string,
        publicationIdentifier: string,
        locator: Locator,
        name?: string,
    ) => Promise<void> | void;
    addBookmark: (
        publicationIdentifier: string,
        locator: Locator,
        name?: string,
    ) => Promise<void> | void;
    deleteBookmark: (identifier: string) => Promise<void> | void;
}

export type TReaderApiSetLastReadingLocation = IReaderApi["setLastReadingLocation"];
export type TReaderApiGetLastReadingLocation = IReaderApi["getLastReadingLocation"];
export type TReaderApiFindBookmarks = IReaderApi["findBookmarks"];
export type TReaderApiUpdateBookmark = IReaderApi["updateBookmark"];
export type TReaderApiAddBookmark = IReaderApi["addBookmark"];
export type TReaderApiDeleteBookmark = IReaderApi["deleteBookmark"];

export type TReaderApiSetLastReadingLocation_result = LocatorView;
export type TReaderApiGetLastReadingLocation_result = LocatorView;
export type TReaderApiFindBookmarks_result = LocatorView[];
export type TReaderApiUpdateBookmark_result = void;
export type TReaderApiAddBookmark_result = void;
export type TReaderApiDeleteBookmark_result = void;

@injectable()
export class ReaderApi implements IReaderApi {
    @inject("locator-repository")
    private readonly locatorRepository!: LocatorRepository;

    @inject("locator-view-converter")
    private readonly locatorViewConverter!: LocatorViewConverter;

    public async setLastReadingLocation(publicationIdentifier: string, locator: Locator): Promise<LocatorView> {
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publicationIdentifier,
            LocatorType.LastReadingLocation,
        );

        let newDoc = null;

        if (docs.length === 0) {
            // Create new locator
            newDoc = {
                publicationIdentifier,
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

    public async getLastReadingLocation(publicationIdentifier: string): Promise<LocatorView> {
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publicationIdentifier,
            LocatorType.LastReadingLocation,
        );

        if (docs.length === 0) {
            return null;
        }

        return this.locatorViewConverter.convertDocumentToView(docs[0]);
    }

    public async findBookmarks(publicationIdentifier: string): Promise<LocatorView[]> {
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publicationIdentifier,
            LocatorType.Bookmark,
        );

        return docs.map((doc) => {
            return this.locatorViewConverter.convertDocumentToView(doc);
        });
    }

    public async updateBookmark(
        identifier: string,
        publicationIdentifier: string,
        locator: Locator,
        name?: string,
    ): Promise<void> {

        const newDoc = {
            identifier,
            publicationIdentifier,
            locatorType: LocatorType.Bookmark,
            locator: Object.assign({}, locator),
            name,
        };
        await this.locatorRepository.save(newDoc);
    }

    public async addBookmark(
        publicationIdentifier: string,
        locator: Locator,
        name?: string,
    ): Promise<void> {

        const doc = {
            publicationIdentifier,
            locatorType: LocatorType.Bookmark,
            locator: Object.assign({}, locator),
            name,
        };
        await this.locatorRepository.save(doc);
    }

    public async deleteBookmark(identifier: string): Promise<void> {
        await this.locatorRepository.delete(identifier);
    }
}
