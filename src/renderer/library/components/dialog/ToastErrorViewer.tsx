// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
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

class ToastErrorViewer extends React.Component<IProps> {

    public render(): React.ReactElement<{}> {
        const { open } = this.props;

        if (!open) {
            return (<></>);
        }

        return (
            <Dialog
                title={"Something went wrong"}
                submitButtonDisabled={false}
                submitButtonTitle={this.props.__("dialog.yes")}
                shouldOkRefEnabled={true}
                size={"small"}
            >
                <p>The error should be here
                    <span>{this.props.message}</span>
                </p>
            </Dialog>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.ToastModal,
    message: (state.dialog.data as DialogType[DialogTypeName.ToastModal]).message,
});

export default connect(mapStateToProps)(withTranslator(ToastErrorViewer));
