// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as apiActions from "./api";
import * as dialogActions from "./dialog/";
import * as downloadActions from "./download/";
import * as i18nActions from "./i18n/";
import * as importActions from "./import";
import * as lcpActions from "./lcp/index";
import * as loggerActions from "./logger";
import * as netActions from "./net";
import * as readerActions1 from "./reader";
import * as readerActions2 from "./reader/index";
import * as toastActions from "./toast/";
import * as updateActions from "./update/";

const readerActions = {
    ...readerActions1,
    ...readerActions2,
};

export {
    apiActions,
    dialogActions,
    i18nActions,
    loggerActions,
    netActions,
    readerActions,
    lcpActions,
    updateActions,
    importActions,
    toastActions,
    downloadActions,
};
