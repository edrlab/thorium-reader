// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { apiKeysActions } from "../actions";
import { IApiKeysArray } from "../states/api_key";

const initialState: IApiKeysArray = [
];

function apiKeysReducer_(
    state = initialState,
    action: apiKeysActions.setKey.TAction,
): IApiKeysArray {

    switch (action.type) {
        case apiKeysActions.setKey.ID:
            // Vérifiez si le fournisseur existe déjà
            const existingIndex = state.findIndex(
                key => key.provider === action.payload.provider,
            );

            if (existingIndex !== -1) {
                // Si le fournisseur existe, mettez à jour la clé
                return state.map((key, index) =>
                    index === existingIndex
                        ? { ...key, key: action.payload.key }
                        : key,
                );
            } else {
                // Sinon, ajoutez une nouvelle entrée
                return [
                    ...state,
                    {
                        provider: action.payload.provider,
                        key: action.payload.key,
                    },
                ];
            };
        default:
            return state;
    }
}


export const apiKeysReducer = apiKeysReducer_ as Reducer<ReturnType<typeof apiKeysReducer_>>;
