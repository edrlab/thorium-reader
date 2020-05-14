// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app, clipboard } from "electron";
import { inject, injectable } from "inversify";
import { IReaderApi } from "readium-desktop/common/api/interface/readerApi.interface";
import { LocatorType } from "readium-desktop/common/models/locator";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { Translator } from "readium-desktop/common/services/translator";
import { LocatorView } from "readium-desktop/common/views/locator";
import { LocatorViewConverter } from "readium-desktop/main/converter/locator";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { RootState } from "readium-desktop/main/redux/states";
import { Store } from "redux";

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";

@injectable()
export class ReaderApi implements IReaderApi {
    @inject(diSymbolTable["locator-repository"])
    private readonly locatorRepository!: LocatorRepository;

    @inject(diSymbolTable["locator-view-converter"])
    private readonly locatorViewConverter!: LocatorViewConverter;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable.translator)
    private readonly translator!: Translator;

    // public async setLastReadingLocation(publicationIdentifier: string, locator: R2Locator): Promise<LocatorView> {
    //     const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
    //         publicationIdentifier,
    //         LocatorType.LastReadingLocation,
    //     );

    //     let newDoc = null;

    //     if (docs.length === 0) {
    //         // Create new locator
    //         newDoc = {
    //             publicationIdentifier,
    //             locatorType: LocatorType.LastReadingLocation,
    //             locator: Object.assign({}, locator),
    //         };
    //     } else {
    //         // Update locator
    //         newDoc = Object.assign(
    //             {},
    //             docs[0],
    //             {
    //                 locator: Object.assign({}, locator),
    //             },
    //         );
    //     }

    //     const savedDoc = await this.locatorRepository.save(newDoc);
    //     return this.locatorViewConverter.convertDocumentToView(savedDoc);
    // }

    public async getLastReadingLocation(publicationIdentifier: string): Promise<LocatorExtended | undefined> {
        // const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
        //     publicationIdentifier,
        //     LocatorType.LastReadingLocation,
        // );

        // if (docs.length === 0) {
        //     return null;
        // }

        // return this.locatorViewConverter.convertDocumentToView(docs[0]);

        const state = this.store.getState();
        const locator = state.win.registry.reader[publicationIdentifier]?.reduxState.locator;

        return locator;
    }

    public async findBookmarks(publicationIdentifier: string): Promise<LocatorView[]> {
        const docs = await this.locatorRepository.findByPublicationIdentifierAndLocatorType(
            publicationIdentifier,
            LocatorType.Bookmark,
        );

        return docs.map((doc) => {
            return this.locatorViewConverter.convertDocumentToView(doc);
        });
    }

    public async updateBookmark(
        identifier: string,
        publicationIdentifier: string,
        locator: R2Locator,
        name?: string,
    ): Promise<void> {

        const newDoc = {
            identifier,
            publicationIdentifier,
            locatorType: LocatorType.Bookmark,
            locator: Object.assign({}, locator),
            name,
        };
        await this.locatorRepository.save(newDoc);
    }

    public async addBookmark(
        publicationIdentifier: string,
        locator: R2Locator,
        name?: string,
    ): Promise<void> {

        const loc = {
            publicationIdentifier,
            locatorType: LocatorType.Bookmark,
            locator: Object.assign({}, locator),
            name,
        };
        await this.locatorRepository.save(loc);

        if (app.accessibilitySupportEnabled) {
            this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                `${this.translator.translate("reader.navigation.bookmarkTitle")} (${this.translator.translate("catalog.addTagsButton")})`));
        }
    }

    public async deleteBookmark(identifier: string): Promise<void> {
        await this.locatorRepository.delete(identifier);

        if (app.accessibilitySupportEnabled) {
            this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
                `${this.translator.translate("reader.navigation.bookmarkTitle")} (${this.translator.translate("reader.marks.delete")})`));
        }
    }

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

    // TODO
    // may be removed and replaced with a action dispatched to every reader
    public async getMode() {
        return this.store.getState().mode;
    }
}
