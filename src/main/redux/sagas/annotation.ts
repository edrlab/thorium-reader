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
import { call, SagaGenerator, put, select, take } from "typed-redux-saga";
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
import { getPublication } from "./api/publication/getPublication";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { v4 as uuidv4 } from "uuid";


// Logger
const filename_ = "readium-desktop:main:saga:annotationsImporter";
const debug = debug_(filename_);
debug("_");

function* importAnnotationSet(action: annotationActions.importAnnotationSet.TAction): SagaGenerator<void> {

    const { payload: { publicationIdentifier, winId } } = action;
    debug("Start annotations Importer");

    const readerPublicationIdentifier = winId ? publicationIdentifier : undefined; // if undefined toast notification will be displayed in library win
    const currentTimestamp = (new Date()).getTime();

    const win = winId ? getReaderWindowFromDi(winId) : getLibraryWindowFromDi();
    if (!win) {
        debug("ERROR!! No Browser window !!! exit");
        return ;
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
        yield* put(toastActions.openRequest.build(ToastType.Error, "Error" + e, readerPublicationIdentifier));
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
                yield* put(toastActions.openRequest.build(ToastType.Success, "Success !, there are no annotations in the file and nothing is imported", readerPublicationIdentifier));
                return;
            }


            // we just check if each annotation href source belongs to the R2Publication Spine items
            // if at least one annotation in the list doesn't match with the current spine item, then reject the set importation

            const pubView = yield* call(getPublication, publicationIdentifier);
            const r2PublicationJson = pubView.r2PublicationJson;
            const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);
            const spineItem = r2Publication.Spine;
            const hrefFromSpineItem = spineItem.map((v) => v.Href);
            debug("Current Publcation (", publicationIdentifier, ") SpineItems(hrefs):", hrefFromSpineItem);
            const annotationsIncommingArraySourceHrefs = annotationsIncommingArray.map(({ target: {source} }) => source);
            debug("Incomming Annotations target.source(hrefs):", annotationsIncommingArraySourceHrefs);
            const annotationsIncommingMatchPublicationSpineItem = annotationsIncommingArraySourceHrefs.reduce((acc, source) => {
                return acc && hrefFromSpineItem.includes(source);
            }, true);

            if (annotationsIncommingMatchPublicationSpineItem) {

                debug("GOOD ! spineItemHref matched : publication identified, let's continue the importation");

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


                const annotationsParsedNoConflictArray: IAnnotationState[] = [];
                const annotationsParsedConflictArray: IAnnotationState[] = [];
                const annotationsParsedAllArray: IAnnotationState[] = [];

                debug("There are", annotationsIncommingArray.length, "incomming annotations to be imported");

                // loop on each annotation to check conflicts and import it
                for (const incommingAnnotation of annotationsIncommingArray) {

                    const textQuoteSelector = incommingAnnotation.target.selector.find(isTextQuoteSelector);
                    const progressionSelector = incommingAnnotation.target.selector.find(isProgressionSelector);
                    const domRangeSelector = incommingAnnotation.target.selector.find(isDomRangeSelector);
                    const fragmentSelector = incommingAnnotation.target.selector.find(isFragmentSelector);
                    const { headings, page } = incommingAnnotation.target.meta || {};
                    const creator = incommingAnnotation.creator;

                    const cfi = fragmentSelector.conformsTo === "http://www.idpf.org/epub/linking/cfi/epub-cfi.html"
                                        ? fragmentSelector.value.startsWith("epubcfi(")
                                            ? fragmentSelector.value.slice("epubcfi(".length, -1)
                                            : fragmentSelector.value
                                        : undefined;
                    const firstPartOfCfi = cfi.split(",")[0]; // TODO need to check cfi computation

                    const annotationParsed: IAnnotationState = {
                        uuid: incommingAnnotation.id.split("urn:uuid:")[1] || uuidv4(), // TODO : may not be an uuid format and maybe we should hash the uuid to get a unique identifier based on the original uuid
                        locatorExtended: {
                            locator: {
                                href: incommingAnnotation.target.source,
                                title: undefined,
                                text: {
                                    beforeRaw: textQuoteSelector?.prefix,
                                    afterRaw: textQuoteSelector?.suffix,
                                    highlightRaw: textQuoteSelector?.exact,
                                    before: textQuoteSelector?.prefix ? cleanupStr(textQuoteSelector.prefix) : undefined,
                                    after: textQuoteSelector?.suffix ? cleanupStr(textQuoteSelector.suffix) : undefined,
                                    highlight: textQuoteSelector?.exact ? cleanupStr(textQuoteSelector.exact) : undefined,
                                },
                                locations: {
                                    cfi: firstPartOfCfi,
                                    cssSelector: domRangeSelector.startContainerElementCssSelector, // TODO just for debug, need to understand how to get this information if needed
                                    position: undefined,
                                    progression: progressionSelector?.value,
                                    rangeInfo: domRangeSelector
                                        ? {
                                            startContainerElementCssSelector: domRangeSelector.startContainerElementCssSelector,
                                            startContainerElementCFI: undefined,
                                            startContainerChildTextNodeIndex: domRangeSelector.startContainerChildTextNodeIndex,
                                            startOffset: domRangeSelector.startOffset,
                                            endContainerElementCssSelector: domRangeSelector.endContainerElementCssSelector,
                                            endContainerElementCFI: undefined,
                                            endContainerChildTextNodeIndex: domRangeSelector.endContainerChildTextNodeIndex,
                                            endOffset: domRangeSelector.endOffset,
                                            cfi: cfi,
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
                                cleanAfter: textQuoteSelector?.prefix ? cleanupStr(textQuoteSelector.prefix) : undefined,
                                cleanBefore: textQuoteSelector?.suffix ? cleanupStr(textQuoteSelector.suffix) : undefined,
                                cleanText: textQuoteSelector?.exact ? cleanupStr(textQuoteSelector.exact) : undefined,
                                rangeInfo: {
                                    startContainerElementCssSelector: domRangeSelector.startContainerElementCssSelector,
                                    startContainerElementCFI: undefined,
                                    startContainerChildTextNodeIndex: domRangeSelector.startContainerChildTextNodeIndex,
                                    startOffset: domRangeSelector.startOffset,
                                    endContainerElementCssSelector: domRangeSelector.endContainerElementCssSelector,
                                    endContainerElementCFI: undefined,
                                    endContainerChildTextNodeIndex: domRangeSelector.endContainerChildTextNodeIndex,
                                    endOffset: domRangeSelector.endOffset,
                                    cfi: cfi,
                                },
                            },
                            selectionIsNew: false,
                            docInfo: undefined, // {isFixedLayout: false, isRightToLeft: false, isVerticalWritingMode: false},  // TODO how to complete these informations
                            epubPage: page,
                            epubPageID: undefined,
                            headings: headings.map(({ txt, level }) => ({ id: undefined, txt, level })),
                            secondWebViewHref: undefined,
                        },
                        comment: incommingAnnotation.body.value,
                        color: hexToRgb(incommingAnnotation.body.color),
                        drawType: (isNil(incommingAnnotation.body.highlight) || incommingAnnotation.body.highlight === "solid") ? "solid_background" : incommingAnnotation.body.highlight,
                        // TODO need to ask to user if the incomming tag is kept or the fileName is used
                        tags: [fileName], // incommingAnnotation.body.tag ? [incommingAnnotation.body.tag] : [],
                        modified: incommingAnnotation.modified ? tryCatchSync(() => new Date(incommingAnnotation.modified).getTime(), fileName) : undefined,
                        created: tryCatchSync(() => new Date(incommingAnnotation.created).getTime(), fileName) || currentTimestamp,
                        creator: creator ? {
                            id: creator.id,
                            type: creator.type,
                            name: creator.name,
                        } : undefined,
                    };

                    if (annotationParsed.modified > currentTimestamp) {
                        annotationParsed.modified = currentTimestamp;
                    }
                    if (annotationParsed.created > currentTimestamp) {
                        annotationParsed.created = currentTimestamp;
                    }
                    if (annotationParsed.created > annotationParsed.modified) {
                        annotationParsed.modified = currentTimestamp;
                    }

                    debug("incomming annotation Parsed And Formated (", annotationParsed.uuid, "), and now ready to be imported in the publication!");
                    debug(JSON.stringify(annotationParsed));

                    annotationsParsedAllArray.push(annotationParsed);

                    if (annotations.find(({ uuid }) => uuid === annotationParsed.uuid)) {

                        // ok same annotation,
                        // we need to check if same uuid but modified date ahead of time

                        if (annotations.find(({ uuid, modified }) => uuid === annotationParsed.uuid && modified < annotationParsed.modified)) {
                            // so we want to import an annotation with a conflict, let's user mitigate it
                            annotationsParsedConflictArray.push(annotationParsed);
                        }
                    } else {

                        annotationsParsedNoConflictArray.push(annotationParsed);
                    }
                }

                if (!annotationsParsedAllArray.length) {

                    debug("there are no annotations ready to be imported, exit");
                    yield* put(toastActions.openRequest.build(ToastType.Success, "There are no annotations ready to be imported, aborting the importation", readerPublicationIdentifier));
                    return;

                }

                // dispatch data to the user modal
                yield* put(annotationActions.importTriggerModal.build(
                    {
                        about: data.about ? {...data.about} : undefined,
                        title: data.title || "",
                        generated: data.generated || "",
                        generator: data.generator ? { ...data.generator} : undefined,
                    },
                    annotationsParsedNoConflictArray,
                    annotationsParsedConflictArray,
                ));

                // wait the modal confirmation or abort
                const actionConfirmOrAbort = yield* take(annotationActions.importConfirmOrAbort.build);
                if (!actionConfirmOrAbort?.payload || actionConfirmOrAbort.payload.state === "abort") {
                    // aborted

                    debug("ABORTED, exit");
                    return;
                }

                const annotationsParsedReadyToBeImportedArray = actionConfirmOrAbort.payload.state === "importNoConflict"
                    ? annotationsParsedNoConflictArray
                    : [...annotationsParsedNoConflictArray, ...annotationsParsedConflictArray];

                debug("ready to send", annotationsParsedReadyToBeImportedArray.length, "annotation(s) to the reader");
                if (winSessionReaderStateArray.length) {

                    debug("send to", winSessionReaderStateArray.length, "readerWin with the same publicationId (", publicationIdentifier, ")");

                    for (const winSessionReaderState of winSessionReaderStateArray) {

                        const readerWin = getReaderWindowFromDi(winSessionReaderState.identifier);

                        for (const annotationParsedReadyToBeImported of annotationsParsedReadyToBeImportedArray) {
                            const a = ActionSerializer.serialize(readerActions.annotation.push.build(annotationParsedReadyToBeImported));
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

                    yield* put(winActions.registry.addAnnotationToReaderPublication.build(publicationIdentifier, annotationsParsedReadyToBeImportedArray));

                }

            } else {

                debug("ERROR: At least one annotation is rejected and not match with the current publication SpineItem, see above");
                yield* put(toastActions.openRequest.build(ToastType.Error, "Error: " + "Cannot import annotations Set, at least one annotation does not belong to the publication", readerPublicationIdentifier));
                return;
            }
        } else {

            debug("Error: ", __READIUM_ANNOTATION_AJV_ERRORS);
            yield* put(toastActions.openRequest.build(ToastType.Error, "Error: " + "File format", readerPublicationIdentifier));
            return;
        }

    } catch (e) {

        debug("Error!!! ", e);
        yield* put(toastActions.openRequest.build(ToastType.Error, "Error" + e, readerPublicationIdentifier));
        return;
    }

    debug("Annotations importer success and exit");
    yield* put(toastActions.openRequest.build(ToastType.Success, "Success !", readerPublicationIdentifier));
    return ;
}


export function saga() {
    return takeSpawnLeading(
        annotationActions.importAnnotationSet.ID,
        importAnnotationSet,
        (e) => error(filename_, e),
    );
}