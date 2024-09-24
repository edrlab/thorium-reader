// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { dialog } from "electron";
import { readFile } from "fs/promises";
import { ToastType } from "readium-desktop/common/models/toast";
import { annotationActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { call, SagaGenerator, put, select } from "typed-redux-saga";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { hexToRgb } from "readium-desktop/common/rgb";
import { isNil } from "readium-desktop/utils/nil";
import { RootState } from "../states";
import { __READIUM_ANNOTATION_AJV_ERRORS, isDomRangeSelector, isFragmentSelector, isIReadiumAnnotationModelSet, isProgressionSelector, isTextQuoteSelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { syncIpc } from "readium-desktop/common/ipc";
import { SenderType } from "readium-desktop/common/models/sync";
import { winActions } from "readium-desktop/main/redux/actions";
import { cleanupStr } from "readium-desktop/utils/search/transliteration";
import path from "path";


// Logger
const filename_ = "readium-desktop:main:saga:annotationsImporter";
const debug = debug_(filename_);
debug("_");

function* importAnnotationSet(action: annotationActions.importAnnotationSet.TAction): SagaGenerator<void> {

    const { payload: { publicationIdentifier, winId } } = action;

    debug("Start annotations Importer");

    let win = getLibraryWindowFromDi();
    try {
        if (winId) {
            win = getReaderWindowFromDi(winId);
        }
    } catch {
        // nothing
    }

    let filePath = "";
    try {

        debug("Open ShowOpenDialog and ask to user the filePath");
        const res = yield* call(() => dialog.showOpenDialog(win, { filters: [{ extensions: ["annotation"], name: "Readium Annotation Set (.annotation)" }], properties: ["openFile"] }));

        if (!res.canceled) {
            filePath = res.filePaths[0] || "";

        }
    } catch (e) {
        debug("Error!!! to open a file, exit", e);
        yield* put(toastActions.openRequest.build(ToastType.Error, "Error" + e, publicationIdentifier));
        return ;
    }

    debug("FilePath=", filePath);
    const fileName = path.basename(filePath).slice(0, -1 * ".annotation".length);

    try {

        // read filePath
        const data = yield* call(() => readFile(filePath, { encoding: "utf8" }));
        const readiumAnnotationFormat = JSON.parse(data);
        debug("filePath size=", data.length);
        debug("filePath serialized and ready to pass the type checker");

        if (isIReadiumAnnotationModelSet(readiumAnnotationFormat)) {

            debug("filePath pass the typeChecker (ReadiumAnnotationModelSet)");

            const data = readiumAnnotationFormat;
            const annotationsIncommingArray = data.items;

            if (!annotationsIncommingArray.length) {
                debug("there are no annotations in the file, exit");
                yield* put(toastActions.openRequest.build(ToastType.Success, "Success !, there are no annotations in the file and nothing is imported", publicationIdentifier));
                return;
            }

            // check if it is the same publication ID
            const sourceUUID = data.about["dc:identifier"].find((v) => v.startsWith("urn:thorium:"))?.split("urn:thorium:")[1] || "";
            if (sourceUUID === publicationIdentifier) {

                debug("OK Publication identified : same publicationIndentifier");

                // OK publication identified

                let annotations: IAnnotationState[] = [];
                const sessionReader = yield* select((state: RootState) => state.win.session.reader);
                const winSessionReaderStateArray = Object.values(sessionReader).filter((v) => v.publicationIdentifier === publicationIdentifier);
                if (winSessionReaderStateArray.length) {
                    const winSessionReaderState = winSessionReaderStateArray[0];
                    annotations = (winSessionReaderState?.reduxState?.annotation || []).map(([, v]) => v);

                    debug("current publication AnnotationsList come from the readerSession (there are one or many readerWin currently open)");
                } else {
                    const sessionRegistry = yield* select((state: RootState) => state.win.registry.reader);
                    if (Object.keys(sessionRegistry).find((v) => v === publicationIdentifier)) {
                        annotations = (sessionRegistry[publicationIdentifier]?.reduxState?.annotation || []).map(([, v]) => v);

                        debug("current publication AnnotationsList come from the readerRegistry (no readerWin currently open)");
                    }
                }
                debug("There are", annotations.length, "annotation(s) loaded from the current publicationIdentifier");
                if (!annotations.length) {
                    debug("Be careful, there are no annotation loaded for this publication!");
                }


                const annotationsParsedBuffer: IAnnotationState[] = [];

                debug("There are", annotationsIncommingArray.length, "incomming annotations to be imported");

                // loop on each annotation to check conflicts and import it
                for (const incommingAnnotation of annotationsIncommingArray) {

                    const textQuoteSelector = incommingAnnotation.target.selector.find(isTextQuoteSelector);
                    const progressionSelector = incommingAnnotation.target.selector.find(isProgressionSelector);
                    const domRangeSelector = incommingAnnotation.target.selector.find(isDomRangeSelector);
                    const fragmentSelector = incommingAnnotation.target.selector.find(isFragmentSelector);

                    const annotationParsed: IAnnotationState = {
                        uuid: incommingAnnotation.id.split("urn:uuid:")[1], // TODO : may not be an uuid format and maybe we should hash the uuid to get a unique identifier based on the original uuid
                        locatorExtended: {
                            locator: {
                                href: incommingAnnotation.target.source,
                                title: undefined,
                                text: {
                                    beforeRaw: textQuoteSelector?.prefix,
                                    afterRaw: textQuoteSelector?.suffix,
                                    highlightRaw: textQuoteSelector?.exact,
                                    after: textQuoteSelector?.prefix && cleanupStr(textQuoteSelector.prefix),
                                    before: textQuoteSelector?.suffix && cleanupStr(textQuoteSelector.suffix),
                                    highlight: textQuoteSelector?.exact && cleanupStr(textQuoteSelector.exact),
                                },
                                locations: {
                                    cfi: fragmentSelector.conformsTo === "http://www.idpf.org/epub/linking/cfi/epub-cfi.html"
                                        ? fragmentSelector.value.startsWith("epubcfi(")
                                            ? fragmentSelector.value.slice("epubcfi(".length, -1)
                                            : fragmentSelector.value
                                        : undefined,
                                    cssSelector: undefined,
                                    position: undefined,
                                    progression: progressionSelector?.value,
                                    rangeInfo: domRangeSelector
                                        ? {
                                            startContainerElementCssSelector: domRangeSelector.startContainerElementCssSelector,
                                            startContainerElementCFI: undefined,
                                            startContainerChildTextNodeIndex: domRangeSelector.endContainerChildTextNodeIndex,
                                            startOffset: domRangeSelector.startOffset,
                                            endContainerElementCssSelector: domRangeSelector.endContainerElementCssSelector,
                                            endContainerElementCFI: undefined,
                                            endContainerChildTextNodeIndex: domRangeSelector.endContainerChildTextNodeIndex,
                                            endOffset: domRangeSelector.endOffset,
                                            cfi: undefined,
                                        }
                                        : undefined,
                                },
                            },
                            audioPlaybackInfo: undefined,
                            paginationInfo: undefined,
                            selectionInfo: {
                                rawBefore: textQuoteSelector?.prefix,
                                rawAfter: textQuoteSelector?.suffix,
                                rawText: textQuoteSelector?.exact,
                                cleanAfter: textQuoteSelector?.prefix && cleanupStr(textQuoteSelector.prefix),
                                cleanBefore: textQuoteSelector?.suffix && cleanupStr(textQuoteSelector.suffix),
                                cleanText: textQuoteSelector?.exact && cleanupStr(textQuoteSelector.exact),
                                rangeInfo: {
                                    startContainerElementCssSelector: domRangeSelector?.startContainerElementCssSelector || "",
                                    startContainerElementCFI: undefined,
                                    startContainerChildTextNodeIndex: domRangeSelector?.endContainerChildTextNodeIndex || 0,
                                    startOffset: domRangeSelector?.startOffset || 0,
                                    endContainerElementCssSelector: domRangeSelector?.endContainerElementCssSelector || "",
                                    endContainerElementCFI: undefined,
                                    endContainerChildTextNodeIndex: domRangeSelector?.endContainerChildTextNodeIndex || 0,
                                    endOffset: domRangeSelector?.endOffset || 0,
                                    cfi: undefined,
                                },
                            },
                            selectionIsNew: undefined,
                            docInfo: undefined,
                            epubPage: undefined,
                            epubPageID: undefined,
                            headings: undefined,
                            secondWebViewHref: undefined,
                        },
                        comment: incommingAnnotation.body.value,
                        color: hexToRgb(incommingAnnotation.body.color),
                        drawType: (isNil(incommingAnnotation.body.highlight) || incommingAnnotation.body.highlight === "solid") ? "solid_background" : incommingAnnotation.body.highlight,
                        // TODO need to ask to user if the incomming tag is kept or the fileName is used
                        tags: [fileName], // incommingAnnotation.body.tag ? [incommingAnnotation.body.tag] : [],
                    };

                    debug("incomming annotation Parsed And Formated (", annotationParsed.uuid, "), ready to be imported");

                    if (annotations.find(({ uuid }) => uuid === annotationParsed.uuid)) {

                        // Oups there is a conflict !
                        // ask to user how to reconciliate

                        debug(`ANNOTATION CONFLICT WITH ${annotationParsed.uuid} !`);
                    } else {

                        annotationsParsedBuffer.push(annotationParsed);
                    }

                }

                if (!annotationsParsedBuffer.length) {

                    debug("there are no annotations ready to be imported, exit");
                    yield* put(toastActions.openRequest.build(ToastType.Success, `Success !, there are ${annotationsIncommingArray.length} annotations and nothing has been imported`, publicationIdentifier));
                    return;

                }

                debug("ready to send", annotationsParsedBuffer.length, "annotation(s) to the reader");
                if (winSessionReaderStateArray.length) {

                    debug("send to", winSessionReaderStateArray.length, "readerWin with the same publicationId (", publicationIdentifier, ")");

                    for (const winSessionReaderState of winSessionReaderStateArray) {

                        const readerWin = getReaderWindowFromDi(winSessionReaderState.identifier);

                        for (const annotationParsed of annotationsParsedBuffer) {
                            const a = ActionSerializer.serialize(readerActions.annotation.push.build(annotationParsed));
                            try {
                                readerWin.webContents.send(syncIpc.CHANNEL, {
                                    type: syncIpc.EventType.MainAction,
                                    payload: {
                                        action: a,
                                    },
                                    sender: {
                                        type: SenderType.Main,
                                    },
                                } as syncIpc.EventPayload);

                            } catch (error) {
                                debug("ERROR in SYNC ACTION", error);
                            }
                        }
                    }

                } else {
                    // No readerWin opened with the pubId
                    // Need to dispatch to the reader registry to save the new annotation

                    debug("No readerWin currently open");
                    debug("Dispatch an action to save to the publicationIdentifier registry");
                    debug("new AnnotationList is appended to the persisted publication reduxState in main process");

                    yield* put(winActions.registry.addAnnotationToReaderPublication.build(publicationIdentifier, annotationsParsedBuffer));

                }

            } else {

                // TODO matching with the title and authors ?

                // TODO: ask to user if he want to continue the import

                // For the moment, exit with error message

                debug("TODO: need to enhance this part and update the publication matching");
                yield* put(toastActions.openRequest.build(ToastType.Error, "Error: " + "Not the same publication Identifier", publicationIdentifier));
                return;
            }
        } else {

            debug("Error: ", __READIUM_ANNOTATION_AJV_ERRORS);
            yield* put(toastActions.openRequest.build(ToastType.Error, "Error: " + "File format", publicationIdentifier));
            return;
        }

    } catch (e) {

        debug("Error!!! ", e);
        yield* put(toastActions.openRequest.build(ToastType.Error, "Error" + e, publicationIdentifier));
        return;
    }

    debug("Annotations importer success and exit");
    yield* put(toastActions.openRequest.build(ToastType.Success, "Success !", publicationIdentifier));
    return ;
}


export function saga() {
    return takeSpawnLeading(
        annotationActions.importAnnotationSet.ID,
        importAnnotationSet,
        (e) => error(filename_, e),
    );
}
