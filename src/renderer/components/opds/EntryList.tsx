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

interface IProps extends RouteComponentProps {
    level?: number;
    entries: OpdsLinkView[];
}

class EntryList extends React.Component<IProps> {
    public render(): React.ReactElement<{}>  {
        return (
            <section id={styles.flux_list}>
                <ul>
                    { this.props.entries.map((entry) =>
                        <li key={ entry.url } >
                            <Entry entry={ entry } level={ this.props.level } />
                        </li>,
                    )}
                </ul>
            </section>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    level: state.opds.browser.navigation.length + 1,
});

export default connect(mapStateToProps, undefined)(withRouter(EntryList));
