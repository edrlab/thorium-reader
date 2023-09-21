// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ReactReduxContext, ReactReduxContextValue } from "react-redux";
import { useSyncExternalStore } from "./useSyncExternalStore";

export function useSelector<State, Selected>(selector: (state: State) => Selected): Selected {

    const {store} = React.useContext<ReactReduxContextValue<State>>(ReactReduxContext);
    const selected = useSyncExternalStore(store.subscribe, () => selector(store.getState()));
    return selected;
}
