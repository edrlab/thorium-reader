// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

// note.ts
// bookmarks or annotations

import debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { SagaGenerator } from "typed-redux-saga";
import { select as selectTyped, take as takeTyped, race as raceTyped, put as putTyped, all as allTyped, call as callTyped, spawn as spawnTyped, delay as delayTyped} from "typed-redux-saga/macro";
import { readerAnalyticsEvents } from "readium-desktop/common/analytics/reader";
import { readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionLocatorHrefChanged } from "../actions";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { winCommonActions } from "readium-desktop/common/redux/actions";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";

import { highlightsDrawMargin, keyboardFocusRequest, MediaOverlaysStateEnum, TTSStateEnum } from "@r2-navigator-js/electron/renderer";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { IHighlightHandlerState } from "readium-desktop/common/redux/states/renderer/highlight";
import { getTranslator } from "readium-desktop/common/services/translator";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import { EDrawType, type TDrawType } from "readium-desktop/common/type/note.type";
import { checkIfIsAllSelectorsNoteAreGeneratedForReadiumAnnotation, readiumAnnotationSelectorFromNote } from "../../readiumAnnotation/selector";
import { clone } from "ramda";
import { logEvent } from "readium-desktop/renderer/common/analytics";
import { resolveSelectorTargetToLocatorExtended } from "readium-desktop/common/readium/annotation/converter";
import { getResourceCacheFromPublication } from "./resourceCache";
import { selectPublicationNotes } from "../../publication-notes/selectors";
import {
    IReadiumAnnotationSelectorControllerContext,
    IReadiumAnnotationSelectorControllerUpdate,
    ReadiumAnnotationSelectorController,
} from "../../readiumAnnotation/selectorController";

// Logger
const debug = debug_("readium-desktop:renderer:reader:redux:sagas:annotation");
debug("_");

// click from highlight
// function* annotationClick(action: readerLocalActionHighlights.click.TAction) {
//     const { uuid, def: {group} } = action.payload;
//     if (uuid && group === "annotation") {
//         debug(`highlightClick ACTION (will focus) -- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);

//         // const { payload: { uuid } } = action;

//         // const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
//         // yield* putTyped(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: true}));
//     }
// }

// // focus from annotation menu
// function* annotationFocus(action: readerLocalActionAnnotations.focus.TAction) {
//     debug(`annotationFocus -- action: [${JSON.stringify(action.payload, null, 4)}]`);

//     // const { payload: { uuid } } = action;

//     // const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
//     // yield* putTyped(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: false}));
// }

function createReadiumAnnotationSelectorController(
    r2Publication: IReaderRootState["reader"]["info"]["r2Publication"],
    manifestUrlR2Protocol: string,
): ReadiumAnnotationSelectorController {

    return new ReadiumAnnotationSelectorController({
        getResourceCache: (href) => getResourceCacheFromPublication(href, r2Publication, manifestUrlR2Protocol),
        createExportSelectors: (note, isLcp, sourceHref, xmlDom) =>
            readiumAnnotationSelectorFromNote(note, isLcp, sourceHref, xmlDom, r2Publication),
        convertImportTargetToLocatorExtended: (target, isBookmark, xmlDom, sourceHref) =>
            resolveSelectorTargetToLocatorExtended(target, undefined, isBookmark, xmlDom, sourceHref),
        hasGeneratedExportSelectors: checkIfIsAllSelectorsNoteAreGeneratedForReadiumAnnotation,
        onError: (e, note) =>
            debug(`ERROR: ${note.uuid} readium annotation selector background batch compute CRASH`, e),
        yieldBeforeNote: () => new Promise<void>((resolve) => {
            setTimeout(resolve, 10);
        }),
    });
}

function* selectReadiumAnnotationSelectorControllerContext(
    isReaderLocked: boolean,
): SagaGenerator<{
    context: IReadiumAnnotationSelectorControllerContext;
    controller: ReadiumAnnotationSelectorController;
    publicationIdentifier: string;
}> {

    const { publicationView, publicationIdentifier, r2Publication, manifestUrlR2Protocol } =
        yield* selectTyped((state: IReaderRootState) => state.reader.info);

    return {
        context: {
            isReaderLocked,
            isLcp: !!publicationView.lcp,
        },
        controller: createReadiumAnnotationSelectorController(r2Publication, manifestUrlR2Protocol),
        publicationIdentifier,
    };
}

