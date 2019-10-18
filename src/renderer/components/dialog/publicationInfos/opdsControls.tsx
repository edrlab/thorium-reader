// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as importAction from "readium-desktop/common/redux/actions/import";
import { ImportOpdsPublication } from "readium-desktop/common/redux/states/import";
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

        return <>
            {publication.isFree ? (
                <button
                    onClick={() => verifyImport(publication as ImportOpdsPublication)}
                    className={styles.lire}
                >
                    {__("catalog.addBookToLib")}
                </button>
            ) : publication.hasSample && (
                <button
                    onClick={() => verifyImport(publication as ImportOpdsPublication, true)}
                    className={styles.lire}
                >
                    {__("opds.menu.addExtract")}
                </button>
            )}
            <ul className={styles.liens}>
                { publication.buyUrl &&
                    <li>
                        <a role="menuitem"
                            href={publication.buyUrl}
                        >
                            {__("opds.menu.goBuyBook")}
                        </a>
                    </li>
                }
                { publication.borrowUrl &&
                    <li>
                        <a role="menuitem"
                            href={publication.borrowUrl}
                        >
                            {__("opds.menu.goLoanBook")}
                        </a>
                    </li>
                }
                { publication.subscribeUrl &&
                    <li>
                        <a role="menuitem"
                            href={publication.subscribeUrl}
                        >
                            {__("opds.menu.goSubBook")}
                        </a>
                    </li>
                }
            </ul>
        </>;
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        // src/common/redux/states/import.ts
        // FIXME : REDUX ISN'T TYPED, resolve this force cast
        verifyImport: (publication: ImportOpdsPublication, downloadSample?: boolean) => {
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
