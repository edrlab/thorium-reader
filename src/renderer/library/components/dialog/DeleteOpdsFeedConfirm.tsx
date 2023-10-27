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
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

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

class DeleteOpdsFeedConfirm extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.feed) {
            return (<></>);
        }

        const { __ } = this.props;
        return (
            <Dialog
                title={__("dialog.deleteFeed")}
                onSubmitButton={this.remove}
                submitButtonDisabled={false}
                submitButtonTitle={this.props.__("dialog.yes")}
                shouldOkRefEnabled={true}
                size={"small"}
            >
                <p>
                    <span>{this.props.feed.title}</span>
                </p>
            </Dialog>
        );
    }

    private remove = () => {
        apiAction("opds/deleteFeed", this.props.feed.identifier).catch((error) => {
            console.error("Error to fetch opds/deleteFeed", error);
        });
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.DeleteOpdsFeedConfirm,
    feed: (state.dialog.data as DialogType[DialogTypeName.DeleteOpdsFeedConfirm]).feed,
});

export default connect(mapStateToProps)(withTranslator(DeleteOpdsFeedConfirm));
