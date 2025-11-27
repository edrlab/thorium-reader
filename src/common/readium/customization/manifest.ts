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

export const customizationManifestJsonSchemaMinimal = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thorium Profile Manifest Json Schema (minimal)",
  "type": "object",
  "required": [
    "manifestVersion",
    "version",
    "identifier",
    "created",
    "title",
    "description",
    "theme",
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
    },
    "title": {
      "oneOf": [
        {
          "type": "string",
        },
        {
          "type": "object",
          "additionalProperties": {
            "type": "string",
          },
        },
      ],
    },
    "description": {
      "oneOf": [
        {
          "type": "string",
        },
        {
          "type": "object",
          "additionalProperties": {
            "type": "string",
          },
        },
      ],
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
          "pattern": "^#[0-9A-F]{6}$",
        },
        "primary": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "secondary": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "border": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "background": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "appName": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "scrollbarThumb": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "buttonsBorder": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
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

export const customizationManifestJsonSchemaExtended = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thorium Profile Manifest Json Schema",
  "type": "object",
  "required": [
    "manifestVersion",
    "version",
    "identifier",
    "contentHash",
    "title",
    "description",
    "theme",
    "images",
    "links",
    "signature",
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
    },
    "contentHash": {
      "type": "string",
    },
    "title": {
      "$ref": "https://readium.org/webpub-manifest/schema/language-map.schema.json",
    },
    "description": {
      "$ref": "https://readium.org/webpub-manifest/schema/language-map.schema.json",
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
		  
		  /*
		  *. TODO: link.schema.json doesn't inlude a title link of type StringMap
		  *
		  *     "title": {
      *      "description": "Title of the linked resource",
      *      "type": "string"
			*		  },
		  *
			* title must be of type/ref equal to language-map.schema.json
		  */
			  "$ref": "https://readium.org/webpub-manifest/schema/link.schema.json",
			},
    },
    "publications": {
	    "type": "array",
	    "items": {
				"$ref": "https://drafts.opds.io/schema/publication.schema.json",
			},
    },
    "images": {
      "type": "array",
      "items": {
        "$ref": "https://readium.org/webpub-manifest/schema/link.schema.json",
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
          "pattern": "^#[0-9A-F]{6}$",
        },
        "primary": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "secondary": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "border": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "background": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "appName": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "scrollbarThumb": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
        },
        "buttonsBorder": {
          "type": "string",
          "pattern": "^#[0-9A-F]{6}$",
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
