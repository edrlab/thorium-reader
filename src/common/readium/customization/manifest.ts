// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { JsonArray } from "src/typings/json";

// https://www.notion.so/edrlab/Thorium-Reader-Profiles-1d8a1ca5712f80619738c2f26e700355

export interface ICustomizationManifest {

    manifestVersion: number;
    identifier: string; // URI
    version: string; // semantic versionning
    contentHash: string;
    name: string;
    description: string;
    // default_locale: string; // BCP47 // not used anymore but still in notion example manifest
    theme: ICustomizationManifestTheme;
    images: ICustomizationLink[];
    links?: Array<ICustomizationLink & { properties: ICustomizationManifestLinkPropertiesExtension }>;
    publications?: JsonArray; // OPDSPublication;
    signature: ICustomizationManifestSignature | undefined;
}

export interface ICustomizationManifestTheme {

    color: {
        dark: ICustomizationManifestColor;
        light: ICustomizationManifestColor;
    }
}

export interface ICustomizationManifestColor {
    neutral: string;
    primary: string;
    secondary: string;
    border: string;
    background: string;
    app_name: string;
}

export interface ICustomizationManifestSignature {
    key: string;
    value: string;
    algorithm: string; // URI
}

export interface ICustomizationManifestLinkPropertiesExtension {
    showOnHomeSection?: boolean;
    // showDeletion?: boolean;
    // defaultProfile?: boolean;
    authenticate?: ICustomizationLink;
    logo?: ICustomizationLink;
}

export interface ICustomizationLink {
    href: string; // relative file path in zip directory or http(s) link => not fully an URI
    rel: string;
    type: string;
}
