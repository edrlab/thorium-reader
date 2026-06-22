// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesBookmarks from "readium-desktop/renderer/assets/styles/components/bookmarks.scss";
import classNames from "classnames";
import * as React from "react";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import SVG from "readium-desktop/renderer/common/components/SVG";

import * as BookmarkIcon from "readium-desktop/renderer/assets/icons/bookmarkMultiple-icon.svg";
import * as TocIcon from "readium-desktop/renderer/assets/icons/toc-icon.svg";
import * as LandmarkIcon from "readium-desktop/renderer/assets/icons/landmark-icon.svg";
import * as TargetIcon from "readium-desktop/renderer/assets/icons/target-icon.svg";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";
import * as AnnotationIcon from "readium-desktop/renderer/assets/icons/annotations-icon.svg";

import * as Tabs from "@radix-ui/react-tabs";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";
import type { Selection } from "react-aria-components";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { Link } from "@r2-shared-js/models/publication-link";
import { ILink, TToc } from "../../pdf/common/pdfReader.type";
import { IReaderMenuProps } from "../options-values";
import ReaderMenuSearch from "../ReaderMenuSearch";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { Locator } from "@r2-shared-js/models/locator";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerLocalActionLocatorHrefChanged } from "../../redux/actions";
import { useReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

import { shell } from "electron";
import { AnnotationList } from "./AnnotationList";
import { BookmarkList } from "./BookmarkList";
import { GoToPageSection } from "./GoToPageSection";
import { createOrGetPdfEventBus } from "../../pdf/driver";
import { ModalControlButtons } from "readium-desktop/renderer/reader/components/ModalControlButtons";
import { DockedHeader } from "readium-desktop/renderer/reader/components/DockedHeader";

(window as any).__shell_openExternal = (url: string) => url && /^https?:\/\//.test(url) ? shell.openExternal(url) : Promise.resolve(); // needed after markdown marked parsing for sanitizing the external anchor href

// console.log(window);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderMenuProps {
    // focusNaviguationMenu: () => void;
    currentLocation: MiniLocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    isAudiobook: boolean;
    pdfNumberOfPages: number;
    // handleMenuClick: (open: boolean) => void;
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
            const rtlExcludingJapanese = typeof cv === "string" ?
                // we test for Arabic and Hebrew and Farsi,
                // in order to exclude Japanese Vertical Writing Mode which is also RTL!
                // (
                //     cv === "ar" || cv.startsWith("ar-") ||
                //     cv === "he" || cv.startsWith("he-") ||
                //     cv === "fa" || cv.startsWith("fa-")

                //     // https://github.com/edrlab/thorium-reader/pull/3027
                //     // cv === "zh-Hant" || cv === "zh-TW"
                // )
                langStringIsRTL(cv) :
                false;
            return pv || rtlExcludingJapanese;
        }, false);
    }
    return isRTL;
};

