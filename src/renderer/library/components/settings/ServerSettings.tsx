// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";

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
    url: string;
    messageUrl: string;
    message: string;
    messageToken: string;
    token: string;
}> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            url: "",
            messageUrl: "",
            message: "",
            messageToken: "",
            token: "DEFAULT_TOKEN",
        };
    }

    public componentDidMount() {
        this.getUrl();
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const { url, token } = this.state;
        return (
            <>
                <h3>{__("settings.server.title")}</h3>
                <form noValidate={true}>
                    <div>
                        <label>{__("settings.server.url")}</label>
                        <input
                            style={{ width: "300px" }}
                            onChange={(e) => this.setState({
                                url: e.target.value,
                            })}
                            type="text"
                            aria-label={__("settings.server.url")}
                            placeholder={__("settings.server.urlPlaceHolder")}
                            defaultValue={url}
                        />
                        <h5>{this.state.messageUrl}</h5>
                    </div>
                    <div>
                        <label>{__("settings.server.token")}</label>
                        <input
                            style={{ width: "280px" }}
                            onChange={(e) => this.setState({
                                token: e.target.value,
                            })}
                            type="text"
                            aria-label={__("settings.server.token")}
                            placeholder={__("settings.server.tokenPlaceHolder")}
                            defaultValue={token}
                        />
                        <h5>{this.state.messageToken}</h5>
                    </div>
                    <div>
                        <input
                            style={{ width: "50px" }}
                            disabled={!url}
                            type="submit"
                            value={__("settings.server.submit")}
                            onClick={this.setUrl}
                        />
                        <h5>{this.state.message}</h5>
                    </div>
                </form>
            </>
        );
    }

    private getUrl = () => {
        apiAction("server/getUrl")
            .then(([url, token]) => this.setState({ url, token }))
            .catch((error) => console.error("Error to fetch api server/getUrl", error));
    }

    private setUrl = async (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        e.preventDefault();

        const { __ } = this.props;

        try {
            const u = new URL(this.state.url);

            if (u.pathname[u.pathname.length - 1] !== "/") {
                throw new Error(__("settings.server.slashExpectedAtTheEnd"));
            }

            this.setState({ messageUrl: "", messageToken: "", message: "✅" });

            try {
                await apiAction("server/setUrl", this.state.url, this.state.token);
            } catch {
                this.getUrl();
                throw new Error("not updated");
            }
        } catch (e) {
            this.setState({ messageUrl: e.toString(), messageToken: "❌" });
        }
    }
}

export default withTranslator(SessionSettings);
