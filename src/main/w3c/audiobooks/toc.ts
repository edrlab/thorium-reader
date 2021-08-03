/**
 * Table of Content extraction.
 *
 * (As defined in
 * [§C.3 of the Publication Manifest](https://www.w3.org/TR/pub-manifest/#app-toc-ua)).
 *
 * The function follows, as far as possible, the names used in the specification.
 *
 * The main entry of the module is: [[generate_TOC]]
 *
 */

// tslint:disable: variable-name
// tslint:disable: max-line-length

import * as debug_ from "debug";
import { JSDOM } from "jsdom";

import { Link } from "@r2-shared-js/models/publication-link";

import { w3cPublicationManifestToReadiumPublicationManifest } from "./converter";

export interface TocEntry {
    name: string;
    url: string;
    type: string;
    rel: string[];
    entries: TocEntry[];
}

export interface ToC {
    name: string;
    entries: TocEntry[];
}

// Logger
const debug = debug_("readium-desktop:main#w3c/audiobooks/toc");

// will be mapped to R2Publicaiton Link[]

const toc_query_selector = "*[role*=\"doc-toc\"]";

/** Sectioning Content Elements, see as specified by the [html spec](https://html.spec.whatwg.org/multipage/dom.html#sectioning-content-2) */
const sectioning_content_elements: string[] = ["ARTICLE", "ASIDE", "NAV", "SECTION"];

/** Sectioning Root Elements, as specified by the [html spec](https://html.spec.whatwg.org/multipage/sections.html#sectioning-root) */
const sectioning_root_elements: string[] = ["BLOCKQUOTE", "BODY", "DETAILS", "DIALOG", "FIELDSET", "FIGURE", "TD"];

/** Per specification, Sectioning elements are skipped, see step 4.7 */
const skipped_elements: string[] = [...sectioning_content_elements, ...sectioning_root_elements];

/** Heading Content elements, as specified by the [html spec](https://html.spec.whatwg.org/multipage/dom.html#heading-content-2) */
const heading_content_elements: string[] = ["H1", "H2", "H3", "H4", "H5", "H6", "HGROUP"];

/** List elements, as specified by the [spec](https://www.w3.org/TR/pub-manifest/#dfn-list-element) */
const list_elements: string[] = ["UL", "OL"];

/** List item elements, as specified by the [html spec](https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element) */
const list_item_elements: string[] = ["LI"];

/** Anchor elements, as specified by the [html spec](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element) */
const anchor_elements: string[] = ["A"];

/** Internal type to control the exact flow in [[core_element_cycle]] */
enum traverse {
    skip,
    proceed,
}

/**
 * Depth-first traversal of a DOM tree. For each child element:
 *
 * 1. it calls the `enter` function, which also returns a [[traverse]] value
 * 2. unless the result of the previous step is to exit right away, goes down to the children recursively
 * 3. calls the `exit` function
 *
 * All these actions happen on elements that are of interest for the process. If that is not the case, just go to children without entering `enter` and `exit`.
 *
 * @param element - element to handle
 * @param enter - 'enter element' call-back
 * @param exit - 'exit element' call-back
 */
function core_element_cycle(element: HTMLElement, enter: ((entry: HTMLElement) => traverse), exit: ((entry: HTMLElement) => void)): void {
    element.childNodes.forEach((child) => {
        const childE = child as HTMLElement;
        if (enter(childE) === traverse.proceed) {
            core_element_cycle(childE, enter, exit);
            exit(childE);
        }
    });
}

/**
 * Get the text content of an element.
 * The spec gives a choice between using the text content of an element or
 * the result of doing an accessible name calculation. For now, simply do the
 * former.
 *
 * Also, in all cases the function is called, the assignment of the result is `null` instead of an empty string, so this is returned.
 *
 * @param element - element whose text content is collected
 * @return - text content, null if the text is empty
 */
function text_content(element: HTMLElement): string {
    const txt = element.textContent;
    return (txt === "") ? null : txt;
}

/**
 * Extract the Table of Content data from the HTML source.
 *
 * This is the implementation of the core [§C.3 User Agent Processing algorithm](https://www.w3.org/TR/pub-manifest/#app-toc-ua) of the specification.
 *
 * @param toc_element - the DOM element to extract the data from
 * @param manifest - the (already processed) publication manifest
 * @returns - the Table of Content structure; if there are no valid entries, the function returns `null`
 */
