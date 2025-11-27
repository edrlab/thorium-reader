
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
