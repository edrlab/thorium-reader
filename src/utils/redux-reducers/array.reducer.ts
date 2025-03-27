// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { Action, type UnknownAction } from "redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ActionWithPayload<Type extends string = string, Payload extends { } = { }>
    extends Action<Type> {
        payload: Payload;
}

export interface IArrayAction<
    T extends string = string,
    P extends {} = {},
    V extends { uuid: string } = { uuid: string }
> {
    type: T;
    selector: (action: P) => V[];
}

// interface IArrayData<
//     TAddType extends string,
//     TRemoveType extends string,
//     TAddPayload extends {},
//     TRemovePayload extends {},
//     Value extends { uuid: string}
// > {
//     add: IArrayAction<TAddType, TAddPayload, Value>
//     remove: IArrayAction<TRemoveType, TRemovePayload, Value>
// }

export function arrayReducer<
    // TAddType extends string,
    // TRemoveType extends string,
    // TAddPayload extends { },
    // TRemovePayload extends { },
    TActionAdd extends ActionWithPayload,
    TActionRemove extends ActionWithPayload,
    Value extends { uuid: string}
>(
    data: {
        add: IArrayAction<TActionAdd["type"], TActionAdd["payload"], Value>
        remove: IArrayAction<TActionRemove["type"], TActionRemove["payload"], Value>
    },
) {

    const reducer =
    (
        array: Value[] = [],
        action: UnknownAction,
    ): Value[] => {


        if (action.type === data.add.type) {

            const items = data.add.selector(action.payload as unknown as TActionAdd["payload"]);
            if (!items) {
                return array;
            }

            const needToBeUpdatedUUID = items.map((item) => item.uuid);
            const newArray = array.filter((element) => !needToBeUpdatedUUID.includes(element.uuid));
            for (const item of items) {
                const clonedItem = clone(item);
                newArray.push(clonedItem);
            }
            return newArray;

        } else if (action.type === data.remove.type) {

            const items = data.remove.selector(action.payload as unknown as TActionRemove["payload"]);
            if (!items) {
                return array;
            }
            const needToBeRemovedUUID = items.map((item) => item.uuid);
            const newArray = array.filter((element) => !needToBeRemovedUUID.includes(element.uuid));
            return newArray;
        }

        return array;
    };

    return reducer;
}
