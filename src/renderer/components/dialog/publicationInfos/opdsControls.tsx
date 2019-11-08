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

        return opdsPublicationView.isFree ? (
            <button
                onClick={() => verifyImport(opdsPublicationView)}
                className={styles.lire}
                disabled={buttonIsDisabled}
            >
                {__("catalog.addBookToLib")}
            </button>
        ) : opdsPublicationView.hasSample && (
            <button
                onClick={() => verifyImport(opdsPublicationView, true)}
                className={styles.lire}
            >
                {__("opds.menu.addExtract")}
            </button>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        verifyImport: (opdsPublicationView: OpdsPublicationView, downloadSample?: boolean) => {
            dispatch(importAction.verifyImport(
                {
                    opdsPublicationView,
                    downloadSample,
                },
            ));
        },
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
        buttonIsDisabled: state.download.downloads.findIndex((pub) => pub.url === props.opdsPublicationView.url) > -1,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