const renderLinkList = (isRTLfn: (_link: ILink) => boolean, handleLinkClick: IBaseProps["handleLinkClick"], dockedMode: boolean) => {
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
                                const closeNavTOCList = !dockedMode && !(e.shiftKey && e.altKey);
                                handleLinkClick(e, link.Href, closeNavTOCList);
                            } : undefined}
                            onDoubleClick=
                            {link.Href ? (e) => handleLinkClick(e, link.Href, false) : undefined}
                            tabIndex={0}
                            onKeyUp=
                            {link.Href ?
                                (e) => {
                                    if (e.key === "Enter") {
                                        const closeNavTOCList = !dockedMode && !(e.shiftKey && e.altKey);
                                        handleLinkClick(e, link.Href, closeNavTOCList);
                                    }
                                }
                                : undefined
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

const renderLinkTree = (currentLocation: MiniLocatorExtended, isRTLfn: (_link: ILink) => boolean, handleLinkClick: IBaseProps["handleLinkClick"], dockedMode: boolean) => {
    const RenderLinkTree = (label: string | undefined, links: TToc, level: number, headingTrailLink: ILink | undefined): JSX.Element => {
        // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
        const useTree = false;

        const linkRef = React.useRef<HTMLAnchorElement>();

        React.useEffect(() => {
            setTimeout(() => {
                if (linkRef.current) {
                    // no "structural" focus steal here, just visual scroll into view
                    // linkRef.current.focus();
                    linkRef.current.scrollIntoView({
                        behavior: "instant",
                        block: "nearest", // "center" | "end" | "nearest" | "start",
                        inline: "nearest",
                    });
                }
            }, 1);
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
                if (link === headingTrailLink) {
                    emphasis = { backgroundColor: "var(--color-gray-50", borderLeft: "2px solid var(--color-brand-primary)" };
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
                                        ref={link === headingTrailLink ? linkRef : undefined}
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
                                            const closeNavTOCTree = !dockedMode && !(e.shiftKey && e.altKey);
                                            handleLinkClick(e, link.Href, closeNavTOCTree);
                                        } : undefined}
                                        onDoubleClick=
                                        {link.Href ? (e) => handleLinkClick(e, link.Href, false) : undefined}
                                        tabIndex={0}
                                        onKeyUp=
                                        {link.Href ?
                                            (e) => {
                                                if (e.key === "Enter") {
                                                    const closeNavTOCTree = !dockedMode && !(e.shiftKey && e.altKey);
                                                    handleLinkClick(e, link.Href, closeNavTOCTree);
                                                }
                                            }
                                            : undefined
                                        }
                                        data-href={link.Href}
                                    >
                                        <span dir={isRTL ? "rtl" : "ltr"}>{label}</span>
                                    </a>
                                </div>

                                {RenderLinkTree(undefined, link.Children, level + 1, headingTrailLink)}
                            </>
                        ) : (
                            <div role={"heading"} aria-level={level}>
                                <a
                                    ref={link === headingTrailLink ? linkRef : undefined}
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
                                        const closeNavTOCTree = !dockedMode && !(e.shiftKey && e.altKey);
                                        handleLinkClick(e, link.Href, closeNavTOCTree);
                                    } : undefined}
                                    onDoubleClick=
                                    {link.Href ? (e) => handleLinkClick(e, link.Href, false) : undefined}
                                    tabIndex={0}
                                    onKeyUp=
                                    {
                                        link.Href ?
                                            (e) => {
                                                if (e.key === "Enter") {
                                                    const closeNavTOCTree = !dockedMode && !(e.shiftKey && e.altKey);
                                                    handleLinkClick(e, link.Href, closeNavTOCTree);
                                                }
                                            }
                                            : undefined
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
    };
    return RenderLinkTree;
};

// const HardWrapComment: React.FC<{ comment: string | undefined }> = (props) => {
//     const { comment } = props;
//     if (!comment) {
//         return (
//             <p> </p>
//         );
//     }
//     const splittedComment = comment.split("\n");

//     const strListComponent = [];
//     let n = 0;
//     for (const strline of splittedComment) {
//         strListComponent.push(<span key={++n}>{strline}</span>);
//         strListComponent.push(<br key={++n} />);
//     }

//     return (
//         <p>
//             {
//                 strListComponent
//             }
//         </p>
//     );
// };

export const computeProgression = (spineItemLinks: Link[], locator: Locator) => {

    let percent = 100;
    if (spineItemLinks.length && locator.href) {
        const index = spineItemLinks.findIndex((item) => item.Href === locator.href);
        if (index >= 0) {
            if (typeof locator.locations?.progression === "number") {
                percent = 100 * ((index + locator.locations.progression) / spineItemLinks.length);
            } else {
                percent = 100 * (index / spineItemLinks.length);
            }
            percent = Math.round(percent * 100) / 100;
        }
    }

    return percent;
};

const selectionIsSet = (a: Selection): a is Set<string> => typeof a === "object";
const MAX_MATCHES_PER_PAGE = 5;
const START_PAGE = 1;

const TabTitle = ({ value }: { value: string }) => {
    let title: string;
    const [__] = useTranslator();
    const searchText = useSelector((state: IReaderRootState) => state.search.textSearch);

    switch (value) {
        case "tab-toc":
            title = __("reader.marks.toc");
            break;
        case "tab-landmark":
            title = __("reader.marks.landmarks");
            break;
        case "tab-bookmark":
            title = __("reader.marks.bookmarks");
            break;
        case "tab-search":
            title = searchText ? __("reader.marks.searchResult", { searchText: searchText.slice(0, 20) })
                : (__("reader.marks.search"));
            break;
        case "tab-gotopage":
            title = (__("reader.navigation.goToTitle"));
            break;
        case "tab-annotation":
            title = __("reader.marks.annotations");
            break;
    }
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{title}</h2>
        </div>
    );
};

