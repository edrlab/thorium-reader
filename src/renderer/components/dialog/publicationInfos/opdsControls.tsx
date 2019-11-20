// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { dialogActions, importActions } from "readium-desktop/common/redux/actions/";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: OpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

export class OpdsControls extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { opdsPublicationView, verifyImport, buttonIsDisabled } = this.props;
        const { __ } = this.props;

        if (!opdsPublicationView) {
            return <></>;
        }

        return <>
            { opdsPublicationView.openAccessUrl || opdsPublicationView.sampleOrPreviewUrl ?
            <button
                onClick={() => verifyImport(opdsPublicationView)}
                className={styles.lire}
                disabled={buttonIsDisabled()}
            >
                {opdsPublicationView.openAccessUrl ?
                __("catalog.addBookToLib") :
                __("opds.menu.addExtract")}
            </button>
            : <></> }
            { opdsPublicationView.buyUrl || opdsPublicationView.borrowUrl || opdsPublicationView.subscribeUrl ?
            <ul className={styles.liens}>
                { opdsPublicationView.buyUrl &&
                    <li>
                        <a role="menuitem"
                            href={opdsPublicationView.buyUrl}
                        >
                            {__("opds.menu.goBuyBook")}
                        </a>
                    </li>
                }
                { opdsPublicationView.borrowUrl &&
                    <li>
                        <a role="menuitem"
                            href={opdsPublicationView.borrowUrl}
                        >
                            {__("opds.menu.goLoanBook")}
                        </a>
                    </li>
                }
                { opdsPublicationView.subscribeUrl &&
                    <li>
                        <a role="menuitem"
                            href={opdsPublicationView.subscribeUrl}
                        >
                            {__("opds.menu.goSubBook")}
                        </a>
                    </li>
                }
            </ul> : <></>}
            </>;
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        verifyImport: (opdsPublicationView: OpdsPublicationView) => {
            dispatch(dialogActions.closeRequest.build());
            dispatch(importActions.verify.build(opdsPublicationView));
        },
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
        buttonIsDisabled: () => {
            const foundDownload = state.download.downloads.find((dl) => {
                return dl.url === props.opdsPublicationView.openAccessUrl ||
                    dl.url === props.opdsPublicationView.sampleOrPreviewUrl;
            });
            return foundDownload ? true : false;
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
