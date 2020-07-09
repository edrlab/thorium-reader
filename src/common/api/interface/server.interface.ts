// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { PublicationView } from "readium-desktop/common/views/publication";

export interface IServerApi {
    setUrl: (url: string) => Promise<void>;
    getUrl: () => Promise<string>;
    publishPublication: (pub: PublicationView) => Promise<void>;
}

export interface IServerModuleApi {
    "server/getUrl": IServerApi["getUrl"];
    "server/setUrl": IServerApi["setUrl"];
    "server/publishPublication": IServerApi["publishPublication"];
}
