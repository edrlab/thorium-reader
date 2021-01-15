// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classnames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { LocatorView } from "readium-desktop/common/views/locator";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiAction } from "readium-desktop/renderer/reader/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/reader/apiSubscribe";
import { TFormEvent, TMouseEventOnButton } from "readium-desktop/typings/react";
import { Unsubscribe } from "redux";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";
import { Link } from "@r2-shared-js/models/publication-link";

import { ILink, TToc } from "../pdf/common/pdfReader.type";
import { IReaderMenuProps } from "./options-values";
import ReaderMenuSearch from "./ReaderMenuSearch";
import SideMenu from "./sideMenu/SideMenu";
import { SectionData } from "./sideMenu/sideMenuData";
import UpdateBookmarkForm from "./UpdateBookmarkForm";

// tslint:disable-next-line: no-empty-interface
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
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    bookmarkToUpdate: number;
    pageError: boolean;
    refreshError: boolean;
    bookmarks: LocatorView[] | undefined;
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
            bookmarks: undefined,
        };

        this.closeBookarkEditForm = this.closeBookarkEditForm.bind(this);
        this.handleSubmitPage = this.handleSubmitPage.bind(this);
    }

    public componentDidMount() {

        this.unsubscribe = apiSubscribe([
            "reader/addBookmark",
            "reader/deleteBookmark",
            "reader/updateBookmark",
        ], () => {
            apiAction("reader/findBookmarks", this.props.pubId)
            .then((bookmarks) => this.setState({bookmarks}))
            .catch((error) => console.error("Error to fetch api reader/findBookmark", error));
        });
    }

    public componentDidUpdate() {
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
        const { bookmarks } = this.state;
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
                    (isPdf && pdfToc?.length && this.renderLinkTree(__("reader.marks.toc"), pdfToc, 1)) ||
                    (isPdf && !pdfToc?.length && <p>{__("reader.toc.publicationNoToc")}</p>) ||
                    // tslint:disable-next-line: max-line-length
                    (!isPdf && r2Publication.TOC && this.renderLinkTree(__("reader.marks.toc"), r2Publication.TOC, 1)) ||
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
            {
                title: __("reader.marks.annotations"),
                content: <></>,
                disabled: true,
            },
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
                className={styles.chapters_settings}
                listClassName={styles.chapter_settings_list}
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
        // console.log(label, JSON.stringify(links, null, 4));

        return <ul
            aria-label={label}
            className={styles.chapters_content}
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
                                classnames(styles.line,
                                    styles.active,
                                    link.Href ? " " : styles.inert,
                                    isRTL ? styles.rtlDir : " ")
                            }
                            onClick=
                                {link.Href ? (e) => this.props.handleLinkClick(e, link.Href) : undefined}
                            tabIndex={0}
                            onKeyPress=
                                {
                                    (e) => {
                                        if (link.Href && e.key === "Enter") {
                                            this.props.handleLinkClick(e, link.Href);
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

    private renderLinkTree(label: string | undefined, links: TToc, level: number): JSX.Element {
        // console.log(label, JSON.stringify(links, null, 4));

        // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
        const useTree = false;

        return <ul
                    role={useTree ? (level <= 1 ? "tree" : "group") : undefined}
                    aria-label={label}
                    className={styles.chapters_content}
                >
            { links.map((link, i: number) => {

                const isRTL = this.isRTL(link);

                return (
                    <li key={`${level}-${i}`}
                        role={useTree ? "treeitem" : undefined}
                        aria-expanded={useTree ? "true" : undefined}
                    >
                        {link.Children ? (
                            <>
                            <div role={"heading"} aria-level={level}>
                                <a
                                    className={
                                        classnames(styles.subheading,
                                            link.Href ? " " : styles.inert,
                                            isRTL ? styles.rtlDir : " ")
                                    }
                                    onClick=
                                        {link.Href ? (e) => this.props.handleLinkClick(e, link.Href) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    this.props.handleLinkClick(e, link.Href);
                                                }
                                            }
                                        }
                                    data-href={link.Href}
                                >
                                    <span dir={isRTL ? "rtl" : "ltr"}>{link.Title ? link.Title : `#${level}-${i} ${link.Href}`}</span>
                                </a>
                            </div>

                            {this.renderLinkTree(undefined, link.Children, level + 1)}
                            </>
                        ) : (
                            <div role={"heading"} aria-level={level}>
                                <a
                                    className={
                                        classnames(styles.line,
                                            styles.active,
                                            link.Href ? " " : styles.inert,
                                            isRTL ? styles.rtlDir : " ")
                                    }
                                    onClick=
                                        {link.Href ? (e) => this.props.handleLinkClick(e, link.Href) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    this.props.handleLinkClick(e, link.Href);
                                                }
                                            }
                                        }
                                    data-href={link.Href}
                                >
                                    <span dir={isRTL ? "rtl" : "ltr"}>{link.Title ? link.Title : `#${level}-${i} ${link.Href}`}</span>
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
        if (this.props.r2Publication && this.state.bookmarks) {
            const { bookmarkToUpdate } = this.state;
            return this.state.bookmarks.sort((a, b) => {
                if (!a.locator || !b.locator) {
                    return 0;
                }
                if (!a.locator.locations || !b.locator.locations) {
                    return 0;
                }
                const aLink = this.props.r2Publication.Spine.find((link) => {
                    return link.Href === a.locator.href;
                });
                const aLinkIndex = this.props.r2Publication.Spine.indexOf(aLink);
                const bLink = this.props.r2Publication.Spine.find((link) => {
                    return link.Href === b.locator.href;
                });
                const bLinkIndex = this.props.r2Publication.Spine.indexOf(bLink);
                if (aLinkIndex > bLinkIndex) {
                    return 1;
                }
                if (aLinkIndex < bLinkIndex) {
                    return -1;
                }
                // aLinkIndex === bLinkIndex
                if (a.locator.locations.progression > b.locator.locations.progression) {
                    return 1;
                } else if (a.locator.locations.progression < b.locator.locations.progression) {
                    return -1;
                }
                return 0;
            }).map((bookmark, i) =>
                <div
                    className={styles.bookmarks_line}
                    key={i}
                >
                    { bookmarkToUpdate === i &&
                        <UpdateBookmarkForm
                            close={ this.closeBookarkEditForm }
                            bookmark={ bookmark }
                        />
                    }
                    <button
                        className={styles.bookmark_infos}
                        tabIndex={0}
                        onClick={(e) => this.handleBookmarkClick(e, bookmark)}
                    >
                        <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                        <div className={styles.chapter_marker}>
                            <p className={styles.bookmark_name}>
                                {bookmark.name ? bookmark.name : `Bookmark ${i}`}
                            </p>
                            <div className={styles.gauge}>
                                <div className={styles.fill}></div>
                            </div>
                        </div>
                    </button>
                    <button onClick={() => this.setState({bookmarkToUpdate: i})}>
                        <SVG title={ __("reader.marks.edit")} svg={ EditIcon }/>
                    </button>
                    <button onClick={() => this.deleteBookmark(bookmark.identifier)}>
                        <SVG title={ __("reader.marks.delete")} svg={ DeleteIcon }/>
                    </button>
                </div>,
            );
        }
        return undefined;
    }

    private deleteBookmark = (bookmarkId: string) => {
        apiAction("reader/deleteBookmark", bookmarkId)
            .catch((error) => console.error("Error to fetch api reader/deleteBookmark", error));
    }

    private buildGoToPageSection(totalPages?: string) {
        if (!this.props.r2Publication) {
            return <></>;
        }

        // this.props.currentLocation.docInfo.isFixedLayout
        const isFixedLayout = !this.props.r2Publication.PageList &&
            this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed";

        let currentPage = (this.props.isDivina || this.props.isPdf) ?
            this.props.currentLocation?.locator?.href :
            this.props.currentLocation?.epubPage;
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
                } catch (e) {
                    // ignore
                }
            } else if (this.props.isPdf) {
                currentPage = currentPage;
            }
        }

        const { __ } = this.props;

        return <div className={styles.goToPage}>
            <p className={styles.title}>{__("reader.navigation.goToTitle")}</p>

            <label className={styles.currentPage}
                id="gotoPageLabel"
                htmlFor="gotoPageInput">
                {
                currentPage ?
                (totalPages
                        // tslint:disable-next-line: max-line-length
                        ? __("reader.navigation.currentPageTotal", { current: `${currentPage}`, total: `${totalPages}` })
                        : __("reader.navigation.currentPage", { current: `${currentPage}`})) :
                ""
                }
            </label>

            <form onSubmit={this.handleSubmitPage}>
                {(isFixedLayout || this.props.r2Publication?.PageList) &&
                <select
                    onChange={(ev) => {
                        const val = ev.target?.value?.toString();
                        if (!val || !this.goToRef?.current) {
                            return;
                        }
                        this.goToRef.current.value = val;
                        this.setState({pageError: false});

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
                    onChange={() => this.setState({pageError: false})}
                    disabled={
                        !(isFixedLayout || this.props.r2Publication.PageList || this.props.isDivina || this.props.isPdf)
                    }
                    placeholder={__("reader.navigation.goToPlaceHolder")}
                    alt={__("reader.navigation.goToPlaceHolder")}
                />
                <button
                    type="submit"
                    disabled={
                        !(isFixedLayout || this.props.r2Publication.PageList || this.props.isDivina || this.props.isPdf)
                    }
                >
                    { __("reader.navigation.goTo") }
                </button>
            </form>
            {this.state.pageError &&
                <p
                    className={styles.goToErrorMessage}
                    aria-live="assertive"
                    aria-relevant="all"
                    role="alert"
                >
                    { __("reader.navigation.goToError") }
                </p>
            }

        </div>;
    }

    private closeBookarkEditForm() {
        this.setState({ bookmarkToUpdate: undefined });
    }

    private handleSubmitPage(e: TFormEvent) {
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
                    this.setState({pageError: false});
                    this.props.handleLinkClick(undefined, spineLink.Href);
                    return;
                }
            } catch (e) {
                // ignore error
            }

            this.setState({refreshError: true});
        } else if (this.props.isDivina || this.props.isPdf) {
            let page: number | undefined;

            if (this.props.isDivina) {
                try {
                    page = parseInt(pageNbr, 10) - 1;
                } catch (e) {
                    // ignore error
                }
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
                this.props.handleBookmarkClick(loc as any);

                return;
            }

            this.setState({refreshError: true});
        } else {
            const foundPage = this.props.r2Publication.PageList ?
                this.props.r2Publication.PageList.find((page) => page.Title === pageNbr) :
                undefined;
            if (foundPage) {
                this.setState({pageError: false});
                this.props.handleLinkClick(undefined, foundPage.Href);

                return;
            }

            this.setState({refreshError: true});
        }
    }

    private handleBookmarkClick(e: TMouseEventOnButton, bookmark: LocatorView) {
        e.preventDefault();
        this.props.handleBookmarkClick(bookmark.locator);
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
        // isDivina,
    };
};

export default connect(mapStateToProps)(withTranslator(ReaderMenu));
