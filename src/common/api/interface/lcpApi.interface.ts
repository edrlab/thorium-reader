// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface ILcpApi {
    renewPublicationLicense: (publicationIdentifier: string) => Promise<void>;
    returnPublication: (publicationIdentifier: string) => Promise<void>;
    unlockPublicationWithPassphrase: (passphrase: string, publicationViewIdentifer: string) => Promise<void>;
}

export interface ILcpModuleApi {
    "lcp/renewPublicationLicense": ILcpApi["renewPublicationLicense"];
    "lcp/returnPublication": ILcpApi["returnPublication"];
    "lcp/unlockPublicationWithPassphrase": ILcpApi["unlockPublicationWithPassphrase"];
}
