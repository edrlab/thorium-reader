// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { matchPath, useLocation } from "react-router-dom";
import { isPublicationNotesViewSort } from "readium-desktop/common/publication-notes";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionToggleMenu } from "readium-desktop/renderer/reader/redux/actions";
import {
    isReaderMenuRouteGroup,
    readerMenuRoutePattern,
} from "readium-desktop/renderer/reader/routing";

export const ReaderMenuRouteController: React.FC = () => {

    const dispatch = useDispatch();
    const location = useLocation();

    React.useEffect(() => {
        const match = matchPath<"group" | "uuid", string>(
            readerMenuRoutePattern,
            location.pathname,
        );
        const group = match?.params.group;
        const uuid = match?.params.uuid;
        if (!isReaderMenuRouteGroup(group) || !uuid) {
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const edit = searchParams.get("edit") === "1";
        const sortSearchParam = searchParams.get("sort");
        const sort = isPublicationNotesViewSort(sortSearchParam) ? sortSearchParam : undefined;
        dispatch(readerLocalActionToggleMenu.build({
            open: true,
            section: group === "annotation" ? "tab-annotation" : "tab-bookmark",
            id: uuid,
            edit,
            sort,
            focusRequestId: location.key || `${location.pathname}${location.search}`,
        }));
    }, [dispatch, location.key, location.pathname, location.search]);

    return null;
};