function debugReadiumAnnotationSelectorControllerUpdate(
    update: IReadiumAnnotationSelectorControllerUpdate,
) {

    if (update.kind === "exportSelector") {
        debug(`${update.previousNote.uuid} does not have any readiumAnnotationSelector so let's update the note with this new selectors: ${JSON.stringify(update.note.readiumAnnotation?.export?.selector, null, 2)}`);
    } else if (update.kind === "importLocator") {
        debug(`${update.previousNote.uuid} doesn't have any locator so let's update the note with the new locator generated: ${JSON.stringify(update.note.locatorExtended, null, 2)}`);
    } else {
        debug(`${update.previousNote.uuid} import selectors could not be resolved: ${JSON.stringify(update.note.readiumAnnotation?.import?.unresolved, null, 2)}`);
    }
}

function* putReadiumAnnotationSelectorControllerUpdates(
    updates: IReadiumAnnotationSelectorControllerUpdate[],
    publicationIdentifier: string,
): SagaGenerator<void> {

    for (const update of updates) {
        debugReadiumAnnotationSelectorControllerUpdate(update);
        yield* putTyped(readerActions.publicationNotes.commands.save.build(
            publicationIdentifier,
            update.note,
            update.previousNote,
        ));
    }
}

export function* noteUpdateReadiumAnnotationSelector(note: PublicationNote) {

    try {
        const isReaderLocked = yield* selectTyped((state: IReaderRootState) => state.reader.lock);
        if (!isReaderLocked) {
            return;
        }

        const { context, controller, publicationIdentifier } =
            yield* selectReadiumAnnotationSelectorControllerContext(isReaderLocked);
        const updates = yield* callTyped(() =>
            controller.resolvePublicationNoteUpdates(note, context));

        yield* putReadiumAnnotationSelectorControllerUpdates(updates, publicationIdentifier);
    } catch (e) {
        debug(`ERROR: ${note.uuid} readium annotation selector background compute CRASH`, e);
    }
}

export function* noteUpdateReadiumAnnotationSelectors(notes: PublicationNote[]): SagaGenerator<void> {

    try {
        if (!notes.length) {
            return;
        }

        const isReaderLocked = yield* selectTyped((state: IReaderRootState) => state.reader.lock);
        if (!isReaderLocked) {
            return;
        }

        const { context, controller, publicationIdentifier } =
            yield* selectReadiumAnnotationSelectorControllerContext(isReaderLocked);
        const updates = yield* callTyped(() =>
            controller.resolvePublicationNotesUpdates(notes, context));

        yield* putReadiumAnnotationSelectorControllerUpdates(updates, publicationIdentifier);
    } catch (e) {
        debug("ERROR: readium annotation selector background batch compute CRASH", e);
    }
}

