// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TOpdsLinkViewSimplified } from "readium-desktop/common/views/opds";
import * as request from "request";

const findLink = (ln: TOpdsLinkViewSimplified[], type: string) => ln && ln.find((link) =>
    link.TypeLink.includes(type));

// tslint:disable-next-line: max-line-length
// http://examples.net/opds/search/?q={searchTerms}&author={atom:author}&translator={atom:contributor}&title={atom:title}
const getOpenSearchUrl = async (opensearchLink: TOpdsLinkViewSimplified) =>
new Promise<string | undefined>((resolve) => {
    // request from node on the browserWindows
    // xmlHttpRequest doesn't work because of CORS
    request(opensearchLink.Href, (err, _response, body) => {
        if (err) {
            resolve(undefined);
        }
        try {
            const xmlDom = (new DOMParser()).parseFromString(body, "text/xml");
            const urlsElem = xmlDom.documentElement.querySelectorAll("Url");

            for (const urlElem of urlsElem.values()) {
                const type = urlElem.getAttribute("type");

                if (type && type.includes("application/atom+xml")) {
                    const searchUrl = urlElem.getAttribute("template");
                    const url = new URL(searchUrl);

                    if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {

                        // remove search filter not handle yet
                        let searchLink = searchUrl.replace("{atom:author}", "");
                        searchLink = searchLink.replace("{atom:contributor}", "");
                        searchLink = searchLink.replace("{atom:title}", "");

                        resolve(searchLink);
                        return ;
                    }
                }
            }
        } catch (err) {
            // ignore
        } finally {
            resolve(undefined);
        }
        });
    });

const SEARCH_TERM = "{searchTerms}";

export async function getSearchUrlFromOpdsLinks(
    link: TOpdsLinkViewSimplified[] | undefined) {

    const atomLink = findLink(link, "application/atom+xml");
    const opensearchLink = !atomLink && findLink(link, "application/opensearchdescription+xml");
    const opdsLink = !opensearchLink && findLink(link, "application/opds+json");

    try {
        // http://examples.net/opds/search.php?q={searchTerms}
        if (atomLink && atomLink.Href) {
            const url = new URL(atomLink.Href);
            if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {
                return (atomLink.Href);
            }

            // http://static.wolnelektury.pl/opensearch.xml
        } else if (opensearchLink && opensearchLink.Href) {
            return (await getOpenSearchUrl(opensearchLink));

            // https://catalog.feedbooks.com/search.json{?query}
        } else if (opdsLink && opdsLink.Href) {
            const url = new URL(opdsLink.Href);
            if (url.pathname.endsWith("%7B") && url.search.includes("query")) {
                return (opdsLink.Href.split("{")[0].concat("?query={searchTerms}"));
            }
        }
    } catch {
        // ignore
    }
    return (undefined);
}
