// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

let focusPtrRef: React.RefObject<any> | undefined = undefined;

const setFocusRef = (ref: React.RefObject<any>) => {
    if (ref) {
        focusPtrRef = ref;
    }
};

const getFocusRef = () => focusPtrRef;

const clearFocusRef = (ref: React.RefObject<any>) => {
    if (ref?.current === focusPtrRef?.current) {
        focusPtrRef = undefined;
    }
};

export const focusConstructor = {
    setFocusRef,
    getFocusRef,
    clearFocusRef,
};

export const FocusContext = React.createContext<typeof focusConstructor>(focusConstructor);
