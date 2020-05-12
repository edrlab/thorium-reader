// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as ramda from "ramda";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { readerActions } from "readium-desktop/common/redux/actions";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

const dispatchSetReduxState = (store: MiddlewareAPI<Dispatch<AnyAction>, IReaderRootState>) => {

    const state = store.getState();
    store.dispatch(readerActions.setReduxState.build(state.win.identifier, state.reader));
};

export const reduxPersistMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>, IReaderRootState>) =>
        (next: Dispatch<ActionWithSender>) =>
            (action: ActionWithSender) => {

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                if (!ramda.equals(prevState.reader, nextState.reader)) {
                    dispatchSetReduxState(store);
                }

                return returnValue;
            };
