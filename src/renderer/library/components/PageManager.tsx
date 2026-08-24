// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { logFirebaseEvent } from "readium-desktop/renderer/common/analytics/firebase";
import { routes } from "readium-desktop/renderer/library/routing";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

const LibraryRouteAnalytics: React.FC = () => {

    const location = useLocation();
    const lastScreenNameRef = React.useRef<string | undefined>();

    React.useEffect(() => {
        const screenName = location.pathname.split("/")[1] || "home";

        if (lastScreenNameRef.current === screenName) {
            return;
        }

        lastScreenNameRef.current = screenName;
        logFirebaseEvent("screen_view", {
            firebase_screen: screenName,
            firebase_screen_class: "library",
            page_path: location.pathname,
        }).catch((err) => console.log(err));
    }, [location.pathname]);

    return <></>;
};

interface IState {
    activePage: number;
}

export default class PageManager extends React.Component<{}, IState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            activePage: 0,
        };
    }

    public render(): React.ReactElement<{}> {
        return (
            <>
                <LibraryRouteAnalytics />
                <Routes>
                    {
                        ObjectKeys(routes).map(
                            (path) =>
                                <Route
                                    key={path}
                                    path={routes[path].path}
                                    element={React.createElement(routes[path].component)}
                                />,
                        )
                    }
                </Routes>
            </>
        );
    }
}
