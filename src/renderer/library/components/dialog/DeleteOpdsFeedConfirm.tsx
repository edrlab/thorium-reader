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
// FIXME : Error :
// translator_1.withTranslator is not a function when ordered
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

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

class DeleteOpdsFeedConfirm extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.remove = this.remove.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.feed) {
            return (<></>);
        }

        const { __, closeDialog } = this.props;
        return (
            <Dialog open={true} close={closeDialog} id={styles.choice_dialog}>
            <div>
                <p>
                    {__("dialog.deleteFeed")}
                    <span>{this.props.feed.title}</span>
                </p>
                <div>
                    <button onClick={this.remove}>{__("dialog.yes")}</button>
                    <button className={styles.primary} onClick={this.props.closeDialog}>{__("dialog.no")}</button>
                </div>
            </div>
            </Dialog>
        );
    }

    public remove(e: TMouseEventOnButton) {
        e.preventDefault();
        apiAction("opds/deleteFeed", this.props.feed.identifier).catch((error) => {
            console.error("Error to fetch opds/deleteFeed", error);
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
    open: state.dialog.type === DialogTypeName.DeleteOpdsFeedConfirm,
    feed: (state.dialog.data as DialogType[DialogTypeName.DeleteOpdsFeedConfirm]).feed,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(DeleteOpdsFeedConfirm));
