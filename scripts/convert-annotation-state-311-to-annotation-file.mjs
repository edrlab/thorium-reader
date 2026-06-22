
// https://github.com/edrlab/thorium-reader/issues/3472

// From Thorium-reader 3.1.x state to Readium annotation set .annotation

import * as crypto from "node:crypto";

const uuidv4 = () =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );

const normalizeString = (str) => {
    return str
        .normalize("NFKD")
        .replace(/\s+/g, " ") // collapse contiguous whitespace into single space
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\./g, "-")
        .toLowerCase();
};

export const NOTE_PINK_COLOR = "#EB9694";
export const NOTE_ORANGE_COLOR = "#FAD0C3";
export const NOTE_YELLOW_COLOR = "#FEF3BD";
export const NOTE_GREEN_COLOR = "#C1EAC5";
export const NOTE_BLUE_COLOR = "#BED3F3";
export const NOTE_PURPLE_COLOR = "#D4C4FB";


export const noteColorCodeToColorSet = {
    [NOTE_PINK_COLOR]: "pink",
    [NOTE_ORANGE_COLOR]: "orange",
    [NOTE_YELLOW_COLOR]: "yellow",
    [NOTE_GREEN_COLOR]: "green",
    [NOTE_BLUE_COLOR]: "blue",
    [NOTE_PURPLE_COLOR]: "purple",
};

export function rgbToHex(color/*: { red: number; green: number; blue: number }*/)/*: string*/ {
    const { red, green, blue } = color;
    const redHex = Math.min(255, Math.max(0, red)).toString(16).padStart(2, "0");
    const greenHex = Math.min(255, Math.max(0, green)).toString(16).padStart(2, "0");
    const blueHex = Math.min(255, Math.max(0, blue)).toString(16).padStart(2, "0");
    return `#${redHex}${greenHex}${blueHex}`.toUpperCase();
}

export function convertAnnotationStateToReadiumAnnotation(note/*: INoteState*/)/*: IReadiumAnnotation*/ {

    const { uuid, color, locatorExtended, tags, drawType, textualValue, creator, created, modified, readiumAnnotation } = note;
    const highlight = (drawType === "solid_background" ? "solid" : drawType);
    const isABookmark = drawType === "bookmark"

    if (!locatorExtended) {
        console.error("Convert A Note without any locator !!!", note.uuid);
    }

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid ? "urn:uuid:" + uuid : "",
        created: created ? (new Date(created)).toISOString() : (new Date()).toISOString(),
        modified: modified ? new Date(modified).toISOString() : undefined,
        type: "Annotation",
        body: {
            type: "TextualBody",
            value: textualValue || "",
            format: "text/plain",
            color: color ? noteColorCodeToColorSet[rgbToHex(color)] || NOTE_DEFAULT_COLOR : NOTE_DEFAULT_COLOR,
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
            selector: [
                {
                    type: "CfiSelector",
                    value: locatorExtended?.selectionInfo?.rangeInfo?.cfi
                        || locatorExtended?.locator?.locations?.rangeInfo?.cfi
                        || locatorExtended?.locator?.locations?.cfi
                        || "",
                }
            ],
        },
        motivation: isABookmark ? "bookmarking" : "highlighting", // isABookmark = drawType === EDrawType.bookmark
    };
}

export function convertAnnotationStateArrayToReadiumAnnotationSet(locale, notes /*: INoteState[]*/, identifier, title, label = "") /*: IReadiumAnnotationSet*/ {

    const currentDate = new Date();
    const dateString = currentDate.toISOString();
    // const iLcp = !!publicationView.lcp;

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: "urn:uuid:" + uuidv4(),
        type: "AnnotationSet",
        // generator: {
        //     id: "https://github.com/edrlab/thorium-reader/releases/tag/v" + _APP_VERSION,
        //     type: "Software",
        //     name: _APP_NAME + " " + _APP_VERSION,
        //     homepage: "https://thorium.edrlab.org",
        // },
        generated: dateString,
        title: label || "Annotations set",
        about: {
            "dc:identifier": ["urn:thorium:" + identifier],
            "dc:format": "application/epub+zip",
            "dc:title": title || "",
            // "dc:publisher": publicationView.publishersLangString ?
            //     publicationView.publishersLangString.map((item) => {
            //         return convertMultiLangStringToString(item, locale);
            //     }) : [],
            // "dc:creator": publicationView.authorsLangString ?
            //     publicationView.authorsLangString.map((item) => {
            //         return convertMultiLangStringToString(item, locale);
            //     }) : [],
            // "dc:date": publicationView.publishedAt || "",
        },
        items: notes.map((v) => convertAnnotationStateToReadiumAnnotation(v)),
    };
}



import * as fs from "node:fs";
import * as path from "node:path";

let state;
const fileArg = process.argv[2];
console.log("file:", fileArg);
if (!fileArg) process.exit(1);
const filePath = path.resolve(fileArg);
console.log(filePath);

try {
    const data = fs.readFileSync(filePath, 'utf8');
    state = JSON.parse(data);
    console.log("typeof state=", typeof state);
    if (typeof state !== "object") {
        process.exit(1);
    }

} catch (err) {
    console.error('Error reading or parsing JSON:', err);
    process.exit(1);
}

const readers = state.win.registry.reader;


console.log("START");

for (const [id, reader] of Object.entries(readers)) {

    console.log(id);
    if (Array.isArray(reader?.reduxState?.annotation)) {
        
        // From thorium-reader 3.1.x state version
        const notes = reader?.reduxState?.annotation.map((v) => ({ uuid: v[0], ...(v[1] || {}) }));
        // TODO: reader?.reduxState?.bookmark are not migrated to notes
        
        const title = state?.publication?.db[id]?.title;

        const readiumAnnotationSet = convertAnnotationStateArrayToReadiumAnnotationSet("en", notes, id, title || "");
        const exportFilePath = path.resolve(path.dirname(filePath), `${title ? normalizeString(title) : id}.annotation`);
        fs.writeFileSync(exportFilePath, JSON.stringify(readiumAnnotationSet));
        console.log("Annotation set written to", exportFilePath);
    }

}

console.log("END");