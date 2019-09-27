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

import { OpdsResultPageInfos, OpdsResultUrls } from "readium-desktop/common/views/opds";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

interface Props extends TranslatorProps {
    goto: (url: string) => void;
    urls: OpdsResultUrls;
    page: OpdsResultPageInfos;
}

class PageNavigation extends React.Component<Props> {
    private currentPage: number = 1;
    public constructor(props: Props) {
        super(props);

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);
        this.lastPage = this.lastPage.bind(this);
        this.firstPage = this.firstPage.bind(this);
    }

    public componentDidMount() {
        document.addEventListener("keydown", this.handleKeyDown);
    }

    public componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        const { page, urls, __ } = this.props;
        const { nextPage, previousPage, lastPage, firstPage } = urls;
        return (
            <div className={styles.opds_page_navigation}>
                <span/>
                { firstPage &&
                    <button onClick={this.firstPage}>
                        {__("opds.firstPage")}
                    </button>
                }
                { previousPage ?
                    <button onClick={this.previousPage}>
                        <SVG svg={ArrowLeftIcon} />
                        {__("opds.previous")}
                    </button>
                : <div/> }
                { nextPage ?
                    <button onClick={this.nextPage}>
                        {__("opds.next")}
                        <SVG svg={ArrowRightIcon} />
                    </button>
                : <div/>}
                { lastPage &&
                    <button onClick={this.lastPage}>
                        {__("opds.lastPage")}
                    </button>
                }
                { page ?
                    <span>{this.currentPage} / {this.totalPage()}</span>
                : <span/>}
            </div>
        );
    }

    private handleKeyDown(e: KeyboardEvent) {
        const { urls } = this.props;
        const { nextPage, previousPage } = urls;
        const withModifierKeys = e.shiftKey && e.ctrlKey;
        if (withModifierKeys) {
            if (e.key === "ArrowLeft" && previousPage) {
                this.previousPage();
            } else if (e.key === "ArrowRight" && nextPage) {
                this.nextPage();
            }
        }
    }

    private nextPage() {
        this.props.goto(this.props.urls.nextPage);
        this.currentPage += 1;
    }

    private previousPage() {
        this.props.goto(this.props.urls.nextPage);
        this.currentPage -= 1;
    }

    private lastPage() {
        const { goto, urls } = this.props;
        goto(urls.lastPage);
        this.currentPage += this.totalPage();
    }

    private firstPage() {
        this.props.goto(this.props.urls.firstPage);
        this.currentPage = 1;
    }

    private totalPage() {
        const { page } = this.props;
        return Math.ceil(page.numberOfItems / page.itemsPerPage);
    }
}

export default withTranslator(PageNavigation);
