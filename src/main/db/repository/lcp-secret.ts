// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { LcpSecretDocument } from "readium-desktop/main/db/document/lcp-secret";

import { BaseRepository, ExcludeTimestampableAndIdentifiable } from "./base";

const PUBLICATION_IDENTIFIER_INDEX = "publication_identifier";

@injectable()
export class LcpSecretRepository extends BaseRepository<LcpSecretDocument> {
    public constructor(db: PouchDB.Database<LcpSecretDocument>) {// INJECTED!

        const indexes = [
            {
                fields: ["publicationIdentifier"], // LcpSecretDocument
                name: PUBLICATION_IDENTIFIER_INDEX,
            },
        ];
        super(db, "lcp_secret", indexes);
    }

    // public async findByPublicationIdentifier(publicationIdentifier: string): Promise<LcpSecretDocument[]> {
    //     return this.find({
    //         selector: { publicationIdentifier },
    //     });
    // }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<LcpSecretDocument>): LcpSecretDocument {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                publicationIdentifier: dbDoc.publicationIdentifier,
                secret: dbDoc.secret,
            } as ExcludeTimestampableAndIdentifiable<LcpSecretDocument>,
        );
    }
}
