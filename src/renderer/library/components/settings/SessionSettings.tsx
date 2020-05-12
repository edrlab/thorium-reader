// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";

import SVG from "../../../common/components/SVG";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

class SessionSettings extends React.Component<IProps, {
    sessionEnabled: boolean;
}> {

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
                <h3>{__("settings.session.title")}</h3>
                <form className={styles.languages_list}>
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
            </>
        );
    }

    private getSession = () => {
        apiAction("session/isEnabled")
            .then((sessionEnabled) => this.setState({ sessionEnabled }))
            .catch((error) => console.error("Error to fetch api publication/findAll", error));
    }

    private setSession = async (bool: boolean) => {
        this.setState({ sessionEnabled: bool });

        try {
            await apiAction("session/enable", bool);
        } catch {

            this.getSession();
        }
    }
}

export default withTranslator(SessionSettings);
