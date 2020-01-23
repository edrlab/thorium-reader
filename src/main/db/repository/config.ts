// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { ConfigDocument } from "readium-desktop/main/db/document/config";

import { BaseRepository, ExcludeTimestampableAndIdentifiable } from "./base";

@injectable()
export class ConfigRepository<T> extends BaseRepository<ConfigDocument<T>> {
    public constructor(db: PouchDB.Database<ConfigDocument<T>>) {// INJECTED!
        super(db, "config");
    }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<ConfigDocument<T>>): ConfigDocument<T> {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                value: dbDoc.value,
            } as ExcludeTimestampableAndIdentifiable<ConfigDocument<T>>,
        );
    }
}