function* noteAddUpdate(action: readerActions.publicationNotes.commands.save.TAction) {

    const { previousNote: previousNote, newNote: note } = action.payload;

    const currentBookmarkTotalCount = yield* selectTyped((state: IReaderRootState) => state.reader.noteTotalCount.state);
    if (!previousNote && note) {
        yield* putTyped(readerActions.bookmarkTotalCount.build(currentBookmarkTotalCount + 1));
    }

    yield* spawnTyped(function* () {

        yield* delayTyped(10);
        yield* callTyped(noteUpdateReadiumAnnotationSelector, note);
    });

    if (!note.locatorExtended) {
        return ;
    }

    const item = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler.find(([_, highlightState]) => highlightState.uuid === note.uuid));
    let update = false;
    if (!previousNote) {
        debug(`[${note.uuid}] update because previousNote was undefined`);
        update = true;
    }
    if (!update && previousNote && !item) {
        update = true;
        debug(`[${note.uuid}] update because previousNote is defined but with no current highlight found`);
        yield* putTyped(readerLocalActionHighlights.handler.pop.build([{ uuid: note.uuid }]));
    }
    if (!update && previousNote?.color.red !== note.color.red || previousNote?.color.blue !== note.color.blue || previousNote?.color.green !== note.color.green) {
        debug(`[${note.uuid}] update because color note has changed`);
        update = true;
    }
    if (!update && item && item[1]?.def && note.textualValue && item[1].def.textPopup?.text !== note.textualValue) {
        debug(`[${note.uuid}] update because textPopup has changed`);
        update = true;
    }
    if (!update && previousNote.drawType !== note.drawType) {
        debug(`[${note.uuid}] update because drawType has changed`);
        update = true;
    }
    if (!update) {
        return ;
    }

    // if (!textPopup?.text || !note.textualValue && textPopup?.text || note.textualValue !== textPopup?.text || color.blue !== note.color.blue || color.red !== note.color.red || color.green !== note.color.green || drawType !== note.drawType) {
    yield* putTyped(readerLocalActionHighlights.handler.pop.build([{ uuid: note.uuid }]));
    yield* putTyped(readerLocalActionHighlights.handler.push.build([
        {
            uuid: note.uuid,
            href: note.locatorExtended.locator.href,
            def: {
                textPopup: note.textualValue ? {
                    text: note.textualValue, // multiline
                    dir: "ltr", // TODO
                    lang: "en", // TODO
                } : undefined,
                selectionInfo: note.group === "bookmark" ? {
                    textFragment: undefined,
                    rangeInfo: note.locatorExtended.locator.locations.caretInfo?.rangeInfo || {
                        startContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // startContainerElementCFI: undefined,
                        startContainerElementXPath: undefined,
                        startContainerChildTextNodeIndex: -1,
                        startOffset: -1,
                        endContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // endContainerElementCFI: undefined,
                        endContainerElementXPath: undefined,
                        endContainerChildTextNodeIndex: -1,
                        endOffset: -1,
                        cfi: undefined,
                    },
                    cleanBefore: note.locatorExtended.locator.locations.caretInfo?.cleanBefore || note.locatorExtended.locator.text?.before || "",
                    cleanText: note.locatorExtended.locator.locations.caretInfo?.cleanText || note.locatorExtended.locator.text?.highlight || note.locatorExtended.locator.title || "",
                    cleanAfter: note.locatorExtended.locator.locations.caretInfo?.cleanAfter || note.locatorExtended.locator.text?.after || "",
                    rawBefore: note.locatorExtended.locator.locations.caretInfo?.rawBefore || note.locatorExtended.locator.text?.beforeRaw || "",
                    rawText: note.locatorExtended.locator.locations.caretInfo?.rawText || note.locatorExtended.locator.text?.highlightRaw || note.locatorExtended.locator.title || "",
                    rawAfter: note.locatorExtended.locator.locations.caretInfo?.rawAfter || note.locatorExtended.locator.text?.afterRaw || "",
                } : {
                    textFragment: undefined,
                    rangeInfo: note.locatorExtended.selectionInfo?.rangeInfo || {
                        startContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // startContainerElementCFI: undefined,
                        startContainerElementXPath: undefined,
                        startContainerChildTextNodeIndex: -1,
                        startOffset: -1,
                        endContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // endContainerElementCFI: undefined,
                        endContainerElementXPath: undefined,
                        endContainerChildTextNodeIndex: -1,
                        endOffset: -1,
                        cfi: undefined,
                    },
                    cleanBefore: note.locatorExtended.selectionInfo?.cleanBefore || note.locatorExtended.locator.text?.before || "",
                    cleanText: note.locatorExtended.selectionInfo?.cleanText || note.locatorExtended.locator.text?.highlight || "",
                    cleanAfter: note.locatorExtended.selectionInfo?.cleanAfter || note.locatorExtended.locator.text?.after || "",
                    rawBefore: note.locatorExtended.selectionInfo?.rawBefore || note.locatorExtended.locator.text?.beforeRaw || "",
                    rawText: note.locatorExtended.selectionInfo?.rawText || note.locatorExtended.locator.text?.highlightRaw || "",
                    rawAfter: note.locatorExtended.selectionInfo?.rawAfter || note.locatorExtended.locator.text?.afterRaw || "",
                },
                color: { ...note.color },
                group: note.group,
                drawType: Number(note.drawType),
            },
        },
    ]));

    if (note.group === "bookmark") {
        const defaultDrawView = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawView);
        if (defaultDrawView === "hide"
            // SKIP ENTIRELY, see ABOVE
            // ttsState === TTSStateEnum.STOPPED &&
            // mediaOverlaysState === MediaOverlaysStateEnum.STOPPED
        ) { // NOT "margin" or "annotation"
            yield* putTyped(readerActions.setConfig.build({ annotation_defaultDrawView: "annotation" }));

            const currentLocation = yield* selectTyped((state: IReaderRootState) => state.reader.locator);
            const href1 = currentLocation?.locator?.href;
            const href2 = currentLocation?.secondWebViewHref;
            yield* putTyped(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
        }
    }
}

function* noteRemove(action: readerActions.publicationNotes.commands.remove.TAction) {

    const { note } = action.payload;
    debug(`noteRemove : [${note}]`);

    yield* putTyped(readerLocalActionHighlights.handler.pop.build([{ uuid: note.uuid }]));
}

