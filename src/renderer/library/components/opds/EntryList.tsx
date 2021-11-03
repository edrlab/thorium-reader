// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IOpdsNavigationLinkView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

import Entry from "./Entry";

interface IBaseProps {
    entries: IOpdsNavigationLinkView[];
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class EntryList extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        return (
            <section className={styles.block_line}>
                <ul className={styles.buttons_list}>
                    {this.props.entries.map((entry, index) =>
                        <li key={index} >
                            <Entry entry={entry} level={this.props.level} />
                        </li>,
                    )}
                </ul>
            </section>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    level: state.opds.browser.breadcrumb.length + 1,
});

export default connect(mapStateToProps)(EntryList);
