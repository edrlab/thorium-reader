
export const customizationManifestJsonSchemaMinimal = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Thorium Profile Manifest Json Schema (minimal)",
  "type": "object",
  "required": [
    "version",
    "identifier",
    "title",
    "description",
    "theme",
  ],
  "properties": {
    "version": {
      "type": "integer",
    },
    "identifier": {
      "type": "string",
      "format": "uri",
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
