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
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import SVG from "../../../common/components/SVG";

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

interface IState {
    sessionEnabled: boolean;
}

class SessionSettings extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            sessionEnabled: false,
        };
    }

    public componentDidMount() {
        this.getSession();
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <section>
                    <div className={stylesGlobal.heading}>
                        <h2>{__("settings.session.title")}</h2>
                    </div>
                    <form className={stylesInputs.radio_list}>
                        <div>
                            <input
                                id={"session-true"}
                                type="radio"
                                lang={__("settings.session.yes")}
                                name="language"
                                onChange={() => this.setSession(true)}
                                checked={this.state.sessionEnabled === true}
                            />
                            <label htmlFor={"session-true"}>
                                {
                                    this.state.sessionEnabled === true && <SVG svg={DoneIcon} ariaHidden />
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
                                onChange={() => this.setSession(false)}
                                checked={this.state.sessionEnabled === false}
                            />
                            <label htmlFor={"session-false"}>
                                {
                                    this.state.sessionEnabled === false && <SVG svg={DoneIcon} ariaHidden />
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

    private getSession = () => {
        apiAction("session/isEnabled")
            .then((sessionEnabled) => this.setState({ sessionEnabled }))
            .catch((error) => console.error("Error to fetch api publication/findAll", error));
    };

    private setSession = async (bool: boolean) => {
        this.setState({ sessionEnabled: bool });

        try {
            await apiAction("session/enable", bool);
        } catch {

            this.getSession();
        }
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (_dispatch: TDispatch, _props: IBaseProps) => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SessionSettings));
