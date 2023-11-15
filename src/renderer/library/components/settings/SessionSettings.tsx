// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";

import SVG from "../../../common/components/SVG";
import { sessionActions } from "readium-desktop/common/redux/actions";

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

class SessionSettings extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            sessionEnabled: false,
        };
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <section className={stylesSettings.settings_tab_container}>
                    <div className={stylesGlobal.heading}>
                        <h4>{__("settings.session.title")}</h4>
                    </div>
                    <form className={stylesInputs.radio_list}>
                        <div>
                            <input
                                id={"session-true"}
                                type="radio"
                                lang={__("settings.session.yes")}
                                name="language"
                                onChange={() => this.props.setSession(true)}
                                checked={this.props.session === true}
                            />
                            <label htmlFor={"session-true"}>
                                {
                                    this.props.session === true && <SVG svg={DoneIcon} ariaHidden />
                                }
                                {
                                    __("settings.session.yes")
                                }
                            </label>
                        </div>
                        <div>
                            <input
                                id={"session-false"}
                                type="radio"
                                lang={__("settings.session.no")}
                                name="language"
                                onChange={() => this.props.setSession(false)}
                                checked={this.props.session === false}
                            />
                            <label htmlFor={"session-false"}>
                                {
                                    this.props.session === false && <SVG svg={DoneIcon} ariaHidden />
                                }
                                {
                                    __("settings.session.no")
                                }
                            </label>
                        </div>
                    </form>
                </section>
            </>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
        session: state.session.state,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setSession: (enable: boolean) => {
            dispatch(sessionActions.enable.build(enable));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SessionSettings));
