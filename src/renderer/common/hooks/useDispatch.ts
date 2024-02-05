// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ReactReduxContext} from "react-redux";
import { Action } from "readium-desktop/common/models/redux";
import { Dispatch } from "redux";

export function useDispatch<A extends Action<any, any, any>>(): Dispatch<A> {

    const {store} = React.useContext(ReactReduxContext);
    const storeDispatchFn = store.dispatch;
    return storeDispatchFn;
}
