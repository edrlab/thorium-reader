// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as ramda from "ramda";
// import { ActionWithSender } from "readium-desktop/common/models/sync";
import { readerActions } from "readium-desktop/common/redux/actions";
import { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { UnknownAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

const dispatchSetReduxState = (
    store: MiddlewareAPI<Dispatch<UnknownAction>, IReaderRootState>,
    readerState: Partial<IReaderStateReader>,
) => {

    const state = store.getState();
    store.dispatch(
        readerActions.setReduxState.build(state.win.identifier, readerState),
    );
};

export const reduxPersistMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<UnknownAction>, IReaderRootState>) =>
        (next: (action: unknown) => unknown) => // Dispatch<ActionWithSender>
            (action: unknown) => { // ActionWithSender

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                const readerState: Partial<IReaderStateReader> = {};
                let dispatchFlag = false;
                if (!ramda.equals(prevState.reader.config, nextState.reader.config)) {

                    readerState.config = nextState.reader.config;
                    dispatchFlag = true;
                }
                if (!ramda.equals(prevState.reader.locator, nextState.reader.locator)) {

                    readerState.locator = nextState.reader.locator;
                    dispatchFlag = true;
                }
                if (!ramda.equals(prevState.reader.bookmark, nextState.reader.bookmark)) {

                    readerState.bookmark = nextState.reader.bookmark;
                    dispatchFlag = true;
                }
                if (!ramda.equals(prevState.reader.divina, nextState.reader.divina)) {

                    readerState.divina = nextState.reader.divina;
                    dispatchFlag = true;
                }
                if (prevState.reader.disableRTLFlip !== nextState.reader.disableRTLFlip) {

                    readerState.disableRTLFlip = nextState.reader.disableRTLFlip;
                    dispatchFlag = true;
                }
                if (!ramda.equals(prevState.reader.annotation, nextState.reader.annotation)) {

                    readerState.annotation = nextState.reader.annotation;
                    dispatchFlag = true;
                }
                if (!ramda.equals(prevState.reader.readingFinished, nextState.reader.readingFinished)) {

                    readerState.readingFinished = nextState.reader.readingFinished;
                    dispatchFlag = true;
                }
                if (dispatchFlag) {

                    dispatchSetReduxState(store, readerState);
                }

                // readerInfo is readOnly no need to persist it

                return returnValue;
            };