export const ReaderMenu: React.FC<IBaseProps> = (props) => {
    const { /* toggleMenu */ pdfToc, isDivina, isPdf, isAudiobook, focusMainAreaLandmarkAndCloseMenu,
        pdfNumberOfPages, currentLocation, goToLocator, goToPdfAnnotation /*openedSection: tabValue, setOpenedSection: setTabValue*/ } = props;
    const isEpub = !isDivina && !isPdf && !isAudiobook;
    const { /*doFocus, annotationUUID,*/ handleLinkClick /*, resetAnnotationUUID*/ } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
    const setReaderConfig = useSaveReaderConfig();
    // memoization not needed here, onCick not passed as child component props (only event re-bind in local HTML element)
    // ... plus, see setDockingModeFull() and setDockingModeLeftSide() and setDockingModeRightSide() below which are the ones used in onClick!
    const section = useReaderConfig("readerMenuSection");
    const setSection = (value: string) => {
        setReaderConfig({ readerMenuSection: value });
    };
    const [__] = useTranslator();

    const popoverBoundary = React.useRef<HTMLDivElement>();

    // const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    const searchEnable = useSelector((state: IReaderRootState) => state.search.enable);
    // const bookmarks = useSelector((state: IReaderRootState) => state.reader.bookmark).map(([, v]) => v);
    // const annotations = useSelector((state: IReaderRootState) => state.reader.annotation).map(([, v]) => v);
    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    // const isFixedLayoutPublication = r2Publication.Metadata?.Rendition?.Layout === "fixed";
    // const isFixedLayoutWithPageList = isFixedLayoutPublication && r2Publication.PageList;
    // const isFixedLayoutNoPageList = isFixedLayoutPublication && !!r2Publication.PageList;

    const dispatch = useDispatch();

    const [serialAnnotator, setSerialAnnotatorMode] = React.useState(false);

    React.useEffect(() => {
        console.log("Reader MENU set serialAnnotator mode to ", serialAnnotator);
        (window as any).__annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator = serialAnnotator;
        if (isPdf) {
            createOrGetPdfEventBus().dispatch("annotations:set-instant-mode", {
                enabled: serialAnnotator,
            });
        }
    }, [isPdf, serialAnnotator]);

    const dockedModeRef = React.useRef<HTMLButtonElement>();
    const tabModeRef = React.useRef<HTMLDivElement>();

    // const annotationDivRef = React.useRef<HTMLDivElement>();

    // React.useEffect(() => {
    //     console.log("##########");
    //     console.log(`USE EFFECT [annotationUUID=${annotationUUID}] [doFocus=${doFocus}] [tabValue=${tabValue}] [dockedMode=${dockingMode}]`);
    //     console.log("##########");
    //     if (annotationUUID) {
    //         setTimeout(() => {
    //             const elem = document.getElementById(annotationUUID) as HTMLDivElement;
    //             if (elem) {
    //                 console.log(`annotationDiv found "(${elem.tagName})" and Focus on [${annotationUUID}]`);
    //                 // annotationDivRef.current = elem;
    //                 // TODO: what is the logic for stealing focus here? The result of keyboard or mouse interaction?
    //                 elem.focus();

    //             } else {
    //                 console.log(`annotationUUID=${annotationUUID} not found!`);
    //             }
    //         }, 1);
    //     } else if (dockingMode !== "full") {
    //         setTimeout(() => {
    //             if (dockedModeRef.current) {

    //                 console.log("Focus on docked mode combobox");

    //                 // TODO: what is the logic for stealing focus here? The result of keyboard or mouse interaction?
    //                 dockedModeRef.current.focus();
    //             } else {
    //                 console.error("!no dockedModeRef on combobox");
    //             }
    //         }, 1);
    //     } else {
    //     }
    // }, [tabValue, annotationUUID, doFocus, dockingMode]);

    if (!r2Publication) {
        return <>Critical Error no R2Publication available</>;
    }

    // // currentLocation.docInfo.isFixedLayout

    const isFixedLayoutPublication = r2Publication.Metadata?.Rendition?.Layout === "fixed";
    // const isFixedLayoutWithPageList = isFixedLayoutPublication && r2Publication.PageList;
    const isFixedLayoutNoPageList = isFixedLayoutPublication && !!r2Publication.PageList;

    const TabItem = [
        {
            id: 0,
            value: "tab-toc",
            name: __("reader.marks.toc"),
            disabled: (!r2Publication.TOC?.length) && (!r2Publication.Spine?.length),
            svg: TocIcon,
            show: true,
        },
        {
            id: 1,
            value: "tab-landmark",
            name: __("reader.marks.landmarks"),
            disabled: !r2Publication.Landmarks?.length,
            svg: LandmarkIcon,
            show: true,
        },
        {
            id: 2,
            value: "tab-search",
            name: __("reader.marks.search"),
            disabled: isPdf,
            svg: SearchIcon,
            show: isEpub,
        },
        {
            id: 3,
            value: "tab-gotopage",
            name: __("reader.marks.goTo"),
            disabled: !(isFixedLayoutNoPageList || r2Publication.PageList || isDivina || isPdf),
            svg: TargetIcon,
            show: isPdf || isEpub,
        },
        {
            id: 4,
            value: "tab-bookmark",
            name: __("reader.marks.bookmarks"),
            disabled: false,
            svg: BookmarkIcon,
            show: true,
            separatorBefore: true,
        },
        {
            id: 5,
            value: "tab-annotation",
            name: __("reader.marks.annotations"),
            disabled: false,
            svg: AnnotationIcon,
            show: isPdf || isEpub,
        },
    ];

    const visibleTabs = TabItem.filter(tab => tab.show);

    const TabTriggers = visibleTabs.flatMap(tab => {
        const trigger = (
            <Tabs.Trigger
                key={tab.value}
                id={`reader-menu-tab-${tab.value.replace("tab-", "")}-trigger`}
                value={tab.value}
                data-value={tab.value}
                title={tab.name}
                disabled={tab.disabled}
            >
                <SVG ariaHidden svg={tab.svg} />
                <span>{tab.name}</span>
            </Tabs.Trigger>
        );

        return tab.separatorBefore
            ? [<span key={`sep-before-${tab.value}`} style={{ borderBottom: "2px solid var(--color-gray-100)", width: "80%", margin: "0 10%" }} />, trigger]
            : [trigger];
    });

    const options = visibleTabs.map(({ id, value, name, svg, disabled }) => ({ id, value, name, svg, disabled }));
    const optionSelected = options.find(({ value }) => value === section)?.id ?? 0;

    const isRTL_ = isRTL(r2Publication);
    const renderLinkTree_ = renderLinkTree(currentLocation, isRTL_, handleLinkClick, dockedMode);
    const renderLinkList_ = renderLinkList(isRTL_, handleLinkClick, dockedMode);

    const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
    SelectRef.displayName = "Select";

    const advancedAnnotationsOnChange = () => {
        setSerialAnnotatorMode(!serialAnnotator);
    };
    const quickAnnotationsOnChange = () => {
        dispatch(readerActions.setConfig.build({ annotation_popoverNotOpenOnNoteTaking: !readerConfig.annotation_popoverNotOpenOnNoteTaking }));
    };
    const marginAnnotationsOnChange = () => {
        const annotation_defaultDrawView = readerConfig.annotation_defaultDrawView === "margin" ? "annotation" : "margin";

        console.log(`marginAnnotationsToggleSwitch : highlight=${annotation_defaultDrawView}`);
        dispatch(readerActions.setConfig.build({ annotation_defaultDrawView }));

        const href1 = currentLocation?.locator?.href;
        const href2 = currentLocation?.secondWebViewHref;
        dispatch(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
    };
    const hideAnnotationOnChange = () => {
        const annotation_defaultDrawView = readerConfig.annotation_defaultDrawView === "hide" ? "annotation" : "hide";

        console.log(`hideAnnotationsToggleSwitch : highlight=${annotation_defaultDrawView}`);
        dispatch(readerActions.setConfig.build({ annotation_defaultDrawView }));

        const href1 = currentLocation?.locator?.href;
        const href2 = currentLocation?.secondWebViewHref;
        dispatch(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
    };

    return (
        <div style={{ minHeight: "inherit" }}>
            <h1 style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: "0",
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                borderWidth: "0",
            }}>
                {__("reader.navigation.openTableOfContentsTitle")}
            </h1>
            {dockedMode ? <DockedHeader dockedMode={dockedMode} dockingMode={dockingMode} isEpub={isEpub} setSection={setSection} dockedModeRef={dockedModeRef} options={options} optionSelected={optionSelected} section={section} /> : <></>}
            <Tabs.Root value={section} onValueChange={(value) => dockedMode ? null : setSection(value)} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                        <>
                            <Tabs.List ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                                {TabTriggers}
                            </Tabs.List>
                            <TabTitle value={section} />
                        </>
                }
                <div className={stylesSettings.settings_content}
                    ref={popoverBoundary}
                    style={{ marginTop: dockedMode && "0" }}
                    role="region"
                    aria-live="polite"
                >
                    <Tabs.Content value="tab-toc" tabIndex={-1} id={"reader-menu-tab-toc"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            {(isPdf && pdfToc?.length && renderLinkTree_(__("reader.marks.toc"), pdfToc, 1, undefined)) ||
                                (isPdf && !pdfToc?.length && <p>{__("reader.toc.publicationNoToc")}</p>) ||
                                (!isPdf && r2Publication.TOC && renderLinkTree_(__("reader.marks.toc"), r2Publication.TOC, 1, undefined)) ||
                                (!isPdf && r2Publication.Spine && renderLinkList_(__("reader.marks.toc"), r2Publication.Spine))}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-landmark" tabIndex={-1} id={"reader-menu-tab-landmark"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            {r2Publication.Landmarks &&
                                renderLinkList_(__("reader.marks.landmarks"), r2Publication.Landmarks)}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-bookmark" tabIndex={-1} id={"reader-menu-tab-bookmark"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={classNames(stylesSettings.settings_tab, stylesBookmarks.bookmarks_tab)}>
                            <BookmarkList popoverBoundary={popoverBoundary.current} goToLocator={goToLocator} hideBookmarkOnChange={hideAnnotationOnChange} START_PAGE={START_PAGE} selectionIsSet={selectionIsSet} MAX_MATCHES_PER_PAGE={MAX_MATCHES_PER_PAGE} />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-annotation" tabIndex={-1} id={"reader-menu-tab-annotation"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={classNames(stylesSettings.settings_tab, stylesAnnotations.annotations_tab)}>
                            <AnnotationList
                                goToLocator={goToLocator}
                                goToPdfAnnotation={goToPdfAnnotation}
                                isPdf={isPdf}
                                // resetAnnotationUUID={resetAnnotationUUID}
                                // doFocus={doFocus}
                                popoverBoundary={popoverBoundary.current}
                                advancedAnnotationsOnChange={advancedAnnotationsOnChange}
                                quickAnnotationsOnChange={quickAnnotationsOnChange}
                                marginAnnotationsOnChange={marginAnnotationsOnChange}
                                hideAnnotationOnChange={hideAnnotationOnChange}
                                serialAnnotator={serialAnnotator}
                                START_PAGE={START_PAGE}
                                selectionIsSet={selectionIsSet}
                                MAX_MATCHES_PER_PAGE={MAX_MATCHES_PER_PAGE}
                            />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-search" tabIndex={-1} id={"reader-menu-tab-search"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={classNames(stylesSettings.settings_tab, stylesPopoverDialog.search_container)}>
                            {searchEnable
                                ? <ReaderMenuSearch
                                    focusMainAreaLandmarkAndCloseMenu={focusMainAreaLandmarkAndCloseMenu}
                                    dockedMode={dockedMode}
                                />
                                : <></>}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-gotopage" tabIndex={-1} id={"reader-menu-tab-gotopage"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <div className={stylesSettings.settings_tab}>
                            <GoToPageSection totalPages={
                                isPdf && pdfNumberOfPages
                                    ? pdfNumberOfPages
                                    : 0} {...props} />
                        </div>
                    </Tabs.Content>
                </div>
                <ModalControlButtons dockedMode={dockedMode} />
            </Tabs.Root>
        </div>
    );
};
