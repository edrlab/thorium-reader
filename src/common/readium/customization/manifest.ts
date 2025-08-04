// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { Link } from "@r2-shared-js/models/publication-link";
import { OPDSProperties } from "@r2-opds-js/opds/opds2/opds2-properties";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// https://www.notion.so/edrlab/Thorium-Reader-Profiles-1d8a1ca5712f80619738c2f26e700355

export interface ICustomizationManifest {

    manifest_version: number;
    identifier: string; // URI
    version: string; // semantic versionning
    content_hash: string;
    name: string;
    description: string;
    default_locale: string; // BCP47
    theme: ICustomizationManifestTheme;
    images: ICustomizationManifestImage[];
    links?: Array<OPDSLink & { properties: ICustomizationManifestLinkPropertiesExtension }>;
    publications?: OPDSPublication;
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

export interface ICustomizationManifestLinkPropertiesExtension extends OPDSProperties {
    show_on_home_section?: boolean;
    show_deletion?: boolean;
    default_profile?: boolean;
    authenticate?: { // OPDSLink authenticate
        href: string;
        type: string;
    };
    logo?: Link;
}

export interface ICustomizationManifestImage {
    href: string; // relative file path in zip directory
    rel: string;
}
