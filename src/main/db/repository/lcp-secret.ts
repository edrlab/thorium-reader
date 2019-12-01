// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { LcpSecretDocument } from "readium-desktop/main/db/document/lcp-secret";

import { BaseRepository, DatabaseContentType } from "./base";

const PUBLICATION_IDENTIFIER_INDEX = "publication_identifier";

export interface DatabaseContentTypeLcpSecret extends DatabaseContentType, LcpSecretDocument {
}

@injectable()
export class LcpSecretRepository extends BaseRepository<LcpSecretDocument, DatabaseContentTypeLcpSecret> {
    public constructor(db: PouchDB.Database<DatabaseContentTypeLcpSecret>) {

        // See DatabaseContentTypeLcpSecret
        const indexes = [
            {
                fields: ["publicationIdentifier"], // LcpSecretDocument
                name: PUBLICATION_IDENTIFIER_INDEX,
            },
        ];
        super(db, "lcp_secret", indexes);
    }

    public async findByPublicationIdentifier(publicationIdentifier: string): Promise<LcpSecretDocument[]> {
        return this.find({
            selector: { publicationIdentifier },
        });
    }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<DatabaseContentTypeLcpSecret>): LcpSecretDocument {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                publicationIdentifier: dbDoc.publicationIdentifier,
                secret: dbDoc.secret,
            } as Omit<LcpSecretDocument, keyof Timestampable | keyof Identifiable>,
        );
    }
}
