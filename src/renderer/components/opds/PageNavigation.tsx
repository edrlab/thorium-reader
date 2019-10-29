// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";
import { IOpdsResultView } from "readium-desktop/common/views/opds";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { IOpdsBrowse } from "readium-desktop/renderer/routing";

interface Props extends TranslatorProps, RouteComponentProps<IOpdsBrowse> {
    pageLinks?: IOpdsResultView["links"];
    pageInfo?: IOpdsResultView["metadata"];
}

// replace the last '/:url' with the new navigation url
const newRouteUrl = (path: string, url: string) => path.replace(/^(.*?)[^\/]+$/, `\$1${url}`);

class PageNavigation extends React.Component<Props> {

    public componentDidMount() {
        document.addEventListener("keydown", this.handleKeyDown);
    }

    public componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        const { pageLinks, pageInfo, __ } = this.props;
        const { next, previous, last, first } = pageLinks;


        return (
            <div className={styles.opds_page_navigation}>
                <span />
                {first[0] && first[0].Href &&
                    <Link to={newRouteUrl(this.props.location.pathname, first[0].Href)}>
                        <button>
                            {__("opds.firstPage")}
                        </button>
                    </Link>
                }
                {previous[0] && previous[0].Href &&
                    <Link to={newRouteUrl(this.props.location.pathname, previous[0].Href)}>
                        <button>
                            <SVG svg={ArrowLeftIcon} />
                            {__("opds.previous")}
                        </button>
                    </Link>
                }
                {next[0] && next[0].Href &&
                    <Link to={newRouteUrl(this.props.location.pathname, next[0].Href)}>
                        <button>
                            {__("opds.next")}
                            <SVG svg={ArrowRightIcon} />
                        </button>
                    </Link>
                }
                {last[0] && last[0].Href &&
                    <Link to={newRouteUrl(this.props.location.pathname, last[0].Href)}>
                        <button>
                            {__("opds.lastPage")}
                        </button>
                    </Link>
                }
                {pageInfo && pageInfo.CurrentPage && pageInfo.NumberOfItems && pageInfo.ItemsPerPage &&
                    <span className={styles.page_count}>
                        {pageInfo.CurrentPage} / {Math.ceil(pageInfo.NumberOfItems / pageInfo.ItemsPerPage)}</span>
                }
            </div>
        );
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        const { pageLinks, location } = this.props;

        if (e.shiftKey && e.ctrlKey) {
            const next = pageLinks.next[0] && pageLinks.next[0].Href;
            const previous = pageLinks.previous[0] && pageLinks.previous[0].Href;

            if (previous && e.key === "ArrowLeft") {
                this.props.history.push(newRouteUrl(location.pathname, next));
            } else if (next && e.key === "ArrowRight") {
                this.props.history.push(newRouteUrl(location.pathname, previous));
            }
        }
    }
}

export default withTranslator(withRouter(PageNavigation));
