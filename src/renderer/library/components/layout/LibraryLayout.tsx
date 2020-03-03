// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import * as styles2 from "readium-desktop/renderer/assets/styles/myBooks.css";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

import LibraryHeader from "./LibraryHeader";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    secondaryHeader?: React.ReactElement;
    title?: string;
    mainClassName?: string;

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
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps, ReturnType<typeof mapStateToProps> {
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

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.focus_main,
            this.onKeyboardFocusMain);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.focus_toolbar,
            this.onKeyboardFocusToolbar);
    }

    public componentWillUnmount() {
        unregisterKeyboardListener(this.onKeyboardFocusMain);
        unregisterKeyboardListener(this.onKeyboardFocusToolbar);
    }

    public render() {
        const { title } = this.props;

        let helmetTitle = capitalizedAppName;
        if (title) {
            helmetTitle += " - " + title;
        }

        return (
            <HelmetProvider>
                <div>
                    <Helmet>
                        <title>{ helmetTitle }</title>
                    </Helmet>
                    <a
                        ref={this.refToolbar}
                        id="main-toolbar"
                        aria-hidden
                        tabIndex={-1}></a>
                    <LibraryHeader />
                    { this.props.secondaryHeader }
                    <main
                        id="main"
                        className={classNames(styles.main, styles2.main, this.props.mainClassName)}
                        role="main"
                    >
                        <a
                            ref={this.fastLinkRef}
                            id="main-content"
                            aria-hidden
                            tabIndex={-1}></a>
                        { this.props.children }
                    </main>
                </div>
            </HelmetProvider>
        );
    }

    private onKeyboardFocusMain = () => {
        if (this.fastLinkRef?.current) {
            this.fastLinkRef.current.focus();
        }
    }
    private onKeyboardFocusToolbar = () => {
        if (this.refToolbar?.current) {
            this.refToolbar.current.focus();
        }
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    dialogOpen: state.dialog.open,
    keyboardShortcuts: state.keyboard.shortcuts,
});

export default connect(mapStateToProps)(withRouter(LibraryLayout));
