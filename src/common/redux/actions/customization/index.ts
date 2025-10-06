// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as enable from "./enable";
import * as activate from "./activate";
import * as provision from "./provision";
import * as acquire from "./acquire";
import * as lock from "./lock";
import * as history from "./addHistory";
import * as welcomeScreen from "./welcomeScreen";
import * as manifest from "./manifest";
import * as triggerOpdsAuth from "./triggerOpdsAuthentication";
import * as deleteProfile from "./delete";

export {
    activate as activating,
    provision as provisioning,
    acquire,
    lock,
    history as addHistory,
    welcomeScreen,
    manifest,
    triggerOpdsAuth,
    deleteProfile,
};
