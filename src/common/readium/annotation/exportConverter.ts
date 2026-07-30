// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import { IReadiumAnnotation, IReadiumAnnotationSet } from "./annotationModel.type";
import { uuidv4 } from "readium-desktop/utils/uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { rgbToHex } from "readium-desktop/common/rgb";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import {
    NOTE_DEFAULT_COLOR,
    noteColorCodeToColorSet,
    type PublicationNote,
} from "readium-desktop/common/publication-notes";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { EDrawType } from "readium-desktop/common/type/note.type";

// Logger
const debug = debug_("readium-desktop:common:readium:annotation:exportConverter");

export function convertAnnotationStateToReadiumAnnotation(note: PublicationNote): IReadiumAnnotation | undefined {

    const { uuid, color, locatorExtended, tags, drawType, textualValue, creator, created, modified, readiumAnnotation } = note;
    const highlight = (drawType === EDrawType.solid_background ? "solid" : EDrawType[drawType]) as IReadiumAnnotation["body"]["highlight"];
    const isABookmark = drawType === EDrawType.bookmark;

    // PDF annotations currently store their target in `note.pdfAnnotation`.
    // Do not serialize them as Readium annotations until there is an explicit
    // PDF page/rectangle target mapping.
    if (note.pdfAnnotation) {
        debug("Skip PDF annotation during Readium annotation export", note.uuid);
        return undefined;
    }

    if (!locatorExtended) {
        debug("Convert A Note without any locator !!!", note.uuid);
    }

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid ? "urn:uuid:" + uuid : "",
        created: new Date(created).toISOString(),
        modified: modified ? new Date(modified).toISOString() : undefined,
        type: "Annotation",
        body: {
            type: "TextualBody",
            value: textualValue || "",
            format: "text/plain",
            color: noteColorCodeToColorSet[rgbToHex(color)] || NOTE_DEFAULT_COLOR,
            tag: (tags || [])[0] || "",
            highlight,
            //   textDirection: "ltr",
            //   language: "fr",
        },
        creator: creator?.urn ? {
            id: creator.urn,
            name: creator.name || "",
            type: creator.type,
        } : undefined,
        target: {
            source: locatorExtended?.locator.href || "",
            meta: (locatorExtended?.headings || locatorExtended?.epubPage) ? {
                headings: locatorExtended?.headings ? locatorExtended.headings.map(({ txt, level }) => ({ txt, level })) : undefined,
                page: locatorExtended?.epubPage || undefined,
            } : undefined,
            selector: readiumAnnotation?.export?.selector || [],
        },
        motivation: isABookmark ? "bookmarking" : "highlighting", // isABookmark = drawType === EDrawType.bookmark
    };
}

export function convertAnnotationStateArrayToReadiumAnnotationSet(locale: keyof typeof availableLanguages, notes: PublicationNote[], publicationView: PublicationView, label?: string): IReadiumAnnotationSet {

    const currentDate = new Date();
    const dateString: string = currentDate.toISOString();
    // const iLcp = !!publicationView.lcp;

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: "urn:uuid:" + uuidv4(),
        type: "AnnotationSet",
        generator: {
            id: "https://github.com/edrlab/thorium-reader/releases/tag/v" + _APP_VERSION,
            type: "Software",
            name: _APP_NAME + " " + _APP_VERSION,
            homepage: "https://www.thoriumreader.com/",
        },
        generated: dateString,
        title: label || "Annotations set",
        about: {
            "dc:identifier": ["urn:thorium:" + publicationView.identifier, publicationView.workIdentifier ? publicationView.workIdentifier : ""], // TODO workIdentifier urn ?
            "dc:format": "application/epub+zip",
            "dc:title": publicationView.documentTitle || "",
            "dc:publisher": publicationView.publishersLangString ?
                publicationView.publishersLangString.map((item) => {

                    const textObj = item;
                    const pubLangs = publicationView.languages;
                    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;

                    return convertMultiLangStringToString(textObj_, locale);
                }) : [],
            "dc:creator": publicationView.authorsLangString ?
                publicationView.authorsLangString.map((item) => {

                    const textObj = item;
                    const pubLangs = publicationView.languages;
                    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;

                    return convertMultiLangStringToString(textObj_, locale);
                }) : [],
            "dc:date": publicationView.publishedAt || "",
        },
        items: notes.reduce<IReadiumAnnotation[]>((items, note) => {
            const readiumAnnotation = convertAnnotationStateToReadiumAnnotation(note);
            if (readiumAnnotation) {
                items.push(readiumAnnotation);
            }
            return items;
        }, []),
    };
}
