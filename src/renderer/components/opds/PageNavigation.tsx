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

interface IBaseProps extends TranslatorProps {
    pageLinks?: IOpdsResultView["links"];
    pageInfo?: IOpdsResultView["metadata"];
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps<IOpdsBrowse> {
}

// replace the last '/:url' with the new navigation url
const newRouteUrl = (path: string, url: string) => path.replace(/^(.*?)[^\/]+$/, `\$1${url}`);

class PageNavigation extends React.Component<IProps, undefined> {

    public componentDidMount() {
        document.addEventListener("keydown", this.handleKeyDown);
    }

    public componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        const { pageLinks, pageInfo, __ } = this.props;

        return (
            <div className={styles.opds_page_navigation}>
                <span />
                {pageLinks?.first && pageLinks.first[0] && pageLinks.first[0].url &&
                    <Link to={newRouteUrl(this.props.location.pathname, pageLinks.first[0].url)}>
                        <button>
                            {__("opds.firstPage")}
                        </button>
                    </Link>
                }
                {pageLinks?.previous && pageLinks.previous[0] && pageLinks.previous[0].url &&
                    <Link to={newRouteUrl(this.props.location.pathname, pageLinks.previous[0].url)}>
                        <button>
                            <SVG svg={ArrowLeftIcon} />
                            {__("opds.previous")}
                        </button>
                    </Link>
                }
                {pageLinks?.next && pageLinks.next[0] && pageLinks.next[0].url &&
                    <Link to={newRouteUrl(this.props.location.pathname, pageLinks.next[0].url)}>
                        <button>
                            {__("opds.next")}
                            <SVG svg={ArrowRightIcon} />
                        </button>
                    </Link>
                }
                {pageLinks?.last && pageLinks.last[0] && pageLinks.last[0].url &&
                    <Link to={newRouteUrl(this.props.location.pathname, pageLinks.last[0].url)}>
                        <button>
                            {__("opds.lastPage")}
                        </button>
                    </Link>
                }
                {pageInfo?.currentPage && pageInfo.numberOfItems && pageInfo.itemsPerPage &&
                    <span className={styles.page_count}>
                        {pageInfo.currentPage} / {Math.ceil(pageInfo.numberOfItems / pageInfo.itemsPerPage)}</span>
                }
            </div>
        );
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        const { pageLinks, location } = this.props;

        if (e.shiftKey && e.ctrlKey) {
            const next = pageLinks && pageLinks.next[0] && pageLinks.next[0].url;
            const previous = pageLinks && pageLinks.previous[0] && pageLinks.previous[0].url;

            if (previous && e.key === "ArrowLeft") {
                this.props.history.push(newRouteUrl(location.pathname, next));
            } else if (next && e.key === "ArrowRight") {
                this.props.history.push(newRouteUrl(location.pathname, previous));
            }
        }
    }
}

export default withTranslator(withRouter(PageNavigation));
