// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import LibraryHeader from "./LibraryHeader";

import { connect } from "react-redux";

import { RootState } from "readium-desktop/renderer/redux/states";

interface LibraryLayoutProps {
    dialogOpen?: boolean;
    secondaryHeader?: any;
}

class LibraryLayout extends React.Component<LibraryLayoutProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                <LibraryHeader />
                { this.props.secondaryHeader }
                <main
                    style={ this.props.dialogOpen ? {filter: "blur(1px)"} : {} }
                    className={styles.main}
                    role="main"
                >
                    <a id="main-content" aria-hidden tabIndex={-1}></a>
                    { this.props.children }
                </main>
            </>
        );
    }
}

const mapStateToProps = (state: RootState, ownProps: any) => {
    return {
        dialogOpen: state.dialog.open,
    };
};

export default connect(mapStateToProps)(LibraryLayout);
