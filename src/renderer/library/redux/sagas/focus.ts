// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import React from "react";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { getFocusRef } from "readium-desktop/renderer/common/focusPointer";
import { take as takeTyped, call as callTyped } from "typed-redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects

function* doBackFocusMenuButton(action: dialogActions.openRequest.TAction) {

    const { payload: {type} } = action;
    if (type === DialogTypeName.PublicationInfoOpds
        || type === DialogTypeName.PublicationInfoLib
        || type === DialogTypeName.DeletePublicationConfirm
    ) {

        yield* takeTyped(dialogActions.closeRequest.ID);
        const focusRef = getFocusRef() as React.RefObject<HTMLButtonElement>;
        if (focusRef) {
            yield* callTyped(() => setTimeout(() => focusRef.current.focus(), 1));
        }
    }
}

export function saga() {
    return takeSpawnLeading(
        dialogActions.openRequest.ID,
        doBackFocusMenuButton,
        (e) => console.log("FOCUS", e),
    );
}
