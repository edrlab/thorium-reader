// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

export interface ISVGProps {
    [propName: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    svg: ISVGProps;
    title?: string;
    className?: string;
    ariaHidden?: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export default class SVG extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}>  {
        const { svg, className, ariaHidden } = this.props;
        return (
            <svg aria-hidden={ariaHidden} className={className} viewBox={svg.default.viewBox}>
                { this.props.title &&
                    <title>{this.props.title}</title>
                }
                <use xlinkHref={"#" + svg.default.id} />
            </svg>
        );
    }
}
