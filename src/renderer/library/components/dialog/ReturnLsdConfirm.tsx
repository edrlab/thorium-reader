// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { lcpActions } from "readium-desktop/common/redux/actions";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class LsdReturnConfirm extends React.Component<IProps, undefined> {

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
                title={__("publication.returnButton")}
                onSubmitButton={() => this.props.returnPublication(this.props.publicationView.identifier)}
                submitButtonDisabled={false}
                submitButtonTitle={this.props.__("dialog.yes")}
                shouldOkRefEnabled={true}
                size={"small"}
            >
                <div className={stylesGlobal.w_50}>
                    <p><strong>{__("dialog.return")}</strong></p>
                    <p>{this.props.publicationView.documentTitle}</p>
                </div>
            </Dialog>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LsdReturnConfirm,
    }, ...state.dialog.data as DialogType[DialogTypeName.LsdReturnConfirm],
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        returnPublication: (publicationId: string) => {
            dispatch(lcpActions.returnPublication.build(publicationId));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LsdReturnConfirm));
