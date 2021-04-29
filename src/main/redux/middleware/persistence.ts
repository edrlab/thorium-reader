// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as ramda from "ramda";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";
import { createPatch } from "rfc6902";
import { winActions } from "../actions";
import { patchChannel } from "../sagas/patch";

import { PersistRootState, RootState } from "../states";

export const reduxPersistMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) =>
        (next: Dispatch<ActionWithSender>) =>
            (action: ActionWithSender) => {

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                const persistPrevState: PersistRootState = {
                    win: prevState.win,
                    reader: prevState.reader,
                    i18n: prevState.i18n,
                    session: prevState.session,
                    publication: {
                        db: prevState.publication.db,
                        lastReadingQueue: prevState.publication.lastReadingQueue,
                    },
                    opds: prevState.opds,
                };

                const persistNextState: PersistRootState = {
                    win: nextState.win,
                    reader: nextState.reader,
                    i18n: nextState.i18n,
                    session: nextState.session,
                    publication: {
                        db: nextState.publication.db,
                        lastReadingQueue: nextState.publication.lastReadingQueue,
                    },
                    opds: nextState.opds,
                };

                const ops = createPatch(persistPrevState, persistNextState);
                for (const o of ops) {
                    patchChannel.put(o);
                }
                if (ops?.length) {
                    store.dispatch(winActions.persistRequest.build(ops));
                }

                return returnValue;
            };
