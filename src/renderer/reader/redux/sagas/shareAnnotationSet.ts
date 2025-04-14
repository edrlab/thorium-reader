// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { select as selectTyped, take as takeTyped, all as allTyped, call as callTyped, SagaGenerator, put as putTyped, delay as delayTyped } from "typed-redux-saga/macro";

import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { readerLocalActionExportAnnotationSet, readerLocalActionReader } from "../actions";
// import { delay } from "redux-saga/effects";
import { getResourceCache } from "./resourceCache";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { convertAnnotationStateArrayToReadiumAnnotationSet, convertSelectorTargetToLocatorExtended, INoteStateWithICacheDocument } from "readium-desktop/common/readium/annotation/converter";
import { IReadiumAnnotation, IReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { annotationActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { EDrawType, INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { ToastType } from "readium-desktop/common/models/toast";
import * as Mustache from "mustache";
import { noteExportHtmlMustacheTemplate } from "readium-desktop/common/readium/annotation/htmlTemplate";
import { marked } from "marked";
import DOMPurify from "dompurify";

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
    // yield* callTyped(getResourceCache);

    let importQueue = yield* selectTyped((state: IReaderRootState) => state.annotationImportQueue);
    debug("ImportAnnotationQueue length", importQueue.length);
    while (importQueue.length) {

        // start import routine
        const { target, ...noteState } = importQueue[0];

        // not atomic : if the reader is closing during this import process it can forget data
        yield* putTyped(annotationActions.shiftFromAnnotationImportQueue.build());

        debug("annotationState:", JSON.stringify(noteState, null, 4));
        debug("SelectorTarget from AnnotationState", JSON.stringify(target, null, 4));


        const { source } = target;
        const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);
        const cacheDoc = getCacheDocumentFromLocator(cacheDocuments, source);

        const noteTotalCount = yield* selectTyped((state: IReaderRootState) => state.reader.noteTotalCount.state);
        const isABookmark = noteState.group === "bookmark";
        const locatorExtended = yield* callTyped(() => convertSelectorTargetToLocatorExtended(target, cacheDoc, undefined, isABookmark));
        const noteStateFormated: INoteState = {
            ...noteState,
            locatorExtended,
            index: noteTotalCount + 1,
            drawType: (locatorExtended.locator.locations?.caretInfo || isABookmark) ? EDrawType.bookmark : noteState.drawType,
            group: (locatorExtended.locator.locations?.caretInfo || isABookmark) ? "bookmark" : noteState.group, // can be filed by https://www.w3.org/TR/annotation-model/#motivation-and-purpose
        };
        if (!noteStateFormated.locatorExtended) {
            debug("ERROR: no locator found !! for annotationState, doesn't import this note");
            continue;
        }

        const notes = yield* selectTyped((state: IReaderRootState) => state.reader.note);

        const previousNoteFound = notes.find(({ uuid }) => noteStateFormated.uuid === uuid);
        yield* putTyped(readerActions.note.addUpdate.build(noteStateFormated, previousNoteFound));
        yield* putTyped(readerLocalActionReader.bookmarkTotalCount.build(noteTotalCount + 1));

        // wait 100ms to not overload event-loop
        yield* delayTyped(100);

        // reload import queue for the next shift phase
        importQueue = yield* selectTyped((state: IReaderRootState) => state.annotationImportQueue);
    }

    debug("Wait for any annotation in import queue");
    yield* takeTyped(annotationActions.pushToAnnotationImportQueue.build);
    debug("New annotation put in queue from import annotation routine. Start the import routine");
}


const __htmlMustacheViewConverterFn: (readiumAnnotation: IReadiumAnnotationSet) => Promise<object> = async (readiumAnnotation) => {

    const view = {
        ...readiumAnnotation,
    };
    const tmpItems = [];
    for (const item of (view.items || [])) {

        try {
            tmpItems.push({ ...item, body: { ...item.body || {}, htmlValue: DOMPurify.sanitize(await marked.parse((item.body?.value || "").replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""), { gfm: true })) } });
        } catch (_) {
            tmpItems.push(item);
        }
    }
    view.items = tmpItems as IReadiumAnnotation[];

    return view;
};
const convertReadiumAnnotationSetToHtml = async (
    readiumAnnotation: IReadiumAnnotationSet,
    viewConverterFn: (_: IReadiumAnnotationSet) => Promise<object> = __htmlMustacheViewConverterFn,
    htmlMustacheTemplate: string = noteExportHtmlMustacheTemplate,
): Promise<string> => {
    const output = Mustache.render(htmlMustacheTemplate, await viewConverterFn(readiumAnnotation));
    return output;
};
const downloadAnnotationFile = (data: string, filename: string, extension: ".annotation" | ".html") => {

    const blob = new Blob([data], { type: extension === ".annotation" ? "application/rd-annotations+json" : "text/html" });
    const jsonObjectUrl = URL.createObjectURL(blob);
    const anchorEl = document.createElement("a");
    anchorEl.href = jsonObjectUrl;
    anchorEl.download = filename + extension;
    anchorEl.click();
    URL.revokeObjectURL(jsonObjectUrl);
};
function* exportAnnotationSet(): SagaGenerator<void> {

    const exportAnnotationSetAction = yield* takeTyped(readerLocalActionExportAnnotationSet.build);
    const { payload: { annotationArray, publicationView, label, fileType } } = exportAnnotationSetAction;
    
    const extension = fileType === "annotation" ? ".annotation" : ".html";

    yield* callTyped(getResourceCache);

    debug("exportAnnotationSet just started !");
    debug("AnnotationArray: ", annotationArray);
    debug("PubView ok?", typeof publicationView);
    debug("label:", label);

    const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);

    const annotationsWithCacheDocumentArray: INoteStateWithICacheDocument[] = [];

    for (const anno of annotationArray) {
        annotationsWithCacheDocumentArray.push({
            ...anno,
            __cacheDocument: getCacheDocumentFromLocator(cacheDocuments, anno.locatorExtended?.locator?.href),
        });
    }

    const locale = yield* selectTyped((state: IReaderRootState) => state.i18n.locale);
    const readiumAnnotationSet = yield* callTyped(() => convertAnnotationStateArrayToReadiumAnnotationSet(locale, annotationsWithCacheDocumentArray, publicationView, label));

    debug("readiumAnnotationSet generated, prepare to download it");

    const {htmlContent, overrideHTMLTemplate} = (yield* selectTyped((state: IReaderRootState) => state.noteExport));
    const htmlMustacheTemplateContent = overrideHTMLTemplate ? htmlContent : noteExportHtmlMustacheTemplate || noteExportHtmlMustacheTemplate;

    const stringData = extension === ".annotation" ?
        JSON.stringify(readiumAnnotationSet, null, 2) :
        yield* callTyped(() => convertReadiumAnnotationSetToHtml(readiumAnnotationSet, __htmlMustacheViewConverterFn, htmlMustacheTemplateContent));
    downloadAnnotationFile(stringData, label, extension);
}

export const saga = () =>
    allTyped([
        spawnLeading(
            exportAnnotationSet,
            (e) => console.error("exportAnnotationSet", e),
        ),
        spawnLeading(
            function* () {

                let gotTheLock = yield* selectTyped((state: IReaderRootState) => state.reader.lock);
                if (!gotTheLock) {
                    yield* takeTyped(readerActions.setTheLock.build);
                }

                gotTheLock = yield* selectTyped((state: IReaderRootState) => state.reader.lock);
                if (!gotTheLock) {
                    throw new Error("unreachable!!!");
                }

                while (true) {
                    try {
                        yield* callTyped(importAnnotationSet);
                    } catch (e) {
                        debug("ERROR IMPORT ANNOTATION SET :", e);
                        yield* putTyped(toastActions.openRequest.build(ToastType.Error, `${e}`));
                    }
                }

            },
            (e) => console.error("importAnnotationSet", e),
        ),
    ]);
