// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

import Dialog from "./Dialog";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

class RenewLsdConfirm extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.renew = this.renew.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.publicationView) {
            return <></>;
        }

        const { __, closeDialog } = this.props;
        return (
            <Dialog open={true} close={closeDialog} id={styles.choice_dialog}>
                <div>
                    <p>
                        {__("dialog.renew")}
                        <span>{this.props.publicationView.title}</span>
                    </p>
                    <div>
                        <button className={styles.primary} onClick={this.renew}>{__("dialog.yes")}</button>
                        <button onClick={closeDialog}>{__("dialog.no")}</button>
                    </div>
                </div>
            </Dialog>
        );
    }

    public renew(e: TMouseEvent) {
        e.preventDefault();
        apiAction("lcp/renewPublicationLicense", this.props.publicationView.identifier).catch((error) => {
            console.error(`Error API lcp/renewPublicationLicense`, error);
        });
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === "lsd-renew-confirm",
    }, ...state.dialog.data as DialogType["lsd-renew-confirm"],
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(RenewLsdConfirm));
