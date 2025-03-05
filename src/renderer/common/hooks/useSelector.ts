// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ReactReduxContext, ReactReduxContextValue } from "react-redux";
import { useSyncExternalStore } from "./useSyncExternalStore";

export function useSelector<State, Selected>(selector: (state: State) => Selected, equalFn?: (prev: Selected, current: Selected) => boolean): Selected {

    const {store} = React.useContext<ReactReduxContextValue<State>>(ReactReduxContext);
    const selected = useSyncExternalStore(store.subscribe, () => selector(store.getState()));
    const selectedRef = React.useRef(selected); 

    if (equalFn) {
        if (!equalFn(selectedRef.current, selected)) {
            selectedRef.current = selected;
            return selected;
        } else {
            return selectedRef.current;
        }
    }

    return selected;
}
