// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IApiappApi } from "readium-desktop/common/api/interface/apiappApi.interface";
import { search } from "./search";
import { login } from "./login";

export const apiappApi: IApiappApi = {
    search,
    login,
};
