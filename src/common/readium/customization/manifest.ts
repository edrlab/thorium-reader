// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { JsonArray } from "readium-desktop/typings/json";

// https://www.notion.so/edrlab/Thorium-Reader-Profiles-1d8a1ca5712f80619738c2f26e700355

export interface ICustomizationManifest {

    manifestVersion: number;
    identifier: string; // URI
    version: string; // semantic versionning
    contentHash: string;
    title: string | IStringMap;
    description: string | IStringMap;
    // welcomeScreen: string; // replace with a link rel = "welcome-screen"
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
    appName: string;
    scrollbarThumb: string;
    buttonsBorder: string;
}

export interface ICustomizationManifestSignature {
    key: string;
    value: string;
    algorithm: string; // URI
}

export interface ICustomizationManifestLinkPropertiesExtension {
    // showOnHomeSection?: boolean;
    // showDeletion?: boolean;
    // defaultProfile?: boolean;
    authenticate?: ICustomizationLink;
    // logo?: ICustomizationLink; // never used in thorium-desktop
}

export interface ICustomizationLink {

    // https://github.com/ajv-validator/ajv-formats/blob/4ca86d21bd07571a30178cbb3714133db6eada9a/src/formats.ts#L56
    // https://developer.mozilla.org/en-US/docs/Web/URI/Reference
    href: string; // relative file path in zip directory or http(s) link => not fully an URI

    rel?: string;
    type?: string;
    title?: string | IStringMap;
    language?: string; // bcp47
}
