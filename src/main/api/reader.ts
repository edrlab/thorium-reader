// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clipboard } from "electron";
import { inject, injectable } from "inversify";
import { IReaderApi } from "readium-desktop/common/api/interface/readerApi.interface";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { Translator } from "readium-desktop/common/services/translator";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { RootState } from "readium-desktop/main/redux/states";
import { type Store } from "redux";

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";

@injectable()
export class ReaderApi implements IReaderApi {

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    // TODO
    // clipboard can be an action catched in saga, nothing to return
    public async clipboardCopy(
        publicationIdentifier: string,
        clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY): Promise<boolean> {

        // const isLinux = process.platform === "linux";
        // const clipBoardType = isLinux ? "selection" : "clipboard";
        const clipBoardType = "clipboard";

        let textToCopy = clipboardData.txt;

        const publicationDocument = await this.publicationRepository.get(
            publicationIdentifier,
        );

        if (!publicationDocument.lcp ||
            !publicationDocument.lcp.rights ||
            publicationDocument.lcp.rights.copy === null ||
            typeof publicationDocument.lcp.rights.copy === "undefined" ||
            publicationDocument.lcp.rights.copy < 0) {

            clipboard.writeText(textToCopy, clipBoardType);
            return true;
        }

        const lcpRightsCopies = publicationDocument.lcpRightsCopies ?
            publicationDocument.lcpRightsCopies : 0;
        const lcpRightsCopiesRemain = publicationDocument.lcp.rights.copy - lcpRightsCopies;
        if (lcpRightsCopiesRemain <= 0) {
            this.store.dispatch(toastActions.openRequest.build(ToastType.Error,
                `LCP [${this.translator.translate("app.edit.copy")}] ${publicationDocument.lcpRightsCopies} / ${publicationDocument.lcp.rights.copy}`,
                publicationIdentifier));
            return false;
        }
        const nCharsToCopy = textToCopy.length > lcpRightsCopiesRemain ?
            lcpRightsCopiesRemain : textToCopy.length;
        if (nCharsToCopy < textToCopy.length) {
            textToCopy = textToCopy.substr(0, nCharsToCopy);
        }
        const newPublicationDocument: PublicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                lcpRightsCopies: lcpRightsCopies + nCharsToCopy,
            },
        );
        await this.publicationRepository.save(newPublicationDocument);

        clipboard.writeText(`${textToCopy}`, clipBoardType);

        this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
            `LCP [${this.translator.translate("app.edit.copy")}] ${newPublicationDocument.lcpRightsCopies} / ${publicationDocument.lcp.rights.copy}`,
            publicationIdentifier));

        return true;
    }
}
