// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    title: string;
    message?: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

/**
 * FIXME : css in code
 */
const style: React.CSSProperties = {
    textAlign: "center",
};

export default class MessageOpdBrowserResult extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { message, title } = this.props;
        return (
            <div style={style}>
                <h3>{title}</h3>
                {message && <p>{message}</p>}
            </div>
        );
    }
}
