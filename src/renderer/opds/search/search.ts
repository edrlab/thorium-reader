// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TOpdsLinkViewSimplified } from "readium-desktop/common/views/opds";

const findLink = (ln: TOpdsLinkViewSimplified[], type: string) => ln && ln.find((link) =>
    link.TypeLink.includes(type));

export async function getSearchUrlFromOpdsLinks(
    link: TOpdsLinkViewSimplified[] | undefined): Promise<string | undefined> {

    const atomLink = findLink(link, "application/atom+xml");
    const opensearchLink = !atomLink && findLink(link, "application/opensearchdescription+xml");

    return new Promise<string | undefined>((resolve) => {
        if (atomLink) {
            // http://examples.net/opds/search.php?q={searchTerms}
            if (atomLink.Href && atomLink.Href.includes("{searchTerms}")) {
                resolve(atomLink.Href);
            }
        } else if (opensearchLink) {
            // tslint:disable-next-line: max-line-length
            // http://examples.net/opds/search/?q={searchTerms}&author={atom:author}&translator={atom:contributor}&title={atom:title}
            const xhr = new XMLHttpRequest();
            xhr.open("GET", opensearchLink.Href);
            xhr.addEventListener("loadend", function() {
                try {
                    const dom = this.responseXML;
                    const urlsElem = dom.documentElement.querySelectorAll("url");
                    for (const urlElem of urlsElem.values()) {
                        const type = urlElem.getAttribute("type");
                        if (type && type.includes("application/atom+xml")) {
                            const searchUrl = urlElem.getAttribute("template");
                            if (searchUrl && searchUrl.includes("{searchTerms}")) {
                                let searchLink = searchUrl.replace("{atom:author}", "\"\"");
                                searchLink = searchLink.replace("{atom:contributor}", "\"\"");
                                searchLink = searchLink.replace("{atom:title}", "\"\"");
                                resolve(searchLink);
                            }
                        }
                    }
                } catch (err) {
                    resolve(undefined);
                }
            });
            xhr.addEventListener("error", () => {
                resolve(undefined);
            });
            xhr.send();
        } else {
            resolve(undefined);
        }
    });
}
