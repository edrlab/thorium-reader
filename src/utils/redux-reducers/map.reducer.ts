// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ActionWithPayload<Type = string>
    extends Action<Type> {
}

export interface IMapAction<TAction extends
    ActionWithPayload<ActionType>, Key = number, Value = string, ActionType = string> {
    type: ActionType;
    selector: (action: TAction) => Array<IMapState<Key, Value>>;
}

export interface IMapData
<
    TPushAction extends ActionWithPayload<ActionType>,
    TPopAction extends ActionWithPayload<ActionType>,
    Key = number,
    Value = string,
    ActionType = string,
> {
    push: IMapAction<TPushAction, Key, Value, ActionType>;
    pop: IMapAction<TPopAction, Key, Value, ActionType>;
    sortFct?: (a: IMapState<Key, Value>, b: IMapState<Key, Value>) => number;
}

export type IMapState<Key, Value> = [Key, Value];
export type TMapState<K = number, V = string> = Array<IMapState<K, V>>;

export function mapReducer
    <
        TPushAction extends ActionWithPayload<ActionType>,
        TPopAction extends ActionWithPayload<ActionType>,
        Key = number,
        Value = string,
        ActionType = string,
    >(
        data: IMapData<TPushAction, TPopAction, Key, Value, ActionType>,
) {

    const reducer =
        (
                queue: TMapState<Key, Value>,
                action: TPopAction | TPushAction,
        ): TMapState<Key, Value> => {

            if (!queue || !Array.isArray(queue)) {
                queue = [];
            }

            if (action.type === data.push.type) {

                const selectorItem = data.push.selector(action as TPushAction);
                if (!selectorItem) {
                    return queue;
                }
                const newQueue = queue.slice();
                selectorItem.forEach(([key, value]) => {
                    if (key && value) {

                        // find same key
                        const index = newQueue.findIndex(([_key, _value]) => _key === key);
                        if (index > -1) {
                            newQueue[index] = [key, value];
                        } else {
                            newQueue.push([key, value]);
                        }

                    }
                });

                // WARNING: .sort() is in-place same-array mutation! (not a new array)
                // ... which is fine here because .slice() to create a shallow copy
                newQueue.sort(data.sortFct);
                return newQueue;

            } else if (action.type === data.pop.type) {

                const selectorItem = data.pop.selector(action as TPopAction);
                if (!selectorItem) {
                    return queue;
                }
                return queue.filter(
                    ([key, _value]) =>
                        !selectorItem.reduce<boolean>(
                            (pv, [keySelector, _valueSelector]) => pv || (keySelector === key), false),
                );

            }

            return queue;
        };

    return reducer;
}
