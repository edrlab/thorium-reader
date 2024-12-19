// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { shell } from "electron";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { decodeB64 } from "readium-desktop/renderer/common/logics/base64";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { TDispatch } from "readium-desktop/typings/redux";
import { parseContentType } from "readium-desktop/utils/contentType";

import { Location } from "history";

import { dispatchHistoryPush, IRouterLocationState } from "../routing";
import { extractParamFromOpdsRoutePathname } from "./route";

const REL_NAVIGATION_TYPES: string[] = [
    "http://librarysimplified.org/terms/rel/revoke",
];

export const dispatchOpdsLink =
    (dispatch: TDispatch) =>
        async (ln: IOpdsLinkView, location: Location, title?: string) => {

            dispatch(dialogActions.closeRequest.build());

            const contentType = parseContentType(ln.type);
            if (
                contentType ||
                REL_NAVIGATION_TYPES.includes(ln.rel)
            ) {

                const param = extractParamFromOpdsRoutePathname(location.pathname);

                const lvl = parseInt(param.level, 10);
                const newLvl = lvl === 1 ? 3 : (lvl + 1);

                const route = buildOpdsBrowserRoute(
                    param.opdsId,
                    title ? title : decodeB64(param.name),
                    ln.url, // this.props.headerLinks?.self
                    newLvl,
                );

                dispatchHistoryPush(dispatch)({
                    ...location,
                    pathname: route,
                    // state: {} // we preserve the existing route state
                }, location.state as IRouterLocationState);
            } else {
                await shell.openExternal(ln.url);
            }
        };
