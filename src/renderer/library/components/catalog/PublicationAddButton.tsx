// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as React from "react";
import { connect } from "react-redux";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { Dispatch } from "redux";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/common/components/hoc/translator";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export class PublicationAddButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.importFile = this.importFile.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        return (
            <button
                type="button"
                className={stylesButtons.button_nav_primary}
                onClick={this.importFile}
            >
                <SVG ariaHidden={true} svg={PlusIcon} title={__("header.importTitle")} />
                <span>{__("header.importTitle")}</span>
            </button>
        );
    }

    private async importFile() {
        const paths = await apiAction("publication/selectFiles");
        if (!paths.length) {
            return;
        }

        this.props.import(paths, false /* willBeImmediatelyFollowedByOpen */);
    }
}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    import: apiDispatch(dispatch)()("publication/importFromFs"),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationAddButton));
