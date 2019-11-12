// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { lcpActions } from "readium-desktop/common/redux/actions";
import { readerActions } from "readium-desktop/common/redux/actions/";
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { Server } from "@r2-streamer-js/http/server";

const debug = debug_("readium-desktop:main:redux:sagas:streamer");

export interface ILcpApi {
    renewPublicationLicense: (publicationIdentifier: string) => Promise<void>;
    returnPublication: (publicationIdentifier: string) => Promise<void>;
    unlockPublicationWithPassphrase: (passphrase: string, publicationView: PublicationView) => Promise<void>;
}

export type TLcpApiRenewPublicationLicense = ILcpApi["renewPublicationLicense"];
export type TLcpApiReturnPublication = ILcpApi["returnPublication"];
export type TLcpApiUnlockPublicationWithPassphrase = ILcpApi["unlockPublicationWithPassphrase"];

export interface ILcpModuleApi {
    "lcp/renewPublicationLicense": TLcpApiRenewPublicationLicense;
    "lcp/returnPublication": TLcpApiReturnPublication;
    "lcp/unlockPublicationWithPassphrase": TLcpApiUnlockPublicationWithPassphrase;
}

@injectable()
export class LcpApi {
    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    @inject(diSymbolTable.streamer)
    private readonly streamer!: Server;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    public async renewPublicationLicense(publicationIdentifier: string): Promise<void> {
        const publicationDocument = await this.publicationRepository.get(
            publicationIdentifier,
        );
        await this.lcpManager.renewPublicationLicense(publicationDocument);
    }

    public async returnPublication(publicationIdentifier: string): Promise<void> {
        const publicationDocument = await this.publicationRepository.get(
            publicationIdentifier,
        );
        await this.lcpManager.returnPublication(publicationDocument);
    }

    public async unlockPublicationWithPassphrase(passphrase: string, publicationView: PublicationView): Promise<void> {
        try {
            const unlockPublicationRes: string | number | null | undefined =
                await this.lcpManager.unlockPublication(publicationView.identifier, passphrase);
            if (typeof unlockPublicationRes !== "undefined") {
                const message = unlockPublicationRes === 11 ?
                    this.translator.translate("publication.expiredLcp") :
                    this.lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                debug(message);

                const epubPath = this.publicationStorage.getPublicationEpubPath(publicationView.identifier);
                const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);
                if (!r2Publication.LCP) {
                    return;
                }
                try {
                    const action = lcpActions.userKeyCheckRequest.build(
                        publicationView,
                        r2Publication.LCP.Encryption.UserKey.TextHint,
                        message,
                    );
                    this.store.dispatch(action);
                    return;
                } catch (error) {
                    debug(error);
                    return;
                }
            }
        } catch (err) {
            debug(err);
            return;
        }

        this.store.dispatch(readerActions.openRequest.build(publicationView.identifier));
    }
}
