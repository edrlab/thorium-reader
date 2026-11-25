// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { randomBytes } from "node:crypto";
import { URL_HOST_OPDS_AUTH, URL_PROTOCOL_OPDS } from "readium-desktop/common/streamerProtocol";
import { IOpdsLinkView, TExternalOpdsAuthenticationType } from "readium-desktop/common/views/opds";
import { OPDS_PKCE_CANONICAL_TYPE, IOpdsPkceTransaction } from "readium-desktop/main/network/opdsPkce";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

export interface IExternalAuthenticationDocument {
    id: string;
    authenticationType: TExternalOpdsAuthenticationType;
    links: Partial<Record<"authenticate" | "refresh" | "token", IOpdsLinkView>>;
}

export function getExternalAuthenticationUrl(auth: IExternalAuthenticationDocument, pkce?: IOpdsPkceTransaction,
    implicitAuthData = { authenticationDocumentId: "", nonce: "" }): string {
    if (auth.authenticationType === OPDS_PKCE_CANONICAL_TYPE) return pkce?.authorizationRequestUrl || "";
    const url = new URL(auth.links?.authenticate?.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid authorization URL");
    url.searchParams.set("redirect_uri", `${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`);
    if (auth.authenticationType === "http://opds-spec.org/auth/oauth/implicit") {
        implicitAuthData.authenticationDocumentId = auth.id;
        implicitAuthData.nonce = randomBytes(16).toString("hex");
        if (!url.searchParams.get("client_id")) url.searchParams.set("client_id", "http://opds-spec.org/auth/client");
        url.searchParams.set("response_type", "token");
        url.searchParams.set("state", implicitAuthData.nonce);
        url.searchParams.set("application", "org.edrlab.thorium.desktop");
        url.searchParams.set("application_version", _APP_VERSION);
    }
    return url.toString();
}
