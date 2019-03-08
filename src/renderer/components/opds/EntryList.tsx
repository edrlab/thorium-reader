// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { RouteComponentProps, withRouter } from "react-router-dom";

import { RootState } from "readium-desktop/renderer/redux/states";

import { OpdsLinkView } from "readium-desktop/common/views/opds";

import Entry from "./Entry";

interface EntryListProps extends RouteComponentProps {
    level?: number;
    entries: OpdsLinkView[];
}

export class EntryList extends React.Component<EntryListProps, null> {
    public render(): React.ReactElement<{}>  {
        return (
            <section id={styles.flux_list}>
                <ul>
                    { this.props.entries.map((entry: any, index: any) =>
                        <li key={ index } >
                            <Entry entry={ entry } level={ this.props.level } />
                        </li>,
                    )}
                </ul>
            </section>
        );
    }
}

const mapStateToProps = (state: RootState, __: any) => {
    const level = state.opds.browser.navigation.length + 1;

    return {
        level,
    };
};

export default withRouter(connect(mapStateToProps, undefined)(EntryList));
