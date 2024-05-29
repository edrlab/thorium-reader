// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { IOpdsResultView } from "readium-desktop/common/views/opds";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/arrowFirst-icon.svg";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/arrowLast-icon.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { buildOpdsBrowserRouteWithLink } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { dispatchHistoryPush, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { TDispatch } from "readium-desktop/typings/redux";

import * as stylesPublication from "readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";

interface IBaseProps extends TranslatorProps {
    pageLinks?: IOpdsResultView["links"];
    pageInfo?: IOpdsResultView["metadata"];
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class PageNavigation extends React.Component<IProps, undefined> {
    private fixedElementRef: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);
        this.fixedElementRef = React.createRef<HTMLDivElement>();

        this.onKeyboardPageNavigationPrevious = this.onKeyboardPageNavigationPrevious.bind(this);
        this.onKeyboardPageNavigationNext = this.onKeyboardPageNavigationNext.bind(this);
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
        this.adjustElementPosition();
        window.addEventListener('resize', this.adjustElementPosition);
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();
        window.removeEventListener('resize', this.adjustElementPosition);
    }

    public async componentDidUpdate(oldProps: IProps) {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }
 
    public  adjustElementPosition = () => {
        const element = this.fixedElementRef.current;
        const container = document.getElementById("opds_browserResults");
        const cardWrapper = document.getElementById("card_wrapper");
        if (cardWrapper.scrollHeight >container.clientHeight) {
          element.style.position = 'unset';
        } else {
          element.style.position = 'fixed';
          element.style.bottom = '20px';
          element.style.left = '50%';
        }
      }

    public render() {
        const { pageLinks, pageInfo, __ } = this.props;

        const buildRoute = buildOpdsBrowserRouteWithLink(this.props.location.pathname);



        return (
            <div className={stylesPublication.opds_publication_wrapper} ref={this.fixedElementRef} style={{width: "unset"}}>
                {/* <button className={stylesButtons.button_primary_blue} onClick={() => console.log(pageLinks)}>Log "pageLinks"</button> */}
                {/* <p className={stylesPublication.allBooks_header_pagination_title}>{__("catalog.numberOfPages")}</p> */}
                <div className={stylesPublication.allBooks_header_pagination_container}>
                    <button
                        className={stylesPublication.allBooks_header_pagination_arrow}
                        aria-label={`${__("opds.firstPage")}`}
                        disabled={!pageLinks?.first[0]?.url || pageInfo?.currentPage === 0}
                    >
                        {pageLinks?.first[0]?.url ?
                            <Link
                                to={{
                                    ...this.props.location,
                                    pathname: buildRoute(pageLinks.first[0]),
                                }}
                            >
                                <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                            </Link> :
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />}
                    </button>

                    <button
                        className={stylesPublication.allBooks_header_pagination_arrow}
                        style={{
                            transform: "rotate(180deg)",
                        }}
                        aria-label={`${__("opds.previous")}`}
                        disabled={!pageLinks?.previous[0]?.url || pageInfo?.currentPage === 0}>
                        {
                            pageLinks?.previous[0]?.url ?
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: buildRoute(pageLinks.previous[0]),
                                    }}
                                >
                                    <SVG ariaHidden={true} svg={ChevronRight} />
                                </Link>
                                : <SVG ariaHidden={true} svg={ChevronRight} />}
                    </button>

                    {/* <select
                        aria-label={`${__("reader.navigation.currentPageTotal", { current: pageInfo?.currentPage, total: pageInfo.numberOfItems })}`}
                        className={stylesPublication.allBooks_header_pagination_select}
                        value={pageInfo?.currentPage}
                        onChange={(e) => {
                            const pageIndex = e.target.value;
                            console.log(pageIndex)
                        }}
                    >
                        {
                            ".".repeat(Math.ceil(pageInfo.numberOfItems / pageInfo.itemsPerPage)).split("").map((_s, i) => (
                                <option
                                    key={`page${i}`}
                                    value={i}>
                                    {i + 1} / {Math.ceil(pageInfo.numberOfItems / pageInfo.itemsPerPage)}
                                </option>
                            ))
                        }
                    </select> */}
                    <span className={stylesPublication.allBooks_header_pagination_opds_currentPage}>
                        {
                            pageInfo?.currentPage ?
                                <>{pageInfo.currentPage} {
                                    (pageInfo?.numberOfItems && pageInfo?.itemsPerPage) ?
                                        ` / ${Math.ceil(pageInfo.numberOfItems / pageInfo.itemsPerPage)}`
                                        : ""
                                }</>
                                : <></>
                        }
                    </span>
                    <button
                        className={stylesPublication.allBooks_header_pagination_arrow}
                        aria-label={`${__("opds.next")}`}
                        disabled={!pageLinks?.next[0]?.url || pageInfo?.currentPage === Math.ceil(pageInfo?.numberOfItems / (pageInfo?.itemsPerPage || 1))}>
                        {pageLinks?.next[0]?.url ?
                            <Link
                                to={{
                                    ...this.props.location,
                                    pathname: buildRoute(pageLinks.next[0]),
                                }}
                            >
                                <SVG ariaHidden={true} svg={ChevronRight} />
                            </Link>
                            : <SVG ariaHidden={true} svg={ChevronRight} />}
                    </button>

                    <button
                        className={stylesPublication.allBooks_header_pagination_arrow}
                        aria-label={`${__("opds.lastPage")}`}
                        disabled={!pageLinks?.last[0]?.url || pageInfo?.currentPage === Math.ceil(pageInfo?.numberOfItems / (pageInfo?.itemsPerPage || 1))}>
                        {
                            pageLinks?.last[0]?.url ?
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: buildRoute(pageLinks.last[0]),
                                    }}>
                                    <SVG ariaHidden={true} svg={ArrowLastIcon} />
                                </Link>
                                : <SVG ariaHidden={true} svg={ArrowLastIcon} />}
                    </button>
                </div>
            </div>
        );
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigatePreviousOPDSPage,
            this.onKeyboardPageNavigationPrevious);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigateNextOPDSPage,
            this.onKeyboardPageNavigationNext);

        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigatePreviousOPDSPageAlt,
            this.onKeyboardPageNavigationPrevious);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigateNextOPDSPageAlt,
            this.onKeyboardPageNavigationNext);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardPageNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardPageNavigationNext);
    }

    private onKeyboardPageNavigationNext = () => {
        this.onKeyboardPageNavigationPreviousNext(false);
    };
    private onKeyboardPageNavigationPrevious = () => {
        this.onKeyboardPageNavigationPreviousNext(true);
    };
    private onKeyboardPageNavigationPreviousNext = (isPrevious: boolean) => {
        const { pageLinks } = this.props;

        const buildRoute = buildOpdsBrowserRouteWithLink(this.props.location.pathname);

        if (pageLinks?.previous[0]?.url && isPrevious) { // TODO RTL
            this.props.historyPush({
                ...this.props.location,
                pathname: buildRoute(pageLinks.previous[0]),
            }, this.props.location.state as IRouterLocationState);
        } else if (pageLinks?.next[0]?.url) { // TODO RTL
            this.props.historyPush({
                ...this.props.location,
                pathname: buildRoute(pageLinks.next[0]),
            }, this.props.location.state as IRouterLocationState);
        }
    };
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    keyboardShortcuts: state.keyboard.shortcuts,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PageNavigation));
