// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IRecoverablePublication } from "readium-desktop/common/api/interface/publicationApi.interface";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { IPublicationStorageRecoverablePublication } from "readium-desktop/main/storage/publication-storage";

import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import debug_ from "debug";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";

import { importFromFsService } from "./import/importFromFs";

const debug = debug_("readium-desktop:main#saga/api/publication/recovery");

const convertDoc = async (doc: PublicationDocument, publicationViewConverter: PublicationViewConverter) => {
    try {
        return await publicationViewConverter.convertDocumentToView(doc);
    } catch (e) {
        debug("Error to convert recovered document to publicationView", e);
        return publicationViewConverter.convertUnavailableDocumentToMinimalPublicationView(doc);
    }
};

const getRecoverablePublicationTitle = async (
    publication: IPublicationStorageRecoverablePublication,
    locale: keyof typeof availableLanguages,
): Promise<string | undefined> => {
    let r2Publication;
    try {
        r2Publication = await PublicationParsePromise(publication.filePath);
        return convertMultiLangStringToString(r2Publication.Metadata?.Title, locale) || publication.identifier;
    } catch (e) {
        debug("Recoverable publication parse failed", publication.identifier, publication.filePath, e);
        return undefined;
    } finally {
        try {
            r2Publication?.freeDestroy();
        } catch (e) {
            debug(e);
        }
    }
};

const findRecoverablePublicationData = async (): Promise<IRecoverablePublication[]> => {
    const publicationRepository = diMainGet("publication-repository");
    const publicationStorage = diMainGet("publication-storage");
    const store = diMainGet("store");
    const locale = store.getState().i18n.locale as keyof typeof availableLanguages;

    const publicationDocuments = publicationRepository.findAll();
    const recoverablePublications = await publicationStorage.listRecoverablePublications(publicationDocuments);
    const publications: IRecoverablePublication[] = [];

    for (const recoverablePublication of recoverablePublications) {
        const title = await getRecoverablePublicationTitle(recoverablePublication, locale);
        if (!title) {
            continue;
        }
        publications.push({
            identifier: recoverablePublication.identifier,
            filePath: recoverablePublication.filePath,
            title,
        });
    }

    return publications;
};

export function* findAllRecoverable(): SagaGenerator<IRecoverablePublication[]> {
    return yield* callTyped(findRecoverablePublicationData);
}

export function* recover(identifiers?: string[]): SagaGenerator<PublicationView[]> {
    const recoverablePublications = yield* callTyped(findRecoverablePublicationData);
    const identifierSet = identifiers?.length ? new Set(identifiers) : undefined;
    const publicationsToRecover = identifierSet ?
        recoverablePublications.filter((publication) => identifierSet.has(publication.identifier)) :
        recoverablePublications;

    const publicationViewConverter = diMainGet("publication-view-converter");
    const publicationViews: PublicationView[] = [];

    for (const publication of publicationsToRecover) {
        try {
            const [publicationDocument, alreadyImported] = yield* callTyped(
                importFromFsService,
                publication.filePath,
                false,
                undefined,
                publication.identifier,
            );
            if (alreadyImported) {
                debug("Publication recovery skipped because a database record already exists", publication.identifier, publication.filePath);
                continue;
            }
            const publicationView = yield* callTyped(() => convertDoc(publicationDocument, publicationViewConverter));
            publicationViews.push(publicationView);
        } catch (e) {
            debug("Publication recovery failed", publication.identifier, publication.filePath, e);
        }
    }

    if (publicationViews.length) {
        yield* putTyped(toastActions.openRequest.build(
            ToastType.Success,
            `${publicationViews.length} publication${publicationViews.length > 1 ? "s" : ""} recovered.`,
        ));
    } else if (publicationsToRecover.length) {
        yield* putTyped(toastActions.openRequest.build(
            ToastType.Error,
            "Publication recovery failed.",
        ));
    }

    return publicationViews;
}
