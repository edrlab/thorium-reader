// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { OpdsPublicationView } from "readium-desktop/common/views/opds";

import * as importAction from "readium-desktop/common/redux/actions/import";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface CatalogControlsProps {
    publication: OpdsPublicationView;
    verifyImport?: (publication: OpdsPublicationView, downloadSample?: boolean) => void;
}

export class OpdsControls extends React.Component<CatalogControlsProps, undefined> {
    public render(): React.ReactElement<{}> {
        const { publication, verifyImport } = this.props;

        if (!publication) {
            return <></>;
        }

        return publication.isFree ? (
            <a
                onClick={() => verifyImport(publication)}
                className={styles.lire}
            >
                Ajouter à la bibliothèque
            </a>
        ) : publication.hasSample && (
            <a
                onClick={() => verifyImport(publication, true)}
                className={styles.lire}
            >
                Ajouter l'extrait à la bibliothèque
            </a>
        );
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        verifyImport: (publication: OpdsPublicationView, downloadSample: boolean) => {
            dispatch(importAction.verifyImport(
                {
                    publication,
                    downloadSample,
                },
            ));
        },
    };
};

export default withApi(
    OpdsControls,
    {
        operations: [],
        mapDispatchToProps,
    },
);
