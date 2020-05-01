// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as ramda from "ramda";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { winActions } from "readium-desktop/main/redux/actions";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

import { RootState } from "../states";

export const reduxPersistMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) =>
        (next: Dispatch<ActionWithSender>) =>
            (action: ActionWithSender) => {

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                if (
                        !ramda.equals(prevState.win, nextState.win)
                    ||  !ramda.equals(prevState.publication, nextState.publication)
                    ||  !ramda.equals(prevState.reader, nextState.reader)
                    ||  !ramda.equals(prevState.session, nextState.session)
                ) {

                    // dispatch a new round in middleware
                    store.dispatch(winActions.persistRequest.build());
                }

                return returnValue;
            };
