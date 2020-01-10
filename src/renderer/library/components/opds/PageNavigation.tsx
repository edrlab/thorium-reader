// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { IOpdsResultView } from "readium-desktop/common/views/opds";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/library/components/utils/SVG";
import { buildOpdsBrowserRouteWithLink } from "readium-desktop/renderer/library/opds/route";
import { RootState } from "readium-desktop/renderer/library/redux/states";
import { dispatchHistoryPush } from "readium-desktop/renderer/library/routing";
import { TDispatch } from "readium-desktop/typings/redux";

interface IBaseProps extends TranslatorProps {
    pageLinks?: IOpdsResultView["links"];
    pageInfo?: IOpdsResultView["metadata"];
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class PageNavigation extends React.Component<IProps, undefined> {

    public componentDidMount() {
        document.addEventListener("keydown", this.handleKeyDown);
    }

    public componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        const { pageLinks, pageInfo, __ } = this.props;

        const buildRoute = buildOpdsBrowserRouteWithLink(this.props.location.pathname);

        return (
            <div className={styles.opds_page_navigation}>
                <span />
                {
                    pageLinks?.first[0]?.url
                    && <Link to={{
                        ...this.props.location,
                        pathname: buildRoute(pageLinks.first[0]),
                    }}>
                        <button>
                            {__("opds.firstPage")}
                        </button>
                    </Link>
                }
                {
                    pageLinks?.previous[0]?.url
                    && <Link to={{
                        ...this.props.location,
                        pathname: buildRoute(pageLinks.previous[0]),
                    }}>
                        <button>
                            <SVG svg={ArrowLeftIcon} />
                            {__("opds.previous")}
                        </button>
                    </Link>
                }
                {
                    pageLinks?.next[0]?.url
                    && <Link to={{
                        ...this.props.location,
                        pathname: buildRoute(pageLinks.next[0]),
                    }}>
                        <button>
                            {__("opds.next")}
                            <SVG svg={ArrowRightIcon} />
                        </button>
                    </Link>
                }
                {
                    pageLinks?.last[0]?.url
                    && <Link to={{
                        ...this.props.location,
                        pathname: buildRoute(pageLinks.last[0]),
                    }}>
                        <button>
                            {__("opds.lastPage")}
                        </button>
                    </Link>
                }
                {
                    pageInfo?.currentPage
                    && pageInfo.numberOfItems
                    && pageInfo.itemsPerPage
                    && <span className={styles.page_count}>
                        {
                            pageInfo.currentPage
                        } / {
                            Math.ceil(pageInfo.numberOfItems / pageInfo.itemsPerPage)
                        }
                    </span>
                }
            </div>
        );
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        const { pageLinks } = this.props;

        if (e.shiftKey && e.ctrlKey) {
            const next = pageLinks?.next[0];
            const previous = pageLinks?.previous[0];
            const buildRoute = buildOpdsBrowserRouteWithLink(this.props.location.pathname);

            // FIXME : Why e.key isn't typed ?
            if (previous && e.key === "ArrowLeft") {
                this.props.historyPush({
                    ...this.props.location,
                    pathname: buildRoute(next),
                });
            } else if (next && e.key === "ArrowRight") {
                this.props.historyPush({
                    ...this.props.location,
                    pathname: buildRoute(previous),
                });
            }
        }
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PageNavigation));
