// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { matchPath } from "react-router";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";

import { decodeB64, encodeB64 } from "../../common/logics/base64";
import { IOpdsBrowse, routes } from "../routing";

export const extractParamFromOpdsRoutePathname =
    (pathname: string) =>
        matchPath<keyof IOpdsBrowse, string>(
            routes["/opds/browse"].path,
            pathname,
        ).params;

export const buildOpdsBrowserRouteWithLink =
    (pathname: string) =>
        (link: IOpdsLinkView) => {

            const param = extractParamFromOpdsRoutePathname(pathname);

            const lvl = parseInt(param.level, 10);

            const route = buildOpdsBrowserRoute(
                param.opdsId,
                decodeB64(param.name),
                link.url,
                lvl,
            );

            return route;
        };

/**
 * formating opds browser route to react-router route
 * @param rootFeedIdentifier identifier from opdsId IOpdsBrowse react-router
 * @param title title of opds feed
 * @param url url of the current access ressource (Navigation or Publication)
 * @param level current level of last url,
 *  ex: catalog/fb/free-books/last from breadcrumb = level 3
 */
export function buildOpdsBrowserRoute(
    rootFeedIdentifier: string,
    title: string,
    url: string,
    level?: number,
) {
    if (level == null) {
        level = 1;
    }
    const route = `/opds/${rootFeedIdentifier}/browse/` + level
        + `/${encodeB64(title)}/${encodeB64(url)}`;

    return route;
}

export function parseOpdsBrowserRoute(route: string) {
    // Parse route with regexp
    // tslint:disable-next-line:max-line-length
    const regexp = /\/opds\/([a-zA-Z0-9-=]+)\/browse\/([0-9]+)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/g;
    const match = regexp.exec(route);

    if (match == null) {
        return null;
    }

    const rootFeedIdentifier = match[1];
    const level = parseInt(match[2], 10);
    const title = decodeB64(match[3]);
    const url = decodeB64(match[4]);

    return {
        rootFeedIdentifier,
        title,
        url,
        level,
    };
}

export type TParseOpdsBrowserRoute = ReturnType<typeof parseOpdsBrowserRoute>;
