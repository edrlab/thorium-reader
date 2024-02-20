// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { all, call, put} from "typed-redux-saga/macro";
import { select as selectTyped, take as takeTyped, race as raceTyped, SagaGenerator} from "typed-redux-saga";

import { readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionSetLocator } from "../actions";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

const DEFAULT_COLOR = {
    red: 109,
    green: 163,
    blue: 200,
};

// Logger
const debug = debug_("readium-desktop:renderer:reader:redux:sagas:annotation");
debug("_");

// click from highlight
function* annotationClick(action: readerLocalActionHighlights.click.TAction) {
    const { uuid, def: {group} } = action.payload;
    if (uuid && group === "annotation") {
        debug(`highlightClick ACTION (will focus) -- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);

        const { payload: { uuid } } = action;

        const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
        yield* put(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: true}));
    }
}

// focus from annotation menu
function* annotationFocus(action: readerLocalActionAnnotations.focus.TAction) {
    debug(`annotationFocus -- action: [${JSON.stringify(action.payload, null, 4)}]`);

    const { payload: { uuid } } = action;

    const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
    yield* put(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: true}));
}

function* annotationUpdate(action: readerLocalActionAnnotations.update.TAction) {
    debug(`annotationUpdate-- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);
    const {payload: {uuid, locatorExtended: {locator: {href}, selectionInfo}, color}} = action;

    yield* put(readerLocalActionHighlights.handler.pop.build([{uuid}]));
    yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color, group: "annotation" } }]));
}

function* annotationPush(action: readerLocalActionAnnotations.push.TAction) {

    debug(`annotationPush : [${JSON.stringify(action.payload, null, 4)}]`);
    const {payload: {uuid, locatorExtended: {locator: {href}, selectionInfo}, color}} = action;

    yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color, group: "annotation" } }]));
}

function* annotationPop(action: readerLocalActionAnnotations.pop.TAction) {
    debug(`annotationPop : [${action.payload.uuid}]`);

    const {
        uuid,
    } = action.payload;

    yield* put(readerLocalActionHighlights.handler.pop.build([{uuid}]));
}

function* createAnnotation(locatorExtended: readerLocalActionSetLocator.Payload) {

    debug(`Create an annotation for, [${locatorExtended.selectionInfo.cleanText.slice(0, 10)}]`);
    yield* put(readerLocalActionAnnotations.push.build({
        color: DEFAULT_COLOR,
        comment: "...",
        locatorExtended,
    }));
}

function* newLocator(action: readerLocalActionSetLocator.TAction): SagaGenerator<void> {
    const def = action.payload;
    const { selectionInfo, selectionIsNew } = def;

    if (!selectionInfo || !selectionIsNew) {
        return;
    }

    debug(`New Selection Requested ! [${selectionInfo.cleanText.slice(0, 10)}]`);

    const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);

    if (modeEnabled) {

        debug("annotation mode enabled [creation of the annotation]");
        yield* call(createAnnotation, def);
        return;
    }
    debug("annotation mode not enabled, waiting the click on annotation button or just receive a new locator position");

    const { newLocatorAction, annotationBtnTriggerRequestedAction } = yield* raceTyped({
        newLocatorAction: takeTyped(readerLocalActionSetLocator.build),
        annotationBtnTriggerRequestedAction: takeTyped(readerLocalActionAnnotations.trigger.build),
    });

    if (newLocatorAction) {
        debug("new Locator requested, so we drop this annotation [not created]");
        yield* call(newLocator, newLocatorAction);
    } else if (annotationBtnTriggerRequestedAction) {
        debug("annotation trigger btn requested, creation of the annotation");
        yield* call(createAnnotation, def);
    } else {
        debug("ERROR: yield RACE not worked !!?!!");
    }
}

function* newLocatorOrTriggerBtnWatcher() {

    const { newLocatorAction, annotationBtnTriggerRequestedAction } = yield* raceTyped({
        newLocatorAction: takeTyped(readerLocalActionSetLocator.build),
        annotationBtnTriggerRequestedAction: takeTyped(readerLocalActionAnnotations.trigger.build),
    });

    if (newLocatorAction) {
        yield* call(newLocator, newLocatorAction);
    } else if (annotationBtnTriggerRequestedAction) {
        const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);
        yield* put(readerLocalActionAnnotations.enableMode.build(!modeEnabled));
    }
}
function* annotationEnableMode(action: readerLocalActionAnnotations.enableMode.TAction) {
    const { payload: {enable}} = action;

    debug(`annotationEnableMode enable=${enable}`);

    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
    const annotationsUuids = annotations.map(([_, annotationState]) => ({ uuid: annotationState.uuid }));
    yield* put(readerLocalActionHighlights.handler.pop.build(annotationsUuids));

    if (enable) {

        debug("annotation mode enabled ! draws all the annotations");
        // draw all annotations
        const annotationsHighlighted = annotations.map(
            ([_, { uuid, locatorExtended: { locator: { href }, selectionInfo }, color }]) =>
                ({ uuid, href, def: { selectionInfo, color, group: "annotation" } }));

        yield* put(readerLocalActionHighlights.handler.push.build(annotationsHighlighted));
    }
}

function* annotationFocusMode(action: readerLocalActionAnnotations.focusMode.TAction) {
    debug("annotationMode (UI Edition and focus on current plus remove focus if any previous)");
    
    const { payload: {previousFocusUuid, currentFocusUuid} } = action;

    if (previousFocusUuid ) {
        const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);
        if (!modeEnabled) {
            debug(`annotation focus mode -- delete the highlight for previousFocusUUId=${previousFocusUuid}`);
            yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid: previousFocusUuid }]));
        }
    }

    if (currentFocusUuid) {

        const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
        const annotationItemQueue = annotations.find(([_, {uuid}]) => uuid === currentFocusUuid);
        if (!annotationItemQueue) {
            debug(`ERROR: annotation item not found [currentFocusId=${currentFocusUuid}`);
        } else {
            debug(`annotation focus mode -- highlight the new currentFocusUUId=${currentFocusUuid}`);

            const annotationItem = annotationItemQueue[1]; // [timestamp, data]
            const { uuid, locatorExtended: { locator: { href }, selectionInfo }, color } = annotationItem;

            yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color, group: "annotation" } }]));
        }
    }
}

export const saga = () =>
    all([
        takeSpawnEvery(
            readerLocalActionAnnotations.enableMode.ID,
            annotationEnableMode,
            (e) => console.error("readerLocalActionAnnotations.enableMode", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.focusMode.ID,
            annotationFocusMode,
            (e) => console.error("readerLocalActionAnnotations.annotationFocusMode", e),
        ),
        takeSpawnEvery(
            readerLocalActionHighlights.click.ID,
            annotationClick,
            (e) => console.error("readerLocalActionHighlights.click", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.update.ID,
            annotationUpdate,
            (e) => console.error("readerLocalActionAnnotations.update", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.focus.ID,
            annotationFocus,
            (e) => console.error("readerLocalActionAnnotations.focus", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.push.ID,
            annotationPush,
            (e) => console.error("readerLocalActionAnnotations.push", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.pop.ID,
            annotationPop,
            (e) => console.error("readerLocalActionAnnotations.pop", e),
        ),
        spawnLeading(
            newLocatorOrTriggerBtnWatcher,
            (e) => console.error("newLocatorOrTriggerBtnWatcher", e),
        ),
    ]);
