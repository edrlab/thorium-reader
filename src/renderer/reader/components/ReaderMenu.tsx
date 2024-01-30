// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as BookmarkIcon from "readium-desktop/renderer/assets/icons/bookmark-icon.svg";
import * as BookOpenIcon from "readium-desktop/renderer/assets/icons/bookOpen-icon.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";

import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as Tabs from "@radix-ui/react-tabs";

import * as TocIcon from "readium-desktop/renderer/assets/icons/toc-icon.svg";
import * as LandmarkIcon from "readium-desktop/renderer/assets/icons/landmark-icon.svg";
import * as TargetIcon from "readium-desktop/renderer/assets/icons/target-icon.svg";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";
import { Link } from "@r2-shared-js/models/publication-link";

import SVG from "readium-desktop/renderer/common/components/SVG";

import { ILink, TToc } from "../pdf/common/pdfReader.type";
import { readerLocalActionBookmarks } from "../redux/actions";
import { IPopoverDialogProps, IReaderMenuProps } from "./options-values";
import ReaderMenuSearch from "./ReaderMenuSearch";
// import SideMenu from "./sideMenu/SideMenu";
// import { SectionData } from "./sideMenu/sideMenuData";
import UpdateBookmarkForm from "./UpdateBookmarkForm";

import { ComboBox, ComboBoxItem, MyComboBoxProps } from "readium-desktop/renderer/common/components/ComboBox";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderMenuProps, IPopoverDialogProps {
    focusNaviguationMenu: () => void;
    currentLocation: LocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    pdfNumberOfPages: number;
    handleMenuClick: (open: boolean) => void;
}

