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

class DeletePublicationConfirm extends React.Component<IProps, undefined> {

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
                title={__("dialog.deletePublication")}
                onSubmitButton={this.remove}
                submitButtonDisabled={false}
                submitButtonTitle={this.props.__("dialog.yes")}
                shouldOkRefEnabled={true}
                size={"small"}
            >
                <p>
                    <span>{this.props.publicationView.documentTitle}</span>
                </p>
            </Dialog>
        );
    }

    private remove = () => {
        apiAction("publication/delete", this.props.publicationView.identifier).catch((error) => {
            console.error("Error to fetch publication/delete", error);
        });
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.DeletePublicationConfirm,
    publicationView: (state.dialog.data as DialogType[DialogTypeName.DeletePublicationConfirm]).publicationView,
});

export default connect(mapStateToProps)(withTranslator(DeletePublicationConfirm));
