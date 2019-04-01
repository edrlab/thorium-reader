// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable} from "inversify";

import { LcpManager } from "readium-desktop/main/services/lcp";
import { PublicationRepository } from "../db/repository/publication";

@injectable()
export class LcpApi {
    private publicationRepository: PublicationRepository;
    private lcpManager: LcpManager;

    constructor(
        @inject("publication-repository") publicationRepository: PublicationRepository,
        @inject("lcp-manager") lcpManager: LcpManager,
    ) {
        this.lcpManager = lcpManager;
        this.publicationRepository = publicationRepository;
    }

    public async renewPublicationLicense(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        this.lcpManager.renewPublicationLicense(publicationDocument);
        console.log("renew license", publication);
    }

    public async returnPublication(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        this.lcpManager.returnPublicationLicense(publicationDocument);
        console.log("return publication", publication);
    }
}
