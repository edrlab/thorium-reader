// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { dialogActions, importActions } from "readium-desktop/common/redux/actions/";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: IOpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

// FIXME : Let the user to choice the link in links array from opds converter

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
            {opdsPublicationView.openAccessLinks || opdsPublicationView.sampleOrPreviewLinks ?
                <button
                    onClick={() => verifyImport(opdsPublicationView)}
                    className={styles.lire}
                    disabled={buttonIsDisabled()}
                >
                    {opdsPublicationView.openAccessLinks ?
                        __("catalog.addBookToLib") :
                        __("opds.menu.addExtract")}
                </button>
                : <></>}
            {opdsPublicationView.buyLinks || opdsPublicationView.borrowLinks || opdsPublicationView.subscribeLinks ?
                <ul className={styles.liens}>
                    {
                        Array.isArray(opdsPublicationView.buyLinks)
                        && opdsPublicationView.buyLinks[0]
                        &&
                        <li>
                            <a role="menuitem"
                                href={opdsPublicationView.buyLinks[0].url}
                            >
                                {__("opds.menu.goBuyBook")}
                            </a>
                        </li>
                    }
                    {
                        Array.isArray(opdsPublicationView.borrowLinks)
                        && opdsPublicationView.borrowLinks[0]
                        &&
                        <li>
                            <a role="menuitem"
                                href={opdsPublicationView.borrowLinks[0].url}
                            >
                                {__("opds.menu.goLoanBook")}
                            </a>
                        </li>
                    }
                    {
                        Array.isArray(opdsPublicationView.subscribeLinks)
                        && opdsPublicationView.subscribeLinks[0]
                        &&
                        <li>
                            <a role="menuitem"
                                href={opdsPublicationView.subscribeLinks[0].url}
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
        verifyImport: (opdsPublicationView: IOpdsPublicationView) => {
            dispatch(dialogActions.closeRequest.build());
            dispatch(importActions.verify.build(opdsPublicationView));
        },
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
        buttonIsDisabled: () => {
            return !!state.download.downloads.find((dl) =>
                dl.url === props.opdsPublicationView.openAccessLinks[0].url ||
                dl.url === props.opdsPublicationView.sampleOrPreviewLinks[0].url);
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
