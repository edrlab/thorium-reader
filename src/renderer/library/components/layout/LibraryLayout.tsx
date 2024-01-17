// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";

import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

import LibraryHeader from "./LibraryHeader";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    secondaryHeader?: React.ReactElement;
    breadCrumb?: React.ReactElement;
    title?: string;
    mainClassName?: string;
    search?: React.ReactElement;

    // since React 16.10.0 (was not needed in 16.9.0)
    children?: React.ReactNode; // JSX.Element[] | JSX.Element
    // SEE @types/react/index.d.ts:
    // ------
    // React.Props<T> is now deprecated, which means that the `children`
    // property is not available on `P` by default, even though you can
    // always pass children as variadic arguments to `createElement`.
    // In the future, if we can define its call signature conditionally
    // on the existence of `children` in `P`, then we should remove this.
    // readonly props: Readonly<P> & Readonly<{ children?: ReactNode }>;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class LibraryLayout extends React.Component<IProps, undefined> {
    private fastLinkRef: React.RefObject<HTMLAnchorElement>;
    private refToolbar: React.RefObject<HTMLAnchorElement>;

    constructor(props: IProps) {
        super(props);

        this.onKeyboardFocusMain = this.onKeyboardFocusMain.bind(this);
        this.onKeyboardFocusToolbar = this.onKeyboardFocusToolbar.bind(this);

        this.fastLinkRef = React.createRef<HTMLAnchorElement>();
        this.refToolbar = React.createRef<HTMLAnchorElement>();
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();
    }

    public async componentDidUpdate(oldProps: IProps) {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render() {
        const { title } = this.props;
        const { __ } = this.props;

        let helmetTitle = capitalizedAppName;
        if (title) {
            helmetTitle += " - " + title;
        }
        window.document.title = helmetTitle;

        return (
            <div role="region" aria-label={__("accessibility.toolbar")}>
                <a
                    role="heading"
                    className={stylesGlobal.anchor_link}
                    ref={this.refToolbar}
                    id="main-toolbar"
                    title={__("accessibility.toolbar")}
                    aria-label={__("accessibility.toolbar")}
                    tabIndex={-1}
                >
                    {__("accessibility.toolbar")}
                </a>
                <div style={{display: "flex"}}>
                    <LibraryHeader />
                    <main
                        id="main"
                        aria-label={__("accessibility.mainContent")}
                        className={classNames(stylesGlobal.main, this.props.mainClassName)}
                    >
                        { this.props.secondaryHeader }
                        { title === "Catalogs" && this.props.breadCrumb ?
                        <h2>{title}</h2>
                        : <></>
                        }
                        {this.props.breadCrumb ?
                        <div className={stylesCatalogs.catalog_breadcrumbSearch_Wrapper}>
                            { this.props.breadCrumb }
                            { this.props.search }
                        </div>
                        : <></>}
                        <a
                            role="heading"
                            className={stylesGlobal.anchor_link}
                            ref={this.fastLinkRef}
                            id="main-content"
                            title={__("accessibility.mainContent")}
                            aria-label={__("accessibility.mainContent")}
                            tabIndex={-1}
                        >
                            {__("accessibility.mainContent")}
                        </a>
                        { this.props.children }
                    </main>
                </div>
            </div>
        );
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusMain,
            this.onKeyboardFocusMain);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusToolbar,
            this.onKeyboardFocusToolbar);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardFocusMain);
        unregisterKeyboardListener(this.onKeyboardFocusToolbar);
    }

    private onKeyboardFocusMain = () => {
        if (this.fastLinkRef?.current) {
            this.fastLinkRef.current.focus();
        }
    };
    private onKeyboardFocusToolbar = () => {
        if (this.refToolbar?.current) {
            this.refToolbar.current.focus();
        }
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    // dialogOpen: state.dialog.open, // unused ?
    keyboardShortcuts: state.keyboard.shortcuts,
});

export default connect(mapStateToProps)(withTranslator(LibraryLayout));
