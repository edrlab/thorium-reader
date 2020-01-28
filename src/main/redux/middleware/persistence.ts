// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ActionWithSender } from "readium-desktop/common/models/sync";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_WIN_PERSISTENCE, diMainGet } from "readium-desktop/main/di";
import { debounce } from "readium-desktop/utils/debounce";
import { shallowEqual } from "readium-desktop/utils/shallowEqual";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

import { RootState } from "../states";

const persistState = async (nextState: RootState) => {

    const configRepository: ConfigRepository<Partial<RootState>> = diMainGet("config-repository");
    await configRepository.save({
        identifier: CONFIGREPOSITORY_REDUX_WIN_PERSISTENCE,
        value: {
            win: nextState.win,
        },
    });
};

const TIME_BETWEEN_2_RECORDING = 1000;

const debouncePersistState = debounce<typeof persistState>(persistState, TIME_BETWEEN_2_RECORDING);

export const reduxPersistMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) =>
        (next: Dispatch<ActionWithSender>) =>
            (action: ActionWithSender) => {

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                if (!shallowEqual(prevState.win, nextState.win)) {
                    debouncePersistState(nextState);
                }

                return returnValue;
            };
