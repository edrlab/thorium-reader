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
    message: string;
}> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            url: "",
            message: "",
        };
    }

    public componentDidMount() {
        this.getUrl();
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const { url } = this.state;
        return (
            <>
                <h3>{__("settings.server.title")}</h3>
                <form noValidate={true}>
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
                    <input
                        style={{ width: "50px" }}
                        disabled={!url}
                        type="submit"
                        value={__("settings.server.submit")}
                        onClick={this.setUrl}
                    />
                </form>
                <h5>{this.state.message}</h5>
            </>
        );
    }

    private getUrl = () => {
        apiAction("server/getUrl")
            .then((url) => this.setState({ url }))
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

            this.setState({ message: "✅"});

            try {
                await apiAction("server/setUrl", this.state.url);
            } catch {
                this.getUrl();
                this.setState({ message: "❌" });
            }
        } catch (e) {
            this.setState({ message: e.toString()});
        }
    }
}

export default withTranslator(SessionSettings);