function* createAnnotation(locatorExtended: MiniLocatorExtended, color: IColor, comment: string, drawType: TDrawType, tags: string[]) {

    // clean __selection global variable state
    __selectionInfoGlobal.locatorExtended = undefined;

    const creator = yield* selectTyped((state: IReaderRootState) => state.creator);

    debug(`Create an annotation for, [${locatorExtended.selectionInfo.cleanText.slice(0, 10)}]`);

    const noteTotalCount = yield* selectTyped((state: IReaderRootState) => state.reader.noteTotalCount.state);
    const { publicationIdentifier } = yield* selectTyped((state: IReaderRootState) => state.reader.info);
    yield* putTyped(readerActions.publicationNotes.commands.save.build(publicationIdentifier, {
        color,
        textualValue: comment,
        index: noteTotalCount + 1,
        locatorExtended: clone(locatorExtended),
        drawType: EDrawType[drawType] || EDrawType.solid_background,
        tags,
        creator: clone(creator),
        created: (new Date()).getTime(),
        group: "annotation",
    }));
    yield* spawnTyped(function*() {
        yield* callTyped(logEvent, readerAnalyticsEvents.annotate);
    });

    // sure! close the popover
    yield* putTyped(readerLocalActionAnnotations.enableMode.build(false, undefined, undefined));
}

function* newLocatorEditAndSaveTheNote(locatorExtended: MiniLocatorExtended, fromKeyboard: boolean): SagaGenerator<void> {
    const defaultColor = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultColor);
    const defaultDrawType = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawType);

    // check the boolean value of annotation_popoverNotOpenOnNoteTaking
    const annotation_popoverNotOpenOnNoteTaking = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_popoverNotOpenOnNoteTaking);
    if (annotation_popoverNotOpenOnNoteTaking) {
        yield* callTyped(createAnnotation, locatorExtended, {...defaultColor}, "", defaultDrawType, []);
        return;
    }

    // open popover to edit and save the note
    yield* putTyped(readerLocalActionAnnotations.enableMode.build(true, locatorExtended, fromKeyboard));

    // wait the action of the annotation popover, the user select the text, click on "take the note" button and then edit his note with the popover.
    // 2 choices: cancel (annotationModeEnabled = false) or takeNote with color and comment
    const { cancelAction, noteTakenAction } = yield* raceTyped({
        cancelAction: takeTyped(readerLocalActionAnnotations.enableMode.ID),
        noteTakenAction: takeTyped(readerLocalActionAnnotations.createNote.build), // not .ID because we need Action return type
    });

    if (cancelAction) {
        debug("annotation canceled and not saved [not created]");

        // __selectionInfoGlobal.locatorExtended is not yet cleaned, ready to re-trigger the note creation
        return;
    } else if (noteTakenAction) {

        const { color, textualValue, drawType, tags } = noteTakenAction.payload;
        debug(`annotation save the note with the color: ${color} , comment: ${textualValue.slice(0, 20)} , drawType: ${drawType} , tags: ${tags}`);


        // get color and comment and save the note
        yield* callTyped(createAnnotation, locatorExtended, color, textualValue, EDrawType[drawType] as TDrawType, tags);

    } else {
        debug("ERROR: second yield RACE not worked !!?!!");
    }

    if (fromKeyboard) {
        setTimeout(() => {
            keyboardFocusRequest(true);
        }, 200);
    }
}

function* annotationButtonTrigger(action: readerLocalActionAnnotations.trigger.TAction) {

    const ttsState = yield* selectTyped((state: IReaderRootState) => state.reader.tts.state);
    const mediaOverlaysState = yield* selectTyped((state: IReaderRootState) => state.reader.mediaOverlay.state);

    if (ttsState !== TTSStateEnum.STOPPED ||
        mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
    ) {
        yield* putTyped(
            toastActions.openRequest.build(
                ToastType.Error,
                `${getTranslator().__("reader.tts.stop")} / ${getTranslator().__("reader.media-overlays.stop")}`,
            ),
        );
        return;
    }

    const defaultDrawView = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawView);
    if (defaultDrawView === "hide"
        // SKIP ENTIRELY, see ABOVE
        // ttsState === TTSStateEnum.STOPPED &&
        // mediaOverlaysState === MediaOverlaysStateEnum.STOPPED
    ) { // NOT "margin" or "annotation"
        yield* putTyped(readerActions.setConfig.build({ annotation_defaultDrawView: "annotation" }));

        const currentLocation = yield* selectTyped((state: IReaderRootState) => state.reader.locator);
        const href1 = currentLocation?.locator?.href;
        const href2 = currentLocation?.secondWebViewHref;
        yield* putTyped(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
    }

    const { locatorExtended } = __selectionInfoGlobal;
    if (!locatorExtended?.selectionInfo) {
        debug("annotationBtnTriggerRequestedAction received");
        // trigger a Toast notification to user
        yield* putTyped(
            toastActions.openRequest.build(
                ToastType.Error,
                getTranslator().__("reader.annotations.noSelectionToast"),
            ),
        );
        return ;
    }

    debug("annotation trigger btn requested, create annotation");
    yield* callTyped(newLocatorEditAndSaveTheNote, locatorExtended, action.payload.fromKeyboard);

}

