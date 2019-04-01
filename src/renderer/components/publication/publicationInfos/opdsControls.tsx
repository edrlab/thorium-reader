// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { OpdsPublicationView } from "readium-desktop/common/views/opds";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import { withApi } from "readium-desktop/renderer/components/utils/api";

interface CatalogControlsProps {
    publication: OpdsPublicationView;
    importOpdsEntry?: any;
}

export class OpdsControls extends React.Component<CatalogControlsProps, undefined> {
    public render(): React.ReactElement<{}> {
        const { publication, importOpdsEntry } = this.props;

        if (!publication) {
            return <></>;
        }

        return publication.isFree ? (
            <a
                onClick={() => importOpdsEntry({ url: publication.url })}
                className={styles.lire}
            >
                Ajouter à la bibliothèque
            </a>
        ) : publication.hasSample && (
            <a
                onClick={() => importOpdsEntry({ url: publication, downloadSample: true })}
                className={styles.lire}
            >
                Ajouter l'extrait à la bibliothèque
            </a>
        );
    }
}

export default withApi(
    OpdsControls,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "importOpdsEntry",
                callProp: "importOpdsEntry",
            },
        ],
    },
);
