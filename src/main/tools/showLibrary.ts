// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { getLibraryWindowFromDi } from "../di";
import { getAppActivateEventChannel } from "../redux/sagas/getEventChannel";

export const showLibrary = () => {

    const library = getLibraryWindowFromDi();
    if (library.isDestroyed()) {

        const appActivateChannel = getAppActivateEventChannel();
        appActivateChannel.put(true);
    } else {
        library.show();
    }
};
