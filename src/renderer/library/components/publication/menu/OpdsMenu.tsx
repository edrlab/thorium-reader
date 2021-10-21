// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions/";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: IOpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

export class OpdsMenu extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

    }

    public render(): React.ReactElement<{}> {

        const {
            __,
        } = this.props;

        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo}
                >
                    {__("opds.menu.aboutBook")}
                </button>
            </>
        );
    }

    private displayPublicationInfo = (e: TMouseEventOnButton) => {
        e.preventDefault();
        this.props.displayPublicationInfo();
    };
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds,
                {
                    publication: props.opdsPublicationView,
                },
            ));
        },
    };
};

const mapStateToProps = (_state: ILibraryRootState, _props: IBaseProps) => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsMenu));
