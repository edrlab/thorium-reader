// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import * as stylesBookmarks from "readium-desktop/renderer/assets/styles/components/bookmarks.scss";
import * as stylesMarkdown from "readium-desktop/renderer/assets/styles/github-markdown.scss";
import classNames from "classnames";
import * as React from "react";
import FocusLock from "react-focus-lock";

import SVG from "readium-desktop/renderer/common/components/SVG";

import * as SaveIcon from "readium-desktop/renderer/assets/icons/export-icon.svg";
import * as ImportIcon from "readium-desktop/renderer/assets/icons/import-icon.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as BookmarkIcon from "readium-desktop/renderer/assets/icons/bookmarkMultiple-icon.svg";
import * as BookOpenIcon from "readium-desktop/renderer/assets/icons/bookOpen-icon.svg";
import * as TocIcon from "readium-desktop/renderer/assets/icons/toc-icon.svg";
import * as LandmarkIcon from "readium-desktop/renderer/assets/icons/landmark-icon.svg";
import * as TargetIcon from "readium-desktop/renderer/assets/icons/target-icon.svg";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";
import * as AnnotationIcon from "readium-desktop/renderer/assets/icons/annotations-icon.svg";
import * as CalendarIcon from "readium-desktop/renderer/assets/icons/calendar-icon.svg";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/arrowLast-icon.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/arrowFirst-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/filter3-icon.svg";
import * as OptionsIcon from "readium-desktop/renderer/assets/icons/filter2-icon.svg";
import * as SortIcon from "readium-desktop/renderer/assets/icons/sort-icon.svg";
import * as HighLightIcon from "readium-desktop/renderer/assets/icons/highlight-icon.svg";
import * as UnderLineIcon from "readium-desktop/renderer/assets/icons/underline-icon.svg";
import * as TextStrikeThroughtIcon from "readium-desktop/renderer/assets/icons/TextStrikethrough-icon.svg";
import * as TextOutlineIcon from "readium-desktop/renderer/assets/icons/TextOutline-icon.svg";
import * as AvatarIcon from "readium-desktop/renderer/assets/icons/avatar-icon.svg";
// import * as DuplicateIcon from "readium-desktop/renderer/assets/icons/duplicate-icon.svg";

