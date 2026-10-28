// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Focusable, OverlayArrow, Tooltip, TooltipTrigger } from "react-aria-components";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    anchorId: string;
    label: string;
    className?: string;
    tooltip?: string;
    onClick?: () => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export default class SkipLink extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    //
    public render(): React.ReactElement<{}>  {
        const { onClick, label, className, tooltip } = this.props;
        if (tooltip) {
            return (
                <TooltipTrigger delay={500} closeDelay={0} trigger="hover">
                <Focusable>
                <button
                    onClick={onClick || (() => this.onClick())}
                    aria-hidden={false}
                    className={className}
                    aria-label={`${label} (${tooltip})`}
                >
                    { label }
                </button>
                </Focusable>
                <Tooltip placement="bottom" offset={0} className={"tooltipskiplink"}>
                <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg>
                </OverlayArrow>{tooltip}</Tooltip></TooltipTrigger>
            );
        } else {
            return (
                <button
                    onClick={onClick || (() => this.onClick())}
                    aria-hidden={false}
                    className={className}
                >
                    { label }
                </button>
            );
        }
    }

    private onClick() {
        const element = document.getElementById(this.props.anchorId);
        if (element) {
            element.focus();
        }
    }
}
