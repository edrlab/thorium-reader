// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import ApiappAddForm from "./ApiappAddForm";

import DeleteOpdsFeedConfirm from "./DeleteOpdsFeedConfirm";
import FileImport from "./FileImport";
import LcpAuthentication from "./LcpAuthentication";
import OpdsFeedAddForm from "./OpdsFeedAddForm";
import OpdsFeedUpdateForm from "./OpdsFeedUpdateForm";
import RenewLsdConfirm from "./RenewLsdConfirm";
import ReturnLsdConfirm from "./ReturnLsdConfirm";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class DialogManager extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const dialog = this.props.dialog;

        if (!dialog || !dialog.open) {
            return (<></>);
        }

        return (
            <>
                <ApiappAddForm></ApiappAddForm>
                <OpdsFeedAddForm></OpdsFeedAddForm>
                <OpdsFeedUpdateForm></OpdsFeedUpdateForm>
                <FileImport></FileImport>
                <DeleteOpdsFeedConfirm></DeleteOpdsFeedConfirm>
                <LcpAuthentication></LcpAuthentication>
                <RenewLsdConfirm></RenewLsdConfirm>
                <ReturnLsdConfirm></ReturnLsdConfirm>
            </>
        );

    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        dialog: state.dialog,
    };
};

export default connect(mapStateToProps)(DialogManager);
