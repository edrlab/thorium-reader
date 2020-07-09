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
}> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            url: "",
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
                <form onClick={this.setUrl}>
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
                    />
                </form>
            </>
        );
    }

    private getUrl = () => {
        apiAction("server/getUrl")
            .then((url) => this.setState({ url }))
            .catch((error) => console.error("Error to fetch api server/getUrl", error));
    }

    private setUrl = async () => {

        try {
            await apiAction("server/setUrl", this.state.url);
        } catch {

            this.getUrl();
        }
    }
}

export default withTranslator(SessionSettings);
