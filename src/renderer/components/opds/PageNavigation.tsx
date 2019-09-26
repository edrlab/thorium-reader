// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/hoc/translator";

import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

interface Props extends TranslatorProps {
    goto: (url?: string) => void;
    nextUrl: string;
    previousUrl: string;
}

class PageNavigation extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    public componentDidMount() {
        document.addEventListener("keydown", this.handleKeyDown);
    }

    public componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        const { goto, nextUrl, previousUrl, __ } = this.props;

        return (
            <div className={styles.opds_page_navigation}>
                { previousUrl ?
                    <button onClick={() => goto(previousUrl)}>
                        <SVG svg={ArrowLeftIcon} />
                        {__("opds.previous")}
                    </button>
                : <div/> }
                { nextUrl ?
                    <button onClick={() => goto(nextUrl)}>
                        {__("opds.next")}
                        <SVG svg={ArrowRightIcon} />
                    </button>
                : <div/>}
            </div>
        );
    }

    private handleKeyDown(e: KeyboardEvent) {
        const { goto, nextUrl, previousUrl } = this.props;
        const withModifierKeys = e.shiftKey && e.ctrlKey;
        if (withModifierKeys) {
            if (e.key === "ArrowLeft") {
                goto(previousUrl);
            } else if (e.key === "ArrowRight") {
                goto(nextUrl);
            }
        }
    }
}

export default withTranslator(PageNavigation);