// TODO: in EPUB3 the NavDoc is XHTML with its own "dir" and "lang" markup,
// but this information is lost when converting to ReadiumWebPubManifest
// (e.g. TOC is hierarchical list of "link" objects with "title" property for textual label,
// LANDMARKS is a list of the same link objects, etc.)
// For example, there is a test Arabic EPUB that has non-RTL French labels in the TOC,
// which are incorrectly displayed as RTL because of this isRTL() logic:
const isRTL = (r2Publication: R2Publication) => (_link: ILink) => {
    // link.Dir??
    // link.Lang??
    // RWPM does not indicate this, so we fallback to publication-wide dir/lang metadata
    let isRTL = false;
    if (r2Publication?.Metadata?.Direction === "rtl") {
        const lang = r2Publication?.Metadata?.Language ?
            (Array.isArray(r2Publication.Metadata.Language) ?
                r2Publication.Metadata.Language :
                [r2Publication.Metadata.Language]) :
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
};

const renderLinkList = (isRTLfn: (_link: ILink) => boolean, handleLinkClick: IBaseProps["handleLinkClick"]) => {
    const T = (label: string, links: Link[]) => {

        return <ul
            aria-label={label}
            className={stylesPopoverDialog.chapters_content}
            role={"list"}
        >
            {links.map((link, i: number) => {

                const isRTL = isRTLfn(link);

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
                                handleLinkClick(e, link.Href, closeNavPanel);
                            } : undefined}
                            onDoubleClick=
                            {link.Href ? (e) => handleLinkClick(e, link.Href, false) : undefined}
                            tabIndex={0}
                            onKeyPress=
                            {
                                (e) => {
                                    if (link.Href && e.key === "Enter") {
                                        const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                        handleLinkClick(e, link.Href, closeNavPanel);
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
    };
    T.displayName = "LinkList";
    return T;
};

const renderLinkTree = (currentLocation: any, isRTLfn: (_link: ILink) => boolean, handleLinkClick: IBaseProps["handleLinkClick"]) => {
    const renderLinkTree = (label: string | undefined, links: TToc, level: number, headingTrailLink: ILink | undefined): JSX.Element => {
        // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
        const useTree = false;

        const linkRef = React.useRef<HTMLAnchorElement>();

        React.useEffect(() => {

            setTimeout(() => {
                if (linkRef.current) {
                    linkRef.current.focus();
                }
            }, 1)
        });

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
                if (currentLocation?.locator?.href && link.Href) {
                    let href1 = currentLocation.locator.href;
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

            if (currentLocation?.headings) {
                let iH = -1;
                for (const h of currentLocation.headings) {
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
                                iH === (currentLocation.headings.length - 1) &&
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
            className={classNames(stylesPopoverDialog.chapters_content, stylesPopoverDialog.toc_container)}
        >
            {links.map((link, i: number) => {

                const isRTL = isRTLfn(link);

                let emphasis = undefined;
                let flag = false;
                if (link === headingTrailLink) {
                    emphasis = { backgroundColor: "var(--color-light-grey)", borderLeft: "2px solid var(--color-blue)" };
                    flag = true;
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
                                            handleLinkClick(e, link.Href, closeNavPanel);
                                        } : undefined}
                                        onDoubleClick=
                                        {link.Href ? (e) => handleLinkClick(e, link.Href, false) : undefined}
                                        tabIndex={0}
                                        onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                                    handleLinkClick(e, link.Href, closeNavPanel);
                                                }
                                            }
                                        }
                                        data-href={link.Href}
                                        ref={flag ? linkRef : undefined}
                                    >
                                        <span dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                                    </a>
                                </div>

                                {renderLinkTree(undefined, link.Children, level + 1, headingTrailLink)}
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
                                        handleLinkClick(e, link.Href, closeNavPanel);
                                    } : undefined}
                                    onDoubleClick=
                                    {link.Href ? (e) => handleLinkClick(e, link.Href, false) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                    {
                                        (e) => {
                                            if (link.Href && e.key === "Enter") {
                                                const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                                                handleLinkClick(e, link.Href, closeNavPanel);
                                            }
                                        }
                                    }
                                    data-href={link.Href}
                                    ref={flag ? linkRef : undefined}
                                >
                                    <span dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                                </a>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>;
    };
    return renderLinkTree;
};

const BookmarkList: React.FC<{ r2Publication: R2Publication} & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const {r2Publication, goToLocator} = props;
    const [__] = useTranslator();
    const [bookmarkToUpdate, setBookmarkToUpdate] = React.useState(undefined);
    const bookmarks = useSelector((state: IReaderRootState) => state.reader.bookmark).map(([, v]) => v);
    const dispatch = useDispatch();
    const deleteBookmark = (bookmark: IBookmarkState) => {
        dispatch(readerLocalActionBookmarks.pop.build(bookmark));
    };
    if (!r2Publication || !bookmarks) {
        <></>;
    }

    const isAudioBook = isAudiobookFn(r2Publication);

    // WARNING: .sort() is in-place same-array mutation! (not a new array)
    const sortedBookmarks = bookmarks.sort((a, b) => {
        // -1 : a < b
        // 0 : a === b
        // 1 : a > b
        if (!a.locator?.href || !b.locator?.href) {
            return -1;
        }
        const indexA = r2Publication.Spine.findIndex((item) => item.Href === a.locator.href);
        const indexB = r2Publication.Spine.findIndex((item) => item.Href === b.locator.href);
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
        if (r2Publication.Spine?.length && bookmark.locator?.href) {
            const index = r2Publication.Spine.findIndex((item) => item.Href === bookmark.locator.href);
            if (index >= 0) {
                if (typeof bookmark.locator?.locations?.progression === "number") {
                    percent = 100 * ((index + bookmark.locator.locations.progression) / r2Publication.Spine.length);
                } else {
                    percent = 100 * (index / r2Publication.Spine.length);
                }
                percent = Math.round(percent * 100) / 100;
                p = Math.round(percent);
            }
        }
        const style = { width: `${percent}%` };

        const bname = (bookmark.name ? `${bookmark.name}` : `${__("reader.navigation.bookmarkTitle")} ${n++}`);

        const bprogression = (p >= 0 && !isAudioBook ? `${p}% ` : "");

        return (<div
            className={stylesPopoverDialog.bookmarks_line}
            key={i}
        >
            {bookmarkToUpdate === i &&
                <UpdateBookmarkForm
                    close={() => setBookmarkToUpdate(undefined)}
                    bookmark={bookmark}
                />
            }
            <div
                className={stylesPopoverDialog.bookmark_infos}
                tabIndex={0}
                onClick={(e) => {
                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                    goToLocator(bookmark.locator, closeNavPanel);
                }}
                onDoubleClick={(_e) => goToLocator(bookmark.locator, false)}
                onKeyPress=
                {
                    (e) => {
                        if (e.key === "Enter" || e.key === "Space") {
                            const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                            goToLocator(bookmark.locator, closeNavPanel);
                        }
                    }
                }
            >
                {/* <SVG ariaHidden={true} svg={BookmarkIcon} /> */}

                <div className={stylesPopoverDialog.chapter_marker}>
                    <p className={stylesPopoverDialog.bookmark_name} title={bname}>{bname}</p>
                    <div className={stylesPopoverDialog.bookmark_actions}>
                        <div>
                            <SVG ariaHidden svg={BookOpenIcon} />
                            <p>{bprogression}</p>
                        </div>
                        <div className={stylesPopoverDialog.bookmark_actions_buttons}>
                            <button title={__("reader.marks.edit")}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setBookmarkToUpdate(i);
                                    }
                                }>
                                <SVG ariaHidden={true} svg={EditIcon} />
                            </button>
                            <button title={__("reader.marks.delete")}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBookmark(bookmark)}}>
                                <SVG ariaHidden={true} svg={DeleteIcon} />
                            </button>
                        </div>
                    </div>
                    <div className={stylesPopoverDialog.gauge}>
                        <div className={stylesPopoverDialog.fill} style={style}></div>
                    </div>
                </div>
            </div>
        </div>);
    },
    );
};

const GoToPageSection: React.FC<IBaseProps & {totalPages?: number}> = (props) => {

    const { r2Publication, handleLinkClick, isDivina, isPdf, currentLocation, totalPages: totalPagesFromProps, goToLocator } = props
    let totalPages = `${totalPagesFromProps}`;
    const goToRef = React.useRef<HTMLInputElement>();

    const [refreshError, setRefreshError] = React.useState(false);
    const [pageError, setPageError] = React.useState(false);

    const [__] = useTranslator();

    React.useEffect(() => {
        if (refreshError) {
            if (pageError) {
                setPageError(false);
            } else {
                setPageError(true);
                setRefreshError(false);
            }
        }

    }, [refreshError, pageError]);

    const handleSubmitPage = (closeNavPanel = true) => {
        if (!goToRef?.current?.value) {
            return;
        }

        // currentLocation.docInfo.isFixedLayout
        const isFixedLayout = !r2Publication.PageList &&
            r2Publication.Metadata?.Rendition?.Layout === "fixed";

        const pageNbr = goToRef.current.value.trim().replace(/\s\s+/g, " ");
        if (isFixedLayout) {
            try {
                const spineIndex = parseInt(pageNbr, 10) - 1;
                const spineLink = r2Publication.Spine[spineIndex];
                if (spineLink) {
                    setPageError(false);
                    handleLinkClick(undefined, spineLink.Href, closeNavPanel);
                    return;
                }
            } catch (_e) {
                // ignore error
            }

            setRefreshError(true);
        } else if (isDivina || isPdf) {
            let page: number | undefined;

            if (isDivina) {
                // try {
                //     page = parseInt(pageNbr, 10) - 1;
                // } catch (_e) {
                //     // ignore error
                // }
            } else if (isPdf) {
                //
            }
            if (isPdf ||
                (typeof page !== "undefined" && page >= 0 &&
                    r2Publication.Spine && r2Publication.Spine[page])
            ) {

                setPageError(false);

                // handleLinkClick(undefined, pageNbr);
                const loc = {
                    href: (page || pageNbr).toString(),
                    // progression generate in divina pagechange event
                };
                goToLocator(loc as any, closeNavPanel);

                return;
            }

            setRefreshError(true);
        } else {
            const foundPage = r2Publication.PageList ?
                r2Publication.PageList.find((page) => page.Title === pageNbr) :
                undefined;
            if (foundPage) {
                setPageError(false);
                handleLinkClick(undefined, foundPage.Href, closeNavPanel);

                return;
            }

            setRefreshError(true);
        }
    }

    if (!r2Publication || isDivina) {
        return <></>;
    }

    // currentLocation.docInfo.isFixedLayout
    const isFixedLayout = r2Publication.Metadata?.Rendition?.Layout === "fixed";
    const isFixedLayoutWithPageList = isFixedLayout && r2Publication.PageList;
    const isFixedLayoutNoPageList = isFixedLayout && !isFixedLayoutWithPageList;

    let currentPageInPageList: string | undefined;
    if (currentLocation?.epubPageID && r2Publication.PageList) {
        const p = r2Publication.PageList.find((page) => {
            return page.Title && page.Href && page.Href.endsWith(`#${currentLocation.epubPageID}`);
        });
        if (p) {
            currentPageInPageList = p.Title;
        }
    }
    let currentPage: string | undefined;
    if (isDivina || isPdf) {
        currentPage = isDivina
            ? `${currentLocation?.locator.locations.position}`
            : currentLocation?.locator?.href;
    } else if (currentLocation?.epubPage) {
        const epubPageIsEmpty = currentLocation.epubPage.trim().length === 0;
        if (epubPageIsEmpty && currentPageInPageList) {
            currentPage = currentPageInPageList;
        } else if (!epubPageIsEmpty) {
            currentPage = currentLocation.epubPage;
        }
    }

    if (isFixedLayoutWithPageList && !currentPage && currentLocation?.locator?.href) {
        const page = r2Publication.PageList.find((l) => {
            return l.Href === currentLocation.locator.href;
        });
        if (page) {
            currentPage = page.Title;
            if (currentPage) {
                totalPages = r2Publication.PageList.length.toString();
            }
        }
    } else if (isFixedLayoutNoPageList &&
        currentLocation?.locator?.href &&
        r2Publication.Spine) {
        const spineIndex = r2Publication.Spine.findIndex((l) => {
            return l.Href === currentLocation.locator.href;
        });
        if (spineIndex >= 0) {
            currentPage = (spineIndex + 1).toString();
            totalPages = r2Publication.Spine.length.toString();
        }
    } else if (currentPage) {
        if (isDivina) {
            try {
                const p = parseInt(currentPage, 10) + 1;
                currentPage = p.toString();
            } catch (_e) {
                // ignore
            }
        } else if (isPdf) {
            currentPage = currentPage;
        }
    }

    let options:{ id: number; name: string; value: string; }[];

    if (isFixedLayoutNoPageList) {
        options = r2Publication.Spine.map((_spineLink, idx) => {
            const indexStr = (idx + 1).toString();
            return (
                {
                    id: idx +1,
                    name: indexStr,
                    value: indexStr,
                }
            );
        })
    } else if (r2Publication?.PageList) {
        options = r2Publication.PageList.map((pageLink, idx) => {
            return (
                pageLink.Title ?
                {
                    id: idx +1,
                    name: pageLink.Title,
                    value: pageLink.Title,
                }
                : null
            )
        })
    }

    let defaultKey;
    
    if (isFixedLayoutNoPageList || r2Publication?.PageList) {
        defaultKey = options.findIndex((value) => value.name === currentPage) +1;
    }
    

    return < div className={stylesPopoverDialog.goToPage} >
        {/* <p>{__("reader.navigation.goToTitle")}</p> */}

        <label className={stylesPopoverDialog.currentPage}
            id="gotoPageLabel"
            htmlFor="gotoPageInput">
                <SVG ariaHidden svg={BookOpenIcon} />
            {
                currentPage ?
                    (parseInt(totalPages, 10)
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
                            e.preventDefault();
                            handleSubmitPage(closeNavPanel);
                        }
                }
            }
        >

            {(isFixedLayoutNoPageList || r2Publication?.PageList) &&
            <div className={classNames(stylesInputs.form_group, stylesPopoverDialog.gotopage_combobox)} style={{width: "80%"}}>
                <label> {__("reader.navigation.goToPlaceHolder")}</label>
                <ComboBox
                    defaultItems={options}
                    defaultSelectedKey={defaultKey}
                    refInputEl={goToRef}
                    onSelectionChange={(ev) => {
                        const val = ev?.toString();
                        if (!val || !goToRef?.current) {
                            return;
                        }
                        goToRef.current.value = val;
                        setPageError(false);
                    }}
                    >
                    {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                </ComboBox>
            </div>
}

            <button
                type="button"
                
                onClick=
                {(e) => {
                    const closeNavPanel = e.shiftKey && e.altKey ? false : true;
                    e.preventDefault();
                    console.log(goToRef?.current?.value)
                    handleSubmitPage(closeNavPanel);
                }}
                onDoubleClick=
                {(e) => {e.preventDefault(); handleSubmitPage(false);}}
                disabled={
                    !(isFixedLayoutNoPageList || r2Publication.PageList || isDivina || isPdf)
                }
            >
                <SVG ariaHidden svg={TargetIcon} />
                {__("reader.navigation.goTo")}
            </button>
        </form>

        {pageError &&
            <p
                className={stylesPopoverDialog.goToErrorMessage}
                aria-live="assertive"
                aria-relevant="all"
                role="alert"
            >
                {__("reader.navigation.goToError")}
            </p>
        }

    </div>;
}



const TabTitle = ({title}: {title: string}) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{title}</h2>
        </div>
    );
};

