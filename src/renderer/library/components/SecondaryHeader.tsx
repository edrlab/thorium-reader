// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.scss";

import * as React from "react";
import { TranslatorProps, withTranslator } from "../../common/components/hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    style?: React.CSSProperties;
    id?: string;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export class SecondaryHeader extends React.Component<React.PropsWithChildren<IProps>, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { id, __ } = this.props;
        return (
            <nav
                style={this.props.style}
                className={stylesHeader.nav_secondary}
                role="navigation"
                aria-label={ __("accessibility.bookMenu")}
                {...(id ? {id} : {})}
            >
                {this.props.children}
            </nav>
        );
    }
}

export default withTranslator(SecondaryHeader);
