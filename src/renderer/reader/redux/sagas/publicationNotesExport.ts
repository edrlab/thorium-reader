// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLatest } from "readium-desktop/common/redux/sagas/takeSpawnLatest";
import { convertReadiumAnnotationSetToHtml } from "readium-desktop/renderer/common/redux/sagas/readiumAnnotation/export";
import { SagaGenerator } from "typed-redux-saga";
import { all as allTyped, call as callTyped, put as putTyped } from "typed-redux-saga/macro";

function* renderPublicationNotesHtmlExport(
    action: readerActions.publicationNotes.exportHtmlRequest.TAction,
): SagaGenerator<void> {

    const {
        publicationIdentifier,
        readiumAnnotationSet,
        htmlMustacheTemplate,
        title,
        windowIdentifier,
    } = action.payload;
    const html = yield* callTyped(() =>
        convertReadiumAnnotationSetToHtml(readiumAnnotationSet, undefined, htmlMustacheTemplate));

    yield* putTyped(readerActions.publicationNotes.exportHtmlResult.build(
        publicationIdentifier,
        html,
        title,
        windowIdentifier,
    ));
}

export function saga() {
    return allTyped([
        takeSpawnLatest(
            readerActions.publicationNotes.exportHtmlRequest.ID,
            renderPublicationNotesHtmlExport,
            (e) => console.error("readerActions.publicationNotes.exportHtmlRequest", e),
        ),
    ]);
}
