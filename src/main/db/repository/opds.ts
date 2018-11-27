// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";
import * as PouchDB from "pouchdb-core";

import { OpdsDocument } from "readium-desktop/main/db/document/opds";

import { BaseRepository } from "./base";

@injectable()
export class OpdsRepository extends BaseRepository<OpdsDocument> {
    public constructor(db: PouchDB.Database) {
        super(db, "opds")
    }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<any>): OpdsDocument {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                name: dbDoc.name,
                url: dbDoc.url,
            }
        );
    }
}
