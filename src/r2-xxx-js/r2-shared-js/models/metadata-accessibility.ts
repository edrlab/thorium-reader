// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonElementType, JsonObject, JsonConverter, JsonProperty } from "ta-json-x";
import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";
import { IStringMap } from "./metadata-multilang";
import { AccessibilityCertification } from "./metadata-accessibility-certification";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/metadata.schema.json#L35-L37
@JsonObject()
export class AccessibilityMetadata {

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L18-L31
    @JsonProperty("certification")
    public Certification!: AccessibilityCertification;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L7-L17
    // dcterms:conformsTo
    @JsonProperty("conformsTo")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public ConformsTo!: string[]; // link in EPUB3, or meta! (https://www.w3.org/TR/epub-a11y-11/)
    // http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-a
    // http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa
    // http://www.idpf.org/epub/a11y/accessibility-20170105.html#wcag-aaa
    // EPUB Accessibility 1.1 - WCAG 2.0 Level A
    // EPUB Accessibility 1.1 - WCAG 2.0 Level AA
    // EPUB Accessibility 1.1 - WCAG 2.0 Level AAA
    // EPUB Accessibility 1.1 - WCAG 2.1 Level A
    // EPUB Accessibility 1.1 - WCAG 2.1 Level AA
    // EPUB Accessibility 1.1 - WCAG 2.1 Level AAA

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L32-L34
    // schema:accessibilitySummary
    @JsonProperty("summary")
    public Summary!: string | IStringMap;

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L35-L53
    // schema:accessMode
    @JsonProperty("accessMode")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public AccessMode!: string[];
    // 'auditory',
    // 'tactile',
    // 'textual',
    // 'visual',
    // 'chartOnVisual',
    // 'chemOnVisual',
    // 'colorDependent',
    // 'diagramOnVisual',
    // 'mathOnVisual',
    // 'musicOnVisual',
    // 'textOnVisual',

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L54-L82
    // schema:accessModeSufficient
    // NOTE: the only field that accepts comma-separated values from the enumeration,
    // but this model breaks down the original string into individual tokens.
    @JsonProperty("accessModeSufficient")
    @JsonElementType(Array)
    public AccessModeSufficient!: (string[])[];
    // 'auditory',
    // 'tactile',
    // 'textual',
    // 'visual',
    // 'chartOnVisual',
    // 'chemOnVisual',
    // 'colorDependent',
    // 'diagramOnVisual',
    // 'mathOnVisual',
    // 'musicOnVisual',
    // 'textOnVisual',

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L83-L122
    // schema:accessibilityFeature
    @JsonProperty("feature")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Feature!: string[];
    // 'alternativeText',
    // 'annotations',
    // 'audioDescription',
    // 'bookmarks',
    // 'braille',
    // 'captions',
    // 'ChemML',
    // 'describedMath',
    // 'displayTransformability',
    // 'displayTransformability/font-size',
    // 'displayTransformability/font-family',
    // 'displayTransformability/line-height',
    // 'displayTransformability/word-spacing',
    // 'displayTransformability/letter-spacing',
    // 'displayTransformability/color',
    // 'displayTransformability/background-color',
    // 'highContrastAudio',
    // 'highContrastAudio/noBackground',
    // 'highContrastAudio/reducedBackground',
    // 'highContrastAudio/switchableBackground',
    // 'highContrastDisplay',
    // 'index',
    // 'largePrint',
    // 'latex',
    // 'longDescription',
    // 'MathML',
    // 'none',
    // 'printPageNumbers', 'pageBreakMarkers', 'pageNavigation'
    // 'readingOrder',
    // 'rubyAnnotations',
    // 'signLanguage',
    // 'structuralNavigation',
    // 'synchronizedAudioText',
    // 'tableOfContents',
    // 'taggedPDF',
    // 'tactileGraphic',
    // 'tactileObject',
    // 'timingControl',
    // 'transcript',
    // 'ttsMarkup',
    // 'unlocked',

    // tslint:disable-next-line:max-line-length
    // https://github.com/readium/webpub-manifest/blob/03d7681cf1ff689bad76efaabc9c77423296a94c/schema/a11y.schema.json#L123-L138
    // schema:accessibilityHazard
    @JsonProperty("hazard")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Hazard!: string[];
    // 'flashing',
    // 'noFlashingHazard',
    // 'motionSimulation',
    // 'noMotionSimulationHazard',
    // 'sound',
    // 'noSoundHazard',
    // 'unknown',
    // 'none',
}
