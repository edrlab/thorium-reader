// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import LibraryHeader from "./LibraryHeader";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useKeyboardShortcut } from "readium-desktop/renderer/common/hooks/useKeyboardShortcut";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

interface IBaseProps extends React.PropsWithChildren {
    secondaryHeader?: React.ReactElement;
    breadCrumb?: React.ReactElement;
    title?: string;
    mainClassName?: string;
}

const LibraryLayout = (props: IBaseProps) => {

    const { title, secondaryHeader, breadCrumb, mainClassName, children } = props;
    const [__] = useTranslator();
    const refToolbar = React.useRef<HTMLAnchorElement>();
    const fastLinkRef = React.useRef<HTMLAnchorElement>();

    React.useEffect(() => {
        let helmetTitle = capitalizedAppName;
        if (title) {
            helmetTitle += " - " + title;
        }
        window.document.title = helmetTitle;
    }, [title]);
    useKeyboardShortcut(true, (s) => s.FocusToolbar, () => refToolbar?.current?.focus()); // listen for key up (not key down)
    useKeyboardShortcut(true, (s) => s.FocusMain, () => fastLinkRef?.current?.focus());

    return (
        <div role="region" aria-label={__("accessibility.toolbar")}>
            <a
                role="heading"
                className={stylesGlobal.anchor_link}
                ref={refToolbar}
                id="main-toolbar"
                title={__("accessibility.toolbar")}
                aria-label={__("accessibility.toolbar")}
                tabIndex={-1}
            >
                {__("accessibility.toolbar")}
            </a>
            <LibraryHeader />
            {secondaryHeader}
            {breadCrumb}
            <main
                id="main"
                aria-label={__("accessibility.mainContent")}
                className={classNames(stylesGlobal.main, mainClassName)}
            >
                <a
                    role="heading"
                    className={stylesGlobal.anchor_link}
                    ref={fastLinkRef}
                    id="main-content"
                    title={__("accessibility.mainContent")}
                    aria-label={__("accessibility.mainContent")}
                    tabIndex={-1}
                >
                    {__("accessibility.mainContent")}
                </a>
                {/* <HooksTest name="main"></HooksTest> */}
                {children}
            </main>
        </div>
    );
};
export default LibraryLayout;
