// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { select as selectTyped, take as takeTyped, all as allTyped, call as callTyped, SagaGenerator, put as putTyped, delay as delayTyped } from "typed-redux-saga/macro";

import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { readerLocalActionExportAnnotationSet } from "../actions";
// import { delay } from "redux-saga/effects";
import { getResourceCache } from "./resourceCache";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { convertAnnotationStateArrayToReadiumAnnotationSet, convertSelectorTargetToLocatorExtended, IAnnotationStateWithICacheDocument } from "readium-desktop/common/readium/annotation/converter";
import { IReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { annotationActions, readerActions } from "readium-desktop/common/redux/actions";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";

// Logger
const debug = debug_("readium-desktop:renderer:reader:redux:sagas:shareAnnotationSet");
debug("_");



const getCacheDocumentFromLocator = (cacheDocumentArray: ICacheDocument[], hrefSource: string): ICacheDocument => {

    for (const cacheDoc of cacheDocumentArray) {
        if (hrefSource && cacheDoc.href && cacheDoc.href === hrefSource) {
            return cacheDoc;
        }
    }

    return undefined;
};

export function* importAnnotationSet(): SagaGenerator<void> {

    debug("importAnnotationSet just started !");
    yield* callTyped(getResourceCache);

    let importQueue = yield* selectTyped((state: IReaderRootState) => state.annotationImportQueue);
    debug("ImportAnnotationQueue length", importQueue.length);
    while (importQueue.length) {

        // start import routine
        const { target, ...annotationState } = importQueue.shift();

        debug("annotationState:", JSON.stringify(annotationState, null, 4));
        debug("SelectorTarget from AnnotationState", JSON.stringify(target, null, 4));

        yield* putTyped(annotationActions.shiftFromAnnotationImportQueue.build());

        const { source } = target;
        const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);
        const cacheDoc = getCacheDocumentFromLocator(cacheDocuments, source);

        const annotationStateFormated: IAnnotationState = {
            ...annotationState,
            locatorExtended: yield* callTyped(() => convertSelectorTargetToLocatorExtended(target, cacheDoc)),
        };
        if (!annotationStateFormated.locatorExtended) {
            debug("ERROR: no locator found !! for annotationState, doesn't import this note");
            continue;
        }

        yield* putTyped(readerActions.annotation.push.build(annotationStateFormated));
        yield* delayTyped(100);

        importQueue = yield* selectTyped((state: IReaderRootState) => state.annotationImportQueue);
    }

    debug("Wait for any annotation in import queue");
    yield* takeTyped(annotationActions.pushToAnnotationImportQueue.build);
    debug("New annotation put in queue from import annotation routine. Start the import routine");
}

function* exportAnnotationSet(): SagaGenerator<void> {

    const exportAnnotationSetAction = yield* takeTyped(readerLocalActionExportAnnotationSet.build);
    const { payload: { annotationArray, publicationView, label } } = exportAnnotationSetAction;

    yield* callTyped(getResourceCache);

    debug("exportAnnotationSet just started !");
    debug("AnnotationArray: ", annotationArray);
    debug("PubView ok?", typeof publicationView);
    debug("label:", label);

    const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);

    const annotationsWithCacheDocumentArray: IAnnotationStateWithICacheDocument[] = [];

    for (const anno of annotationArray) {
        annotationsWithCacheDocumentArray.push({
            ...anno,
            __cacheDocument: getCacheDocumentFromLocator(cacheDocuments, anno.locatorExtended?.locator?.href),
        });
    }

    const readiumAnnotationSet = yield* callTyped(() => convertAnnotationStateArrayToReadiumAnnotationSet(annotationsWithCacheDocumentArray, publicationView, label));

    debug("readiumAnnotationSet generated, prepare to download it");

    const downloadAnnotationJSON = (contents: IReadiumAnnotationSet, filename: string) => {

        const data = JSON.stringify(contents, null, 2);
        const blob = new Blob([data], { type: "application/rd-annotations+json" });
        const jsonObjectUrl = URL.createObjectURL(blob);
        const anchorEl = document.createElement("a");
        anchorEl.href = jsonObjectUrl;
        anchorEl.download = `${filename}.annotation`;
        anchorEl.click();
        URL.revokeObjectURL(jsonObjectUrl);
    };

    downloadAnnotationJSON(readiumAnnotationSet, label);

}

export const saga = () =>
    allTyped([
        spawnLeading(
            exportAnnotationSet,
            (e) => console.error("exportAnnotationSet", e),
        ),
        spawnLeading(
            importAnnotationSet,
            (e) => console.error("importAnnotationSet", e),
        ),
    ]);