const __selectionInfoGlobal: {locatorExtended: MiniLocatorExtended | undefined} = {locatorExtended: undefined};
function* setLocator(action: readerActions.setLocator.TAction) {

    const locatorExtended = action.payload;
    const { selectionInfo, selectionIsNew } = locatorExtended;

    if (!selectionInfo) {
        __selectionInfoGlobal.locatorExtended = undefined;
        return;
    }

    debug(`${selectionIsNew ? "New" : "Old"} Selection Requested ! [${selectionInfo.cleanText.slice(0, 50)}...]`);
    __selectionInfoGlobal.locatorExtended = locatorExtended;

    // check the boolean value of annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator
    const annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator = (window as any).__annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator || false;

    if (annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator) {
        yield* callTyped(newLocatorEditAndSaveTheNote, locatorExtended, true);
        return;
    }
}

function* readerStart() {

    debug("iframe reader viewport waiting to start...");

    yield* allTyped([
        takeTyped(readerActions.setLocator.ID),
        takeTyped(winCommonActions.initSuccess.ID),
    ]);

    // divina,
    const { info, locator } = yield* selectTyped((state: IReaderRootState) => state.reader);
    // typeof divina !== "undefined" ||
    const skip = info?.publicationView?.isDivina ||
        locator?.audioPlaybackInfo || info?.publicationView?.isAudio ||
        info?.publicationView?.isPDF;
    if (skip) {
        // divina,
        debug("readerStart SKIP annot", skip, info?.publicationView?.isDivina, locator?.audioPlaybackInfo, info?.publicationView?.isAudio, info?.publicationView?.isPDF);
        return;
    }

    debug("annotation iframe reader viewport is started and ready to annotate, we draws all the annotation for the first time with 'highlightsDrawMargin' enabled");

    const { annotation_defaultDrawView } = yield* selectTyped((state: IReaderRootState) => state.reader.config);
    if (annotation_defaultDrawView === "margin") {
        highlightsDrawMargin(["annotation", "bookmark"]);
    } else {
        highlightsDrawMargin(["bookmark"]);
    }

    const notes = yield* selectTyped(selectPublicationNotes);
    const notesWithLocator = notes.filter((note) => !!note.locatorExtended);
    const noteUUID = notesWithLocator.map(({ uuid }) => ({ uuid }));

    // const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
    // const annotationsUuids = annotations.map(([_, annotationState]) => ({ uuid: annotationState.uuid }));
    yield* putTyped(readerLocalActionHighlights.handler.pop.build(noteUUID));

    const notesHighlighted = notesWithLocator.map((note): IHighlightHandlerState => {

        return {
            uuid: note.uuid,
            href: note.locatorExtended.locator.href,
            def: {
                textPopup: note.textualValue ? {
                    text: note.textualValue,
                    dir: "ltr", // TODO
                    lang: "en", // TODO
                } : undefined,
                selectionInfo: note.group === "bookmark" ? {
                    textFragment: undefined,
                    rangeInfo: note.locatorExtended.locator.locations.caretInfo?.rangeInfo || {
                        startContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // startContainerElementCFI: undefined,
                        startContainerElementXPath: undefined,
                        startContainerChildTextNodeIndex: -1,
                        startOffset: -1,
                        endContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // endContainerElementCFI: undefined,
                        endContainerElementXPath: undefined,
                        endContainerChildTextNodeIndex: -1,
                        endOffset: -1,
                        cfi: undefined,
                    },
                    cleanBefore: note.locatorExtended.locator.locations.caretInfo?.cleanBefore || note.locatorExtended.locator.text?.before || "",
                    cleanText: note.locatorExtended.locator.locations.caretInfo?.cleanText || note.locatorExtended.locator.text?.highlight || note.locatorExtended.locator.title || "",
                    cleanAfter: note.locatorExtended.locator.locations.caretInfo?.cleanAfter || note.locatorExtended.locator.text?.after || "",
                    rawBefore: note.locatorExtended.locator.locations.caretInfo?.rawBefore || note.locatorExtended.locator.text?.beforeRaw || "",
                    rawText: note.locatorExtended.locator.locations.caretInfo?.rawText || note.locatorExtended.locator.text?.highlightRaw || note.locatorExtended.locator.title || "",
                    rawAfter: note.locatorExtended.locator.locations.caretInfo?.rawAfter || note.locatorExtended.locator.text?.afterRaw || "",
                } : {
                    textFragment: undefined,
                    rangeInfo: note.locatorExtended.selectionInfo?.rangeInfo || {
                        startContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // startContainerElementCFI: undefined,
                        startContainerElementXPath: undefined,
                        startContainerChildTextNodeIndex: -1,
                        startOffset: -1,
                        endContainerElementCssSelector: note.locatorExtended.locator.locations.cssSelector,
                        // endContainerElementCFI: undefined,
                        endContainerElementXPath: undefined,
                        endContainerChildTextNodeIndex: -1,
                        endOffset: -1,
                        cfi: undefined,
                    },
                    cleanBefore: note.locatorExtended.selectionInfo?.cleanBefore || note.locatorExtended.locator.text?.before || "",
                    cleanText: note.locatorExtended.selectionInfo?.cleanText || note.locatorExtended.locator.text?.highlight || "",
                    cleanAfter: note.locatorExtended.selectionInfo?.cleanAfter || note.locatorExtended.locator.text?.after || "",
                    rawBefore: note.locatorExtended.selectionInfo?.rawBefore || note.locatorExtended.locator.text?.beforeRaw || "",
                    rawText: note.locatorExtended.selectionInfo?.rawText || note.locatorExtended.locator.text?.highlightRaw || "",
                    rawAfter: note.locatorExtended.selectionInfo?.rawAfter || note.locatorExtended.locator.text?.afterRaw || "",
                },
                color: { ...note.color },
                group: note.group,
                drawType: Number(note.drawType),
            },
        };
    });

    debug(`${notesHighlighted.length} note(s) to draw`);

    yield* putTyped(readerLocalActionHighlights.handler.push.build(notesHighlighted));

    debug(`${notesHighlighted.length} note(s) drawn`);
}

