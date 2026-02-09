// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface OpdsFeedDocument extends Identifiable, Timestampable {
    title: string;
    url: string;

    // when true, signifies that pub was migrated from 1.6 PouchDB
    // (Sqlite3 / Leveldown database storage adapters) to Redux state (with JSON serialization)
    migratedFrom1_6Database?: boolean;

    // when true, signifies that feed was added or modified in 1.7 (both via opdsActions.addOpdsFeed, for modified see repository.save())
    // and should not be migrated anymore from 1.6 PouchDB (Sqlite3 / Leveldown database storage adapters) to Redux state (with JSON serialization)
    doNotMigrateAnymore?: boolean;

    // TODO: change this design in Thorium 1.8+ to avoid unbounded database growth when deleting publications
    // when true, was removed via Thorium 1.7+ but data is preserved here to avoid re-migration
    // from PouchDB (Sqlite3 / Leveldown database storage adapters) to Redux state (with JSON serialization) at subsequent app launches
    removedButPreservedToAvoidReMigration?: boolean;

    // TODO customization profile
    // customizationProfileFrom?: string[]; // array of customization profile id

    authenticationUrl?: string;
    favorite?: boolean;
}
