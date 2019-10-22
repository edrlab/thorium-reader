// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as importAction from "readium-desktop/common/redux/actions/import";
// import { ImportOpdsPublication } from "readium-desktop/common/redux/states/import";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
    publication: OpdsPublicationView;
}

export class OpdsControls extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        const { publication, buttonIsDisabled } = this.props;
        const { __ } = this.props;

        if (!publication) {
            return <></>;
        }

        return (
            <>
                { publication.isFree &&
                    <button role="menuitem"
                        onClick={ (e) => this.onAddToCatalogClick(e) }
                        className={styles.lire}
                        disabled={buttonIsDisabled}
                    >
                        {__("catalog.addBookToLib")}
                    </button>
                }
                {publication.hasSample &&
                    <button role="menuitem"
                        onClick={(e) => this.onAddToCatalogClick(e, true)}
                        className={styles.lire}
                    >
                        {__("opds.menu.addExtract")}
                    </button>
                }
                {publication.buyUrl &&
                    <button
                        className={styles.lire}
                    >
                        <a role="menuitem"
                            href={publication.buyUrl}
                        >
                            {__("opds.menu.goBuyBook")}
                        </a>
                    </button>
                }
                {publication.borrowUrl &&
                    <button
                        className={styles.lire}
                    >
                        <a role="menuitem"
                            href={publication.borrowUrl}
                        >
                            {__("opds.menu.goLoanBook")}
                        </a>
                    </button>
                }
                {publication.subscribeUrl &&
                    <button
                        className={styles.lire}
                    >
                        <a role="menuitem"
                            href={publication.subscribeUrl}
                        >
                            {__("opds.menu.goSubBook")}
                        </a>
                    </button>
                }

            </>
        );
    }

    private onAddToCatalogClick(e: TMouseEvent, downloadSample?: boolean) {
        e.preventDefault();
        this.props.verifyImport(this.props.publication, downloadSample);
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        // src/common/redux/states/import.ts
        // FIXME : REDUX ISN'T TYPED, resolve this force cast
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

// any because recursive type doesn't works
const mapStateToProps = (state: RootState, props: any) => {
    return {
        buttonIsDisabled: state.download.downloads.findIndex((pub) => pub.url === props.publication.url) > -1,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
