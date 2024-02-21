// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { all, call, put, take} from "typed-redux-saga/macro";
import { select as selectTyped, take as takeTyped, race as raceTyped, SagaGenerator} from "typed-redux-saga";
import {
    highlightsDrawMargin,
} from "@r2-navigator-js/electron/renderer";

import { readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionSetLocator } from "../actions";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { winActions } from "readium-desktop/renderer/common/redux/actions";

// B80000
const DEFAULT_COLOR = {
    red: 184,
    green: 0,
    blue: 0,
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
    yield* put(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: false}));
}

function* annotationUpdate(action: readerLocalActionAnnotations.update.TAction) {
    debug(`annotationUpdate-- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);
    const {payload: {uuid, locatorExtended: {locator: {href}, selectionInfo}, color: newColor}} = action;

    const item = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler.find(([_, highlightState]) => highlightState.uuid === uuid));

    if (item) {
        const { def: { color: previousColor } } = item[1];

        if (previousColor.blue !== newColor.blue || previousColor.green !== newColor.green || previousColor.red !== newColor.red) {
            yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid }]));
            yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color: newColor, group: "annotation" } }]));
        }
    } else {
        // error sync between hightlight data array and annotation array
        yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid }]));
    }
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
    const locatorExtended = action.payload;
    const { selectionInfo, selectionIsNew } = locatorExtended;

    if (!selectionInfo || !selectionIsNew) {
        return;
    }

    debug(`New Selection Requested ! [${selectionInfo.cleanText.slice(0, 10)}]`);

    const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);

    if (modeEnabled) {

        debug("annotation mode enabled [creation of the annotation]");
        yield* call(createAnnotation, locatorExtended);
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
        yield* call(createAnnotation, locatorExtended);
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

        debug(`annotationBtnTriggerRequestedAction received [${JSON.stringify(annotationBtnTriggerRequestedAction.payload, null, 4)}]`);
        const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);
        yield* put(readerLocalActionAnnotations.enableMode.build(!modeEnabled));
    }
}
function* annotationEnableMode(action: readerLocalActionAnnotations.enableMode.TAction) {
    const { payload: {enable}} = action;

    debug(`annotationEnableMode enable=${enable}`);
    if (enable) {
        highlightsDrawMargin(false);
        debug("annotation mode enabled ! draws highlight NOT in marging!");
    } else {
        highlightsDrawMargin(["annotation"]);
        debug("annotation mode diasbled ! draws highlight IN marging!");
    }
}

function* annotationFocusMode(action: readerLocalActionAnnotations.focusMode.TAction) {
    debug("annotationMode (UI Edition and focus on current plus remove focus if any previous)");
    
    const { payload: {previousFocusUuid, currentFocusUuid} } = action;

    if (previousFocusUuid ) {
        // disable with the new annotation margin mode, annotations are never deleted/unmounted
        // const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);
        // if (!modeEnabled) {
        //     debug(`annotation focus mode -- delete the highlight for previousFocusUUId=${previousFocusUuid}`);
        //     yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid: previousFocusUuid }]));
        // }
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

function* readerStart() {

    debug("iframe reader viewport waiting to start...");

    yield* all([
        take(readerLocalActionSetLocator.build),
        take(winActions.initSuccess.build),
    ]);

    debug("annotation iframe reader viewport is started and ready to annotate, we draws all the annoatation for the first time with 'highlightsDrawMargin' enabled");

    highlightsDrawMargin(["annotation"]);

    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
    const annotationsUuids = annotations.map(([_, annotationState]) => ({ uuid: annotationState.uuid }));
    yield* put(readerLocalActionHighlights.handler.pop.build(annotationsUuids));

    const annotationsHighlighted = annotations.map(
        ([_, { uuid, locatorExtended: { locator: { href }, selectionInfo }, color }]) =>
            ({ uuid, href, def: { selectionInfo, color, group: "annotation" } }));

    yield* put(readerLocalActionHighlights.handler.push.build(annotationsHighlighted));

    debug(`${annotationsHighlighted.length} annotation(s) drawn`);
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
        spawnLeading(
            readerStart,
            (e) => console.error("readerStart", e),
        ),
    ]);
