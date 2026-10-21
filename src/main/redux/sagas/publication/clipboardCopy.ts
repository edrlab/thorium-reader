// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { clipboard } from "electron";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { ToastType } from "readium-desktop/common/models/toast";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { getTranslator } from "readium-desktop/common/services/translator";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";

const debug = debug_("readium-desktop:main:saga:clipboardCopy");

export function* readerClipboardCopy(action: readerActions.clipboardCopy.TAction) {

    const { publicationIdentifier, clipboardData } = action.payload;
    const clipBoardType = "clipboard";

    let textToCopy = clipboardData.txt;

    const publicationRepository = diMainGet("publication-repository");
    const translator = getTranslator();
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));

    debug("LCP RIGHTS", JSON.stringify(publicationDocument.lcp?.rights, null, 4));

    if (!publicationDocument.lcp ||
        !publicationDocument.lcp.rights ||
        publicationDocument.lcp.rights.copy === null ||
        typeof publicationDocument.lcp.rights.copy === "undefined" ||
        publicationDocument.lcp.rights.copy < 0) {

        clipboard.writeText(textToCopy, clipBoardType);
        return ;
    }

    const lcpRightsCopies = publicationDocument.lcpRightsCopies ?
        publicationDocument.lcpRightsCopies : 0;
    const lcpRightsCopiesRemain = publicationDocument.lcp.rights.copy - lcpRightsCopies;
    if (lcpRightsCopiesRemain <= 0) {
        yield* putTyped(toastActions.openRequest.build(ToastType.Error,
            translator.translate("message.notifications.copyLimit"),
            publicationIdentifier, (action as unknown as ActionWithSender).sender?.identifier));
        return;
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
    yield* callTyped(() => publicationRepository.save(newPublicationDocument));

    clipboard.writeText(`${textToCopy}`, clipBoardType);

    yield* putTyped(toastActions.openRequest.build(ToastType.Success,
        `LCP [${translator.translate("app.edit.copy")}] ${newPublicationDocument.lcpRightsCopies} / ${publicationDocument.lcp.rights.copy}`,
        publicationIdentifier, (action as unknown as ActionWithSender).sender?.identifier));
}