export const ReaderMenu: React.FC<IBaseProps> = (props) => {
    const { r2Publication, /* toggleMenu */ pdfToc, isPdf, focusMainAreaLandmarkAndCloseMenu,
        pdfNumberOfPages, currentLocation, goToLocator, openedSection: tabValue, setOpenedSection: setTabValue } = props;
    const { setDockingMode, dockedMode, dockingMode } = props;
    const { focus, handleLinkClick } = props;

    const [__, translator] = useTranslator();

    // const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    const searchEnable = useSelector((state: IReaderRootState) => state.search.enable);
    const searchText = useSelector((state: IReaderRootState) => state.search.textSearch);
    const bookmarks = useSelector((state: IReaderRootState) => state.reader.bookmark).map(([, v]) => v);

    const prevValue = React.useRef<number>();

    // const tabTocRef = React.useRef<HTMLDivElement>();
    // const tabLandmarkRef = React.useRef<HTMLDivElement>();
    // const tabBookmarkRef = React.useRef<HTMLDivElement>();
    // const tabSearchRef = React.useRef<HTMLDivElement>();
    // const tabGoToPageRef = React.useRef<HTMLDivElement>();
    const dockedModeRef = React.useRef<HTMLInputElement>();
    const tabModeRef = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        console.log("readerMenu UPDATED");
        console.log("FocusNumber", focus, prevValue.current);
        
        if (focus !== prevValue.current) {
            console.log("FOCUS FOCUS", tabValue, "REQUESTED");
            
            prevValue.current = focus;
            return () => { };
        }

        console.log("FOCUS DOCKING MODE CHANGED 1ms");
        setTimeout(() => {
            console.log("readerMenu FOCUS");

            if (dockedMode) {
                if (dockedModeRef.current) {
                    dockedModeRef.current.focus();
                } else {
                    console.error("!no dockedModeRef on combobox");
                }
            } else {
                if (tabModeRef.current) {
                    tabModeRef.current.focus();
                } else {
                    console.error("!no tabModeRef on tabList");
                }
            }
        }, 1);

        console.log("FOCUS DOCKING MODE CHANGED 1s");
        const itv = setTimeout(() => {
            console.log("readerMenu FOCUS");

            if (dockedMode) {
                if (dockedModeRef.current) {
                    dockedModeRef.current?.focus();
                } else {
                    console.error("!no dockedModeRef on combobox");
                }
            } else {
                if (tabModeRef.current) {
                    tabModeRef.current?.focus();
                } else {
                    console.error("!no tabModeRef on tabList");
                }
            }
        }, 1000); // force focus on tabList instead of webview

        prevValue.current = focus;
        return () => clearInterval(itv);
    }, [dockingMode, focus]);

    if (!r2Publication) {
        return <>Critical Error no R2Publication available</>;
    }
    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");

    const sectionsArray: Array<React.JSX.Element> = [];
    const options: Array<{ id: number, value: string, name: string, disabled: boolean, svg: {} }> = [];

    const TocTrigger =
        <Tabs.Trigger value="tab-toc" key={"tab-toc"} data-value={"tab-toc"}
            disabled={
                (!r2Publication.TOC || r2Publication.TOC.length === 0) &&
                (!r2Publication.Spine || r2Publication.Spine.length === 0)
            }>
            <SVG ariaHidden svg={TocIcon} />
            <h3>{__("reader.marks.toc")}</h3>
        </Tabs.Trigger>;
    const optionTocItem = {
        id: 0, value: "tab-toc", name: __("reader.marks.toc"), disabled:
            (!r2Publication.TOC || r2Publication.TOC.length === 0) &&
            (!r2Publication.Spine || r2Publication.Spine.length === 0),
        svg: TocIcon,
    };

    const LandMarksTrigger =
        <Tabs.Trigger value="tab-landmark" key={"tab-landmark"} data-value={"tab-landmark"} disabled={!r2Publication.Landmarks || r2Publication.Landmarks.length === 0}>
            <SVG ariaHidden svg={LandmarkIcon} />
            <h3>{__("reader.marks.landmarks")}</h3>
        </Tabs.Trigger>;
    const optionLandmarkItem = {
        id: 1, value: "tab-landmark", name: __("reader.marks.landmarks"), disabled:
            !r2Publication.Landmarks || r2Publication.Landmarks.length === 0,
        svg: LandmarkIcon,
    };

    const BookmarksTrigger =
        <Tabs.Trigger value="tab-bookmark" key={"tab-bookmark"} data-value={"tab-bookmark"} disabled={!bookmarks || bookmarks.length === 0}>
            <SVG ariaHidden svg={BookmarkIcon} />
            <h3>{__("reader.marks.bookmarks")}</h3>
        </Tabs.Trigger>;
    const optionBookmarkItem = {
        id: 2, value: "tab-bookmark", name: __("reader.marks.bookmarks"), disabled: !bookmarks || bookmarks.length === 0,
        svg: BookmarkIcon,
    };

    const SearchTrigger =
        <Tabs.Trigger value="tab-search" key={"tab-search"} data-value={"tab-search"} disabled={/*!searchEnable ||*/ isPdf}>
            <SVG ariaHidden svg={SearchIcon} />
            <h3>{__("reader.marks.search")}</h3>
        </Tabs.Trigger>;
    const optionSearchItem = {
        id: 3, value: "tab-search", name: __("reader.marks.search"), disabled: /*!searchEnable ||*/ isPdf,
        svg: SearchIcon,
    };

    const GoToPageTrigger =
        <Tabs.Trigger value="tab-gotopage" key={"tab-gotopage"} data-value={"tab-gotopage"} disabled={false}>
            <SVG ariaHidden svg={TargetIcon} />
            <h3>Go To Page</h3>
        </Tabs.Trigger>;
    const optionGoToPageItem = {
        id: 4, value: "tab-gotopage", name: "Go To Page", disabled: false,
        svg: TargetIcon,
    };

    const Separator =
        <span key={"separator"} style={{ borderBottom: "1px solid var(--color-medium-grey)", width: "80%", margin: "0 10%" }}></span>;

    sectionsArray.push(TocTrigger);
    options.push(optionTocItem);
    sectionsArray.push(LandMarksTrigger);
    options.push(optionLandmarkItem);
    sectionsArray.push(SearchTrigger);
    options.push(optionSearchItem);
    sectionsArray.push(GoToPageTrigger);
    options.push(optionGoToPageItem);
    sectionsArray.push(Separator);
    sectionsArray.push(BookmarksTrigger);
    options.push(optionBookmarkItem);

    const optionSelected = options.find(({ value }) => value === tabValue)?.id || 0;

    const isRTL_ = isRTL(r2Publication);
    const renderLinkTree_ = renderLinkTree(currentLocation, isRTL_, handleLinkClick);
    const renderLinkList_ = renderLinkList(isRTL_, handleLinkClick);

    const ComboBoxRef = React.forwardRef<HTMLInputElement, MyComboBoxProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <ComboBox refInputEl={forwardedRef} {...props}></ComboBox>);
    ComboBoxRef.displayName = "ComboBox";

    return (
        <div>
            {
                dockedMode ? <div key="docked-header" className={stylesPopoverDialog.docked_header}>
                    <ComboBoxRef defaultItems={options} selectedKey={optionSelected}
                        svg={options.find(({ value }) => value === tabValue)?.svg}
                        onSelectionChange={(id) => {
                            console.log("selectionchange: ", id);
                            const value = options.find(({ id: _id }) => _id === id)?.value;
                            if (value) {
                                setTabValue(value);
                                console.log("set Tab Value = ", value);

                            } else {
                                console.error("Combobox No value !!!");
                            }
                        }}
                        onInputChange={(v) => {
                            console.log("inputchange: ", v);

                            const value = options.find(({ name }) => name === v)?.value;
                            if (value === tabValue) return;
                            if (value) {
                                setTabValue(value);
                                console.log("set Tab Value = ", value);

                            } else {
                                console.error("Combobox No value !!!");
                            }
                        }}
                        ref={dockedModeRef}
                    >
                        {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                    </ComboBoxRef>

                    <div key="docked-header-btn" className={stylesPopoverDialog.docked_header_controls}>
                        <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "left" ? true : false} aria-label="left" onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "right" ? true : false} aria-label="right" onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "full" ? true : false} aria-label="full" onClick={setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>

                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                </div> : <></>
            }
            <Tabs.Root value={tabValue} onValueChange={(value) => dockedMode ? null : setTabValue(value)} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                        <Tabs.List ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {sectionsArray}
                        </Tabs.List>
                }
                <div className={stylesSettings.settings_content}>
                    <Tabs.Content value="tab-toc" tabIndex={-1}>
                        <TabTitle title={__("reader.marks.toc")} />
                        <div className={stylesSettings.settings_tab}>
                            {(isPdf && pdfToc?.length && renderLinkTree_(__("reader.marks.toc"), pdfToc, 1, undefined)) ||
                                (isPdf && !pdfToc?.length && <p>{__("reader.toc.publicationNoToc")}</p>) ||
                                // tslint:disable-next-line: max-line-length
                                (!isPdf && r2Publication.TOC && renderLinkTree_(__("reader.marks.toc"), r2Publication.TOC, 1, undefined)) ||
                                (!isPdf && r2Publication.Spine && renderLinkList_(__("reader.marks.toc"), r2Publication.Spine))}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-landmark" tabIndex={-1}>
                        <TabTitle title={__("reader.marks.landmarks")} />
                        <div className={stylesSettings.settings_tab}>
                            {r2Publication.Landmarks &&
                                renderLinkList_(__("reader.marks.landmarks"), r2Publication.Landmarks)}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-bookmark" tabIndex={-1}>
                        <TabTitle title={__("reader.marks.bookmarks")} />
                        <div className={stylesSettings.settings_tab}>
                            <BookmarkList r2Publication={r2Publication} goToLocator={goToLocator} />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-search" tabIndex={-1}>
                        <TabTitle title={searchText ? translator.translate("reader.marks.searchResult", { searchText: searchText.slice(0, 20) }) : (__("reader.marks.search")) } />
                        <div className={classNames(stylesSettings.settings_tab, stylesPopoverDialog.search_container)}>
                            {searchEnable
                                ? <ReaderMenuSearch
                                    focusMainAreaLandmarkAndCloseMenu={focusMainAreaLandmarkAndCloseMenu}
                                ></ReaderMenuSearch>
                                : <></>}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-gotopage" tabIndex={-1}>
                        <TabTitle title="Go To Page" />
                        <div className={stylesSettings.settings_tab}>
                            <GoToPageSection totalPages={
                                isPdf && pdfNumberOfPages
                                    ? pdfNumberOfPages
                                    : 0} {...props}/>
                        </div>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
            {
                dockedMode ? <></> :
                    <div key="modal-header" className={stylesSettings.close_button_div}>
                        <button className={stylesButtons.button_transparency_icon} aria-label="left" onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} aria-label="right" onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled aria-label="full" onClick={setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
            }
        </div>
    );
};
