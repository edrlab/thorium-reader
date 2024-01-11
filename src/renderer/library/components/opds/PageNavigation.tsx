// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { IOpdsResultView } from "readium-desktop/common/views/opds";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/chevron-bar-left.svg";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/chevron-bar-right.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { buildOpdsBrowserRouteWithLink } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { dispatchHistoryPush, DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { TDispatch } from "readium-desktop/typings/redux";

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

    constructor(props: IProps) {
        super(props);

        this.onKeyboardPageNavigationPrevious = this.onKeyboardPageNavigationPrevious.bind(this);
        this.onKeyboardPageNavigationNext = this.onKeyboardPageNavigationNext.bind(this);
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();
    }

    public async componentDidUpdate(oldProps: IProps) {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render() {
        const { pageLinks, pageInfo, __ } = this.props;

        const buildRoute = buildOpdsBrowserRouteWithLink(this.props.location.pathname);

        return (
            <div className={classNames(stylesGlobal.justify_content_between, stylesGlobal.mt_30)}>
                <div>
                    {
                        pageLinks?.first[0]?.url ?
                            <Link
                                to={{
                                    ...this.props.location,
                                    pathname: buildRoute(pageLinks.first[0]),
                                }}
                                state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                                className={stylesButtons.button_primary}
                            >
                                <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                                {__("opds.firstPage")}
                            </Link>
                        :
                            <a
                                className={classNames(stylesButtons.button_primary, stylesButtons.disabled)}
                                tabIndex={-1}
                            >
                                <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                                {__("opds.firstPage")}
                            </a>
                    }
                    {
                        pageLinks?.previous[0]?.url ?
                            <Link
                                to={{
                                    ...this.props.location,
                                    pathname: buildRoute(pageLinks.previous[0]),
                                }}
                                state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                                className={stylesButtons.button_primary}
                            >
                                <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                                {__("opds.previous")}
                            </Link>
                        :
                            <a
                                className={classNames(stylesButtons.button_primary, stylesButtons.disabled)}
                                tabIndex={-1}
                            >
                                <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                                {__("opds.previous")}
                            </a>
                    }
                </div>
                {
                    pageInfo?.currentPage
                    && pageInfo.numberOfItems
                    && pageInfo.itemsPerPage
                    && <span>
                        {
                            pageInfo.currentPage
                        } / {
                            Math.ceil(pageInfo.numberOfItems / pageInfo.itemsPerPage)
                        }
                    </span>
                }
                <div>
                    {
                        pageLinks?.next[0]?.url ?
                            <Link
                                to={{
                                    ...this.props.location,
                                    pathname: buildRoute(pageLinks.next[0]),
                                }}
                                state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                                className={classNames(stylesButtons.button_primary, stylesButtons.icon_end)}
                            >
                                {__("opds.next")}
                                <SVG ariaHidden={true} svg={ArrowRightIcon} />
                            </Link>
                        :
                            <a
                                className={classNames(stylesButtons.button_primary, stylesButtons.disabled)}
                                tabIndex={-1}
                            >
                                {__("opds.next")}
                                <SVG ariaHidden={true} svg={ArrowRightIcon} />
                            </a>
                    }
                    {
                        pageLinks?.last[0]?.url ?
                            <Link
                                to={{
                                    ...this.props.location,
                                    pathname: buildRoute(pageLinks.last[0]),
                                }}
                                state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                                className={classNames(stylesButtons.button_primary, stylesButtons.icon_end)}
                            >
                                {__("opds.lastPage")}
                                <SVG ariaHidden={true} svg={ArrowLastIcon} />
                            </Link>
                        :
                            <a
                                className={classNames(stylesButtons.button_primary, stylesButtons.disabled)}
                                tabIndex={-1}
                            >
                                {__("opds.lastPage")}
                                <SVG ariaHidden={true} svg={ArrowLastIcon} />
                            </a>
                    }
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
