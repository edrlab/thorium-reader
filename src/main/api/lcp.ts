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
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { PublicationViewConverter } from "../converter/publication";

const debug = debug_("readium-desktop:main:redux:sagas:streamer");

export interface ILcpApi {
    renewPublicationLicense: (publicationIdentifier: string) => Promise<void>;
    returnPublication: (publicationIdentifier: string) => Promise<void>;
    unlockPublicationWithPassphrase: (passphrase: string, publicationViewIdentifer: string) => Promise<void>;
}

export interface ILcpModuleApi {
    "lcp/renewPublicationLicense": ILcpApi["renewPublicationLicense"];
    "lcp/returnPublication": ILcpApi["returnPublication"];
    "lcp/unlockPublicationWithPassphrase": ILcpApi["unlockPublicationWithPassphrase"];
}

@injectable()
export class LcpApi implements ILcpApi {
    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    // import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
    // @inject(diSymbolTable["publication-storage"])
    // private readonly publicationStorage!: PublicationStorage;

    // import { Server } from "@r2-streamer-js/http/server";
    // @inject(diSymbolTable.streamer)
    // private readonly streamer!: Server;

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

    public async unlockPublicationWithPassphrase(passphrase: string, publicationViewIdentifer: string): Promise<void> {

        const publicationDocument = await this.publicationRepository.get(
            publicationViewIdentifer,
        );
        try {
            // TODO: improve this horrible returned union type!
            const unlockPublicationRes: string | number | null | undefined =
                await this.lcpManager.unlockPublication(publicationDocument, passphrase);

            if (typeof unlockPublicationRes !== "undefined") {
                const message = unlockPublicationRes === 11 ?
                    this.translator.translate("publication.expiredLcp") :
                    this.lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                debug(message);

                // import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
                // import { Publication as R2Publication } from "@r2-shared-js/models/publication";
                // tslint:disable-next-line: max-line-length
                // const r2PublicationStr = Buffer.from(publicationView.r2PublicationBase64, "base64").toString("utf-8");
                // const r2PublicationJson = JSON.parse(r2PublicationStr);
                // const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);

                // const epubPath = this.publicationStorage.getPublicationEpubPath(publicationView.identifier);
                // const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);

                const publicationView = this.publicationViewConverter.convertDocumentToView(publicationDocument);
                if (!publicationView.lcp) {
                    debug("LCP !!?");
                    return;
                }

                // !r2Publication?.LCP?.Encryption?.UserKey?.TextHint
                if (!publicationView.lcp.textHint) {
                    debug("LCP TextHint !!?");
                    publicationView.lcp.textHint = "";
                }

                try {
                    // will call API.unlockPublicationWithPassphrase() again
                    const action = lcpActions.userKeyCheckRequest.build(
                        publicationView,
                        publicationView.lcp.textHint, // r2Publication.LCP.Encryption.UserKey.TextHint,
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

        this.store.dispatch(readerActions.openRequest.build(publicationViewIdentifer));
    }
}
