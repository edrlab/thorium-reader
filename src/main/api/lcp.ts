// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable} from "inversify";

import { Store } from "redux";

import * as readerActions from "readium-desktop/common/redux/actions/reader";

import { LcpManager } from "readium-desktop/main/services/lcp";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

@injectable()
export class LcpApi {
    @inject("store")
    private store: Store<any>;

    @inject("publication-repository")
    private publicationRepository: PublicationRepository;

    @inject("lcp-manager")
    private lcpManager: LcpManager;

    public async renewPublicationLicense(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        await this.lcpManager.renewPublicationLicense(publicationDocument);
        console.log("renew license", publication);
    }

    public async returnPublication(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        await this.lcpManager.returnPublicationLicense(publicationDocument);
        console.log("return publication", publication);
    }

    public async unlockPublicationWithPassphrase(data: any) {
        const { publication, passphrase } = data;
        console.log("#### 1", publication);
        await this.lcpManager.unlockPublicationWithPassphrase(publication, passphrase);
        console.log("#### 2", publication);
        this.store.dispatch(readerActions.open(publication));
    }
}
