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

class ImportLinkSettings extends React.Component<IProps, {
    url: string;
}> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            url: "",
        };
    }

    public render(): React.ReactElement<{}> {
        // const { __ } = this.props;
        return (
            <>
                <h3>Import link: </h3>
                <form >
                    <input
                        onChange={(e) => this.setState({
                            url: e.target.value,
                        })}
                        type="text"
                        // aria-label={this.props.browsrResult.data.auth.labelLogin}
                        // placeholder={this.props.browserResult.data.auth.labelLogin}
                        defaultValue={""}
                    />
                    <input
                        type="submit"
                        value={"import"}
                        onClick={this.importLink}
                    />
                </form>
            </>
        );
    }

    private importLink = (event: React.MouseEvent) => {

        event.preventDefault();
        apiAction("publication/importFromLink", { url: this.state.url})
            .catch((error) => console.error("Error to fetch api publication/importFromLink", error));
    }

}

export default withTranslator(ImportLinkSettings);
