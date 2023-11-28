// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { authActions } from "readium-desktop/common/redux/actions";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";

import SVG from "../SVG";
import * as BinIcon from "readium-desktop/renderer/assets/icons/bin-icon.svg";
import { useTranslator } from "../../hooks/useTranslator";
import { useDispatch } from "../../hooks/useDispatch";

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

class AuthSettings extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <section className={stylesSettings.settings_tab_container}>
                    <div className={stylesGlobal.heading}>
                        <h4>{__("catalog.opds.auth.login")}</h4>
                    </div>
                    <button
                        className={stylesButtons.button_primary}
                        onClick={() => this.props.wipeData()}>
                        <SVG ariaHidden svg={BinIcon} />
                        {__("settings.auth.wipeData")}
                    </button>
                </section>
            </>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        wipeData: () => dispatch(authActions.wipeData.build()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AuthSettings));


export const Auth = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    return (
        <button
            className={stylesSettings.btn_primary}
            onChange={() => dispatch(authActions.wipeData.build())}>
            <SVG ariaHidden svg={BinIcon} />
            {__("settings.auth.wipeData")}
        </button>
    );
};
