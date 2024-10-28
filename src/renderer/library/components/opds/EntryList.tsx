// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import * as React from "react";
import { connect } from "react-redux";
import { IOpdsNavigationLinkView } from "readium-desktop/common/views/opds";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

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
            <section>
                <ul className={stylesCatalogs.entryList_ul}>
                    {this.props.entries.map((entry, index) =>
                        <li key={index} className={stylesCatalogs.entryList_item}>
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
