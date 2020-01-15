// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { shell } from "electron";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/opds/route";
import { TDispatch } from "readium-desktop/typings/redux";
import { ContentType } from "readium-desktop/utils/content-type";

import { dispatchHistoryPush, TLocation } from "../routing";
import { decodeB64 } from "../tools/base64";
import { extractParamFromOpdsRoutePathname } from "./route";

export const dispatchOpdsLink =
    (dispatch: TDispatch) =>
        (ln: IOpdsLinkView, location: TLocation, title?: string | undefined) => {

            dispatch(dialogActions.closeRequest.build());

            if (ln.type === ContentType.Opds2 ||
                ln.type === ContentType.Opds2Auth ||
                ln.type === ContentType.Opds2Pub ||
                ln.type === ContentType.AtomXml) {

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
                });
            } else {
                shell.openExternal(ln.url);
            }
        };
