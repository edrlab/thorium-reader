// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";
import { Locator } from "readium-desktop/common/models/locator";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";
import * as BookmarkIcon from "readium-desktop/renderer/assets/icons/outline-bookmark-24px-grey.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TKeyboardEventButton, TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { Unsubscribe } from "redux";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";
import { Link } from "@r2-shared-js/models/publication-link";

import { ILink, TToc } from "../pdf/common/pdfReader.type";
import { readerLocalActionBookmarks } from "../redux/actions";
import { IReaderMenuProps } from "./options-values";
import ReaderMenuSearch from "./ReaderMenuSearch";
import SideMenu from "./sideMenu/SideMenu";
import { SectionData } from "./sideMenu/sideMenuData";
import UpdateBookmarkForm from "./UpdateBookmarkForm";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps, IReaderMenuProps {
    focusNaviguationMenu: () => void;
    currentLocation: LocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    pdfNumberOfPages: number;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    bookmarkToUpdate: number;
    pageError: boolean;
    refreshError: boolean;
}

export class ReaderMenu extends React.Component<IProps, IState> {
    private goToRef: React.RefObject<HTMLInputElement>;
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.goToRef = React.createRef<HTMLInputElement>();

        this.state = {
            bookmarkToUpdate: undefined,
            pageError: false,
            refreshError: false,
        };

        this.closeBookarkEditForm = this.closeBookarkEditForm.bind(this);
        this.handleSubmitPage = this.handleSubmitPage.bind(this);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public componentDidMount() {
    }

    public componentDidUpdate(oldProps: IProps) {

        if (this.props.openedSection === 0 && // TOC
            (oldProps.openedSection !== this.props.openedSection ||
            oldProps.open !== this.props.open)) {

            setTimeout(() => {
                const headingFocus = document.getElementById("headingFocus");
                if (headingFocus) {
                    headingFocus.focus();
                    headingFocus.scrollIntoView();
                }
            }, 500); // after openedSection 300ms (SideMenu.tsx componentDidUpdate())
        }

        if (this.state.refreshError) {
            if (this.state.pageError) {
                this.setState({pageError: false});
            } else {
                this.setState({
                    pageError: true,
                    refreshError: false,
                });
            }
        }
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __, r2Publication, toggleMenu, pdfToc, isPdf } = this.props;
        const { bookmarks } = this.props;
        if (!r2Publication) {
            return <></>;
        }

        // WARNING: do not modify zero-based index without adjusting Reader.tsx
        // showSearchResults (4)
        // showGotoPage (5)
        const sections: SectionData[] = [
            {
                title: __("reader.marks.toc"),
                content:
                    (isPdf && pdfToc?.length && this.renderLinkTree(__("reader.marks.toc"), pdfToc, 1, undefined)) ||
                    (isPdf && !pdfToc?.length && <p>{__("reader.toc.publicationNoToc")}</p>) ||
                    // tslint:disable-next-line: max-line-length
                    (!isPdf && r2Publication.TOC && this.renderLinkTree(__("reader.marks.toc"), r2Publication.TOC, 1, undefined)) ||
                    (!isPdf && r2Publication.Spine && this.renderLinkList(__("reader.marks.toc"), r2Publication.Spine)),
                disabled:
                    (!r2Publication.TOC || r2Publication.TOC.length === 0) &&
                    (!r2Publication.Spine || r2Publication.Spine.length === 0),
            },
            {
                title: __("reader.marks.landmarks"),
                content: r2Publication.Landmarks &&
                    this.renderLinkList(__("reader.marks.landmarks"), r2Publication.Landmarks),
                disabled: !r2Publication.Landmarks || r2Publication.Landmarks.length === 0,
            },
            {
                title: __("reader.marks.bookmarks"),
                content: this.createBookmarkList(),
                disabled: !bookmarks || bookmarks.length === 0,
            },
            /*{
                title: __("reader.marks.annotations"),
                content: <></>,
                disabled: true,
            },*/
            {
                title: __("reader.marks.search"),
                content: this.props.searchEnable
                    ? <ReaderMenuSearch
                        focusMainAreaLandmarkAndCloseMenu={this.props.focusMainAreaLandmarkAndCloseMenu}
                    ></ReaderMenuSearch>
                    : <></>,
                disabled: !this.props.searchEnable || this.props.isPdf,
                skipMaxHeight: true,
            },
            {
                content: this.buildGoToPageSection(
                    this.props.isPdf && this.props.pdfNumberOfPages
                        ? this.props.pdfNumberOfPages.toString()
                        : undefined),
                disabled: false,
                notExtendable: true,
            },
        ];