function* captureHightlightDrawMargin(action: readerActions.setConfig.TAction) {

    const { annotation_defaultDrawView } = action.payload;
    if (!annotation_defaultDrawView) return ;

    // divina,
    const { info, locator } = yield* selectTyped((state: IReaderRootState) => state.reader);
    // typeof divina !== "undefined" ||
    const skip = info?.publicationView?.isDivina ||
        locator?.audioPlaybackInfo || info?.publicationView?.isAudio ||
        info?.publicationView?.isPDF;
    if (skip) {
        // divina,
        debug("captureHightlightDrawMargin SKIP annot", skip, info?.publicationView?.isDivina, locator?.audioPlaybackInfo, info?.publicationView?.isAudio, info?.publicationView?.isPDF);
        return;
    }

    debug(`captureHightlightDrawMargin : readerLocalActionSetConfig CHANGED apply=${annotation_defaultDrawView}`);
    if (annotation_defaultDrawView === "margin") {
        highlightsDrawMargin(["annotation", "bookmark"]);
    } else {
        highlightsDrawMargin(["bookmark"]);
    }
}

export const saga = () =>
    allTyped([
        takeSpawnEvery(
            readerActions.setConfig.ID,
            captureHightlightDrawMargin,
            (e) => console.error("readerLocalActionSetConfig", e),
        ),
        takeSpawnEvery(
            readerActions.publicationNotes.commands.save.ID,
            noteAddUpdate,
            (e) => console.error("readerActions.publicationNotes.commands.save", e),
        ),
        takeSpawnEvery(
            readerActions.publicationNotes.commands.remove.ID,
            noteRemove,
            (e) => console.error("readerActions.publicationNotes.commands.remove", e),
        ),
        takeSpawnEvery(
            readerActions.setLocator.ID,
            setLocator,
            (e) => console.error("readerActions.setLocator", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.trigger.ID,
            annotationButtonTrigger,
            (e) => console.error("readerLocalActionAnnotations.trigger", e),
        ),
        spawnLeading(
            readerStart,
            (e) => console.error("readerStart", e),
        ),
    ]);
