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
    title: IStringMap;
    description: IStringMap;
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
    showOnHomeSection?: boolean;
    // showDeletion?: boolean;
    // defaultProfile?: boolean;
    authenticate?: ICustomizationLink;
    logo?: ICustomizationLink;
}

export interface ICustomizationLink {
    href: string; // relative file path in zip directory or http(s) link => not fully an URI
    rel?: string;
    type?: string;
    title?: IStringMap;
    language?: string; // bcp47
}

export const customizationManifestJsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thorium Manifest Schema",
  "type": "object",
  "required": [
    "manifestVersion",
    "identifier",
    "version",
    "contentHash",
    "title",
    "description",
    "theme",
    "images",
  ],
  "properties": {
    "manifestVersion": {
      "type": "integer",
    },
    "identifier": {
      "type": "string",
      "format": "uri",
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
    },
    "contentHash": {
      "type": "string",
    },
    "title": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
      },
      "minProperties": 1,
    },
    "description": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
      },
      "minProperties": 1,
    },
    "theme": {
      "type": "object",
      "properties": {
        "color": {
          "type": "object",
          "properties": {
            "dark": {
                "$ref": "#/definitions/ICustomizationManifestThemeColor",
            },
            "light": {
                "$ref": "#/definitions/ICustomizationManifestThemeColor",
            },
          },
          "required": [
            "dark",
            "light",
          ],
        },
      },
      "required": [
        "color",
      ],
    },
    "links": {
      "type": "array",
      "items": {
        "type": "object",
      },
    },
    "publications": {
      "type": "array",
      "items": {
        "type": "object",
      },
    },
    "images": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "rel",
          "href",
        ],
        "properties": {
          "rel": {
            "type": "string",
          },
          "href": {
            "type": "string",
          },
        },
      },
    },
  },
  "definitions": {
    "ICustomizationManifestThemeColor": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Theme color",
      "type": "object",
      "properties": {
        "neutral": {
          "type": "string",
        },
        "primary": {
          "type": "string",
        },
        "secondary": {
          "type": "string",
        },
        "border": {
          "type": "string",
        },
        "background": {
          "type": "string",
        },
        "appName": {
          "type": "string",
        },
        "scrollbarThumb": {
          "type": "string",
        },
        "buttonsBorder": {
          "type": "string",
        },
      },
      "required": [
        "neutral",
        "primary",
        "secondary",
        "border",
        "background",
        "appName",
        "scrollbarThumb",
        "buttonsBorder",
      ],
    },
  },
};
