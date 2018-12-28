// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";

import { Locator } from "r2-shared-js/dist/es6-es2015/src/models/locator";

@injectable()
export class ReaderApi {
    private bookmarkList: any = {};

    public async findAllBookmark(data: any): Promise<Locator[]> {
        const publicationId: string = data.publicationId;
        console.log("=================================", this.bookmarkList[publicationId]);
        if (this.bookmarkList[publicationId]) {
            return this.bookmarkList[publicationId];
        }
        return [];
    }

    public async setBookmark(data: any): Promise<Locator[]> {
        const publicationId: string = data.publicationId;
        const locator: Locator = data.locator;
        if (!this.bookmarkList[publicationId]) {
            this.bookmarkList[publicationId] = [];
        }
        this.bookmarkList[publicationId].push(locator);
        return this.bookmarkList[publicationId];
    }

    public async removeBookmark(data: any): Promise<Locator[]> {
        const publicationId: string = data.publicationId;
        const locator: Locator = data.locator;
        const id = this.bookmarkList[publicationId].indexOf(locator);
        this.bookmarkList[publicationId].splice(id, 1);
        return this.bookmarkList[publicationId];
    }
}
