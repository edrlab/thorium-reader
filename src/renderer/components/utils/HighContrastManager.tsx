// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { RootState } from "readium-desktop/renderer/redux/states";

interface Props extends ReturnType<typeof mapStateToProps> {
}

class HighContrastManager extends React.Component<Props> {
    public componentDidMount() {
        this.changeDisplay();
    }
    public componentDidUpdate(oldProps: Props) {
        if (oldProps.style !== this.props.style) {
            this.changeDisplay();
        }
    }
    public render(): React.ReactElement<{}> {
        return (<></>);
    }

    private changeDisplay() {
        const { style } = this.props;
        const html = document.getElementsByTagName("html")[0];
        html.id = style.highContrast.enabled ? "high_contrast" : "";
        html.style.setProperty("--hc-background-color", style.highContrast.colors.background);
        html.style.setProperty("--hc-text-color", style.highContrast.colors.text);
        html.style.setProperty("--hc-button-text-color", style.highContrast.colors.buttonText);
        html.style.setProperty("--disabled-color", style.highContrast.colors.disabled);
        html.style.setProperty("--hc-highlight", style.highContrast.colors.highlight);
        html.style.setProperty("--hc-highlight-text", style.highContrast.colors.highlightText);
    }
}

const mapStateToProps = (state: RootState) => {
    return {
        style: state.style,
    };
};

export default connect(mapStateToProps)(HighContrastManager);