        return (
            <SideMenu
                openedSection={this.props.openedSection}
                className={stylesReader.chapters_settings}
                listClassName={stylesReader.chapter_settings_list}
                open={this.props.open}
                sections={sections}
                toggleMenu={toggleMenu}
                focusMenuButton={this.props.focusNaviguationMenu}
            />
        );
    }

    // TODO: in EPUB3 the NavDoc is XHTML with its own "dir" and "lang" markup,
    // but this information is lost when converting to ReadiumWebPubManifest
    // (e.g. TOC is hierarchical list of "link" objects with "title" property for textual label,
    // LANDMARKS is a list of the same link objects, etc.)
    // For example, there is a test Arabic EPUB that has non-RTL French labels in the TOC,
    // which are incorrectly displayed as RTL because of this isRTL() logic:
    private isRTL(_link: ILink) {
        // link.Dir??
        // link.Lang??
        // RWPM does not indicate this, so we fallback to publication-wide dir/lang metadata
        let isRTL = false;
        if (this.props.r2Publication?.Metadata?.Direction === "rtl") {
            const lang = this.props.r2Publication?.Metadata?.Language ?
                (Array.isArray(this.props.r2Publication.Metadata.Language) ?
                    this.props.r2Publication.Metadata.Language :
                    [this.props.r2Publication.Metadata.Language]) :
                [] as string[];
            isRTL = lang.reduce<boolean>((pv, cv) => {
                const arOrHe = typeof cv === "string" ?
                    // we test for Arabic and Hebrew,
                    // in order to exclude Japanese Vertical Writing Mode which is also RTL!
                    (cv.startsWith("ar") || cv.startsWith("he")) :
                    false;
                return pv || arOrHe;
            }, false);
        }
        return isRTL;
    }

    private renderLinkList(label: string, links: Link[]): JSX.Element {

        return <ul
            aria-label={label}
            className={stylesReader.chapters_content}
            role={"list"}
        >
            { links.map((link, i: number) => {

                const isRTL = this.isRTL(link);

                return (
                    <li
                        key={i}
                        aria-level={1}
                        role={"listitem"}
                    >
                        <a
                            className={
                                classNames(stylesReader.line,
                                    stylesReader.active,
                                    link.Href ? " " : stylesReader.inert,
                                    isRTL ? stylesReader.rtlDir : " ")
                            }
                            onClick=
                                {link.Href ? (e) => {
                                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                    this.props.handleLinkClick(e, link.Href, closeNavPanel);
                                } : undefined}
                            onDoubleClick=
                                {link.Href ? (e) => this.props.handleLinkClick(e, link.Href, false) : undefined}
                            tabIndex={0}
                            onKeyPress=
                                {
                                    (e) => {
                                        if (link.Href && e.key === "Enter") {
                                            const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                            this.props.handleLinkClick(e, link.Href, closeNavPanel);
                                        }
                                    }
                                }
                            data-href={link.Href}
                        >
                            <span dir={isRTL ? "rtl" : "ltr"}>{link.Title ? link.Title : `#${i} ${link.Href}`}</span>
                        </a>
                    </li>
                );
            })}
        </ul>;
    }

    private renderLinkTree(label: string | undefined, links: TToc, level: number, headingTrailLink: ILink | undefined): JSX.Element {
        // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
        const useTree = false;

        const treeReset = (t: TToc) => {
            for (const link of t) {
                if ((link as any).__inHeadingsTrail) {
                    delete (link as any).__inHeadingsTrail;
                }
                if (link.Children) {
                    treeReset(link.Children);
                }
            }
        };
        const headingsTrail: TToc = [];
        const treePass = (t: TToc) => {
            for (const link of t) {
                if (this.props.currentLocation?.locator?.href && link.Href) {
                    let href1 = this.props.currentLocation.locator.href;
                    const i_href1 = href1.lastIndexOf("#");
                    if (i_href1 >= 0) {
                        href1 = href1.substring(0, i_href1);
                    }
                    let href2 = link.Href;
                    const i_href2 = href2.lastIndexOf("#");
                    if (i_href2 >= 0) {
                        href2 = href2.substring(0, i_href2);
                    }
                    if (href1 && href2) {
                        if (href1 === href2) {
                            (link as any).__inHeadingsTrail = true;
                            headingsTrail.push(link);
                        }
                    }
                }
                if (link.Children) {
                    treePass(link.Children);
                }
            }
        };

        if (level === 1 && headingTrailLink === undefined) {
            treeReset(links);

            // headingsTrail = [];
            treePass(links);
            headingsTrail.reverse();

            if (this.props.currentLocation?.headings) {
                let iH = -1;
                for (const h of this.props.currentLocation.headings) {
                    iH++;
                    let iHH = -1;
                    for (const hh of headingsTrail) {
                        iHH++;
                        if (hh.Href) {
                            const i_hash = hh.Href.lastIndexOf("#");
                            const hash = i_hash >= 0 && i_hash < (hh.Href.length - 1) ?
                                hh.Href.substring(i_hash + 1) :
                                undefined;
                            if (hash && h.id === hash ||
                                iH === (this.props.currentLocation.headings.length - 1) &&
                                iHH === (headingsTrail.length - 1)) {
                                headingTrailLink = hh;
                                break;
                            }
                        }
                    }
                    if (headingTrailLink) {
                        break;
                    }
                }
            }
        }
        return <ul
                    role={useTree ? (level <= 1 ? "tree" : "group") : undefined}
                    aria-label={label}
                    className={stylesReader.chapters_content}
                >
            { links.map((link, i: number) => {

                const isRTL = this.isRTL(link);

                let emphasis = undefined;
                if (link === headingTrailLink) {
                    emphasis = { border: "transparent", outlineColor: "silver", outlineOffset: "0px", outlineWidth: "4px", outlineStyle: "double" };
                } else if ((link as any).__inHeadingsTrail) {
                    emphasis = { border: "1px dashed silver" };
                }
                const label = link.Title ? link.Title : `#${level}-${i} ${link.Href}`;
                return (
                    <li key={`${level}-${i}`}
                        role={useTree ? "treeitem" : undefined}
                        aria-expanded={useTree ? "true" : undefined}
                    >
                        {link.Children ? (
                            <>
                            <div role={"heading"} aria-level={level}>
                                <a
                                    id={link === headingTrailLink ? "headingFocus" : undefined}
                                    aria-label={link === headingTrailLink ? label + " (***)" : undefined}
                                    style={emphasis}
                                    className={
                                        classNames(stylesReader.subheading,
                                            link.Href ? " " : stylesReader.inert,
                                            isRTL ? stylesReader.rtlDir : " ")
                                    }
                                    onClick=
                                        {link.Href ? (e) => {
                                            const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                            this.props.handleLinkClick(e, link.Href, closeNavPanel);
                                        } : undefined}
                                    onDoubleClick=
                                        {link.Href ? (e) => this.props.handleLinkClick(e, link.Href, false) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                                    this.props.handleLinkClick(e, link.Href, closeNavPanel);
                                                }
                                            }
                                        }
                                    data-href={link.Href}
                                >
                                    <span dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                                </a>
                            </div>

                            {this.renderLinkTree(undefined, link.Children, level + 1, headingTrailLink)}
                            </>
                        ) : (
                            <div role={"heading"} aria-level={level}>
                                <a
                                    id={link === headingTrailLink ? "headingFocus" : undefined}
                                    aria-label={link === headingTrailLink ? label + " (***)" : undefined}
                                    style={emphasis}
                                    className={
                                        classNames(stylesReader.line,
                                            stylesReader.active,
                                            link.Href ? " " : stylesReader.inert,
                                            isRTL ? stylesReader.rtlDir : " ")
                                    }
                                    onClick=
                                        {link.Href ? (e) => {
                                            const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                            this.props.handleLinkClick(e, link.Href, closeNavPanel);
                                        } : undefined}
                                    onDoubleClick=
                                        {link.Href ? (e) => this.props.handleLinkClick(e, link.Href, false) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                                    this.props.handleLinkClick(e, link.Href, closeNavPanel);
                                                }
                                            }
                                        }
                                    data-href={link.Href}
                                >
                                    <span dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                                </a>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>;
    }

    private createBookmarkList(): JSX.Element[] {
        const { __ } = this.props;
        if (this.props.r2Publication && this.props.bookmarks) {

            const isAudioBook = isAudiobookFn(this.props.r2Publication);

            const { bookmarkToUpdate } = this.state;
            // WARNING: .sort() is in-place same-array mutation! (not a new array)
            const sortedBookmarks = this.props.bookmarks.sort((a, b) => {
                // -1 : a < b
                // 0 : a === b
                // 1 : a > b
                if (!a.locator?.href || !b.locator?.href) {
                    return -1;
                }
                const indexA = this.props.r2Publication.Spine.findIndex((item) => item.Href === a.locator.href);
                const indexB = this.props.r2Publication.Spine.findIndex((item) => item.Href === b.locator.href);
                if (indexA < indexB) {
                    return -1;
                }
                if (indexA > indexB) {
                    return 1;
                }
                if (typeof a.locator?.locations?.progression === "number" && typeof b.locator?.locations?.progression === "number") {
                    if (a.locator.locations.progression < b.locator.locations.progression) {
                        return -1;
                    }
                    if (a.locator.locations.progression > b.locator.locations.progression) {
                        return 1;
                    }
                }
                return 0;
            });
            let n = 1;
            return sortedBookmarks.map((bookmark, i) => {
                let percent = 100;
                let p = -1;
                if (this.props.r2Publication.Spine?.length && bookmark.locator?.href) {
                    const index = this.props.r2Publication.Spine.findIndex((item) => item.Href === bookmark.locator.href);
                    if (index >= 0) {
                        if (typeof bookmark.locator?.locations?.progression === "number") {
                            percent = 100 * ((index + bookmark.locator.locations.progression) / this.props.r2Publication.Spine.length);
                        } else {
                            percent = 100 * (index / this.props.r2Publication.Spine.length);
                        }
                        percent = Math.round(percent * 100) / 100;
                        p = Math.round(percent);
                    }
                }
                const style = { width: `${percent}%` };

                const bname = (p >= 0 && !isAudioBook ? `${p}% ` : "") + (bookmark.name ? `${bookmark.name}` : `${__("reader.navigation.bookmarkTitle")} ${n++}`);

                return (<div
                    className={stylesReader.bookmarks_line}
                    key={i}
                >
                    { bookmarkToUpdate === i &&
                        <UpdateBookmarkForm
                            close={ this.closeBookarkEditForm }
                        bookmark={bookmark}
                        />
                    }
                    <button
                        className={stylesReader.bookmark_infos}
                        tabIndex={0}
                        onClick={(e) => {
                            const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                            this.goToLocator(e, bookmark.locator, closeNavPanel);
                        }}
                        onDoubleClick={(e) => this.goToLocator(e, bookmark.locator, false)}
                        onKeyPress=
                        {
                            (e) => {
                                if (e.key === "Enter" || e.key === "Space") {
                                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                    this.goToLocator(e, bookmark.locator, closeNavPanel);
                                }
                            }
                        }
                    >
                        <SVG ariaHidden={true} svg={BookmarkIcon} />

                        <div className={stylesReader.chapter_marker}>
                            <p className={stylesReader.bookmark_name} title={bname}>{bname}</p>
                            <div className={stylesReader.gauge}>
                                <div className={stylesReader.fill} style={style}></div>
                            </div>
                        </div>
                    </button>
                    <button title={ __("reader.marks.edit")}
                    onClick={() => this.setState({bookmarkToUpdate: i})}>
                        <SVG ariaHidden={true} svg={ EditIcon }/>
                    </button>
                    <button title={ __("reader.marks.delete")}
                    onClick={() => this.props.deleteBookmark(bookmark)}>
                        <SVG ariaHidden={true} svg={ DeleteIcon }/>
                    </button>
                </div>);
                },
            );
        }
        return undefined;
    }

    private buildGoToPageSection(totalPages?: string) {
        if (!this.props.r2Publication || this.props.isDivina) {
            return <></>;
        }

        // this.props.currentLocation.docInfo.isFixedLayout
        const isFixedLayout = !this.props.r2Publication.PageList &&
            this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed";

        let currentPage = (this.props.isDivina || this.props.isPdf) ?
            (
                this.props.isDivina
                    ? `${this.props.currentLocation.locator.locations.position}`
                    : this.props.currentLocation?.locator?.href
            )
            : this.props.currentLocation?.epubPage;
        if (isFixedLayout &&
            this.props.currentLocation?.locator?.href &&
            this.props.r2Publication.Spine) {
            const spineIndex = this.props.r2Publication.Spine.findIndex((l) => {
                return l.Href === this.props.currentLocation.locator.href;
            });
            if (spineIndex >= 0) {
                currentPage = (spineIndex + 1).toString();
                totalPages = this.props.r2Publication.Spine.length.toString();
            }
        } else if (currentPage) {
            if (this.props.isDivina) {
                try {
                    const p = parseInt(currentPage, 10) + 1;
                    currentPage = p.toString();
                } catch (_e) {
                    // ignore
                }
            } else if (this.props.isPdf) {
                currentPage = currentPage;
            }
        }

        const { __ } = this.props;

        return < div className={stylesReader.goToPage} >
            <p>{__("reader.navigation.goToTitle")}</p>

            <label className={stylesReader.currentPage}
                id="gotoPageLabel"
                htmlFor="gotoPageInput">
                {
                    currentPage ?
                        (totalPages
                            // tslint:disable-next-line: max-line-length
                            ? __("reader.navigation.currentPageTotal", { current: `${currentPage}`, total: `${totalPages}` })
                            : __("reader.navigation.currentPage", { current: `${currentPage}` })) :
                        ""
                }
            </label>
            <form
                id="gotoPageForm"
                onSubmit={(e) => {
                    e.preventDefault();
                }
                }
                onKeyPress=
                    {
                        (e) => {
                            if (e.key === "Enter" || e.key === "Space") {
                                const closeNavPanel = e.shiftKey && e.altKey ? false : true;

                                console.log("CLose panel from button");

                                this.handleSubmitPage(e, closeNavPanel);
                            }
                        }
                    }
                >
                {(isFixedLayout || this.props.r2Publication?.PageList) &&
                    <select
                        title={__("reader.navigation.goToTitle")}
                        onChange={(ev) => {
                            const val = ev.target?.value?.toString();
                            if (!val || !this.goToRef?.current) {
                                return;
                            }
                            this.goToRef.current.value = val;
                            this.setState({ pageError: false });

                            // Warning: Use the `defaultValue` or `value` props on <select>
                            // instead of setting `selected` on <option>.
                            // ... BUT: this does not result in the behaviour we want,
                            // which is to display the current page, OR the user-selected page (not actually current yet)
                            // value={
                            //     this.props.r2Publication.PageList.find((pl) => {
                            //         return pl.Title === currentPage;
                            //     }) ?
                            //     currentPage : undefined
                            // }
                        }}
                    >
                        {
                            isFixedLayout
                                ?
                                this.props.r2Publication.Spine.map((_spineLink, idx) => {
                                    const indexStr = (idx + 1).toString();
                                    return (
                                        <option
                                            key={`pageGoto_${idx}`}
                                            value={indexStr}
                                            selected={currentPage === indexStr}
                                        >
                                            {indexStr}
                                        </option>
                                    );
                                })
                                :
                                this.props.r2Publication.PageList.map((pageLink, idx) => {
                                    return (
                                        pageLink.Title ?
                                            <option
                                                key={`pageGoto_${idx}`}
                                                value={pageLink.Title}
                                                selected={currentPage === pageLink.Title}
                                            >
                                                {pageLink.Title}
                                            </option> : <></>
                                    );
                                })
                        }
                    </select>
                }
                <input
                    id="gotoPageInput"
                    aria-labelledby="gotoPageLabel"
                    ref={this.goToRef}
                    type="text"
                    aria-invalid={this.state.pageError}
                    onChange={() => this.setState({ pageError: false })}
                    disabled={
                        !(isFixedLayout || this.props.r2Publication.PageList || this.props.isDivina || this.props.isPdf)
                    }
                    placeholder={__("reader.navigation.goToPlaceHolder")}
                    alt={__("reader.navigation.goToPlaceHolder")}
                />
                <button
                    type="button"

                    onClick=
                    {(e) => {
                        const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                        this.handleSubmitPage(e, closeNavPanel);
                    }}
                    onDoubleClick=
                    {(e) => this.handleSubmitPage(e, false)}
                    disabled={
                        !(isFixedLayout || this.props.r2Publication.PageList || this.props.isDivina || this.props.isPdf)
                    }
                >
                    {__("reader.navigation.goTo")}
                </button>
            </form>

            {this.state.pageError &&
                <p
                    className={stylesReader.goToErrorMessage}
                    aria-live="assertive"
                    aria-relevant="all"
                    role="alert"
                >
                    {__("reader.navigation.goToError")}
                </p>
            }

        </div>;
    }

    private closeBookarkEditForm() {
        this.setState({ bookmarkToUpdate: undefined });
    }

    private handleSubmitPage(e: React.MouseEvent<any> | React.KeyboardEvent<HTMLFormElement> | React.KeyboardEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLButtonElement>, closeNavPanel = true) {
        e.preventDefault();
        if (!this.goToRef?.current?.value) {
            return;
        }

        // this.props.currentLocation.docInfo.isFixedLayout
        const isFixedLayout = !this.props.r2Publication.PageList &&
            this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed";

        const pageNbr = this.goToRef.current.value.trim().replace(/\s\s+/g, " ");
        if (isFixedLayout) {
            try {
                const spineIndex = parseInt(pageNbr, 10) - 1;
                const spineLink = this.props.r2Publication.Spine[spineIndex];
                if (spineLink) {
                    this.setState({ pageError: false });
                    this.props.handleLinkClick(undefined, spineLink.Href, closeNavPanel);
                    return;
                }
            } catch (_e) {
                // ignore error
            }

            this.setState({ refreshError: true });
        } else if (this.props.isDivina || this.props.isPdf) {
            let page: number | undefined;

            if (this.props.isDivina) {
                // try {
                //     page = parseInt(pageNbr, 10) - 1;
                // } catch (_e) {
                //     // ignore error
                // }
            } else if (this.props.isPdf) {
                //
            }
            if (this.props.isPdf ||
                (typeof page !== "undefined" && page >= 0 &&
                    this.props.r2Publication.Spine && this.props.r2Publication.Spine[page])
            ) {

                this.setState({ pageError: false });

                // this.props.handleLinkClick(undefined, pageNbr);
                const loc = {
                    href: (page || pageNbr).toString(),
                    // progression generate in divina pagechange event
                };
                this.props.goToLocator(loc as any, closeNavPanel);

                return;
            }

            this.setState({refreshError: true});
        } else {
            const foundPage = this.props.r2Publication.PageList ?
                this.props.r2Publication.PageList.find((page) => page.Title === pageNbr) :
                undefined;
            if (foundPage) {
                this.setState({pageError: false});
                this.props.handleLinkClick(undefined, foundPage.Href, closeNavPanel);

                return;
            }

            this.setState({refreshError: true});
        }
    }

    private goToLocator(e: TKeyboardEventButton | TMouseEventOnButton, locator: Locator, closeNavPanel = true) {
        e.preventDefault();
        this.props.goToLocator(locator, closeNavPanel);
    }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    // TODO: extension or @type ?
    // const isDivina = this.props.r2Publication?.Metadata?.RDFType &&
    //    (/http[s]?:\/\/schema\.org\/ComicStrip$/.test(this.props.r2Publication.Metadata.RDFType) ||
    //    /http[s]?:\/\/schema\.org\/VisualNarrative$/.test(this.props.r2Publication.Metadata.RDFType));
    // const isDivina = path.extname(state?.reader?.info?.filesystemPath) === acceptedExtensionObject.divina;
    return {
        pubId: state.reader.info.publicationIdentifier,
        searchEnable: state.search.enable,
        bookmarks: state.reader.bookmark.map(([, v]) => v),
        // isDivina,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => {


    return {
        setBookmark: (bookmark: IBookmarkState) => {
            dispatch(readerLocalActionBookmarks.push.build(bookmark));
        },
        deleteBookmark: (bookmark: IBookmarkState) => {
            dispatch(readerLocalActionBookmarks.pop.build(bookmark));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderMenu));
