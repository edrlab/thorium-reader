// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// import { promises as fsp } from "fs";
import { inject, injectable } from "inversify";
// import * as path from "path";
import { IServerApi } from "readium-desktop/common/api/interface/server.interface";
import { PublicationView } from "readium-desktop/common/views/publication";
import { Store } from "redux";

import { diMainGet } from "../di";
// import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
// import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { diSymbolTable } from "../diSymbolTable";
import { serverActions } from "../redux/actions";
import { RootState } from "../redux/states";

const debug = debug_("readium-desktop:src/main/api/server");

@injectable()
export class ServerApi implements IServerApi {

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    public async getUrl(): Promise<string> {
        const value = this.store.getState().server.url;

        debug("server getUrl", value);

        return value;
    }

    public async setUrl(value: string): Promise<void> {
        this.store.dispatch(serverActions.setUrl.build(value));

        debug("server setUrl", value);

        return ;
    }

    public async publishPublication(pub: PublicationView): Promise<void> {

        const url = diMainGet("store").getState().server.url;
        debug("publish on server", url, pub.identifier);

        // const id  pub.identifier;
        // {
        //     const { coverUrl } = pub.cover;

        //     // Extract publication item relative url
        //     // src/main/redux/sagas/app.ts
        //     const relativeUrl = coverUrl.substr(6); // "store:/
        //     const pubStorage = diMainGet("publication-storage");
        //     const filePath = path.join(pubStorage.getRootPath(), relativeUrl);

        //     const buffer = await fsp.readFile(filePath);

        // }
        // {
        //     const { thumbnailUrl } = pub.cover;

        //     // Extract publication item relative url
        //     // src/main/redux/sagas/app.ts
        //     const relativeUrl = thumbnailUrl.substr(6); // "store:/
        //     const pubStorage = diMainGet("publication-storage");
        //     const filePath = path.join(pubStorage.getRootPath(), relativeUrl);

        //     const buffer = await fsp.readFile(filePath);
        // }

        // const r2B64 = pub.r2PublicationBase64;
        // const r2Buffer = Buffer.from(r2B64, "base64");
        // const r2Pub = TaJsonDeserialize(r2Buffer.toString(), R2Publication);

        return;
    }
}
