// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";

import {
    CSS_CLASS_NO_FOCUS_OUTLINE, FOOTNOTES_CONTAINER_CLASS, ROOT_CLASS_NO_FOOTNOTES,
} from "../../common/styles";
import { PopupDialog } from "../common/popup-dialog";

import { removeUTF8BOM } from "@r2-utils-js/_utils/bom";

// import {
//     READIUM2_ELECTRON_HTTP_PROTOCOL, convertCustomSchemeToHttpUrl,
// } from "../../common/sessions";

export async function popupFootNote(
    element: HTMLElement,
    focusScrollRaw:
        (el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => void,
    href: string,
    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: () => number,
    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: (val: number) => void,
): Promise<boolean> {

    let documant = element.ownerDocument as Document;

    if (!documant.documentElement ||
        documant.documentElement.classList.contains(ROOT_CLASS_NO_FOOTNOTES)) {
        return false;
    }

    let epubType = element.getAttribute("epub:type");
    if (!epubType) {
        epubType = element.getAttributeNS("http://www.idpf.org/2007/ops", "type");
        if (!epubType) {
            epubType = element.getAttribute("role");
        }
    }
    if (!epubType) {
        return false;
    }
    epubType = epubType.trim().replace(/\s\s+/g, " "); // whitespace collapse


    // epubType.indexOf("biblioref") >= 0 ||
    // epubType.indexOf("glossref") >= 0 ||
    // epubType.indexOf("annoref") >= 0
    const isNoteref = epubType.indexOf("noteref") >= 0 // this includes doc-* below
        // || epubType.indexOf("doc-noteref") >= 0
    ;
    if (!isNoteref) {
        return false;
    }

    const url = new URL(href,
        // edge case: SVG a@href animVal doesn't automatically resolve full absolute URL
        href.startsWith("#") ? documant.location.href : undefined);
    if (!url.hash) { // includes #
        return false;
    }

    const hrefSelf = documant.location.href;
    // if (hrefSelf.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
    //     hrefSelf = convertCustomSchemeToHttpUrl(hrefSelf);
    // }
    const urlSelf = new URL(hrefSelf);
    if (urlSelf.protocol !== url.protocol ||
        urlSelf.origin !== url.origin) {

        return false;
    }

    if (urlSelf.pathname !== url.pathname) {
        try {
            const res = await fetch(href);
            const txt = await res.text();
            const domparser = new DOMParser();
            documant = domparser.parseFromString(
                removeUTF8BOM(txt),
                "application/xhtml+xml");

            const aNodeList = documant.querySelectorAll("a[href]");

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < aNodeList.length; i++) {
                const aNode = aNodeList[i];
                const href = aNode.getAttribute("href");
                if (!href
                    // || !href.startsWith(".")
                    || href.startsWith("/")
                    || href.startsWith("data:")
                    || /^https?:\/\//.test(href)) {
                    continue;
                }

                // HTMLLinkElement
                // let linkHref = (aNode as HTMLAnchorElement | SVGAElement).href;
                // if (!linkHref) {
                //     continue;
                // }
                // if ((linkHref as SVGAnimatedString).animVal) {
                //     linkHref = (linkHref as SVGAnimatedString).animVal;

                //     if (!linkHref) {
                //         continue;
                //     }
                // }
                // const linkUrl = new URL(linkHref as string);

                // we want linkHref (full URL) expressed as path relative to urlSelf (also full URL)
                const from = path.dirname(urlSelf.pathname).replace(/\\/g, "/");
                const too = url.pathname;
                const relFromMainToNotes = path.relative(
                    from,
                    too,
                ).replace(/\\/g, "/");
                const relPath = relFromMainToNotes + "/../" + href;
                console.log(from, too, relFromMainToNotes, relPath);

                // const newUrl = new URL(linkHref as string, urlSelf);
                // console.log(
                //     href.replace(urlSelf.origin, ""),
                //     (linkHref as string).replace(urlSelf.origin, ""),
                //     (new URL(href, url)).toString().replace(urlSelf.origin, ""),
                //     newUrl.toString().replace(urlSelf.origin, ""));

                aNode.setAttribute("href", relPath);
            }

        } catch (e) {
            console.log("EPUB FOOTNOTE FETCH FAIL: " + href, e);
            return false;
        }
    }

    // ==> we're in preload here, so not streamer-injected
    // (unlike checkHiddenFootNotes() called from readium-css.ts)
    //
    // if (!documant.querySelector) { // TODO: polyfill querySelector[All]() ?
    //     return; // when streamer-injected
    // }
    // ... AND even when we fetch an external HTML document,
    // we use the webview DOM parser (not the NodeJS XML parser)

    // const targetElement = win.document.getElementById(url.hash.substr(1));
    const targetElement = documant.querySelector(url.hash); // documant.getElementById(url.substring(1));
    if (!targetElement) {
        return false;
    }

    // const existingDialog = documant.getElementById(id) as IHTMLDialogElementWithPopup;
    // if (existingDialog && existingDialog.popDialog) {
    //     existingDialog.popDialog.show(element);
    //     return true;
    // }

    let htmltxt = targetElement.innerHTML;
    if (!htmltxt) {
        return false;
    }

    htmltxt = htmltxt.replace(/xmlns=["']http:\/\/www.w3.org\/1999\/xhtml["']/g, " ");
    htmltxt = htmltxt.replace(/xmlns:epub=["']http:\/\/www.idpf.org\/2007\/ops["']/g, " ");
    // htmltxt = htmltxt.replace(/epub:type=["'][^"']+["']/g, " ");
    htmltxt = htmltxt.replace(/<script>.+<\/script>/g, " ");

    const ID_PREFIX_ = "r2-footnote-for_";
    const id_ = ID_PREFIX_ + targetElement.id;
    // htmltxt = htmltxt.replace(/id=["'][^"']+["']/, `id="${id_}"`);
    htmltxt = htmltxt.replace(/id=["']([^"']+)["']/g, "idvoid=\"$1\""); // remove duplicate IDs

    // CSS display:none
    // htmltxt = htmltxt.replace(/<a ... (role=["'][^"']*doc-backlink[^"']*["'] .... <\/a>)/g, "<!-- removed backlink -->"); // remove backlinks

    // tslint:disable-next-line:max-line-length
    htmltxt = `<div id="${id_}" class="${FOOTNOTES_CONTAINER_CLASS} ${CSS_CLASS_NO_FOCUS_OUTLINE}" tabindex="0" autofocus="autofocus">${htmltxt}</div>`;

    // htmltxt = htmltxt.replace(/click=["']javascript:.+["']/g, " ");
    // console.log(htmltxt);

    // import * as xmldom from "@xmldom/xmldom";
    // not application/xhtml+xml because:
    // https://github.com/jindw/xmldom/pull/208
    // https://github.com/jindw/xmldom/pull/242
    // https://github.com/xmldom/xmldom/blob/3db6ccf3f7ecbde73608490d71f96c727abdd69a/lib/dom-parser.js#L12
    // https://github.com/xmldom/xmldom/blob/0.9.3/lib/dom-parser.js#L220
    // https://github.com/xmldom/xmldom/blob/0.9.3/index.d.ts#L24
    // https://github.com/xmldom/xmldom/blob/0.9.3/index.d.ts#L99
    // const dom = new xmldom.DOMParser().parseFromString(htmltxt, "application/xhtml+xml"); // "application/xhtml"

    // const payload_: IEventPayload_R2_EVENT_LINK_FOOTNOTE = {
    //     hash: url.hash,
    //     html: htmltxt,
    //     url: href,
    // };
    // ipcRenderer.sendToHost(R2_EVENT_LINK_FOOTNOTE, payload_);

    const val = ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable();

    function onDialogClosed(_thiz: PopupDialog, el: HTMLOrSVGElement | null) {

        if (el) {
            focusScrollRaw(el, true, true, undefined);
        } else {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }

        setTimeout(() => {
            pop.dialog.remove();
        }, 50);
    }
    const pop = new PopupDialog(element.ownerDocument as Document, htmltxt, onDialogClosed);
    pop.show(element);

    return true;
}
