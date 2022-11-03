// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class RenewLsdConfirm extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.publicationView) {
            return <></>;
        }

        const { __ } = this.props;
        return (
            <Dialog
                title={__("publication.renewButton")}
                onSubmitButton={this.renew}
                submitButtonDisabled={false}
                shouldOkRefEnabled={true}
                submitButtonTitle={this.props.__("dialog.yes")}
            >
                <div className={classNames(stylesModals.modal_dialog_body, stylesModals.modal_dialog_body_centered)}>
                    <div className={stylesGlobal.w_50}>
                        <p><strong>{__("dialog.renew")}</strong></p>
                        <p>{this.props.publicationView.documentTitle}</p>
                    </div>
                </div>
            </Dialog>
        );
    }

    private renew = () => {
        apiAction("lcp/renewPublicationLicense", this.props.publicationView.identifier).catch((error) => {
            console.error("Error API lcp/renewPublicationLicense", error);
        });
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LsdRenewConfirm,
    }, ...state.dialog.data as DialogType[DialogTypeName.LsdRenewConfirm],
});

export default connect(mapStateToProps)(withTranslator(RenewLsdConfirm));
