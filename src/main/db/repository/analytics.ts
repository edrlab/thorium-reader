// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as PouchDB from "pouchdb-core";

import { BaseRepository, ExcludeTimestampableAndIdentifiable } from "./base";
import { injectable } from "inversify";
import { AnalyticsDocument } from "../document/analytics";

const PUBLICATION_INDEX = "publication_index";
const CREATED_AT_INDEX = "created_at_index";
const UPDATED_AT_INDEX = "updated_at_index";
const ANALYTICS_TYPE_INDEX = "analytics_type_index";

@injectable()
export class AnalyticsRepository extends BaseRepository<AnalyticsDocument> {
    public constructor(db: PouchDB.Database<AnalyticsDocument>) {

        const indexes = [
            {
                fields: ["createdAt"], // Timestampable
                name: CREATED_AT_INDEX,
            },
            {
                fields: ["updatedAt"], // Timestampable
                name: UPDATED_AT_INDEX,
            },
            {
                fields: ["publicationIdentifier"], // LocatorDocument
                name: PUBLICATION_INDEX,
            },
            {
                fields: ["analyticsType"], // LocatorDocument
                name: ANALYTICS_TYPE_INDEX,
            },
        ];

        super(db, "locator", indexes);

    }


    protected convertToDocument(dbDoc: PouchDB.Core.Document<AnalyticsDocument>): AnalyticsDocument {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                analyticsType: dbDoc.analyticsType,
                publicationIdentifier: dbDoc.publicationIdentifier,
            } as ExcludeTimestampableAndIdentifiable<AnalyticsDocument>,
        );
    }
}