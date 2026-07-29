// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { all, put as putTyped, select as selectTyped } from "typed-redux-saga/macro";
import { SagaGenerator } from "typed-redux-saga";
import { readerLocalActionToggleMenu, readerLocalActionToggleSettings } from "../actions";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions, dockActions, readerActions } from "readium-desktop/common/redux/actions";
import { IReaderDialogOrDockSettingsMenuState, ReaderConfig } from "readium-desktop/common/models/reader";
import { DockTypeName } from "readium-desktop/common/models/dock";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:img";
const debug = debug_(filename_);
debug("_");

let _isObserving = false;
let _observer: MutationObserver;
let _timeoutId = 0;


function* toggleSettingsOrMenu(action: readerLocalActionToggleMenu.TAction | readerLocalActionToggleSettings.TAction): SagaGenerator<void> {

    /* eslint-disable prefer-const */
    let { open, readerDockingMode, section, focus, id, edit, focusRequestId, sort } = action.payload;
    const newReaderConfig: Partial<ReaderConfig> = {};

    if (_isObserving) {
        debug("mutationObeserver_cb_disconnecting");
        _observer.disconnect();
        _isObserving = false;
    }
    if (_timeoutId) {
        window.clearTimeout(_timeoutId);
        _timeoutId = 0;
    }

    const isReaderMenuPublicationNoteTarget =
        action.type === readerLocalActionToggleMenu.ID &&
        (section === "tab-annotation" || section === "tab-bookmark") &&
        !!id &&
        id !== "reader-menu-tab-annotation" &&
        id !== "reader-menu-tab-bookmark";

    // TODO: finish the focus transition away from this MutationObserver path.
    //
    // Publication-note focus no longer relies on observing late-mounted dialog/dock
    // DOM nodes here. When a route targets a bookmark or annotation, the router
    // dispatches the menu action with the target note id plus a fresh
    // `focusRequestId`. This saga stores those values in the reader menu
    // dialog/dock data. The note list then reacts to that state: it resets any
    // filters that could hide the target note, asks the publication-notes view for
    // the page anchored around that note, and passes the `focusRequestId` down to
    // the row card. The card's own effect scrolls and focuses the selected row.
    // The request id is important because it lets the row repeat focus even when
    // the same note id is requested twice.
    //
    // Keep the observer below only for the older generic menu/settings focus
    // targets, such as tab panels, settings navigation, or the go-to-page input,
    // which may not exist in the DOM when the saga first runs. Once those targets
    // also get explicit component-level focus effects, or a shared route/state
    // focus-request mechanism similar to notes, this observer can be removed.
    //
    // If PDF annotation panel actions need repeated focus on the same note, they
    // should also provide a fresh `focusRequestId`; otherwise a same-note request
    // can be indistinguishable from the existing selected state.
    if (focus && !isReaderMenuPublicationNoteTarget) {
        const editId = edit ? "_edit" : "";
        const elementId = id + editId;
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        } else {
            const target = document.getElementById("app-overlay");
            if (!target) {
                debug("CRITICAL ERROR !!! no `app-overlay` id found !!!");
                return;
            }


            _observer = new MutationObserver((records: MutationRecord[], observer) => {
                for (const record of records) {
                    debug("mutationObeserver_cb", record);
                    if (record.type === "childList") {
                        const nodeList = record.addedNodes;
                        debug("mutationObeserver_cb", nodeList);
                        for (const node of nodeList) {
                            if (node.nodeType === node.ELEMENT_NODE && node instanceof HTMLElement) {


                                const nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT, (node) => {
                                    if ((node as HTMLElement)?.id === elementId) {

                                        return NodeFilter.FILTER_ACCEPT;
                                    }
                                    return NodeFilter.FILTER_REJECT;
                                });
                                const focusElement: HTMLElement = nodeIterator.nextNode() as HTMLElement | null;
                                if (focusElement) {
                                    debug("mutationObeserver_cb_found", focusElement);
                                    focusElement.focus();
                                    observer.disconnect();
                                    _isObserving = false;
                                    window.clearTimeout(_timeoutId);
                                    _timeoutId = 0;

                                    return;
                                } else {
                                    debug("mutationObeserver_cb_notfound", focusElement);
                                }
                            }
                        }
                    }
                }
                // debug("mutationObeserver_disconnect_notfound");
                // observer.disconnect();
                // _isObserving = false;
                // window.clearTimeout(_timeoutId);
                // _timeoutId = 0;
            });
            debug("mutationObeserver_observe");
            _observer.observe(target, { childList: true, subtree: true });
            _isObserving = true;

            _timeoutId = window.setTimeout(() => {
                if (_isObserving) {
                    debug("mutationObeserver_disconnect_timeout");
                    _observer.disconnect();
                    _isObserving = false;
                    _timeoutId = 0;
                }
            }, 3000);
        }
    }


    const currentReaderDockingMode = yield* selectTyped((state: IReaderRootState) => state.reader.config.readerDockingMode);

    if (readerDockingMode === undefined) {
        readerDockingMode = currentReaderDockingMode;
    }

    if (readerDockingMode !== currentReaderDockingMode) {
        if (readerDockingMode === "full") {
            yield* putTyped(dialogActions.closeRequest.build());
        } else {
            yield* putTyped(dockActions.closeRequest.build());
        }
        newReaderConfig.readerDockingMode = readerDockingMode;
    }

    const currentSection = action.type === "READER_TOGGLE_MENU" ?
        (yield* selectTyped((state: IReaderRootState) => state.reader.config.readerMenuSection)) :
        (yield* selectTyped((state: IReaderRootState) => state.reader.config.readerSettingsSection));
    if (section === undefined) {
        section = currentSection;
    }

    if (section !== currentSection) {
        if (action.type === "READER_TOGGLE_MENU") {
            newReaderConfig.readerMenuSection = section;
        } else {
            newReaderConfig.readerSettingsSection = section;
        }
    }

    if (ObjectKeys(newReaderConfig).length) {
        yield* putTyped(readerActions.setConfig.build(newReaderConfig));
    }

    if (readerDockingMode === "full") {

        const dialogState = yield* selectTyped((state: IReaderRootState) => state.dialog);
        const currentDialogOpen = dialogState.open && (dialogState.type === DialogTypeName.ReaderMenu || dialogState.type === DialogTypeName.ReaderSettings);
        if (open === undefined) {
            open = !currentDialogOpen;
        }
        const dialogType = action.type === "READER_TOGGLE_MENU" ? DialogTypeName.ReaderMenu : DialogTypeName.ReaderSettings;
        const currentDialogType = dialogState.type;
        const data: IReaderDialogOrDockSettingsMenuState = {
            id: id || "",
            edit: edit || false,
            focusRequestId,
            sort,
        };
        if (open) {
            if (currentDialogOpen && currentDialogType === dialogType) {
                yield* putTyped(dialogActions.updateRequest.build(data));
            } else {
                yield* putTyped(dialogActions.openRequest.build(dialogType, data));
            }
        } else {
            yield* putTyped(dialogActions.closeRequest.build());
        }
    } else {

        const dockState = yield* selectTyped((state: IReaderRootState) => state.dock);
        const currentDockOpen = dockState.open && (dockState.type === DockTypeName.ReaderMenu || dockState.type === DockTypeName.ReaderSettings);
        if (open === undefined) {
            open = !currentDockOpen;
        }
        const dockType = action.type === "READER_TOGGLE_MENU" ? DockTypeName.ReaderMenu : DockTypeName.ReaderSettings;
        const currentDockType = dockState.type;
        const data: IReaderDialogOrDockSettingsMenuState = {
            id: id || "",
            edit: edit || false,
            focusRequestId,
            sort,
        };
        if (open) {
            if (currentDockOpen && currentDockType === dockType) {
                yield* putTyped(dockActions.updateRequest.build(data));
            } else {
                yield* putTyped(dockActions.openRequest.build(dockType, data));
            }
        } else {
            yield* putTyped(dockActions.closeRequest.build());
        }
    }

}

export const saga = () => {
    return all([
        takeSpawnEvery(
            readerLocalActionToggleMenu.ID,
            toggleSettingsOrMenu,
            (e) => console.error(e),
        ),
        takeSpawnEvery(
            readerLocalActionToggleSettings.ID,
            toggleSettingsOrMenu,
            (e) => console.error(e),
        ),
    ]);
};
