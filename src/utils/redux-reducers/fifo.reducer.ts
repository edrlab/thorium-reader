// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action, type UnknownAction } from "redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ActionWithPayload<Type extends string = string>
    extends Action<Type> {
}

export interface IFIFOActionPush<TAction extends
    ActionWithPayload<ActionType>, Value = string, ActionType extends string = string> {
    type: ActionType;
    selector: (action: TAction) => TFIFOState<Value>;
}

export interface IFIFOActionPop<ActionType extends string = string> {
    type: ActionType;
}


export interface IFIFOData
<
    TPushAction extends ActionWithPayload<ActionType>,
    Value = string,
    ActionType extends string = string,
> {
    push: IFIFOActionPush<TPushAction, Value, ActionType>;
    shift: IFIFOActionPop<ActionType>;
}

export type IFIFOState<Value> = Value;
export type TFIFOState<V = string> = Array<IFIFOState<V>>;

export function fifoReducer
    <
        TPushAction extends ActionWithPayload<ActionType>,
        Value = string,
        ActionType extends string = string,
    >(
        data: IFIFOData<TPushAction, Value, ActionType>,
) {

    const reducer =
        (
                queue: TFIFOState<Value>,
                action: UnknownAction, // TPopAction | TPushAction,
        ): TFIFOState<Value> => {

            if (!queue || !Array.isArray(queue)) {
                queue = [];
            }

            if (action.type === data.push.type) {

                const selectorItem = data.push.selector(action as unknown as TPushAction);
                if (!selectorItem) {
                    return queue;
                }
                const newQueue = queue.slice();
                selectorItem.forEach((value) => {
                    if (value) {
                        newQueue.push(value);
                    }
                });

                return newQueue;

            } else if (action.type === data.shift.type) {

                const newQueue = queue.slice();
                newQueue.shift();

                return newQueue;
            }

            return queue;
        };

    return reducer;
}
