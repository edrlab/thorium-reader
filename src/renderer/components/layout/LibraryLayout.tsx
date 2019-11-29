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
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import { RootState } from "readium-desktop/renderer/redux/states";
import LibraryHeader from "./LibraryHeader";

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

    // TODO: unused functionality?
    // private fastLinkRef: any;
    // ref={(ref) => this.fastLinkRef = ref}

    constructor(props: IProps) {
        super(props);
    }

    public componentDidMount() {
        // TODO: unused functionality?
        // const { location } = this.props;
        // const focusInside = qs.parse(location.search).focusInside === "true";
        // if (focusInside) {
        //     this.fastLinkRef.focus();
        // }
    }

    public render() {
        const { title } = this.props;

        let helmetTitle = "Thorium";
        if (title) {
            helmetTitle += " - " + title;
        }

        return (
            <HelmetProvider>
                <div
                    style={ this.props.dialogOpen ? {filter: "blur(1px)"} : {} }
                >
                    <Helmet>
                        <title>{ helmetTitle }</title>
                    </Helmet>
                    <LibraryHeader />
                    { this.props.secondaryHeader }
                    <main
                        id="main"
                        className={classNames(styles.main, this.props.mainClassName)}
                        role="main"
                    >
                        <a id="main-content" aria-hidden tabIndex={-1}></a>
                        { this.props.children }
                    </main>
                </div>
            </HelmetProvider>
        );
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
        dialogOpen: state.dialog.open,
    });

export default connect(mapStateToProps)(withRouter(LibraryLayout));
