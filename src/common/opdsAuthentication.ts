// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const OPDS_AUTHENTICATION_TYPES = [
    "http://opds-spec.org/auth/oauth/authorization-code-pkce",
    "http://opds-spec.org/auth/oauth/password",
    "http://opds-spec.org/auth/oauth/password/apiapp",
    "http://opds-spec.org/auth/oauth/implicit",
    "http://opds-spec.org/auth/basic",
    "http://opds-spec.org/auth/digest",
    "http://opds-spec.org/auth/local",
    "http://librarysimplified.org/authtype/SAML-2.0",
] as const;

export type TAuthenticationType = typeof OPDS_AUTHENTICATION_TYPES[number];

// Credential flows are rendered in the library OPDS browser.
export const isOpdsCredentialAuthenticationType = (type: string): boolean =>
    ["local", "basic", "digest", "oauth/password", "oauth/password/apiapp"]
        .some(value => type === `http://opds-spec.org/auth/${value}`);
