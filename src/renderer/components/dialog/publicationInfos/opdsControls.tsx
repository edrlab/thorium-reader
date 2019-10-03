// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as importAction from "readium-desktop/common/redux/actions/import";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication: OpdsPublicationView;
}

export class OpdsControls extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        const { publication, verifyImport } = this.props;
        const { __ } = this.props;

        if (!publication) {
            return <></>;
        }

        return publication.isFree ? (
            <button
                onClick={() => verifyImport(publication)}
                className={styles.lire}
            >
                {__("catalog.addBookToLib")}
            </button>
        ) : publication.hasSample && (
            <button
                onClick={() => verifyImport(publication, true)}
                className={styles.lire}
            >
                {__("opds.menu.addExtract")}
            </button>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        verifyImport: (publication: OpdsPublicationView, downloadSample?: boolean) => {
            dispatch(importAction.verifyImport(
                {
                    publication,
                    downloadSample,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(OpdsControls));
