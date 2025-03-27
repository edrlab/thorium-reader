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
    selector: (action: P, state: V[]) => V[] | undefined;
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
        add: IArrayAction<TActionAdd["type"], TActionAdd["payload"], Value>[] | IArrayAction<TActionAdd["type"], TActionAdd["payload"], Value>,
        remove?: IArrayAction<TActionRemove["type"], TActionRemove["payload"], Value>,
    },
) {

    const reducer =
    (
        array: Value[] = [],
        action: UnknownAction,
    ): Value[] => {

        const addArray = Array.isArray(data.add) ? data.add : [data.add];
        if (addArray.some((el) => el.type === action.type)) {
            
            let _array = array;
            for (const add of addArray) {

                if (action.type === add.type) {

                    const items = add.selector(action.payload as unknown as TActionAdd["payload"], array);
                    if (!items) {
                        continue;
                    }

                    const needToBeUpdatedUUID = items.map((item) => item.uuid);
                    _array = _array.filter((element) => !needToBeUpdatedUUID.includes(element.uuid));
                    for (const item of items) {
                        const clonedItem = clone(item);
                        _array.push(clonedItem);
                    }
                }
            }

            return _array;
        } else if (action.type === data.remove?.type) {

            const items = data.remove.selector(action.payload as unknown as TActionRemove["payload"], array);
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
