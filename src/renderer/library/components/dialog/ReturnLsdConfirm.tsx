// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

class LsdReturnConfirm extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.remove = this.remove.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.publicationView) {
            return <></>;
        }

        const { __, closeDialog } = this.props;
        return (
            <Dialog
                open={true}
                close={closeDialog}
                title={__("publication.returnButton")}
            >
                <div className={classNames(styles.modal_dialog_body, styles.modal_dialog_body_centered)}>
                    <div className={styles.w_50}>
                        <p><strong>{__("dialog.return")}</strong></p>
                        <p>{this.props.publicationView.title}</p>
                    </div>
                </div>
                <div className={styles.modal_dialog_footer}>
                    <button className={styles.button_transparency} onClick={closeDialog}>
                        {this.props.__("dialog.no")}
                    </button>
                    <button className={styles.button_primary} onClick={this.remove}>
                        {this.props.__("dialog.yes")}
                    </button>
                </div>
            </Dialog>
        );
    }

    public remove(e: TMouseEventOnButton) {
        e.preventDefault();
        apiAction("lcp/returnPublication", this.props.publicationView.identifier)
        .catch((error) => {
            console.error("Error API lcp/returnPublication", error);
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

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LsdReturnConfirm,
    }, ...state.dialog.data as DialogType[DialogTypeName.LsdReturnConfirm],
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LsdReturnConfirm));