import * as Tabs from "@radix-ui/react-tabs";
import * as Popover from "@radix-ui/react-popover";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { MySelectProps, Select, SelectItem } from "readium-desktop/renderer/common/components/Select";
import { ListBox, ListBoxItem  } from "react-aria-components";
import type { Selection } from "react-aria-components";
import { AnnotationEdit } from "./AnnotationEdit";
import { TagGroup, TagList, Tag, Label } from "react-aria-components";
// import {TextArea} from 'react-aria-components';
// import { DialogTrigger as DialogTriggerReactAria, Popover as PopoverReactAria, Dialog as DialogReactAria } from "react-aria-components";

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { Link } from "@r2-shared-js/models/publication-link";
import { ILink, TToc } from "../pdf/common/pdfReader.type";
import { IReaderMenuProps } from "./options-values";
import ReaderMenuSearch from "./ReaderMenuSearch";
// import SideMenu from "./sideMenu/SideMenu";
// import { SectionData } from "./sideMenu/sideMenuData";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { Locator } from "@r2-shared-js/models/locator";
import { dialogActions, dockActions, readerActions } from "readium-desktop/common/redux/actions";
import { readerLocalActionLocatorHrefChanged, readerLocalActionSetConfig } from "../redux/actions";
import { useReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { IReaderDialogOrDockSettingsMenuState, ReaderConfig } from "readium-desktop/common/models/reader";
import { rgbToHex } from "readium-desktop/common/rgb";
import { ImportAnnotationsDialog } from "readium-desktop/renderer/common/components/ImportAnnotationsDialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { DockTypeName } from "readium-desktop/common/models/dock";
import { BookmarkEdit } from "./BookmarkEdit";
import { BookmarkLocatorInfo } from "./BookmarkLocatorInfo";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { EDrawType, INoteState, noteColorCodeToColorTranslatorKeySet, TDrawType } from "readium-desktop/common/redux/states/renderer/note";

import DOMPurify from "dompurify";
import { marked } from "marked";

import { shell } from "electron";
import { exportAnnotationSet } from "readium-desktop/renderer/common/redux/sagas/readiumAnnotation/export";
import { getSaga } from "../createStore";
import { clone } from "ramda";
(window as any).__shell_openExternal = (url: string) => url.startsWith("http") ? shell.openExternal(url) : Promise.resolve(); // needed after markdown marked parsing for sanitizing the external anchor href

// console.log(window);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderMenuProps {
    // focusNaviguationMenu: () => void;
    currentLocation: MiniLocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
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
                // we test for Arabic and Hebrew,
                // in order to exclude Japanese Vertical Writing Mode which is also RTL!
                // see langStringIsRTL()
                (
                    cv === "ar" || cv.startsWith("ar-") ||
                    cv === "he" || cv.startsWith("he-") ||
                    cv === "fa" || cv.startsWith("fa-") ||
                    cv === "zh-Hant" ||
                    cv === "zh-TW"
                ) :
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
                    emphasis = { backgroundColor: "var(--color-extralight-grey)", borderLeft: "2px solid var(--color-blue)" };
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

const AnnotationCard: React.FC<{ annotation: INoteState, isEdited: boolean, triggerEdition: (v: boolean) => void, setTagFilter: (v: string) => void, setCreatorFilter: (v: string) => void } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const { goToLocator, setTagFilter, setCreatorFilter } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
    const { annotation, isEdited, triggerEdition } = props;
    const { uuid, textualValue, tags: tagsStringArrayMaybeUndefined } = annotation;
    const tagsStringArray = tagsStringArrayMaybeUndefined || [];
    const tagName = tagsStringArray[0] || "";
    const dockedEditAnnotation = isEdited && dockedMode;
    const annotationColor = rgbToHex(annotation.color);

    const [textParsed, setTextParsed] = React.useState<string>();
    React.useEffect(() => {

        const fc = async () => {
            if (textualValue) {
                const parsed = DOMPurify.sanitize(await marked.parse(textualValue.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""), { gfm: true }), { FORBID_TAGS: ["style"], FORBID_ATTR: ["style"] });
                const regex = new RegExp(/href=\"(.*?)\"/, "gm");
                const hrefSanitized = parsed.replace(regex, (substring) => {

                    let url = /href=\"(.*?)\"/.exec(substring)[1];
                    if (!url.startsWith("http")) {
                        url = "http://" + url;
                    }

                    return `href="" alt="${url}" onclick="return ((e) => {
                                window.__shell_openExternal('${url}').catch(() => {});
                                return false;
                             })()"`;
                });
                setTextParsed(hrefSanitized);
                console.log(parsed, hrefSanitized);
            }
        };
        fc();
    }, [textualValue]);

    const dispatch = useDispatch();
    const [__] = useTranslator();
    const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    // const noteTotalCount = useSelector((state: IReaderRootState) => state.reader.noteTotalCount.state);
    const save = React.useCallback((color: IColor, comment: string, drawType: TDrawType, tags: string[]) => {
        dispatch(readerActions.note.addUpdate.build(
            pubId,
            {
                uuid: annotation.uuid,
                locatorExtended: clone(annotation.locatorExtended),
                color,
                textualValue: comment,
                drawType: EDrawType[drawType],
                tags,
                modified: (new Date()).getTime(),
                created: annotation.created,
                index: annotation.index,
                group: "annotation",
                creator: clone(annotation.creator),
            },
            annotation,
        ));
        triggerEdition(false);
        // dispatch(readerLocalActionReader.bookmarkTotalCount.build(noteTotalCount + 1));
    }, [dispatch, annotation, triggerEdition, pubId]);

    const date = new Date(annotation.modified || annotation.created);
    const dateStr = `${(`${date.getDate()}`.padStart(2, "0"))}/${(`${date.getMonth() + 1}`.padStart(2, "0"))}/${date.getFullYear()}`;

    const { percentRounded } = React.useMemo(() => {
        if (r2Publication.Spine && annotation.locatorExtended?.locator) {
            const percent = computeProgression(r2Publication.Spine || [], annotation.locatorExtended.locator);
            const percentRounded = Math.round(percent);
            return { style: { width: `${percent}%` }, percentRounded };
        }
        return { style: { width: "100%" }, percentRounded: 100 };
    }, [r2Publication, annotation]);

    // const bname = (annotation?.locatorExtended?.selectionInfo?.cleanText ? `${annotation.locatorExtended.selectionInfo.cleanText.slice(0, 20)}` : `${__("reader.navigation.annotationTitle")} ${index}`);
    const btext = (annotation.locatorExtended?.selectionInfo?.cleanText ? `${annotation.locatorExtended.selectionInfo.cleanText}` : `${__("reader.navigation.annotationTitle")} ${uuid}`);

    const bprogression = (percentRounded >= 0 ? `${percentRounded}% ` : "");

    if (!uuid) {
        return <></>;
    }

    const creatorName = annotation.creator?.name || "";

    return (<li
        className={stylesAnnotations.annotations_line}
        style={{ backgroundColor: dockedEditAnnotation ? "var(--color-extralight-grey)" : "", borderLeft: dockedEditAnnotation ? "none" : `4px solid ${annotationColor}` }}
        onKeyDown={isEdited ? (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                triggerEdition(false);
                setTimeout(() => {
                    const el = document.getElementById(`${uuid}_edit_button`);
                    el?.blur();
                    el?.focus();
                }, 100);
            }
        } : undefined}
        aria-label={__("reader.annotations.note", {color: __(Object.entries(noteColorCodeToColorTranslatorKeySet).find(([colorHex]) => colorHex === annotationColor)?.[1])})}
    >
        {/* <SVG ariaHidden={true} svg={BookmarkIcon} /> */}
        <div className={stylesAnnotations.annnotation_container}>
            {isEdited ?
                <></>
                : <button className={classNames(stylesAnnotations.annotation_name, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                    // title={bname}
                    aria-label={`${__("reader.goToContent")} (${btext})`}
                    style={{ borderLeft: dockedEditAnnotation && "2px solid var(--color-blue)" }}
                    onClick={(e) => {
                        e.preventDefault();
                        const closeNavAnnotation = !dockedMode && !(e.shiftKey && e.altKey);
                        if (annotation.locatorExtended) {
                            goToLocator(annotation.locatorExtended.locator, closeNavAnnotation);
                        }
                        // dispatch(readerLocalActionAnnotations.focus.build(annotation));
                    }}

                    // does not work on button (works on 'a' link)
                    // onDoubleClick={(_e) => {
                    //     e.preventDefault();
                    //     goToLocator(annotation.locatorExtended.locator, false);
                    //     dispatch(readerLocalActionAnnotations.focus.build(annotation));
                    // }}

                    // not necessary (onClick works)
                    // onKeyUp=
                    // {
                    //     (e) => {
                    //         // SPACE does not work (only without key mods on button)
                    //         // || e.key === "Space"
                    //         if (e.key === "Enter") {
                    ///            e.preventDefault();
                    //             const closeNavAnnotation = !dockedMode && !(e.shiftKey && e.altKey);
                    //             goToLocator(annotation.locatorExtended.locator, closeNavAnnotation);
                    //             dispatch(readerLocalActionAnnotations.focus.build(annotation));
                    //         }
                    //     }
                    // }
                    id={uuid}
                >
                    <p>{btext}</p>
                </button>
            }
            {
                isEdited
                    ?
                    <FocusLock disabled={false} autoFocus={true}>
                        <AnnotationEdit
                            uuid={uuid}
                            save={save}
                            cancel={() => triggerEdition(false)}
                            dockedMode={dockedMode}
                            drawType={EDrawType[annotation.drawType] as TDrawType}
                            color={annotation.color}
                            tags={annotation.tags}
                            comment={annotation.textualValue}
                            locatorExtended={annotation.locatorExtended}
                        />
                    </FocusLock>
                    :
                    <>
                        <div className={(stylesMarkdown as any)["markdown-body"]} dangerouslySetInnerHTML={{ __html: textParsed }} />
                        {/* <HardWrapComment comment={textualValue} /> */}
                        {tagName ? <div className={stylesTags.tags_wrapper} aria-label={__("catalog.tags")}>
                            <div className={stylesTags.tag}>
                                <a onClick={() => setTagFilter(tagName)}

                                    onKeyDown={(e) => {
                                        // if (e.code === "Space") {
                                        if (e.key === " " || e.altKey || e.ctrlKey) {
                                            e.preventDefault(); // prevent scroll
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        // Includes screen reader tests:
                                        // if (e.code === "Space") { WORKS
                                        // if (e.key === "Space") { DOES NOT WORK
                                        // if (e.key === "Enter") { WORKS
                                        if (e.key === " " || e.key === "Enter") { // WORKS
                                            e.preventDefault();
                                            e.currentTarget.click();
                                        }
                                    }}
                                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                    tabIndex={0}>
                                    {tagName}
                                </a>
                            </div>
                        </div>
                            : <></>}
                    </>
            }
        </div>
        <div className={stylesAnnotations.annotation_edit}>
            <div>
                <div aria-label={__("reader.annotations.date")}>
                    <SVG ariaHidden svg={CalendarIcon} />
                    <p>{dateStr}</p>
                </div>
                <div aria-label={__("publication.progression.title")}>
                    <SVG ariaHidden svg={BookOpenIcon} />
                    <p>{bprogression}</p>
                </div>
                {creatorName
                    ?
                    <div>
                        <SVG ariaHidden svg={AvatarIcon} />
                        <a onClick={() => setCreatorFilter(creatorName)}

                            onKeyDown={(e) => {
                                // if (e.code === "Space") {
                                if (e.key === " " || e.altKey || e.ctrlKey) {
                                    e.preventDefault(); // prevent scroll
                                }
                            }}
                            onKeyUp={(e) => {
                                // Includes screen reader tests:
                                // if (e.code === "Space") { WORKS
                                // if (e.key === "Space") { DOES NOT WORK
                                // if (e.key === "Enter") { WORKS
                                if (e.key === " " || e.key === "Enter") { // WORKS
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }}
                            tabIndex={0}>
                            <p style={{ overflow: "hidden", textOverflow: "ellipsis", padding: "0" }} title={creatorName}>{creatorName}</p>
                        </a>
                    </div>
                    : <></>
                }
            </div>
            <div className={stylesAnnotations.annotation_actions_buttons}>
                <button
                    id={`${uuid}_edit_button`}
                    title={__("reader.marks.edit")}
                    disabled={isEdited}
                    onClick={() => triggerEdition(true)}
                >
                    <SVG ariaHidden={true} svg={EditIcon} />
                </button>

                {/* <button>
                    <SVG ariaHidden={true} svg={DuplicateIcon} />
                </button> */}
                {/* <DialogTriggerReactAria>
                    <button title={__("reader.marks.delete")}
                    >
                        <SVG ariaHidden={true} svg={DeleteIcon} />
                    </button>
                    <PopoverReactAria>
                        <DialogReactAria>
                            <button onClick={() => {
                                // setItemToEdit(-1);
                                dispatch(readerActions.annotation.pop.build(annotation));
                            }}
                                title={__("reader.marks.delete")}
                            >
                                <SVG ariaHidden={true} svg={DeleteIcon} />
                                {__("reader.marks.delete")}
                            </button>
                        </DialogReactAria>
                    </PopoverReactAria>
                </DialogTriggerReactAria> */}
                {isEdited ?
                <button title={__("reader.marks.delete")}
                className={stylesPopoverDialog.delete_item_edition}
                onClick={() => {
                    triggerEdition(false);
                    dispatch(readerActions.note.remove.build(annotation));
                    // alert("deleted");
                }}
                >
                    <SVG ariaHidden={true} svg={DeleteIcon} />
                    {__("reader.marks.delete")}
                </button> :
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button
                        title={__("reader.marks.delete")}
                        >
                            <SVG ariaHidden={true} svg={DeleteIcon} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content collisionPadding={{ top: 180, bottom: 100 }} avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesPopoverDialog.delete_item}>
                            <Popover.Close
                                onClick={() => {
                                    triggerEdition(false);
                                    dispatch(readerActions.note.remove.build(annotation));
                                }}
                                title={__("reader.marks.delete")}
                            >
                                <SVG ariaHidden={true} svg={DeleteIcon} />
                                {__("reader.marks.delete")}
                            </Popover.Close>
                            <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                        </Popover.Content>
                    </Popover.Portal>

                </Popover.Root>
                }
            </div>
        </div>
        {/* <div className={stylesPopoverDialog.gauge}>
            <div className={stylesPopoverDialog.fill} style={style}></div>
        </div> */}
    </li>);
};

const BookmarkCard: React.FC<{ bookmark: INoteState, isEdited: boolean, triggerEdition: (v: boolean) => void, setTagFilter: (v: string) => void, setCreatorFilter: (v: string) => void } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const { goToLocator, setCreatorFilter, setTagFilter } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
    const { bookmark, isEdited, triggerEdition } = props;
    const { uuid, color, tags } = bookmark;
    const tag = Array.isArray(tags) ? tags[0] || "" : "";
    const dockedEditBookmark = isEdited && dockedMode;

    const [textParsed, setTextParsed] = React.useState<string>();
    React.useEffect(() => {

        const fc = async () => {
            if (bookmark.textualValue) {
                const parsed = DOMPurify.sanitize(await marked.parse(bookmark.textualValue.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""), { gfm: true }), { FORBID_TAGS: ["style"], FORBID_ATTR: ["style"] });
                const regex = new RegExp(/href=\"(.*?)\"/, "gm");
                const hrefSanitized = parsed.replace(regex, (substring) => {

                    let url = /href=\"(.*?)\"/.exec(substring)[1];
                    if (!url.startsWith("http")) {
                        url = "http://" + url;
                    }

                    return `href="" alt="${url}" onclick="return ((e) => {
                                window.__shell_openExternal('${url}').catch(() => {});
                                return false;
                             })()"`;
                });
                setTextParsed(hrefSanitized);
                console.log(parsed, hrefSanitized);
            }
        };
        fc();
    }, [bookmark.textualValue]);

    const dispatch = useDispatch();
    const [__] = useTranslator();

    const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    // const noteTotalCount = useSelector((state: IReaderRootState) => state.reader.noteTotalCount.state);
    const save = React.useCallback((name: string, color: IColor, tag: string | undefined) => {
        dispatch(readerActions.note.addUpdate.build(
            pubId,
            {
                uuid: bookmark.uuid,
                locatorExtended: clone(bookmark.locatorExtended),
                drawType: bookmark.drawType,
                textualValue: name,
                color,
                tags: tag ? [tag] : undefined,
                modified: (new Date()).getTime(),
                group: "bookmark",
                created: bookmark.created,
                index: bookmark.index,
                creator: clone(bookmark.creator),
            },
            bookmark,
        ));
        triggerEdition(false);
        // dispatch(readerLocalActionReader.bookmarkTotalCount.build(noteTotalCount + 1));
    }, [dispatch, bookmark, triggerEdition, pubId]);

    const date = new Date(bookmark.modified || bookmark.created);
    const dateStr = `${(`${date.getDate()}`.padStart(2, "0"))}/${(`${date.getMonth() + 1}`.padStart(2, "0"))}/${date.getFullYear()}`;

    const { percentRounded } = React.useMemo(() => {
        if (r2Publication.Spine && bookmark.locatorExtended?.locator) {
            const percent = computeProgression(r2Publication.Spine || [], bookmark.locatorExtended.locator);
            const percentRounded = Math.round(percent);
            return { style: { width: `${percent}%` }, percentRounded };
        }
        return { style: { width: "100%" }, percentRounded: 100 };
    }, [r2Publication, bookmark]);

    const bprogression = (percentRounded >= 0 ? `${percentRounded}% ` : "");

    if (!uuid) {
        return <></>;
    }

    const creatorName = bookmark.creator?.name || "";

    return (<li
        className={stylesAnnotations.annotations_line}
        style={{ backgroundColor: dockedEditBookmark ? "var(--color-extralight-grey)" : "", borderLeft: dockedEditBookmark ? "none" : `4px solid ${rgbToHex(color)}` }}
        onKeyDown={isEdited ? (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                triggerEdition(false);
                setTimeout(() => {
                    const el = document.getElementById(`${uuid}_edit_button`);
                    el?.blur();
                    el?.focus();
                }, 100);
            }
        } : undefined}
    >
        {/* <SVG ariaHidden={true} svg={BookmarkIcon} /> */}
        <div className={stylesAnnotations.annnotation_container}>
            {isEdited ?
                <></>
                : <div>
                    <button className={classNames(stylesAnnotations.annotation_name, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                    // title={bname}
                    aria-label={`${__("reader.goToContent")} (${__("reader.bookmarks.index", {index: bookmark.index})})`}
                    style={{ borderLeft: dockedEditBookmark && "2px solid var(--color-blue)" }}
                    onClick={(e) => {
                        e.preventDefault();
                        const closeNavAnnotation = !dockedMode && !(e.shiftKey && e.altKey);
                        if (bookmark.locatorExtended) {
                            goToLocator(bookmark.locatorExtended.locator, closeNavAnnotation);
                        }
                        // dispatch(readerLocalActionAnnotations.focus.build(annotation));
                    }}

                    // does not work on button (works on 'a' link)
                    // onDoubleClick={(_e) => {
                    //     e.preventDefault();
                    //     goToLocator(annotation.locatorExtended.locator, false);
                    //     dispatch(readerLocalActionAnnotations.focus.build(annotation));
                    // }}

                    // not necessary (onClick works)
                    // onKeyUp=
                    // {
                    //     (e) => {
                    //         // SPACE does not work (only without key mods on button)
                    //         // || e.key === "Space"
                    //         if (e.key === "Enter") {
                    ///            e.preventDefault();
                    //             const closeNavAnnotation = !dockedMode && !(e.shiftKey && e.altKey);
                    //             goToLocator(annotation.locatorExtended.locator, closeNavAnnotation);
                    //             dispatch(readerLocalActionAnnotations.focus.build(annotation));
                    //         }
                    //     }
                    // }
                    id={uuid}
                >
                        <p style={{ userSelect: "text" }}><BookmarkLocatorInfo fallback={__("reader.bookmarks.index", { index: bookmark.index })} locatorExtended={bookmark.locatorExtended} /></p>
                </button>
                </div>
            }
            {
                isEdited
                    ?
                    <FocusLock disabled={false} autoFocus={true}>
                        <BookmarkEdit
                            locatorExtended={bookmark.locatorExtended}
                            name={bookmark.textualValue}
                            uuid={bookmark.uuid}
                            color={bookmark.color}
                            tags={bookmark.tags}
                            save={save}
                            cancel={() => triggerEdition(false)}
                            dockedMode={dockedMode}
                        />
                    </FocusLock>
                    :
                    <>
                        {/* <HardWrapComment comment={bookmark.textualValue} /> */}
                        <div className={(stylesMarkdown as any)["markdown-body"]} dangerouslySetInnerHTML={{ __html: textParsed }} />
                        {tag ? <div className={stylesTags.tags_wrapper} aria-label={__("catalog.tags")}>
                            <div className={stylesTags.tag}>
                                <a onClick={() => setTagFilter(tag)}

                                    onKeyDown={(e) => {
                                        // if (e.code === "Space") {
                                        if (e.key === " " || e.altKey || e.ctrlKey) {
                                            e.preventDefault(); // prevent scroll
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        // Includes screen reader tests:
                                        // if (e.code === "Space") { WORKS
                                        // if (e.key === "Space") { DOES NOT WORK
                                        // if (e.key === "Enter") { WORKS
                                        if (e.key === " " || e.key === "Enter") { // WORKS
                                            e.preventDefault();
                                            e.currentTarget.click();
                                        }
                                    }}
                                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                    tabIndex={0}
                                    style={{ userSelect: "text" }}
                                >
                                    {tag}
                                </a>
                            </div>
                        </div>
                            : <></>}
                    </>
            }
        </div>
        <div className={stylesAnnotations.annotation_edit}>
            <div>
                <div aria-label={__("reader.annotations.date")}>
                    <SVG ariaHidden svg={CalendarIcon} />
                    <p style={{userSelect: "text"}}>{dateStr}</p>
                </div>
                <div aria-label={__("publication.progression.title")}>
                    <SVG ariaHidden svg={BookOpenIcon} />
                    <p style={{userSelect: "text"}}>{bprogression}</p>
                </div>
                {creatorName
                    ?
                    <div>
                        <SVG ariaHidden svg={AvatarIcon} />
                        <a onClick={() => setCreatorFilter(creatorName)}

                            onKeyDown={(e) => {
                                // if (e.code === "Space") {
                                if (e.key === " " || e.altKey || e.ctrlKey) {
                                    e.preventDefault(); // prevent scroll
                                }
                            }}
                            onKeyUp={(e) => {
                                // Includes screen reader tests:
                                // if (e.code === "Space") { WORKS
                                // if (e.key === "Space") { DOES NOT WORK
                                // if (e.key === "Enter") { WORKS
                                if (e.key === " " || e.key === "Enter") { // WORKS
                                    e.preventDefault();
                                    e.currentTarget.click();
                                }
                            }}
                            tabIndex={0}>
                            <p style={{ overflow: "hidden", textOverflow: "ellipsis", padding: "0", userSelect: "text" }} title={creatorName} >{creatorName}</p>
                        </a>
                    </div>
                    : <></>
                }
            </div>
            <div className={stylesBookmarks.bookmarks_actions_buttons}>
                <button
                    id={`${uuid}_edit_button`}
                    title={__("reader.marks.edit")}
                    disabled={isEdited}
                    onClick={() => triggerEdition(true)}
                >
                    <SVG ariaHidden={true} svg={EditIcon} />
                </button>

                {/* <button>
                    <SVG ariaHidden={true} svg={DuplicateIcon} />
                </button> */}
                {/* <DialogTriggerReactAria>
                    <button title={__("reader.marks.delete")}
                    >
                        <SVG ariaHidden={true} svg={DeleteIcon} />
                    </button>
                    <PopoverReactAria>
                        <DialogReactAria>
                            <button onClick={() => {
                                // setItemToEdit(-1);
                                dispatch(readerActions.annotation.pop.build(annotation));
                            }}
                                title={__("reader.marks.delete")}
                            >
                                <SVG ariaHidden={true} svg={DeleteIcon} />
                                {__("reader.marks.delete")}
                            </button>
                        </DialogReactAria>
                    </PopoverReactAria>
                </DialogTriggerReactAria> */}
                {isEdited ?
                <button title={__("reader.marks.delete")}
                className={stylesPopoverDialog.delete_item_edition}
                onClick={() => {
                    triggerEdition(false);
                    dispatch(readerActions.note.remove.build(bookmark));
                    // alert("deleted");
                }}
                >
                    <SVG ariaHidden={true} svg={DeleteIcon} />
                    {__("reader.marks.delete")}
                </button> :
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button
                        title={__("reader.marks.delete")}
                        >
                            <SVG ariaHidden={true} svg={DeleteIcon} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content collisionPadding={{ top: 180, bottom: 100 }} avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesPopoverDialog.delete_item}>
                            <Popover.Close
                                onClick={() => {
                                    triggerEdition(false);
                                    dispatch(readerActions.note.remove.build(bookmark));
                                }}
                                title={__("reader.marks.delete")}
                            >
                                <SVG ariaHidden={true} svg={DeleteIcon} />
                                {__("reader.marks.delete")}
                            </Popover.Close>
                            <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                        </Popover.Content>
                    </Popover.Portal>

                </Popover.Root>
                }
            </div>
        </div>
        {/* <div className={stylesPopoverDialog.gauge}>
            <div className={stylesPopoverDialog.fill} style={style}></div>
        </div> */}
    </li>);
};

const selectionIsSet = (a: Selection): a is Set<string> => typeof a === "object";
const MAX_MATCHES_PER_PAGE = 5;
const START_PAGE = 1;

const AnnotationList: React.FC<{ /*annotationUUIDFocused: string, resetAnnotationUUID: () => void, doFocus: number,*/ popoverBoundary: HTMLDivElement, advancedAnnotationsOnChange: () => void, quickAnnotationsOnChange: () => void, marginAnnotationsOnChange: () => void, hideAnnotationOnChange: () => void, serialAnnotator: boolean } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    const { goToLocator,/*annotationUUIDFocused, resetAnnotationUUID,*/ popoverBoundary, advancedAnnotationsOnChange, quickAnnotationsOnChange, marginAnnotationsOnChange, hideAnnotationOnChange, serialAnnotator } = props;

    const dispatch = useDispatch();
    const dockedMode = useSelector((state: IReaderRootState) => state.reader.config.readerDockingMode !== "full");
    const dialogOrDockDataInfo = useSelector((state: IReaderRootState): IReaderDialogOrDockSettingsMenuState =>
        (state.dialog.open && state.dialog.type === DialogTypeName.ReaderMenu) ?
            state.dialog.data as IReaderDialogOrDockSettingsMenuState : (state.dock.open && state.dock.type === DockTypeName.ReaderMenu) ?
                state.dock.data : {} as unknown as IReaderDialogOrDockSettingsMenuState);
    const updateDialogOrDockDataInfo = React.useCallback((data: IReaderDialogOrDockSettingsMenuState) => {
        dispatch(dockedMode ? dockActions.updateRequest.build(data) : dialogActions.updateRequest.build(data));
    }, [dockedMode, dispatch]);

    const [sortingOpen, setSortingOpen] = React.useState(false);
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const { id: needToFocusOnID, edit: annotationEdit } = dialogOrDockDataInfo;
    const [annotationUUID, setAnnotationUUID] = React.useState(needToFocusOnID);
    React.useEffect(() => {
        setAnnotationUUID(needToFocusOnID);
        setTagArrayFilter(new Set([]));
        setColorArrayFilter(new Set([]));
        setDrawTypeArrayFilter(new Set([]));
        setCreatorArrayFilter(new Set([]));
        setSortingOpen(false);
        setFilterOpen(false);
        setOptionsOpen(false);

    }, [needToFocusOnID]);

    const [__] = useTranslator();
    const notes = useSelector((state: IReaderRootState) => state.reader.note);
    const annotationsListAll = React.useMemo(() => notes.filter(({ group }) => group === "annotation"), [notes]);
    const publicationView = useSelector((state: IReaderRootState) => state.reader.info.publicationView);
    const winId = useSelector((state: IReaderRootState) => state.win.identifier);
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);

    const [tagArrayFilter, setTagArrayFilter] = React.useState<Selection>(new Set([]));
    const [colorArrayFilter, setColorArrayFilter] = React.useState<Selection>(new Set([]));
    const [drawTypeArrayFilter, setDrawTypeArrayFilter] = React.useState<Selection>(new Set([]));
    const [creatorArrayFilter, setCreatorArrayFilter] = React.useState<Selection>(new Set([]));

    const [pageNumber, setPageNumber] = React.useState(START_PAGE);
    const changePageNumber = React.useCallback((cb: (n: number) => number) => {
        setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100);
        updateDialogOrDockDataInfo({id: "", edit: false});
        setPageNumber(cb);
    }, [setPageNumber, updateDialogOrDockDataInfo]);

    const tagsIndexList = useSelector((state: IReaderRootState) => state.noteTagsIndex);
    const selectTagOption = React.useMemo(() => tagsIndexList.map((v, i) => ({ id: i, name: v.tag })), [tagsIndexList]);

    // if tagArrayFilter value not include in the selectTagOption then take only the intersection between tagArrayFilter and selectTagOption
    const selectTagOptionFilteredNameArray = React.useMemo(() => selectTagOption.map((v) => v.name), [selectTagOption]);
    // const tagArrayFilterArray = selectionIsSet(tagArrayFilter) ? Array(...tagArrayFilter) : [];
    // if (tagArrayFilterArray.filter((tagValue) => !selectTagOptionFilteredNameArray.includes(tagValue)).length) {
    //     const tagArrayFilterArrayDifference = tagArrayFilterArray.filter((tagValue) => selectTagOptionFilteredNameArray.includes(tagValue));
    //     setTagArrayFilter(new Set(tagArrayFilterArrayDifference));
    // }

    const creatorListName = React.useMemo(() => annotationsListAll.map(({ creator }) => creator?.name).filter(v => v), [annotationsListAll]);
    const selectCreatorOptions = React.useMemo(() => [...(new Set(creatorListName))].map((name, index) => ({ id: `${index}_${name}`, name })), [creatorListName]);
    const annotationsColors = React.useMemo(() => Object.entries(noteColorCodeToColorTranslatorKeySet).map(([k, v]) => ({ hex: k, name: __(v) })), [__]);
    const selectDrawtypesOptions = React.useMemo(() => [
        { name: "solid_background", svg: HighLightIcon, textValue: `${__("reader.annotations.type.solid")}` },
        { name: "underline", svg: UnderLineIcon, textValue: `${__("reader.annotations.type.underline")}` },
        { name: "strikethrough", svg: TextStrikeThroughtIcon, textValue: `${__("reader.annotations.type.strikethrough")}` },
        { name: "outline", svg: TextOutlineIcon,  textValue: `${__("reader.annotations.type.outline")}` },
    ], [__]);

    const annotationListFiltered = React.useMemo(() => {

        return (
            (selectionIsSet(tagArrayFilter) && tagArrayFilter.size) ||
            (tagArrayFilter === "all") ||
            (selectionIsSet(colorArrayFilter) && colorArrayFilter.size) ||
            (colorArrayFilter === "all") ||
            (selectionIsSet(drawTypeArrayFilter) && drawTypeArrayFilter.size) ||
            (drawTypeArrayFilter === "all") ||
            (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size) ||
            (creatorArrayFilter === "all")
        )
            ? annotationsListAll.filter(({ tags, color, drawType: _drawType, creator }) => {

                const colorHex = rgbToHex(color);
                const drawType = EDrawType[_drawType];
                const creatorName = creator?.name || "";

                return ((tagArrayFilter === "all" && tags?.some((tagsValueName) => selectTagOptionFilteredNameArray.includes(tagsValueName))) || (selectionIsSet(tagArrayFilter) && tagArrayFilter.size && tags?.some((tagsValueName) => tagArrayFilter.has(tagsValueName)))) ||
                    ((colorArrayFilter === "all" && annotationsColors.some(({hex}) => hex === colorHex)) || (selectionIsSet(colorArrayFilter) && colorArrayFilter.size && colorArrayFilter.has(colorHex))) ||
                    ((drawTypeArrayFilter === "all" && selectDrawtypesOptions.some(({name}) => drawType === name)) || (selectionIsSet(drawTypeArrayFilter) && drawTypeArrayFilter.size && drawTypeArrayFilter.has(drawType))) ||
                    ((creatorArrayFilter === "all" && creatorListName.includes(creatorName)) || (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size && creatorArrayFilter.has(creatorName)));

            })
            : annotationsListAll;
    }, [annotationsListAll, tagArrayFilter, colorArrayFilter, drawTypeArrayFilter, creatorArrayFilter, annotationsColors, creatorListName, selectDrawtypesOptions, selectTagOptionFilteredNameArray]);

    const [sortType, setSortType] = React.useState<Selection>(new Set(["lastCreated"]));

    if (sortType !== "all" && sortType.has("progression")) {

        annotationListFiltered.sort((a, b) => {

            if (!a.locatorExtended || !b.locatorExtended) {
                return 0;
            }
            const { locatorExtended: { locator: la } } = a;
            const { locatorExtended: { locator: lb } } = b;
            const pcta = computeProgression(r2Publication.Spine, la);
            const pctb = computeProgression(r2Publication.Spine, lb);
            return pcta - pctb;
        });
    } else if (sortType !== "all" && sortType.has("lastCreated")) {
        annotationListFiltered.sort(({ created: ca }, { created: cb }) => {
            return cb - ca;
        });
    } else if (sortType !== "all" && sortType.has("lastModified")) {
        annotationListFiltered.sort(({ modified: ma }, { modified: mb }) => {
            return ma && mb ? mb - ma : ma ? -1 : mb ? 1 : 0;
        });
    }

    const annotationFocusFoundIndex = annotationUUID ? annotationListFiltered.findIndex(({ uuid }) => annotationUUID === uuid) : -1;
    React.useEffect(() => {
        if (annotationUUID) {
            setAnnotationUUID("");
            const annotationFocusItemPageNumber = Math.ceil((annotationFocusFoundIndex + 1 /* 0 based */) / MAX_MATCHES_PER_PAGE);
            setPageNumber((pageNumber) => annotationFocusItemPageNumber !== pageNumber ? annotationFocusItemPageNumber : pageNumber);

        }
    }, [annotationUUID, annotationFocusFoundIndex]);

    const pageTotal = Math.ceil(annotationListFiltered.length / MAX_MATCHES_PER_PAGE) || 1;
    if (pageNumber <= 0) {
        setPageNumber(START_PAGE);
    } else if (pageNumber > pageTotal) {
        setPageNumber(pageTotal);
    }

    const startIndex = (pageNumber - 1) * MAX_MATCHES_PER_PAGE;
    const annotationsPagedArray = annotationListFiltered.slice(startIndex, startIndex + MAX_MATCHES_PER_PAGE);

    const isLastPage = pageTotal === pageNumber;
    const isFirstPage = pageNumber === 1;
    const isPaginated = pageTotal > 1;
    const pageOptions = Array.from({ length: pageTotal }, (_k, v) => (v += 1, ({ id: v, name: `${v} / ${pageTotal}` })));
    const begin = startIndex + 1;
    const end = Math.min(startIndex + MAX_MATCHES_PER_PAGE, annotationListFiltered.length);

    const triggerEdition = (annotationItem: INoteState) =>
        (value: boolean) => value ? updateDialogOrDockDataInfo({id: annotationItem.uuid, edit: true}) : updateDialogOrDockDataInfo({id: "", edit: false});

    const nbOfFilters = ((tagArrayFilter === "all") ?
        selectTagOption.length : tagArrayFilter.size) + ((colorArrayFilter === "all") ?
            annotationsColors.length : colorArrayFilter.size) + ((drawTypeArrayFilter === "all") ?
                selectDrawtypesOptions.length : drawTypeArrayFilter.size) + ((creatorArrayFilter === "all") ?
                    selectCreatorOptions.length : creatorArrayFilter.size);

    const paginatorAnnotationsRef = React.useRef<HTMLSelectElement>();
    const annotationTitleRef = React.useRef<HTMLInputElement>();
    const selectFileTypeRef = React.useRef<HTMLSelectElement & { value: "html" | "annotation" }>();

    return (
        <>
            <div className={stylesAnnotations.annotations_filter_line}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Popover.Root open={sortingOpen} onOpenChange={(open) => setSortingOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.sorting.sortingOptions")} className={stylesAnnotations.annotations_filter_trigger_button}
                                title={__("reader.annotations.sorting.sortingOptions")}>
                                <SVG svg={SortIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_sorting_container} style={{ maxHeight: Math.round(window.innerHeight / 2) }}>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <ListBox
                                    selectedKeys={sortType}
                                    onSelectionChange={setSortType}
                                    selectionMode="multiple"
                                    selectionBehavior="replace"
                                    aria-label={__("reader.annotations.sorting.sortingOptions")}
                                >
                                    <ListBoxItem id="progression" key="progression" aria-label="progression" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                        style={{ marginBottom: "5px" }}
                                    >
                                        {__("reader.annotations.sorting.progression")}
                                    </ListBoxItem>
                                    <ListBoxItem id="lastCreated" key="lastCreated" aria-label="lastCreated" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                        style={{ marginBottom: "5px" }}
                                    >
                                        {__("reader.annotations.sorting.lastcreated")}
                                    </ListBoxItem>
                                    <ListBoxItem id="lastModified" key="lastModified" aria-label="lastModified" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                    >
                                        {__("reader.annotations.sorting.lastmodified")}
                                    </ListBoxItem>
                                </ListBox>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <Popover.Root open={filterOpen} onOpenChange={(open) => setFilterOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.filter.filterOptions")} className={stylesAnnotations.annotations_filter_trigger_button}
                                title={__("reader.annotations.filter.filterOptions")}>
                                <SVG svg={MenuIcon} />
                                {nbOfFilters > 0 ?
                                    <p className={stylesAnnotations.annotations_filter_nbOfFilters} style={{ fontSize: nbOfFilters > 9 ? "10px" : "12px", paddingLeft: nbOfFilters > 9 ? "3px" : "4px" }}>{nbOfFilters}</p>
                                    : <></>
                                }
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_filter_container} style={{ maxHeight: Math.round(window.innerHeight / 2) }}>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <FocusLock>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={tagArrayFilter}
                                        onSelectionChange={setTagArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByTag")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="annotationListTagDetails">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: !selectTagOption.length ? "none" : "auto", opacity: !selectTagOption.length ? "0.5" : "1" }}
                                             tabIndex={!selectTagOption.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByTag")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={tagArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter("all");
                                                            const detailsElement = document.getElementById("annotationListTagDetails") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            {
                                                selectTagOption.length ?
                                            <TagList items={selectTagOption} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: !selectTagOption.length ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                            </TagList>
                                            : <></>
                                            }
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={colorArrayFilter}
                                        onSelectionChange={setColorArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByColor")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="annotationListColorDetails">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup}>
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByColor")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={colorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setColorArrayFilter("all");
                                                            const detailsElement = document.getElementById("annotationListColorDetails") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setColorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={annotationsColors} className={stylesAnnotations.annotations_filter_taglist}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_color} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name} ref={(r) => { if (r && (r as unknown as HTMLDivElement).setAttribute) { (r as unknown as HTMLDivElement).setAttribute("title", item.name); } }}></Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={drawTypeArrayFilter}
                                        onSelectionChange={setDrawTypeArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByDrawtype")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="annotationListDrawDetails">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup}>
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByDrawtype")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={drawTypeArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setDrawTypeArrayFilter("all");
                                                            const detailsElement = document.getElementById("annotationListDrawDetails") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setDrawTypeArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={selectDrawtypesOptions} className={stylesAnnotations.annotations_filter_taglist}>
                                                {(item) => <Tag id={item.name} className={stylesAnnotations.annotations_filter_drawtype} textValue={item.textValue}><SVG svg={item.svg} /></Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={creatorArrayFilter}
                                        onSelectionChange={setCreatorArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByCreator")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details id="annotationListCreator" open={!!selectCreatorOptions.length}>
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: !selectCreatorOptions.length ? "none" : "auto", opacity: !selectCreatorOptions.length ? "0.5" : "1" }}
                                                tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByCreator")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={creatorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter("all");
                                                            const detailsElement = document.getElementById("annotationListCreator") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={selectCreatorOptions} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: !selectCreatorOptions.length ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                </FocusLock>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <ImportAnnotationsDialog winId={winId} publicationView={publicationView}>
                        <button className={stylesAnnotations.annotations_filter_trigger_button}
                            title={__("catalog.importAnnotation")}
                            aria-label={__("catalog.importAnnotation")}>
                            <SVG svg={ImportIcon} />
                        </button>
                    </ImportAnnotationsDialog>

                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className={stylesAnnotations.annotations_filter_trigger_button} disabled={!annotationListFiltered.length}
                                title={__("catalog.exportAnnotation")}
                                aria-label={__("catalog.exportAnnotation")}>
                                <SVG svg={SaveIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_sorting_container} style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <div
                                    className={stylesAnnotations.annotationsTitle_form_container}
                                >
                                    <p>{__("reader.annotations.annotationsExport.description")}</p>
                                    <div className={stylesInputs.form_group}>
                                        <label htmlFor="annotationsTitle">{__("reader.annotations.annotationsExport.title")}</label>
                                        <input
                                            type="text"
                                            name="annotationsTitle"
                                            id="annotationsTitle"
                                            ref={annotationTitleRef}
                                            className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                        />
                                        <select defaultValue="annotation" style={{ height: "inherit", border: "none", marginLeft: "5px" }} ref={selectFileTypeRef} name="file_type">
                                            <option value="annotation">.annotation</option>
                                            <option value="html">.html</option>
                                        </select>
                                    </div>

                                    <Popover.Close aria-label={__("reader.annotations.export")} asChild>
                                        <button onClick={async () => {
                                            const title = annotationTitleRef.current?.value || "thorium-reader";
                                            let label = title.slice(0, 200);
                                            label = label.trim();
                                            label = label.replace(/[^a-z0-9_-]/gi, "_");
                                            label = label.replace(/^_+|_+$/g, ""); // leading and trailing underscore
                                            label = label.replace(/^\./, ""); // remove dot start
                                            label = label.toLowerCase();
                                            const fileType = selectFileTypeRef.current?.value || "annotation";

                                            await getSaga().run(exportAnnotationSet, annotationListFiltered, publicationView, label, fileType).toPromise();
                                        }} className={stylesButtons.button_primary_blue}>
                                            <SVG svg={SaveIcon} />
                                            {__("reader.annotations.export")}
                                        </button>
                                    </Popover.Close>
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <AlertDialog.Root>
                        <AlertDialog.Trigger className={stylesAnnotations.annotations_filter_trigger_button} disabled={!annotationListFiltered.length} title={__("dialog.deleteAnnotations")} aria-label={__("dialog.deleteAnnotations")}>
                            <SVG svg={TrashIcon} ariaHidden />
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                            <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                            <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                                <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deleteAnnotations")}</AlertDialog.Title>
                                <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                                    {__("dialog.deleteAnnotationsText", { annotationListLength: annotationListFiltered.length })}
                                </AlertDialog.Description>
                                <div className={stylesAlertModals.AlertDialogButtonContainer}>
                                    <AlertDialog.Cancel asChild>
                                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                        <button className={stylesButtons.button_primary_blue} onClick={() => {
                                            updateDialogOrDockDataInfo({id: "", edit: false});
                                            for (const annotation of annotationListFiltered) {

                                                dispatch(readerActions.note.remove.build(annotation));
                                            }

                                            // reset filters
                                            setTagArrayFilter(new Set([]));
                                            setColorArrayFilter(new Set([]));
                                            setDrawTypeArrayFilter(new Set([]));
                                            setCreatorArrayFilter(new Set([]));
                                        }} type="button">
                                            <SVG ariaHidden svg={TrashIcon} />
                                            {__("dialog.yes")}</button>
                                    </AlertDialog.Action>
                                </div>
                            </AlertDialog.Content>
                        </AlertDialog.Portal>
                    </AlertDialog.Root>
                    <span style={{height: "30px", width: "2px", borderRight: "2px solid var(--color-extralight-grey)"}}></span>
                    <Popover.Root open={optionsOpen} onOpenChange={(open) => setOptionsOpen(open)}>
                        <Popover.Trigger className={stylesAnnotations.annotations_filter_trigger_button} title={__("reader.annotations.annotationsOptions")} aria-label={__("reader.annotations.annotationsOptions")}>
                            <SVG ariaHidden svg={OptionsIcon} />
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesAnnotations.annotations_filter_container} hideWhenDetached>
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="advancedAnnotations" className={stylesGlobal.checkbox_custom_input} name="advancedAnnotations" checked={serialAnnotator} onChange={advancedAnnotationsOnChange} />
                                    <label htmlFor="advancedAnnotations" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={serialAnnotator}
                                            aria-label={__("reader.annotations.advancedMode")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    advancedAnnotationsOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: serialAnnotator ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: serialAnnotator ? "var(--color-blue)" : "transparent" }}>
                                            {serialAnnotator ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            }
                                        </div>
                                        <div aria-hidden>
                                            <h4>{__("reader.annotations.advancedMode")}</h4>
                                        </div>
                                    </label>
                                </div>
                                {/* : <></>} */}
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="quickAnnotations" name="quickAnnotations" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_popoverNotOpenOnNoteTaking}
                                        onChange={quickAnnotationsOnChange}
                                    />
                                    <label htmlFor="quickAnnotations" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_popoverNotOpenOnNoteTaking}
                                            aria-label={__("reader.annotations.quickAnnotations")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    quickAnnotationsOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: readerConfig.annotation_popoverNotOpenOnNoteTaking ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: readerConfig.annotation_popoverNotOpenOnNoteTaking ? "var(--color-blue)" : "transparent" }}>
                                            {readerConfig.annotation_popoverNotOpenOnNoteTaking ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            } </div>
                                        <h4 aria-hidden>{__("reader.annotations.quickAnnotations")}</h4></label>
                                </div>
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="marginAnnotations" name="marginAnnotations" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_defaultDrawView === "margin"} onChange={marginAnnotationsOnChange} />
                                    <label htmlFor="marginAnnotations" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_defaultDrawView === "margin"}
                                            aria-label={__("reader.annotations.toggleMarginMarks")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    marginAnnotationsOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: readerConfig.annotation_defaultDrawView === "margin" ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: readerConfig.annotation_defaultDrawView === "margin" ? "var(--color-blue)" : "transparent" }}>
                                            {readerConfig.annotation_defaultDrawView === "margin" ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            }
                                        </div>
                                        <h4 aria-hidden>{__("reader.annotations.toggleMarginMarks")}</h4></label>
                                </div>
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="hideAnnotation" name="hideAnnotation" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_defaultDrawView === "hide"} onChange={hideAnnotationOnChange} />
                                    <label htmlFor="hideAnnotation" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_defaultDrawView === "hide"}
                                            aria-label={__("reader.annotations.hide")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    hideAnnotationOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: readerConfig.annotation_defaultDrawView === "hide" ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: readerConfig.annotation_defaultDrawView === "hide" ? "var(--color-blue)" : "transparent" }}>
                                            {readerConfig.annotation_defaultDrawView === "hide" ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            }
                                        </div>
                                        <h4 aria-hidden>{__("reader.annotations.hide")}</h4></label>
                                </div>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
            </div>
            <div className={stylesAnnotations.separator} />
            <ol>
                {annotationsPagedArray.map((annotationItem, _i) =>
                    <AnnotationCard
                        key={`annotation-card_${annotationItem.uuid}`}
                        annotation={annotationItem}
                        goToLocator={goToLocator}
                        isEdited={annotationItem.uuid === needToFocusOnID && annotationEdit}
                        triggerEdition={triggerEdition(annotationItem)}
                        setTagFilter={(v) => setTagArrayFilter(new Set([v]))}
                        setCreatorFilter={(v) => setCreatorArrayFilter(new Set([v]))}
                    />,
                )}
            </ol>
            {
                isPaginated ? <>
                    <div className={stylesPopoverDialog.navigation_container}>
                        <button title={__("opds.firstPage")}
                            onClick={() => { changePageNumber(() => 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")}
                            onClick={() => { changePageNumber((pageNumber) => pageNumber - 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>
                        <div className={stylesPopoverDialog.pages}>
                            {/* <SelectRef
                                ref={paginatorAnnotationsRef}
                                aria-label={__("reader.navigation.page")}
                                items={pageOptions}
                                selectedKey={pageNumber}
                                defaultSelectedKey={1}
                                onSelectionChange={(id) => {
                                    setPageNumber(id as number);
                                }}
                                label={__("reader.navigation.page")}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </SelectRef> */}
                            <label htmlFor="paginatorAnnotations" style={{ margin: "0" }}>{__("reader.navigation.page")}</label>
                            <select
                             onChange={(e) => {
                                if (!e.currentTarget?.value) {
                                    // console.error("No select Page currentTarget !!! ", e.currentTarget);
                                    return ;
                                }
                                const value = e.currentTarget.value;
                                const cb = () => pageOptions.find((option) => option.id === parseInt(value, 10)).id;
                                changePageNumber(cb);
                            }}
                                ref={paginatorAnnotationsRef}
                                id="paginatorAnnotations"
                                aria-label={__("reader.navigation.page")}
                                // defaultValue={1}
                                value={pageNumber}
                            >
                                {pageOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                            {/* <ComboBox
                                aria-label={__("reader.navigation.page")}
                                items={pageOptions}
                                selectedKey={pageNumber}
                                defaultSelectedKey={1}
                                onSelectionChange={(id) => {
                                    changePageNumber(() => id as number); setItemToEdit(-1);
                                }}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </ComboBox> */}
                        </div>
                        <button title={__("opds.next")}
                            onClick={() => { changePageNumber((pageNumber) => pageNumber + 1); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")}
                            onClick={() => { changePageNumber(() => pageTotal); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowLastIcon} />
                        </button>
                    </div>
                    {
                        annotationListFiltered.length &&
                        <p
                            style={{
                                textAlign: "center",
                                padding: 0,
                                margin: 0,
                                marginTop: "-16px",
                                marginBottom: "20px",
                            }}>{`[ ${begin === end ? `${end}` : `${begin} ... ${end}`} ] / ${annotationListFiltered.length}`}</p>
                    }
                </>
                    : <></>
            }
        </>
    );
};

const BookmarkList: React.FC<{ popoverBoundary: HTMLDivElement, hideBookmarkOnChange: () => void } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    const { goToLocator, popoverBoundary, hideBookmarkOnChange } = props;

    const dispatch = useDispatch();
    const dockedMode = useSelector((state: IReaderRootState) => state.reader.config.readerDockingMode !== "full");
    const dialogOrDockDataInfo = useSelector((state: IReaderRootState): IReaderDialogOrDockSettingsMenuState =>
        (state.dialog.open && state.dialog.type === DialogTypeName.ReaderMenu) ?
            state.dialog.data as IReaderDialogOrDockSettingsMenuState : (state.dock.open && state.dock.type === DockTypeName.ReaderMenu) ?
                state.dock.data : {} as unknown as IReaderDialogOrDockSettingsMenuState);
    const updateDialogOrDockDataInfo = React.useCallback((data: IReaderDialogOrDockSettingsMenuState) => {
        dispatch(dockedMode ? dockActions.updateRequest.build(data) : dialogActions.updateRequest.build(data));
    }, [dockedMode, dispatch]);

    const [sortingOpen, setSortingOpen] = React.useState(false);
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const { id: needToFocusOnID, edit: bookmarkEdit } = dialogOrDockDataInfo;
    const [bookmarkUUID, setBookmarkUUID] = React.useState(needToFocusOnID);
    React.useEffect(() => {
        setBookmarkUUID(needToFocusOnID);
        setTagArrayFilter(new Set([]));
        setColorArrayFilter(new Set([]));
        setCreatorArrayFilter(new Set([]));
        setSortingOpen(false);
        setFilterOpen(false);
        setOptionsOpen(false);

    }, [needToFocusOnID]);

    const paginatorBookmarksRef = React.useRef<HTMLSelectElement>();

    const [__] = useTranslator();
    const notes = useSelector((state: IReaderRootState) => state.reader.note);
    const bookmarkListAll = React.useMemo(() => notes.filter(({ group }) => group === "bookmark"), [notes]);
    const publicationView = useSelector((state: IReaderRootState) => state.reader.info.publicationView);
    const winId = useSelector((state: IReaderRootState) => state.win.identifier);
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);

    const [colorArrayFilter, setColorArrayFilter] = React.useState<Selection>(new Set([]));
    const [creatorArrayFilter, setCreatorArrayFilter] = React.useState<Selection>(new Set([]));
    const [tagArrayFilter, setTagArrayFilter] = React.useState<Selection>(new Set([]));

    const [pageNumber, setPageNumber] = React.useState(START_PAGE);
    const changePageNumber = React.useCallback((cb: (n: number) => number) => {
        setTimeout(() => paginatorBookmarksRef.current?.focus(), 100);
        updateDialogOrDockDataInfo({id: "", edit: false});
        setPageNumber(cb);
    }, [setPageNumber, updateDialogOrDockDataInfo]);

    const creatorListName = bookmarkListAll.map(({ creator }) => creator?.name).filter(v => v);
    const selectCreatorOptions = [...(new Set(creatorListName))].map((name, index) => ({ id: `${index}_${name}`, name }));

    const bookmarksColors = React.useMemo(() => Object.entries(noteColorCodeToColorTranslatorKeySet).map(([k, v]) => ({ hex: k, name: __(v) })), [__]);

    const tagsIndexList = useSelector((state: IReaderRootState) => state.noteTagsIndex);
    const selectTagOption = React.useMemo(() => tagsIndexList.map((v, i) => ({ id: i, name: v.tag })), [tagsIndexList]);
    const selectTagOptionFilteredNameArray = React.useMemo(() => selectTagOption.map((v) => v.name), [selectTagOption]);

    const bookmarkListFiltered = React.useMemo(() => {

        return (
            (selectionIsSet(tagArrayFilter) && tagArrayFilter.size) ||
            (tagArrayFilter === "all") ||
            (selectionIsSet(colorArrayFilter) && colorArrayFilter.size) ||
            (colorArrayFilter === "all") ||
            (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size) ||
            (creatorArrayFilter === "all")
        )
            ? bookmarkListAll.filter(({ tags, color, drawType: _drawType, creator }) => {

                const colorHex = rgbToHex(color);
                const creatorName = creator?.name || "";

                return ((tagArrayFilter === "all" && tags?.some((tagsValueName) => selectTagOptionFilteredNameArray.includes(tagsValueName))) || (selectionIsSet(tagArrayFilter) && tagArrayFilter.size && tags?.some((tagsValueName) => tagArrayFilter.has(tagsValueName)))) ||
                    ((colorArrayFilter === "all" && bookmarksColors.some(({hex}) => hex === colorHex)) || (selectionIsSet(colorArrayFilter) && colorArrayFilter.size && colorArrayFilter.has(colorHex))) ||
                    ((creatorArrayFilter === "all" && creatorListName.includes(creatorName)) || (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size && creatorArrayFilter.has(creatorName)));

            })
            : bookmarkListAll;
    }, [bookmarkListAll, tagArrayFilter, colorArrayFilter, creatorArrayFilter, bookmarksColors, creatorListName, selectTagOptionFilteredNameArray]);

    const [sortType, setSortType] = React.useState<Selection>(new Set(["lastCreated"]));
    if (sortType !== "all" && sortType.has("progression")) {

        bookmarkListFiltered.sort((a, b) => {

            if (!a.locatorExtended || !b.locatorExtended) {
                return 0;
            }
            const { locatorExtended: la } = a;
            const { locatorExtended: lb } = b;
            const pcta = computeProgression(r2Publication.Spine, la.locator);
            const pctb = computeProgression(r2Publication.Spine, lb.locator);
            return pcta - pctb;
        });
    } else if (sortType !== "all" && sortType.has("lastCreated")) {
        bookmarkListFiltered.sort(({created: ca}, {created: cb}) => {
            return cb - ca;
        });
    } else if (sortType !== "all" && sortType.has("lastModified")) {
        bookmarkListFiltered.sort(({ modified: ma }, { modified: mb }) => {
            return ma && mb ? mb - ma : ma ? -1 : mb ? 1 : 0;
        });
    }

    const annotationFocusFoundIndex = bookmarkUUID ? bookmarkListFiltered.findIndex(({uuid}) => bookmarkUUID === uuid) : -1;
    React.useEffect(() => {
        if (bookmarkUUID) {
            setBookmarkUUID("");
            const annotationFocusItemPageNumber = Math.ceil((annotationFocusFoundIndex + 1 /* 0 based */) / MAX_MATCHES_PER_PAGE);
            setPageNumber((pageNumber) => annotationFocusItemPageNumber !== pageNumber ? annotationFocusItemPageNumber : pageNumber);

        }
    }, [bookmarkUUID, annotationFocusFoundIndex]);

    const pageTotal = Math.ceil(bookmarkListFiltered.length / MAX_MATCHES_PER_PAGE) || 1;

    if (pageNumber <= 0) {
        setPageNumber(START_PAGE);
    } else if (pageNumber > pageTotal) {
        setPageNumber(pageTotal);
    }

    const startIndex = (pageNumber - 1) * MAX_MATCHES_PER_PAGE;
    const bookmarksPagedArray = bookmarkListFiltered.slice(startIndex, startIndex + MAX_MATCHES_PER_PAGE);

    const isLastPage = pageTotal === pageNumber;
    const isFirstPage = pageNumber === 1;
    const isPaginated = pageTotal > 1;
    const pageOptions = Array.from({ length: pageTotal }, (_k, v) => (v += 1, ({ id: v, name: `${v} / ${pageTotal}` })));


    const begin = startIndex + 1;
    const end = Math.min(startIndex + MAX_MATCHES_PER_PAGE, bookmarkListFiltered.length);

    const triggerEdition = (bookmarkItem: INoteState) =>
        (value: boolean) => value ? updateDialogOrDockDataInfo({id: bookmarkItem.uuid, edit: true}) : updateDialogOrDockDataInfo({id: "", edit: false});


    // if tagArrayFilter value not include in the selectTagOption then take only the intersection between tagArrayFilter and selectTagOption
    // const selectTagOptionFilteredNameArray = selectTagOption.map((v) => v.name);
    // const tagArrayFilterArray = selectionIsSet(tagArrayFilter) ? Array(...tagArrayFilter) : [];
    // if (tagArrayFilterArray.filter((tagValue) => !selectTagOptionFilteredNameArray.includes(tagValue)).length) {
    //     const tagArrayFilterArrayDifference = tagArrayFilterArray.filter((tagValue) => selectTagOptionFilteredNameArray.includes(tagValue));
    //     setTagArrayFilter(new Set(tagArrayFilterArrayDifference));
    // }
    const nbOfFilters = ((tagArrayFilter === "all") ?
        selectTagOption.length : tagArrayFilter.size) + (creatorArrayFilter === "all" ?
            selectCreatorOptions.length : creatorArrayFilter.size) + ((colorArrayFilter === "all") ?
                bookmarksColors.length : colorArrayFilter.size);

    const bookmarkTitleRef = React.useRef<HTMLInputElement>();
    const selectFileTypeRef = React.useRef<HTMLSelectElement & { value: "html" | "annotation" }>();

    return (
        <>
            <div className={stylesBookmarks.bookmarks_filter_line}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Popover.Root open={sortingOpen} onOpenChange={(open) => setSortingOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.sorting.sortingOptions")} className={stylesBookmarks.bookmarks_filter_trigger_button}
                                title={__("reader.annotations.sorting.sortingOptions")}>
                                <SVG svg={SortIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_sorting_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2) }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <ListBox
                                    selectedKeys={sortType}
                                    onSelectionChange={setSortType}
                                    selectionMode="multiple"
                                    selectionBehavior="replace"
                                    aria-label={__("reader.annotations.sorting.sortingOptions")}
                                >
                                    <ListBoxItem id="progression" key="progression" aria-label="progression" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                        style={{ marginBottom: "5px" }}
                                    >
                                        {__("reader.annotations.sorting.progression")}
                                    </ListBoxItem>
                                    <ListBoxItem id="lastCreated" key="lastCreated" aria-label="lastCreated" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                        style={{ marginBottom: "5px" }}
                                    >
                                        {__("reader.annotations.sorting.lastcreated")}
                                    </ListBoxItem>
                                    <ListBoxItem id="lastModified" key="lastModified" aria-label="lastModified" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                    >
                                        {__("reader.annotations.sorting.lastmodified")}
                                    </ListBoxItem>
                                </ListBox>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <Popover.Root open={filterOpen} onOpenChange={(open) => setFilterOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.filter.filterOptions")} className={stylesBookmarks.bookmarks_filter_trigger_button}
                                title={__("reader.annotations.filter.filterOptions")}>
                                <SVG svg={MenuIcon} />
                                {nbOfFilters > 0 ?
                                    <p className={stylesBookmarks.bookmarks_filter_nbOfFilters} style={{ fontSize: nbOfFilters > 9 ? "10px" : "12px", paddingLeft: nbOfFilters > 9 ? "3px" : "4px" }}>{nbOfFilters}</p>
                                    : <></>
                                }
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_filter_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2) }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <FocusLock>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={tagArrayFilter}
                                        onSelectionChange={setTagArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByTag")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="bookmark-tags-list-details">
                                            <summary className={stylesBookmarks.bookmarks_filter_tagGroup} style={{ pointerEvents: !selectTagOption.length ? "none" : "auto", opacity: !selectTagOption.length ? "0.5" : "1" }}
                                                tabIndex={!selectTagOption.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByTag")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={tagArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter("all");
                                                            const detailsElement = document.getElementById("bookmark-tags-list-details") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            {
                                                selectTagOption.length ?
                                                    <TagList items={selectTagOption} className={stylesBookmarks.bookmarks_filter_taglist} style={{ margin: !selectTagOption.length ? "0" : "20px 0" }}>
                                                        {(item) => <Tag className={stylesBookmarks.bookmarks_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                                    </TagList>
                                                    : <></>
                                            }
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={colorArrayFilter}
                                        onSelectionChange={setColorArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByColor")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="bookmark-color-list">
                                            <summary className={stylesBookmarks.bookmarks_filter_tagGroup}>
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByColor")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={colorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setColorArrayFilter("all");
                                                            const detailsElement = document.getElementById("bookmark-color-list") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setColorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={bookmarksColors} className={stylesBookmarks.bookmarks_filter_taglist}>
                                                {(item) => <Tag className={stylesBookmarks.bookmarks_filter_color} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name} ref={(r) => { if (r && (r as unknown as HTMLDivElement).setAttribute) { (r as unknown as HTMLDivElement).setAttribute("title", item.name); } }}></Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={creatorArrayFilter}
                                        onSelectionChange={setCreatorArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByCreator")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details id="bookmark-creator-list-details" open={!!selectCreatorOptions.length}>
                                            <summary className={stylesBookmarks.bookmarks_filter_tagGroup} style={{ pointerEvents: !selectCreatorOptions.length ? "none" : "auto", opacity: !selectCreatorOptions.length ? "0.5" : "1" }}
                                                tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByCreator")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={creatorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter("all");
                                                            const detailsElement = document.getElementById("bookmark-creator-list-details") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={selectCreatorOptions} className={stylesBookmarks.bookmarks_filter_taglist} style={{ margin: !selectCreatorOptions.length ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesBookmarks.bookmarks_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                </FocusLock>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <ImportAnnotationsDialog winId={winId} publicationView={publicationView}>
                        <button className={stylesBookmarks.bookmarks_filter_trigger_button}
                            title={__("catalog.importAnnotation")}
                            aria-label={__("catalog.importAnnotation")}>
                            <SVG svg={ImportIcon} />
                        </button>
                    </ImportAnnotationsDialog>

                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className={stylesBookmarks.bookmarks_filter_trigger_button} disabled={!bookmarkListFiltered.length}
                                title={__("catalog.exportAnnotation")}
                                aria-label={__("catalog.exportAnnotation")}>
                                <SVG svg={SaveIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_sorting_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <div
                                    className={stylesBookmarks.bookmarksTitle_form_container}
                                >
                                    <p>{__("reader.annotations.annotationsExport.description")}</p>
                                    <div className={stylesInputs.form_group}>
                                        <label htmlFor="annotationsTitle">{__("reader.annotations.annotationsExport.title")}</label>
                                        <input
                                            type="text"
                                            name="annotationsTitle"
                                            id="annotationsTitle"
                                            ref={bookmarkTitleRef}
                                            className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                        />
                                        <select defaultValue="annotation" style={{ height: "inherit", border: "none", marginLeft: "5px" }} ref={selectFileTypeRef} name="file_type">
                                            <option value="annotation">.annotation</option>
                                            <option value="html">.html</option>
                                        </select>
                                    </div>

                                    <Popover.Close aria-label={__("reader.annotations.export")} asChild>
                                        <button onClick={async () => {
                                            const title = bookmarkTitleRef?.current.value || "thorium-reader";
                                            let label = title.slice(0, 200);
                                            label = label.trim();
                                            label = label.replace(/[^a-z0-9_-]/gi, "_");
                                            label = label.replace(/^_+|_+$/g, ""); // leading and trailing underscore
                                            label = label.replace(/^\./, ""); // remove dot start
                                            label = label.toLowerCase();
                                            const fileType = selectFileTypeRef.current?.value || "annotation";

                                            await getSaga().run(exportAnnotationSet, bookmarkListFiltered, publicationView, label, fileType).toPromise();
                                        }} className={stylesButtons.button_primary_blue}>
                                            <SVG svg={SaveIcon} />
                                            {__("reader.annotations.export")}
                                        </button>
                                    </Popover.Close>
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <AlertDialog.Root>
                        <AlertDialog.Trigger className={stylesBookmarks.bookmarks_filter_trigger_button} disabled={!bookmarkListFiltered.length} title={__("dialog.deleteBookmarks")} aria-label={__("dialog.deleteBookmarks")}>
                            <SVG svg={TrashIcon} ariaHidden />
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                            <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                            <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                                <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deleteBookmarks")}</AlertDialog.Title>
                                <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                                    {__("dialog.deleteBookmarksText", { bookmarkListLength: bookmarkListFiltered.length })}
                                </AlertDialog.Description>
                                <div className={stylesAlertModals.AlertDialogButtonContainer}>
                                    <AlertDialog.Cancel asChild>
                                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                        <button className={stylesButtons.button_primary_blue} onClick={() => {
                                            updateDialogOrDockDataInfo({id: "", edit: false});
                                            for (const bookmark of bookmarkListFiltered) {

                                                dispatch(readerActions.note.remove.build(bookmark));
                                            }

                                            // reset filters
                                            setCreatorArrayFilter(new Set([]));
                                            setColorArrayFilter(new Set([]));
                                            setTagArrayFilter(new Set([]));
                                        }} type="button">
                                            <SVG ariaHidden svg={TrashIcon} />
                                            {__("dialog.yes")}</button>
                                    </AlertDialog.Action>
                                </div>
                            </AlertDialog.Content>
                        </AlertDialog.Portal>
                    </AlertDialog.Root>
                    <span style={{ height: "30px", width: "2px", borderRight: "2px solid var(--color-extralight-grey)" }}></span>
                    <Popover.Root open={optionsOpen} onOpenChange={(open) => setOptionsOpen(open)}>
                        <Popover.Trigger className={stylesAnnotations.annotations_filter_trigger_button} title={__("reader.annotations.annotationsOptions")} aria-label={__("reader.annotations.annotationsOptions")}>
                            <SVG ariaHidden svg={OptionsIcon} />
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_filter_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}
                            >
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="hideBookmark" name="hideBookmark" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_defaultDrawView === "hide"} onChange={hideBookmarkOnChange} />
                                    <label htmlFor="hideBookmark" className={stylesGlobal.checkbox_custom_label} style={{ marginLeft: "10px" }}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_defaultDrawView === "hide"} // TODO: replace annotation_defaultDrawView with note_defaultDrawView, this is applicable both annotation and bookmark
                                            aria-label={__("reader.annotations.hide")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    hideBookmarkOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: readerConfig.annotation_defaultDrawView === "hide" ? "2px solid transparent" : "2px solid var(--color-primary)", backgroundColor: readerConfig.annotation_defaultDrawView === "hide" ? "var(--color-blue)" : "transparent" }}>
                                            {readerConfig.annotation_defaultDrawView === "hide" ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            }
                                        </div>
                                        <h4 aria-hidden>{__("reader.annotations.hide")}</h4></label>
                                </div>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
            </div>
            <div className={stylesAnnotations.separator} />
            <ol style={{ paddingLeft: "0px" }}>
                {bookmarksPagedArray.map((bookmarkItem, _i) =>
                    <BookmarkCard
                        key={`bookmark-card_${bookmarkItem.uuid}`}
                        bookmark={bookmarkItem}
                        goToLocator={goToLocator}
                        isEdited={bookmarkItem.uuid === needToFocusOnID && bookmarkEdit}
                        triggerEdition={triggerEdition(bookmarkItem)}
                        setCreatorFilter={(v) => setCreatorArrayFilter(new Set([v]))}
                        setTagFilter={((v) => setTagArrayFilter(new Set([v])))}
                    />,
                )}
            </ol>
            {
                isPaginated ? <>
                    <div className={stylesPopoverDialog.navigation_container}>
                        <button title={__("opds.firstPage")} // TODO: change i18n label
                            onClick={() => { changePageNumber(() => 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")} // TODO: change i18n label
                            onClick={() => { changePageNumber((pageNumber) => pageNumber - 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>
                        <div className={stylesPopoverDialog.pages}>
                            {/* <SelectRef
                                ref={paginatorAnnotationsRef}
                                aria-label={__("reader.navigation.page")}
                                items={pageOptions}
                                selectedKey={pageNumber}
                                defaultSelectedKey={1}
                                onSelectionChange={(id) => {
                                    setPageNumber(id as number);
                                }}
                                label={__("reader.navigation.page")}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </SelectRef> */}
                            <label htmlFor="paginatorBookmarks" style={{ margin: "0" }}>{__("reader.navigation.page")}</label>
                            <select
                             onChange={(e) => {
                                if (!e.currentTarget?.value) {
                                    // console.error("No select Page currentTarget !!! ", e.currentTarget);
                                    return ;
                                }
                                const value = e.currentTarget.value;
                                const cb = () => pageOptions.find((option) => option.id === parseInt(value, 10)).id;
                                changePageNumber(cb);
                            }}
                                ref={paginatorBookmarksRef}
                                id="paginatorBookmarks"
                                aria-label={__("reader.navigation.page")}
                                // defaultValue={1}
                                value={pageNumber}
                            >
                                {pageOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                            {/* <ComboBox
                                aria-label={__("reader.navigation.page")}
                                items={pageOptions}
                                selectedKey={pageNumber}
                                defaultSelectedKey={1}
                                onSelectionChange={(id) => {
                                    changePageNumber(() => id as number); setItemToEdit(-1);
                                }}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </ComboBox> */}
                        </div>
                        <button title={__("opds.next")} // TODO: change i18n label
                            onClick={() => { changePageNumber((pageNumber) => pageNumber + 1); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")} // TODO: change i18n label
                            onClick={() => { changePageNumber(() => pageTotal); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowLastIcon} />
                        </button>
                    </div>
                    {
                        bookmarkListFiltered.length &&
                        <p
                            style={{
                                textAlign: "center",
                                padding: 0,
                                margin: 0,
                                marginTop: "-16px",
                                marginBottom: "20px",
                            }}>{`[ ${begin === end ? `${end}` : `${begin} ... ${end}`} ] / ${bookmarkListFiltered.length}`}</p>
                    }
                </>
                    : <></>
            }
        </>
    );
};

const GoToPageSection: React.FC<IBaseProps & { totalPages?: number }> = (props) => {

    const { handleLinkClick, isDivina, isPdf, currentLocation, totalPages: totalPagesFromProps, goToLocator } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
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

        // this.props.currentLocation.docInfo.isFixedLayout
        const isFixedLayoutPublication = !r2Publication.PageList &&
            r2Publication.Metadata?.Rendition?.Layout === "fixed";

        const pageNbr = goToRef.current.value.trim().replace(/\s\s+/g, " ");
        if (isFixedLayoutPublication) {
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

                if (typeof page !== "undefined" && page >= 0 &&
                    r2Publication.Spine && r2Publication.Spine[page]) {

                    setPageError(false);

                    // handleLinkClick(undefined, pageNbr);
                    const loc = {
                        href: (page || pageNbr).toString(),
                        // progression generate in divina pagechange event
                    };
                    goToLocator(loc as any, closeNavPanel);

                    return;
                }
            } else if (isPdf) {
                const nPages = r2Publication.Metadata?.NumberOfPages || 1;
                let pageStr = "";
                try {
                    const n = parseInt(pageNbr, 10);
                    if (Number.isInteger(n)) { // NaN
                        if (n >= 1 && n <= nPages) {
                            pageStr = String(n);
                        }
                    }
                } catch (_e) {
                }
                if (pageStr) {
                    setPageError(false);

                    const loc = {
                        href: pageStr,
                        locations: { progression: 1 },
                    };
                    goToLocator(loc, closeNavPanel);

                    return;
                }
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
    };

    // TODO enable Divina??
    if (!r2Publication || isDivina) {
        return <></>;
    }

    // // currentLocation.docInfo.isFixedLayout
    // const isFixedLayout = r2Publication.Metadata?.Rendition?.Layout === "fixed";
    // const isFixedLayoutWithPageList = isFixedLayout && r2Publication.PageList;
    // const isFixedLayoutNoPageList = isFixedLayout && !isFixedLayoutWithPageList;
    const isFixedLayoutPublication = r2Publication.Metadata?.Rendition?.Layout === "fixed";
    const isFixedLayoutWithPageList = isFixedLayoutPublication && r2Publication.PageList;
    const isFixedLayoutNoPageList = isFixedLayoutPublication && !isFixedLayoutWithPageList;

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

    let options: { id: number; name: string; value: string; }[];

    if (isFixedLayoutNoPageList) {
        options = r2Publication.Spine.map((_spineLink, idx) => {
            const indexStr = (idx + 1).toString();
            return (
                {
                    id: idx + 1,
                    name: indexStr,
                    value: indexStr,
                }
            );
        });
    } else if (r2Publication?.PageList) {
        options = r2Publication.PageList.map((pageLink, idx) => {
            return (
                pageLink.Title ?
                    {
                        id: idx + 1,
                        name: pageLink.Title,
                        value: pageLink.Title,
                    }
                    : null
            );
        });
    } else if (isPdf) {
        options = Array.from({ length: r2Publication.Metadata?.NumberOfPages || 1 }, (_v, idx) => {
            const indexStr = (idx + 1).toString();
            return (
                {
                    id: idx + 1,
                    name: indexStr,
                    value: indexStr,
                }
            );
        });
    }

    let defaultKey;

    if (isFixedLayoutNoPageList || r2Publication?.PageList) {
        defaultKey = options.findIndex((value) => value.name === currentPage) + 1;
    }


    return < div className={stylesPopoverDialog.goToPage} >
        {/* <p>{__("reader.navigation.goToTitle")}</p> */}

        {
            currentPage ? <label className={stylesPopoverDialog.currentPage}
                id="reader-menu-tab-gotopage-label"
                htmlFor="reader-menu-tab-gotopage-input">
                <SVG ariaHidden svg={BookOpenIcon} />
                {
                    currentPage ?
                        (parseInt(totalPages, 10)
                            ? __("reader.navigation.currentPageTotal", { current: `${currentPage}`, total: `${totalPages}` })
                            : __("reader.navigation.currentPage", { current: `${currentPage}` })) :
                        ""
                }
            </label> : <></>}
        <form
            id="reader-menu-tab-gotopage-form"
            onSubmit={(e) => {
                e.preventDefault();
            }
            }
        // onKeyUp=
        //     {
        //         (e) => {
        //             // SPACE does not work (only without key mods on button)
        //             //  || e.key === "Space"
        //             if (e.key === "Enter") {
        //                 const closeNavGotoPage = !dockedMode && !(e.shiftKey && e.altKey);
        //                 e.preventDefault();
        //                 handleSubmitPage(closeNavGotoPage);
        //             }
        //     }
        // }
        >

            <div className={classNames(stylesInputs.form_group, stylesPopoverDialog.gotopage_combobox)} style={{ width: "80%" }}>
                {/* <label style={{position: "absolute"}}> {__("reader.navigation.goToPlaceHolder")}</label> */}
                <ComboBox
                    inputId="reader-menu-tab-gotopage-input"
                    label={__("reader.navigation.goToPlaceHolder")}
                    defaultItems={options}
                    defaultSelectedKey={defaultKey}
                    refInputEl={goToRef}
                    allowsCustomValue
                    isDisabled={!(isFixedLayoutNoPageList || r2Publication.PageList || isDivina || isPdf)}
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
            <button
                type="button"
                className={stylesButtons.button_primary_blue}

                onClick=
                {(e) => {
                    const closeNavGotoPage = !dockedMode && !(e.shiftKey && e.altKey);
                    e.preventDefault();
                    // console.log(goToRef?.current?.value);
                    handleSubmitPage(closeNavGotoPage);
                }}

                // does not work on button (works on 'a' link)
                // onDoubleClick=
                // {(e) => {e.preventDefault(); handleSubmitPage(false);}}

                // not necessary (onClick works)
                // onKeyUp=
                //     {
                //         (e) => {
                //             // SPACE does not work (only without key mods on button)
                //             //  || e.key === "Space"
                //             if (e.key === "Enter") {
                //                 const closeNavGotoPage = !dockedMode && !(e.shiftKey && e.altKey);
                //                 e.preventDefault();
                //                 handleSubmitPage(closeNavGotoPage);
                //             }
                //         }
                //     }
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
};

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
                : (__("reader.marks.search"));;
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
    const { /* toggleMenu */ pdfToc, isDivina, isPdf, focusMainAreaLandmarkAndCloseMenu,
        pdfNumberOfPages, currentLocation, goToLocator /*openedSection: tabValue, setOpenedSection: setTabValue*/ } = props;
    const isEpub = !isDivina && !isPdf;
    const { /*doFocus, annotationUUID,*/ handleLinkClick /*, resetAnnotationUUID*/ } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
    const setReaderConfig = useSaveReaderConfig();
    // memoization not needed here, onCick not passed as child component props (only event re-bind in local HTML element)
    // ... plus, see setDockingModeFull() and setDockingModeLeftSide() and setDockingModeRightSide() below which are the ones used in onClick!
    const setDockingMode = (value: ReaderConfig["readerDockingMode"]) => {
        setReaderConfig({ readerDockingMode: value });
    };
    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");
    const section = useReaderConfig("readerMenuSection");
    const setSection = (value: string) => {
        setReaderConfig({ readerMenuSection: value});
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
    // const isFixedLayoutNoPageList = isFixedLayoutPublication && !isFixedLayoutWithPageList;

    const dispatch = useDispatch();

    const [serialAnnotator, setSerialAnnotatorMode] = React.useState(false);

    React.useEffect(() => {
        console.log("Reader MENU set serialAnnotator mode to ", serialAnnotator);
        (window as any).__annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator = serialAnnotator;
    }, [serialAnnotator]);

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

    const sectionsArray: Array<React.JSX.Element> = [];
    const options: Array<{ id: number, value: string, name: string, disabled: boolean, svg: {} }> = [];

    const TocTrigger =
        <Tabs.Trigger id="reader-menu-tab-toc-trigger" value="tab-toc" key={"tab-toc"} data-value={"tab-toc"}
            title={__("reader.marks.toc")}
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
        <Tabs.Trigger id="reader-menu-tab-landmark-trigger" value="tab-landmark" key={"tab-landmark"} data-value={"tab-landmark"} title={__("reader.marks.landmarks")} disabled={!r2Publication.Landmarks || r2Publication.Landmarks.length === 0}>
            <SVG ariaHidden svg={LandmarkIcon} />
            <h3>{__("reader.marks.landmarks")}</h3>
        </Tabs.Trigger>;
    const optionLandmarkItem = {
        id: 1, value: "tab-landmark", name: __("reader.marks.landmarks"), disabled:
            !r2Publication.Landmarks || r2Publication.Landmarks.length === 0,
        svg: LandmarkIcon,
    };

    const BookmarksTrigger =
        // <Tabs.Trigger value="tab-bookmark" key={"tab-bookmark"} data-value={"tab-bookmark"} title={__("reader.marks.bookmarks")} disabled={!bookmarks || bookmarks.length === 0}>
        <Tabs.Trigger id="reader-menu-tab-bookmark-trigger" value="tab-bookmark" key={"tab-bookmark"} data-value={"tab-bookmark"} title={__("reader.marks.bookmarks")}>
            <SVG ariaHidden svg={BookmarkIcon} />
            <h3>{__("reader.marks.bookmarks")}</h3>
        </Tabs.Trigger>;
    const optionBookmarkItem = {
        id: 2, value: "tab-bookmark", name: __("reader.marks.bookmarks"), disabled: false, // !bookmarks || bookmarks.length === 0,
        svg: BookmarkIcon,
    };

    const SearchTrigger =
        <Tabs.Trigger id="reader-menu-tab-search-trigger" value="tab-search" key={"tab-search"} data-value={"tab-search"} title={__("reader.marks.search")} disabled={/*!searchEnable ||*/ isPdf}>
            <SVG ariaHidden svg={SearchIcon} />
            <h3>{__("reader.marks.search")}</h3>
        </Tabs.Trigger>;
    const optionSearchItem = {
        id: 3, value: "tab-search", name: __("reader.marks.search"), disabled: /*!searchEnable ||*/ isPdf,
        svg: SearchIcon,
    };

    const GoToPageTrigger =
        <Tabs.Trigger id="reader-menu-tab-gotopage-trigger" value="tab-gotopage" key={"tab-gotopage"} title={__("reader.marks.goTo")} data-value={"tab-gotopage"}>
            <SVG ariaHidden svg={TargetIcon} />
            <h3>{__("reader.marks.goTo")}</h3>
        </Tabs.Trigger>;
    const optionGoToPageItem = {
        id: 4, value: "tab-gotopage", name: __("reader.marks.goTo"), disabled: false,
        svg: TargetIcon,
    };

    // disabled={!annotations || annotations.length === 0}
    const AnnotationTrigger =
        <Tabs.Trigger id="reader-menu-tab-annotation-trigger" value="tab-annotation" key={"tab-annotation"} data-value={"tab-annotation"} title={__("reader.marks.annotations")} >
            <SVG ariaHidden svg={AnnotationIcon} />
            <h3>{__("reader.marks.annotations")}</h3>
        </Tabs.Trigger>;
    const optionAnnotationItem = {
        id: 5, value: "tab-annotation", name: __("reader.marks.annotations"), disabled: false,// !bookmarks || bookmarks.length === 0,
        svg: AnnotationIcon,
    };

    const Separator =
        <span key={"separator"} style={{ borderBottom: "1px solid var(--color-extralight-grey-alt)", width: "80%", margin: "0 10%" }}></span>;

    sectionsArray.push(TocTrigger);
    options.push(optionTocItem);
    sectionsArray.push(LandMarksTrigger);
    options.push(optionLandmarkItem);

    if (isEpub) {
        sectionsArray.push(SearchTrigger);
        options.push(optionSearchItem);
    }
    if (isPdf || isEpub) {
        sectionsArray.push(GoToPageTrigger);
        options.push(optionGoToPageItem);
    }

    sectionsArray.push(Separator);

    sectionsArray.push(BookmarksTrigger);
    options.push(optionBookmarkItem);

    if (isEpub) {
        sectionsArray.push(AnnotationTrigger);
        options.push(optionAnnotationItem);
    }

    const optionSelected = options.find(({ value }) => value === section)?.id || 0;

    const isRTL_ = isRTL(r2Publication);
    const renderLinkTree_ = renderLinkTree(currentLocation, isRTL_, handleLinkClick, dockedMode);
    const renderLinkList_ = renderLinkList(isRTL_, handleLinkClick, dockedMode);

    const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
    SelectRef.displayName = "Select";

    const TabHeader = () => {
        return (
            dockedMode ? <></> :
                <div key="modal-header" className={stylesSettings.close_button_div}>
                    <TabTitle value={section} />
                    <div>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.svg.left")} onClick={setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.svg.right")} onClick={setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled aria-label={__("reader.settings.column.auto")} onClick={setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>
                        <Dialog.Close asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                </div>
        );
    };

    const advancedAnnotationsOnChange = () => {
        setSerialAnnotatorMode(!serialAnnotator);
    };
    const quickAnnotationsOnChange = () => {
        dispatch(readerLocalActionSetConfig.build({ annotation_popoverNotOpenOnNoteTaking: !readerConfig.annotation_popoverNotOpenOnNoteTaking }));
    };
    const marginAnnotationsOnChange = () => {
        const annotation_defaultDrawView = readerConfig.annotation_defaultDrawView === "margin" ? "annotation" : "margin";

        console.log(`marginAnnotationsToggleSwitch : highlight=${annotation_defaultDrawView}`);
        dispatch(readerLocalActionSetConfig.build({ annotation_defaultDrawView }));

        const href1 = currentLocation?.locator?.href;
        const href2 = currentLocation?.secondWebViewHref;
        dispatch(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
    };
    const hideAnnotationOnChange = () => {
        const annotation_defaultDrawView = readerConfig.annotation_defaultDrawView === "hide" ? "annotation" : "hide";

        console.log(`hideAnnotationsToggleSwitch : highlight=${annotation_defaultDrawView}`);
        dispatch(readerLocalActionSetConfig.build({ annotation_defaultDrawView }));

        const href1 = currentLocation?.locator?.href;
        const href2 = currentLocation?.secondWebViewHref;
        dispatch(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
    };

    return (
        <div>
            {
                dockedMode ?
                    <>
                        <div key="docked-header" className={stylesPopoverDialog.docked_header}>
                            <div key="docked-header-btn" className={stylesPopoverDialog.docked_header_controls} style={{ justifyContent: "space-between", width: "100%" }}>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "left" ? true : false} aria-label={__("reader.svg.left")} onClick={setDockingModeLeftSide}>
                                        <SVG ariaHidden={true} svg={DockLeftIcon} />
                                    </button>
                                    <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "right" ? true : false} aria-label={__("reader.svg.right")} onClick={setDockingModeRightSide}>
                                        <SVG ariaHidden={true} svg={DockRightIcon} />
                                    </button>
                                    <button className={stylesButtons.button_transparency_icon} disabled={false} aria-label={__("reader.settings.column.auto")} onClick={setDockingModeFull}>
                                        <SVG ariaHidden={true} svg={DockModalIcon} />
                                    </button>
                                </div>
                                <Dialog.Close asChild>
                                    <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                        <SVG ariaHidden={true} svg={QuitIcon} />
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>
                        <SelectRef
                            items={options}
                            selectedKey={optionSelected}
                            svg={options.find(({ value }) => value === section)?.svg}
                            onSelectionChange={(id) => {
                                console.log("selectionchange: ", id);
                                const value = options.find(({ id: _id }) => _id === id)?.value;
                                if (value) {
                                    setSection(value);
                                    setTimeout(() => {
                                        // // TODO: is stealing focus here necessary? Should this vary depending on keyboard or mouse interaction?
                                        // const elem = document.getElementById(`readerMenu_tabs-${value}`);
                                        // elem?.blur();
                                        // elem?.focus();
                                    }, 1);
                                    console.log("set Tab Value = ", value);

                                } else {
                                    console.error("Combobox No value !!!");
                                }
                            }}
                            disabledKeys={options.filter(option => option.disabled === true).map(option => option.id)}
                            style={{ margin: "0", padding: "0", flexDirection: "row" }}
                            // onInputChange={(v) => {
                            //     console.log("inputchange: ", v);

                            //     const value = options.find(({ name }) => name === v)?.value;
                            //     if (value === tabValue) return;
                            //     if (value) {
                            //         setTabValue(value);
                            //         console.log("set Tab Value = ", value);

                            //     } else {
                            //         console.error("Combobox No value !!!");
                            //     }
                            // }}
                            ref={dockedModeRef}
                            id={"reader-menu-docked-trigger"}
                        >
                            {item => <SelectItem >{item.name}</SelectItem>}
                        </SelectRef>
                    </>
                    : <></>
            }
            <Tabs.Root value={section} onValueChange={(value) => dockedMode ? null : setSection(value)} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                        <Tabs.List ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {sectionsArray}
                        </Tabs.List>
                }
                <div className={stylesSettings.settings_content}
                    ref={popoverBoundary}
                    style={{ marginTop: dockedMode && "0" }}>
                    <Tabs.Content value="tab-toc" tabIndex={-1} id={"reader-menu-tab-toc"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            {(isPdf && pdfToc?.length && renderLinkTree_(__("reader.marks.toc"), pdfToc, 1, undefined)) ||
                                (isPdf && !pdfToc?.length && <p>{__("reader.toc.publicationNoToc")}</p>) ||
                                (!isPdf && r2Publication.TOC && renderLinkTree_(__("reader.marks.toc"), r2Publication.TOC, 1, undefined)) ||
                                (!isPdf && r2Publication.Spine && renderLinkList_(__("reader.marks.toc"), r2Publication.Spine))}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-landmark" tabIndex={-1} id={"reader-menu-tab-landmark"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            {r2Publication.Landmarks &&
                                renderLinkList_(__("reader.marks.landmarks"), r2Publication.Landmarks)}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-bookmark" tabIndex={-1} id={"reader-menu-tab-bookmark"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            <BookmarkList  popoverBoundary={popoverBoundary.current} goToLocator={goToLocator} hideBookmarkOnChange={hideAnnotationOnChange} />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-annotation" tabIndex={-1} id={"reader-menu-tab-annotation"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={classNames(stylesSettings.settings_tab, stylesAnnotations.annotations_tab)}>
                            <AnnotationList
                                goToLocator={goToLocator}
                                // resetAnnotationUUID={resetAnnotationUUID}
                                // doFocus={doFocus}
                                popoverBoundary={popoverBoundary.current}
                                advancedAnnotationsOnChange={advancedAnnotationsOnChange}
                                quickAnnotationsOnChange={quickAnnotationsOnChange}
                                marginAnnotationsOnChange={marginAnnotationsOnChange}
                                hideAnnotationOnChange={hideAnnotationOnChange}
                                serialAnnotator={serialAnnotator}
                            />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-search" tabIndex={-1} id={"reader-menu-tab-search"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={classNames(stylesSettings.settings_tab, stylesPopoverDialog.search_container)}>
                            {searchEnable
                                ? <ReaderMenuSearch
                                    focusMainAreaLandmarkAndCloseMenu={focusMainAreaLandmarkAndCloseMenu}
                                    dockedMode={dockedMode}
                                ></ReaderMenuSearch>
                                : <></>}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-gotopage" tabIndex={-1} id={"reader-menu-tab-gotopage"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            <GoToPageSection totalPages={
                                isPdf && pdfNumberOfPages
                                    ? pdfNumberOfPages
                                    : 0} {...props} />
                        </div>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    );

};
