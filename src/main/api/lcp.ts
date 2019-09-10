// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import * as readerActions from "readium-desktop/common/redux/actions/reader";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { Store } from "redux";

export interface ILcpApi {
    renewPublicationLicense: (data: any) => Promise<void>;
    registerPublicationLicense: (data: any) => Promise<void>;
    returnPublication: (data: any) => Promise<void>;
    unlockPublicationWithPassphrase: (data: any) => Promise<void>;
    getLsdStatus: (data: any) => Promise<IHttpGetResult<string, any>>;
}

export type TLcpApiRenewPublicationLicense = ILcpApi["renewPublicationLicense"];
export type TLcpApiRegisterPublicationLicense = ILcpApi["registerPublicationLicense"];
export type TLcpApiReturnPublication = ILcpApi["returnPublication"];
export type TLcpApiUnlockPublicationWithPassphrase = ILcpApi["unlockPublicationWithPassphrase"];
export type TLcpApiGgetLsdStatus = ILcpApi["getLsdStatus"];

export interface ILcpModuleApi {
    "lcp/renewPublicationLicense": TLcpApiRenewPublicationLicense;
    "lcp/registerPublicationLicense": TLcpApiRegisterPublicationLicense;
    "lcp/returnPublication": TLcpApiReturnPublication;
    "lcp/unlockPublicationWithPassphrase": TLcpApiUnlockPublicationWithPassphrase;
    "lcp/getLsdStatus": TLcpApiGgetLsdStatus;
}

@injectable()
export class LcpApi {
    @inject(diSymbolTable["store"])
    private readonly store!: Store<any>;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    public async renewPublicationLicense(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        await this.lcpManager.renewPublicationLicense(publicationDocument);
    }

    public async registerPublicationLicense(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        await this.lcpManager.registerPublicationLicense(publicationDocument);
    }

    public async returnPublication(data: any): Promise<void> {
        const { publication } = data;
        const publicationDocument = await this.publicationRepository.get(
            publication.identifier,
        );
        await this.lcpManager.returnPublicationLicense(publicationDocument);
    }

    public async unlockPublicationWithPassphrase(data: any) {
        const { publication, passphrase } = data;
        try {
            await this.lcpManager.unlockPublicationWithPassphrase(publication, passphrase);
        } catch {
            return;
        }
        this.store.dispatch(readerActions.open(publication));
    }

    public async getLsdStatus(data: any) {
        const { publication } = data;
        return await this.lcpManager.getLsdStatus(publication);
    }
}
