// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import { PublicationView } from "readium-desktop/common/views/publication";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface CatalogControlsProps {
    publication: PublicationView;
}

export class OpdsControls extends React.Component<CatalogControlsProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.handleImport = this.handleImport.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publication } = this.props;

        if (!publication) {
            return (<></>);
        }

        return (
            <>
                <a  onClick={this.handleImport} className={styles.lire}>Télécharger</a>
            </>
        );
    }

    private handleImport(e: any) {
        e.preventDefault();

        console.log("DOWNLOAD:", this.props.publication.title);
    }
}

const mapDispatchToProps = (dispatch: any, __: CatalogControlsProps) => {
    return {};
};

export default connect(undefined, mapDispatchToProps)(OpdsControls);
