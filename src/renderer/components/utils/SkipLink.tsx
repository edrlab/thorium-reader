// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

interface Props {
    anchorId: string;
    label: string;
    className?: string;
}

export default class SkipLink extends React.Component<Props> {
    public render(): React.ReactElement<{}>  {
        const { label, className } = this.props;
        return (
            <button
                onClick={() => this.onClick()}
                aria-hidden={false}
                className={className}
            >
                { label }
            </button>
        );
    }

    private onClick() {
        const element = document.getElementById(this.props.anchorId);
        if (element) {
            element.focus();
        }
    }
}