function extract_TOC(toc_element: HTMLElement, uniqueResources: Link[]): ToC {
    // The real 'meat' is in the six functions below; each one represent the entry
    // (or entry/exit pair, if applicable) corresponding to the various entries under
    // step 4. in the algorithm of C.3.
    // The invocation of these functions is done (recursively) via [[core_element_cycle]],
    // started, at the top level, at the end of this function.
    const enter_heading_content = (entry: HTMLElement): traverse => {
        // Step 4.1
        if (toc.name === "" && branches.length === 0) {
            // this will return null instead of the empty string as defined in the spec
            toc.name = text_content(entry);
        }
        return traverse.skip;
    };

    // Step 4.2
    const enter_list_element = (_entry: HTMLElement): traverse => {
        // Step 4.2.1.
        if (toc.name === "") { toc.name = null; }

        if (current_toc_node !== null) {
            // Step 4.2.2.
            if (current_toc_node.entries === null || current_toc_node.entries.length !== 0) {
                return traverse.skip;
            } else {
                branches.push(current_toc_node);
                current_toc_node = null;
            }
        } else if (branches.length === 0) {
            // Step 4.2.3.
            if (toc.entries === null || toc.entries.length !== 0) {
                return traverse.skip;
            }
        }
        return traverse.proceed;
    };

    // Step 4.3
    const exit_list_element = (_entry: HTMLElement) => {
        if (branches.length !== 0) {
            current_toc_node = branches.pop();
        } else if (toc.entries.length === 0) {
            toc.entries = null;
        }
    };

    // Step 4.4
    const enter_list_item_element = (_entry: HTMLElement): traverse => {
        current_toc_node = {
            name: null,
            url: null,
            type: null,
            rel: null,
            entries: [],
        };
        return traverse.proceed;
    };

    // Step 4.5
    const exit_list_item_element = (_entry: HTMLElement) => {
        // Step 4.5.1
        if (current_toc_node.entries.length === 0) {
            current_toc_node.entries = null;
        }

        // Step 4.5.2
        if (current_toc_node.name === null || current_toc_node.name === "") {
            if (current_toc_node.entries !== null) {
                current_toc_node.name = null;
            } else {
                current_toc_node = null;
                return;
            }
        }

        // Step 4.5.3
        if (branches.length !== 0) {
            branches[branches.length - 1].entries.push(current_toc_node);
        } else {
            toc.entries.push(current_toc_node);
        }

        current_toc_node = null;
    };

    // Step 4.6
    const enter_anchor_element = (entry: HTMLElement): traverse => {
        if (current_toc_node !== null) {
            // Step 4.6.1
            if (current_toc_node.name !== null) {
                return traverse.skip;
            } else {
                // Step 4.6.2.1
                // the function returns null instead of an empty string, as required by the spec
                current_toc_node.name = text_content(entry);

                const anchor: HTMLAnchorElement = entry as HTMLAnchorElement;

                // Step 4.6.2.2
                // Note that, by this step, the HTML parser has already turned the relative URL into an absolute one!
                // Also check that the URL is part of the resources listed in the manifest
                const url = anchor.hasAttribute("href") ? anchor.href : undefined;
                if (url) {
                    current_toc_node.url = null;

                    try {

                        let parsedUrl = url;
                        if (/http[s]?:\/\//.test(url)) {

                            const parsedUrlObj = new URL(url);
                            parsedUrlObj.hash = "";
                            parsedUrl = parsedUrlObj.toString();
                        }

                        if (uniqueResources.findIndex((l) => l.Href === parsedUrl)) {
                            current_toc_node.url = url;
                        } else {
                            debug(`The ToC reference "${url}" does not appear in the resources listed in the manifest.`);
                            current_toc_node.url = null;
                        }

                    } catch (e) {
                        debug("error to parse URL:", url, e);
                        current_toc_node.url = null;
                    }
                }

                // Step 4.6.2.3
                current_toc_node.type = anchor.hasAttribute("type") ? anchor.type.trim() : null;

                // Step 4.6.2.4
                if (anchor.hasAttribute("rel")) {
                    const rel = anchor.rel.trim().split(" ");
                    current_toc_node.rel = (rel.length !== 0) ? rel : null;
                } else {
                    current_toc_node.rel = null;
                }
            }
        }
        return traverse.skip;
    };

    // "Universal" entry, branching off to the individual steps based on the element tags
    const enter_element = (entry: HTMLElement): traverse => {
        if (heading_content_elements.includes((entry.tagName))) {
            // Step 4.1
            return enter_heading_content(entry);
        } else if (list_elements.includes(entry.tagName)) {
            // Step 4.2
            return enter_list_element(entry);
        } else if (list_item_elements.includes(entry.tagName)) {
            // Step 4.4
            return enter_list_item_element(entry);
        } else if (anchor_elements.includes(entry.tagName)) {
            // Step 4.6
            return enter_anchor_element(entry);
        } else if (skipped_elements.includes(entry.tagName) || entry.hidden === true) {
            // Step 4.7
            return traverse.skip;
        } else {
            // Step 4.8
            return traverse.proceed;
        }
    };

    // "Universal" exit, branching off to the individual steps based on the element tags
    const exit_element = (entry: HTMLElement) => {
        if (list_elements.includes(entry.tagName)) {
            // Step 4.3
            exit_list_element(entry);
        } else if (list_item_elements.includes(entry.tagName)) {
            // Step 4.5
            exit_list_item_element(entry);
        }
        // Step 4.8
    };

    // --- The real processing

    // Initializations (steps 1, 2, 3)
    const toc: ToC = {
        name: "",
        entries: [],
    };
    const branches: TocEntry[] = [];
    let current_toc_node: TocEntry = null;

    // Top level of step 4: depth first traversal of the nav element with the enter/exit functions above
    core_element_cycle(toc_element, enter_element, exit_element);

    // Step 5: Return either a real ToC or undefined...
    return toc;

}

