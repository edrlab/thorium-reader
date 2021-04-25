// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { ILcpApi } from "readium-desktop/common/api/interface/lcpApi.interface";
import { lcpActions } from "readium-desktop/common/redux/actions";
import { readerActions } from "readium-desktop/common/redux/actions/";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { Store } from "redux";

import { PublicationViewConverter } from "../converter/publication";
import { RootState } from "../redux/states";

const debug = debug_("readium-desktop:main:redux:sagas:streamer");

@injectable()
export class LcpApi implements ILcpApi {
    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

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
                const message =
                    // unlockPublicationRes === 11 ?
                    // this.translator.translate("publication.expiredLcp") :
                    this.lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                debug(message);

                // import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
                // import { Publication as R2Publication } from "@r2-shared-js/models/publication";
                // tslint:disable-next-line: max-line-length
                // const r2PublicationStr = Buffer.from(publicationView.r2PublicationBase64, "base64").toString("utf-8");
                // const r2PublicationJson = JSON.parse(r2PublicationStr);
                // const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);

                // const epubPath = this.publicationStorage.getPublicationEpubPath(publicationView.identifier);
                // const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);

                const publicationView = await this.publicationViewConverter.convertDocumentToView(publicationDocument);
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
                        publicationView.lcp.urlHint,
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