function tocToTocLink(toc: ToC): Link[] {

    const entriesToTocLink = (entries: TocEntry[]) => {
        if (Array.isArray(entries)) {
            return entries.map((entry) => {
                const ln = new Link();

                if (entry.name) {
                    ln.Title = entry.name;
                }
                if (entry.url) {
                    ln.Href = entry.url;
                }
                if (entry.type) {
                    ln.TypeLink = entry.type;
                }
                if (entry.rel) {
                    ln.Rel = entry.rel;
                }
                if (entry.entries) {
                    ln.Children = entriesToTocLink(entry.entries);
                }

                return ln;
            });
        }

        return [];
    };

    const list = entriesToTocLink(toc.entries);
    if (toc.name) {
        const l = new Link();
        l.Title = toc.name;
        l.Children = list;

        return [l];
    }
    return list;
}

export function htmlTocToLinkArray(tocElement: HTMLElement, uniqueResources: Link[]) {

    const toc = extract_TOC(tocElement, uniqueResources);

    const tocLink = tocToTocLink(toc);

    return tocLink;
}

export async function findHtmlTocInRessources(
    uniqueResources: Link[],
    fetcher: (fileName: string) => Promise<Buffer> | Buffer,
    ): Promise<HTMLElement> {

    const ln = uniqueResources.find((l) => Array.isArray(l.Rel) ? l.Rel.includes("contents") : false);

    if (ln && ln.Href) {

        try {

            // const stream = await extractFileFromZip(lpfPath, ln.Href);
            const buffer = await Promise.resolve(fetcher(ln.Href));
            if (!buffer) {
                return undefined;
            }
            // const buffer = await streamToBufferPromise(stream);
            const text = buffer.toString("utf8");

            try {

                const { window } = new JSDOM(text);
                const el = window.document.querySelector<HTMLElement>(toc_query_selector);
                return el;

            } catch (e) {
                debug("error to parse html", e);
            }
        } catch (e) {
            debug("error to extract html from lpf", e);
        }

    }

    return undefined;
}

// /**
//  * Extract the ToC, if available, via the manifest information. This is the implementation of
//  * the [§C.3 User Agent Processing algorithm](https://www.w3.org/TR/pub-manifest/#app-toc-ua) of the specification: after finding the relevant element
//  * that is supposed to contain the ToC, the heavy lifting is done in [[extract_TOC]].
//  *
//  * The function is asynchronous because, possibly, the HTML resource, containing the ToC, must be fetched.
//  *
//  * @async
//  * @param manifest - the processed manifest
//  */
// export async function generate_TOC(manifest: R2Publication): Promise<ToC> {
//     const locate_toc_element = async (): Promise<HTMLElement> => {
//         const linked_resources = (manifest.resources) ? [...manifest.readingOrder, ...manifest.resources] : manifest.readingOrder;
//         const resource: IW3cLinkedResources = linked_resources.find((link) => (link.rel && link.rel.includes("contents")));

//         if (resource !== undefined && resource.url !== "") {
//             const parsed = urlHandler.parse(resource.url);
//             delete parsed.hash;
//             const absolute_url = urlHandler.format(parsed);

//             /* TODO: There can be an optimization step here: if the Global document url is the same as this absolute url, then there is no reason to go through another fetch */

//             // Try to get hold of the HTML resource
//             let html_dom: Document = null;
//             try {
//                 const dom = await fetch_html(absolute_url);
//                 html_dom = dom.window.document;
//             } catch (e) {
//                 Global.logger.log_light_validation_error(`Problems fetching ToC resource (${e.message})`);
//                 return null;
//             }

//             const nav: HTMLElement = html_dom.querySelector(toc_query_selector);
//             if (nav !== null) {
//                 return nav;
//             } else {
//                 Global.logger.log_light_validation_error(`ToC entry in ${resource.url} not found`);
//                 return null;
//             }
//         } else {
//             return null;
//         }
//     };

//     const toc_element = await locate_toc_element();
//     return toc_element !== null ? extract_TOC(toc_element, manifest) : null;
// }

// TEST
if (require.main === module) {

    const { window } = new JSDOM(`<!DOCTYPE html>
        <html>
        <head>
            <title>Entry point with linked manifest, with a local TOC</title>
            <link rel="publication" href="link_4.2.02.jsonld" />
        </head>
        <body>
            <p>This is just a fake entry point with a fake TOC.</p>
            <nav role="doc-toc">
                <h2>Minimal Table of content</h2>
                <ol role="doc-toc">
                    <li>

<a href="http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3">

                    <a href="http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3">Flatland 1</li>
<li><a href="http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3">Flatland 2</li>
<li><a href="http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3">Flatland 3</li>
                </ol>
            </nav>
        </body>
        </html>`);

    const el = window.document.querySelector<HTMLElement>(toc_query_selector);

    const w3cManifest = `
    {
        "@context": [
            "https://schema.org",
            "https://www.w3.org/ns/pub-context"
        ],
        "conformsTo": "https://www.w3.org/TR/audiobooks/",
        "type": "Audiobook",
        "id": "https://librivox.org/flatland-a-romance-of-many-dimensions-by-edwin-abbott-abbott/",
        "url": "https://w3c.github.io/pub-manifest/experiments/audiobook/",
        "name": "Flatland: A Romance of Many Dimensions",
        "author": "Edwin Abbott Abbott",
        "readBy": "Ruth Golding",
        "inLanguage": "en",
        "dateModified": "2019-11-14",
        "datePublished": "2008-10-12",
        "duration": "PT1371S",
        "abridged": false,
        "accessMode": "audio",
        "accessModeSufficient": [{
            "type": "ItemList",
            "itemListElement": ["audio"],
            "description": "Audio"
        }],
        "accessibilityFeature": ["readingOrder", "unlocked"],
        "accessibilityHazard": "noSoundHazard",
        "accessibilitySummary": "This is just a test summary",
        "readingProgression": "ltr",
        "resources": [
        {
            "rel": "cover",
            "url": "http://ia800704.us.archive.org/9/items/LibrivoxCdCoverArt12/Flatland_1109.jpg",
            "encodingFormat": "image/jpeg",
            "name": "Cover page with title and author"
        },
        "./a4.2.02.html"
        ],
        "readingOrder": [
        {
            "url": "http://www.archive.org/download/flatland_rg_librivox/flatland_1_abbott.mp3",
            "encodingFormat": "audio/mpeg",
            "duration": "PT1371S",
            "name": "Part 1, Sections 1 - 3"
        }
        ]
    }
    `;

    const manifestParsed = JSON.parse(w3cManifest);
    // tslint:disable-next-line: no-floating-promises
    w3cPublicationManifestToReadiumPublicationManifest(manifestParsed, (uniqueResources) => {
        const toc = extract_TOC(el, uniqueResources);

        console.log("TOC");
        console.log(toc);

        const tocLink = tocToTocLink(toc);
        console.log("TOC In Link");
        console.log(tocLink);

        return undefined;

    });

}
