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

import classNames from "classnames";
import * as React from "react";
import FocusLock from "react-focus-lock";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";

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
import { ListBox, ListBoxItem, TextArea } from "react-aria-components";
import type { Selection } from "react-aria-components";
import { AnnotationEdit, annotationsColorsLight } from "./AnnotationEdit";
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
// import UpdateBookmarkForm from "./UpdateBookmarkForm";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { Locator } from "@r2-shared-js/models/locator";
import { IAnnotationState, IColor, TAnnotationState, TDrawType } from "readium-desktop/common/redux/states/renderer/annotation";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerLocalActionLocatorHrefChanged, readerLocalActionSetConfig } from "../redux/actions";
import { useReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { rgbToHex } from "readium-desktop/common/rgb";
import { IReadiumAnnotationModelSet } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { convertAnnotationListToReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/converter";
import { ImportAnnotationsDialog } from "readium-desktop/renderer/common/components/ImportAnnotationsDialog";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderMenuProps {
    // focusNaviguationMenu: () => void;
    currentLocation: MiniLocatorExtended;
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

const HardWrapComment: React.FC<{ comment: string }> = (props) => {
    const { comment } = props;
    const splittedComment = comment.split("\n");

    const strListComponent = [];
    let n = 0;
    for (const strline of splittedComment) {
        strListComponent.push(<span key={++n}>{strline}</span>);
        strListComponent.push(<br key={++n} />);
    }

    return (
        <p>
            {
                strListComponent
            }
        </p>
    );
};

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

const AnnotationCard: React.FC<{ timestamp: number, annotation: IAnnotationState, isEdited: boolean, triggerEdition: (v: boolean) => void, setTagFilter: (v: string) => void } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const { goToLocator, setTagFilter } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    // const setReaderConfig = useSaveReaderConfig();
    // const setDockingMode = React.useCallback((value: ReaderConfig["readerDockingMode"]) => {
    //     setReaderConfig({readerDockingMode: value});
    // }, [setReaderConfig]);
    const dockedMode = dockingMode !== "full";
    const { timestamp, annotation, isEdited, triggerEdition } = props;
    const { uuid, comment, tags: tagsStringArrayMaybeUndefined } = annotation;
    const tagsStringArray = tagsStringArrayMaybeUndefined || [];
    const tagName = tagsStringArray[0] || "";
    const dockedEditAnnotation = isEdited && dockedMode;
    const annotationColor = rgbToHex(annotation.color);
    const creatorMyself = useSelector((state: IReaderRootState) => state.creator);

    const dispatch = useDispatch();
    const [__] = useTranslator();
    const save = React.useCallback((color: IColor, comment: string, drawType: TDrawType, tags: string[]) => {
        dispatch(readerActions.annotation.update.build(
            {
                ...annotation,
            },
            {
                uuid: annotation.uuid,
                locatorExtended: annotation.locatorExtended,
                color,
                comment,
                drawType,
                tags,
                modified: (new Date()).getTime(),
                created: annotation.created,
            },
        ));
        triggerEdition(false);
    }, [dispatch, annotation, triggerEdition]);

    const date = new Date(timestamp);
    const dateStr = `${(`${date.getDate()}`.padStart(2, "0"))}/${(`${date.getMonth() + 1}`.padStart(2, "0"))}/${date.getFullYear()}`;

    const { style, percentRounded } = React.useMemo(() => {
        if (r2Publication.Spine && annotation.locatorExtended.locator) {
            const percent = computeProgression(r2Publication.Spine || [], annotation.locatorExtended.locator);
            const percentRounded = Math.round(percent);
            return { style: { width: `${percent}%` }, percentRounded };
        }
        return { style: { width: "100%" }, percentRounded: 100 };
    }, [r2Publication, annotation]);

    // const bname = (annotation?.locatorExtended?.selectionInfo?.cleanText ? `${annotation.locatorExtended.selectionInfo.cleanText.slice(0, 20)}` : `${__("reader.navigation.annotationTitle")} ${index}`);
    const btext = (annotation?.locatorExtended?.selectionInfo?.cleanText ? `${annotation.locatorExtended.selectionInfo.cleanText}` : `${__("reader.navigation.annotationTitle")} ${uuid}`);

    const bprogression = (percentRounded >= 0 ? `${percentRounded}% ` : "");

    if (!uuid) {
        return <></>;
    }

    const creatorName = (annotation.creator?.id !== creatorMyself.id ? annotation.creator?.name : creatorMyself.name) || "";

    return (<div
        className={stylesAnnotations.annotations_line}
        style={{ backgroundColor: dockedEditAnnotation ? "var(--color-extralight-grey)" : "", borderLeft: dockedEditAnnotation ? "none" : `4px solid ${annotationColor}` }}
        onKeyDown={isEdited ? (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                triggerEdition(false);
                setTimeout(() => {
                    const el = document.getElementById(`annotation_card-${uuid}_edit_button`);
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
                : <button className={classNames(stylesAnnotations.annotation_name, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                    // title={bname}
                    aria-label={`${__("reader.navigation.goTo")} ... "${btext}"`}
                    style={{ borderLeft: dockedEditAnnotation && "2px solid var(--color-blue)" }}
                    onClick={(e) => {
                        e.preventDefault();
                        const closeNavAnnotation = !dockedMode && !(e.shiftKey && e.altKey);
                        goToLocator(annotation.locatorExtended.locator, closeNavAnnotation);
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
                        <AnnotationEdit uuid={uuid} save={save} cancel={() => triggerEdition(false)} dockedMode={dockedMode} btext={dockedEditAnnotation && btext} />
                    </FocusLock>
                    :
                    <>
                        <HardWrapComment comment={comment} />
                        {tagName ? <div className={stylesTags.tags_wrapper}>
                            <div className={classNames(
                                stylesTags.tag, stylesTags.no_hover,
                            )}>
                                <a onClick={() => setTagFilter(tagName)}
                                    onKeyUp={(e) => {
                                        if (e.key === "Enter" || e.key === "Space") {
                                            e.preventDefault();
                                            setTagFilter(tagName);
                                        }
                                    }}>
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
                <div>
                    <SVG ariaHidden svg={CalendarIcon} />
                    <p>{dateStr}</p>
                </div>
                <div>
                    <SVG ariaHidden svg={BookOpenIcon} />
                    <p>{bprogression}</p>
                </div>
                {creatorName
                    ?
                    <div>
                        <SVG ariaHidden svg={AvatarIcon} />
                        <p style={{overflow: "hidden", textOverflow: "ellipsis", padding: "0"}} title={creatorName}>{creatorName}</p>
                    </div>
                    : <></>
                }
            </div>
            <div className={stylesAnnotations.annotation_actions_buttons}>
                <button
                    id={`annotation_card-${annotation.uuid}_edit_button`}
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
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button title={__("reader.marks.delete")}
                        >
                            <SVG ariaHidden={true} svg={DeleteIcon} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content collisionPadding={{ top: 180, bottom: 100 }} avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesPopoverDialog.delete_item}>
                            <Popover.Close
                                onClick={() => {
                                    triggerEdition(false);
                                    dispatch(readerActions.annotation.pop.build(annotation));
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
            </div>
        </div>
        <div className={stylesPopoverDialog.gauge}>
            <div className={stylesPopoverDialog.fill} style={style}></div>
        </div>
    </div>);
};

const selectionIsSet = (a: Selection): a is Set<string> => typeof a === "object";
const MAX_MATCHES_PER_PAGE = 5;

const downloadAnnotationJSON = (contents: IReadiumAnnotationModelSet, filename: string) => {

    const data = JSON.stringify(contents, null, 2);
    const blob = new Blob([data], { type: "application/rd-annotations+json" });
    const jsonObjectUrl = URL.createObjectURL(blob);
    const anchorEl = document.createElement("a");
    anchorEl.href = jsonObjectUrl;
    anchorEl.download = `${filename}.annotation`;
    anchorEl.click();
    URL.revokeObjectURL(jsonObjectUrl);
};

const userNumber: Record<string, number> = {};

const AnnotationList: React.FC<{ annotationUUIDFocused: string, resetAnnotationUUID: () => void, doFocus: number, popoverBoundary: HTMLDivElement, advancedAnnotationsOnChange: () => void, quickAnnotationsOnChange: () => void, marginAnnotationsOnChange: () => void, hideAnnotationOnChange: () => void, serialAnnotator: boolean } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    const { goToLocator, annotationUUIDFocused, resetAnnotationUUID, popoverBoundary, advancedAnnotationsOnChange, quickAnnotationsOnChange, marginAnnotationsOnChange, hideAnnotationOnChange, serialAnnotator } = props;

    const [__] = useTranslator();
    const annotationsListAll = useSelector((state: IReaderRootState) => state.reader.annotation);
    const publicationView = useSelector((state: IReaderRootState) => state.reader.info.publicationView);
    const winId = useSelector((state: IReaderRootState) => state.win.identifier);
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);

    const [tagArrayFilter, setTagArrayFilter] = React.useState<Selection>(new Set([]));
    const [colorArrayFilter, setColorArrayFilter] = React.useState<Selection>(new Set([]));
    const [drawTypeArrayFilter, setDrawTypeArrayFilter] = React.useState<Selection>(new Set([]));
    const [creatorArrayFilter, setCreatorArrayFilter] = React.useState<Selection>(new Set([]));

    let annotationListFiltered: TAnnotationState = [];
    let startPage = 1;
    const [pageNumber, setPageNumber] = React.useState(startPage);

    annotationListFiltered = (selectionIsSet(tagArrayFilter) && tagArrayFilter.size) ||
        (selectionIsSet(colorArrayFilter) && colorArrayFilter.size) ||
        (selectionIsSet(drawTypeArrayFilter) && drawTypeArrayFilter.size) ||
        (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size)
        ? annotationsListAll.filter(([, { tags, color, drawType, creator }]) => {

            const colorHex = rgbToHex(color);

            return (!selectionIsSet(tagArrayFilter) || !tagArrayFilter.size || tags.some((tagsValueName) => tagArrayFilter.has(tagsValueName))) &&
                (!selectionIsSet(colorArrayFilter) || !colorArrayFilter.size || colorArrayFilter.has(colorHex)) &&
                (!selectionIsSet(drawTypeArrayFilter) || !drawTypeArrayFilter.size || drawTypeArrayFilter.has(drawType)) &&
                (!selectionIsSet(creatorArrayFilter) || !creatorArrayFilter.size || creatorArrayFilter.has(creator?.id));

        })
        : annotationsListAll;

    if (annotationUUIDFocused) {

        const annotationFocusItemFindIndex = annotationListFiltered.findIndex(([, annotationItem]) => annotationItem.uuid === annotationUUIDFocused);
        if (annotationFocusItemFindIndex > -1) {
            const annotationFocusItemPageNumber = Math.ceil((annotationFocusItemFindIndex + 1 /* 0 based */) / MAX_MATCHES_PER_PAGE);
            startPage = annotationFocusItemPageNumber;
            if (startPage !== pageNumber)
                setPageNumber(startPage);

        } else if (annotationListFiltered !== annotationsListAll) {
            annotationListFiltered = annotationsListAll;
            const annotationFocusItemFindIndex = annotationListFiltered.findIndex(([, annotationItem]) => annotationItem.uuid === annotationUUIDFocused);
            if (annotationFocusItemFindIndex > -1) {
                const annotationFocusItemPageNumber = Math.ceil((annotationFocusItemFindIndex + 1 /* 0 based */) / MAX_MATCHES_PER_PAGE);
                startPage = annotationFocusItemPageNumber;
                if (startPage !== pageNumber)
                    setPageNumber(startPage);

                const [, annotationFound] = annotationListFiltered[annotationFocusItemFindIndex];

                // reset filters
                if (tagArrayFilter !== "all" && !tagArrayFilter.has((annotationFound.tags || [])[0]) && tagArrayFilter.size !== 0) {
                    setTagArrayFilter(new Set([]));
                }
                if (colorArrayFilter !== "all" && !colorArrayFilter.has(rgbToHex(annotationFound.color)) && colorArrayFilter.size !== 0) {
                    setColorArrayFilter(new Set([]));
                }
                if (drawTypeArrayFilter !== "all" && !drawTypeArrayFilter.has(annotationFound.drawType) && drawTypeArrayFilter.size !== 0) {
                    setDrawTypeArrayFilter(new Set([]));
                }
                if (creatorArrayFilter !== "all" && !creatorArrayFilter.has(annotationFound.creator?.id) && creatorArrayFilter.size !== 0) {
                    setCreatorArrayFilter(new Set([]));
                }
            }
        }
    }

    React.useEffect(() => {
        if (annotationUUIDFocused) {
            resetAnnotationUUID();
        }
    }, [annotationUUIDFocused, resetAnnotationUUID]);

    const [sortType, setSortType] = React.useState<Selection>(new Set(["lastCreated"]));
    if (sortType !== "all" && sortType.has("progression")) {

        annotationListFiltered.sort((a, b) => {
            const [, { locatorExtended: { locator: la } }] = a;
            const [, { locatorExtended: { locator: lb } }] = b;
            const pcta = computeProgression(r2Publication.Spine, la);
            const pctb = computeProgression(r2Publication.Spine, lb);
            return pcta - pctb;
        });
    } else if (sortType !== "all" && sortType.has("lastCreated")) {
        annotationListFiltered.sort((a, b) => {
            const [ta] = a;
            const [tb] = b;
            return tb - ta;
        });
    } else if (sortType !== "all" && sortType.has("lastModified")) {
        annotationListFiltered.sort((a, b) => {
            const [, { modified: ma }] = a;
            const [, { modified: mb }] = b;
            return ma && mb ? mb - ma : ma ? -1 : mb ? 1 : 0;
        });
    }

    const pageTotal = Math.ceil(annotationListFiltered.length / MAX_MATCHES_PER_PAGE) || 1;

    if (pageNumber <= 0) {
        setPageNumber(startPage);
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

    const [annotationItemEditedUUID, setannotationItemEditedUUID] = React.useState("");
    const paginatorAnnotationsRef = React.useRef<HTMLSelectElement>();

    const triggerEdition = (annotationItem: IAnnotationState) =>
        (value: boolean) => value ? setannotationItemEditedUUID(annotationItem.uuid) : setannotationItemEditedUUID("");

    const dispatch = useDispatch();

    const tagsIndexList = useSelector((state: IReaderRootState) => state.annotationTagsIndex);
    const selectTagOption = ObjectKeys(tagsIndexList).map((v, i) => ({ id: i, name: v }));

    // if tagArrayFilter value not include in the selectTagOption then take only the intersection between tagArrayFilter and selectTagOption
    const selectTagOptionFilteredNameArray = selectTagOption.map((v) => v.name);
    const tagArrayFilterArray = selectionIsSet(tagArrayFilter) ? Array(...tagArrayFilter) : [];
    if (tagArrayFilterArray.filter((tagValue) => !selectTagOptionFilteredNameArray.includes(tagValue)).length) {
        const tagArrayFilterArrayDifference = tagArrayFilterArray.filter((tagValue) => selectTagOptionFilteredNameArray.includes(tagValue));
        setTagArrayFilter(new Set(tagArrayFilterArrayDifference));
    }

    const creatorMyself = useSelector((state: IReaderRootState) => state.creator);
    const creatorList = annotationsListAll.map(([, { creator }]) => creator).filter(v => v);
    const creatorSet = creatorList.reduce<Record<string, string>>((acc, { id, name }) => {
        if (!acc[id]) {
            if (!userNumber[id]) userNumber[id] = ObjectKeys(userNumber).length + 1;
            return { ...acc, [id]: (id !== creatorMyself.id ? name : creatorMyself.name) || `unknown${userNumber[id]}` };
        }
        return acc;
    }, {});

    const selectCreatorOptions = Object.entries(creatorSet).map(([k, v]) => ({ id: k, name: v }));

    const annotationsColors = React.useMemo(() => Object.entries(annotationsColorsLight).map(([k, v]) => ({ hex: k, name: __(v) })), [__]);

    // I'm disable this feature for performance reason, push new Colors from incoming publicaiton annotation, not used for the moment. So let's commented it for the moment.
    // Need to be optimised in the future.
    // annotationsQueue.forEach(([, annotation]) => {
    //     const colorHex = rgbToHex(annotation.color);
    //     if (!annotationsColorsLight.find((annotationColor) => annotationColor.hex === colorHex)) {
    //         annotationsColorsLight.push({ hex: colorHex, name: colorHex });
    //     }
    // });

    const selectDrawtypesOptions = [
        { name: "solid_background", svg: HighLightIcon, title: `${__("reader.annotations.type.solid")}` },
        { name: "underline", svg: UnderLineIcon, title: `${__("reader.annotations.type.underline")}` },
        { name: "strikethrough", svg: TextStrikeThroughtIcon, title: `${__("reader.annotations.type.strikethrough")}` },
        { name: "outline", svg: TextOutlineIcon,  title: `${__("reader.annotations.type.outline")}` },
    ];

    const nbOfFilters = ((tagArrayFilter === "all") ?
        selectTagOption.length : tagArrayFilter.size) + ((colorArrayFilter === "all") ?
            annotationsColors.length : colorArrayFilter.size) + ((drawTypeArrayFilter === "all") ?
                selectDrawtypesOptions.length : drawTypeArrayFilter.size) + ((creatorArrayFilter === "all") ?
                    selectCreatorOptions.length : creatorArrayFilter.size);

    const annotationTitleRef = React.useRef<HTMLInputElement>();

    return (
        <>
            <div className={stylesAnnotations.annotations_filter_line}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button aria-label="Menu" className={stylesAnnotations.annotations_filter_trigger_button}
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
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button aria-label="Menu" className={stylesAnnotations.annotations_filter_trigger_button}
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
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_color} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name}></Tag>}
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
                                                {(item) => <Tag id={item.name} className={stylesAnnotations.annotations_filter_drawtype} textValue={item.title}><SVG svg={item.svg} /></Tag>}
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
                                        <details id="annotationListCreator">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: selectCreatorOptions.length < 2 ? "none" : "auto", opacity: selectCreatorOptions.length < 2 ? "0.5" : "1" }}
                                                tabIndex={selectCreatorOptions.length < 2 ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByCreator")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        tabIndex={selectCreatorOptions.length < 2 ? -1 : 0}
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
                                                        tabIndex={selectCreatorOptions.length < 2 ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={selectCreatorOptions} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: selectCreatorOptions.length < 2 ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.id} textValue={item.name}>{item.name}</Tag>}
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
                            title={__("catalog.importAnnotation")}>
                            <SVG svg={ImportIcon} />
                        </button>
                    </ImportAnnotationsDialog>

                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className={stylesAnnotations.annotations_filter_trigger_button} disabled={!annotationListFiltered.length}
                                title={__("catalog.exportAnnotation")}>
                                <SVG svg={SaveIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_sorting_container} style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-extralight-grey)" }} />
                                <form
                                    className={stylesAnnotations.annotationsTitle_form_container}
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <p>{__("reader.annotations.annotationsExport.description")}</p>
                                    <div className={stylesInputs.form_group}>
                                        <label htmlFor="annotationsTitle">{__("reader.annotations.annotationsExport.title")}</label>
                                        <input
                                            type="text"
                                            name="annotationsTitle"
                                            id="annotationsTitle"
                                            ref={annotationTitleRef}
                                            className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" />
                                    </div>
                                    <Popover.Close aria-label={__("catalog.export")} asChild>
                                        <button type="submit" onClick={() => {
                                            const annotations = annotationListFiltered.map(([, anno]) => {
                                                const { creator } = anno;
                                                if (creator?.id === creatorMyself.id) {
                                                    return { ...anno, creator: { ...creatorMyself, id: "urn:uuid:" + creatorMyself.id } };
                                                }
                                                return anno;
                                            });
                                            const title = annotationTitleRef?.current.value || "myAnnotationsSet";
                                            let label = title;
                                            label = label.trim();
                                            label = label.replace(/[^a-z0-9_-]/gi, "_");
                                            label = label.replace(/^_+|_+$/g, ""); // leading and trailing underscore
                                            label = label.replace(/^\./, ""); // remove dot start
                                            label = label.toLowerCase();
                                            const contents = convertAnnotationListToReadiumAnnotationSet(annotations, publicationView, title);
                                            downloadAnnotationJSON(contents, label);
                                        }} className={stylesButtons.button_primary_blue}>
                                            <SVG svg={SaveIcon} />
                                            {__("catalog.export")}
                                        </button>
                                    </Popover.Close>
                                </form>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <AlertDialog.Root>
                        <AlertDialog.Trigger className={stylesAnnotations.annotations_filter_trigger_button} disabled={!annotationListFiltered.length} title={__("dialog.deleteAnnotations")}>
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
                                            for (const [, annotation] of annotationListFiltered) {

                                                dispatch(readerActions.annotation.pop.build(annotation));
                                                setannotationItemEditedUUID("");
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
                    <Popover.Root>
                        <Popover.Trigger className={stylesAnnotations.annotations_filter_trigger_button}>
                            <SVG ariaHidden svg={OptionsIcon} title={__("reader.annotations.annotationsOptions")} />
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
            {annotationsPagedArray.map(([timestamp, annotationItem], _i) =>
                <AnnotationCard
                    key={`annotation-card_${annotationItem.uuid}`}
                    timestamp={timestamp}
                    annotation={annotationItem}
                    goToLocator={goToLocator}
                    isEdited={annotationItem.uuid === annotationItemEditedUUID}
                    triggerEdition={triggerEdition(annotationItem)}
                    setTagFilter={(v) => setTagArrayFilter(new Set([v]))}
                />,
            )}
            {
                isPaginated ? <>
                    <div className={stylesPopoverDialog.navigation_container}>
                        <button title={__("opds.firstPage")}
                            onClick={() => { setPageNumber(1); setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")}
                            onClick={() => { setPageNumber(pageNumber - 1); setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100); }}
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
                                setPageNumber(pageOptions.find((option) => option.id === parseInt(e.currentTarget.value, 10)).id);
                                setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100);
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
                                    setPageNumber(id as number); setItemToEdit(-1);
                                }}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </ComboBox> */}
                        </div>
                        <button title={__("opds.next")}
                            onClick={() => { setPageNumber(pageNumber + 1); setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")}
                            onClick={() => { setPageNumber(pageTotal); setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100); }}
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

const BookmarkItem: React.FC<{ bookmark: IBookmarkState; i: number }> = (props) => {

    const { r2Publication, goToLocator, dockedMode: _dockedMode, setItemToEdit, itemEdited, dockedMode } = React.useContext(bookmarkCardContext);
    const { bookmark, i } = props;
    const isEdited = itemEdited === i;
    const [__] = useTranslator();

    const dispatch = useDispatch();
    const isAudioBook = isAudiobookFn(r2Publication);
    const deleteBookmark = (bookmark: IBookmarkState) => {
        dispatch(readerActions.bookmark.pop.build(bookmark));
    };
    let percent = 100;
    let p = -1;
    if (r2Publication.Spine?.length && bookmark.locator?.href) {
        const index = r2Publication.Spine.findIndex((item: any) => item.Href === bookmark.locator.href);
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
    const bprogression = (p >= 0 && !isAudioBook ? `${p}% ` : "");

    const textearearef = React.useRef<HTMLTextAreaElement>();

    const submitBookmark = (textValue: string) => {

        dispatch(readerActions.bookmark.update.build({ ...bookmark, name: textValue }));
        setItemToEdit(-1);
    };

    const bname = (bookmark.name ? `${bookmark.name}` : `${__("reader.navigation.bookmarkTitle")} ${i}`);

    React.useEffect(() => {
        if (isEdited && textearearef.current) {
            textearearef.current.style.height = "auto";
            textearearef.current.style.height = `${textearearef.current.scrollHeight + 3}px`;
            textearearef.current.focus();
        }
    }, [isEdited]);

    return (
        <div
            className={stylesPopoverDialog.bookmarks_line}
            key={i}
            onKeyDown={isEdited ? (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    setItemToEdit(-1);
                    setTimeout(() => {
                        const el = document.getElementById(`bookmark_item-${itemEdited}_edit_button`);
                        el?.blur();
                        el?.focus();
                    }, 100);
                }
            } : undefined}
        >
            <div
                className={stylesPopoverDialog.bookmark_infos}
            >

                <div className={stylesPopoverDialog.chapter_marker}>
                    {isEdited ?
                        // <FocusLock disabled={dockedMode} autoFocus={true}>
                        // TODO fix issue with focusLock on modal not docked
                        <FocusLock disabled={true} autoFocus={true}>
                            <form className={stylesPopoverDialog.update_form}>
                                <TextArea id="editBookmark" name="editBookmark" wrap="hard" ref={textearearef}
                                    defaultValue={bname}
                                    className={stylesPopoverDialog.bookmark_textArea}
                                />
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <button className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")} type="button" onClick={() => { setItemToEdit(-1); }}>{__("dialog.cancel")}</button>
                                    <button type="submit"
                                        className={stylesButtons.button_primary_blue}
                                        aria-label={__("reader.marks.saveMark")}
                                        onClick={(e) => { e.preventDefault(); submitBookmark(textearearef?.current?.value || ""); }}
                                    >
                                        <SVG ariaHidden svg={SaveIcon} />
                                        {__("reader.marks.saveMark")}
                                    </button>
                                </div>
                            </form>
                        </FocusLock>
                        :
                        <button
                            className={stylesReader.bookmarkList_button}
                            onClick={(e) => {
                                // e.stopPropagation();
                                e.preventDefault();
                                const closeNavBookmark = !dockedMode && !(e.shiftKey && e.altKey);
                                goToLocator(bookmark.locator, closeNavBookmark);
                            }}

                        // does not work on button (works on 'a' link)
                        // onDoubleClick={(_e) => goToLocator(bookmark.locator, false)}

                        // not necessary (onClick works)
                        // onKeyUp=
                        // {
                        //     (e) => {
                        //         // SPACE does not work (only without key mods on button)
                        //         // || e.key === "Space"
                        //         if (e.key === "Enter") {
                        //             // e.stopPropagation();
                        //             e.preventDefault();
                        //             const closeNavBookmark = !dockedMode && !(e.shiftKey && e.altKey);
                        //             goToLocator(bookmark.locator, closeNavBookmark);
                        //         }
                        //     }
                        // }
                        >
                            <HardWrapComment comment={bname} />
                        </button>
                    }
                    <div className={stylesPopoverDialog.bookmark_actions}>
                        <div>
                            <SVG ariaHidden svg={BookOpenIcon} />
                            <p>{bprogression}</p>
                        </div>
                        <div className={stylesPopoverDialog.bookmark_actions_buttons}>
                            <button
                                id={`bookmark_item-${i}_edit_button`}
                                title={__("reader.marks.edit")}
                                onClick={() => { setItemToEdit(i); }}
                                disabled={isEdited}
                            >
                                <SVG ariaHidden={true} svg={EditIcon} />
                            </button>
                            <Popover.Root>
                                <Popover.Trigger asChild>
                                    <button title={__("reader.marks.delete")}
                                    >
                                        <SVG ariaHidden={true} svg={DeleteIcon} />
                                    </button>
                                </Popover.Trigger>
                                <Popover.Portal>
                                    <Popover.Content collisionPadding={{ top: 180, bottom: 100 }} avoidCollisions alignOffset={-10} hideWhenDetached sideOffset={5} className={stylesPopoverDialog.delete_item}>
                                        <Popover.Close
                                            onClick={() => { setItemToEdit(-1); deleteBookmark(bookmark); }}
                                            title={__("reader.marks.delete")}
                                        >
                                            <SVG ariaHidden={true} svg={DeleteIcon} />
                                            {__("reader.marks.delete")}
                                        </Popover.Close>
                                        <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                                    </Popover.Content>
                                </Popover.Portal>

                            </Popover.Root>
                        </div>
                    </div>
                    <div className={stylesPopoverDialog.gauge}>
                        <div className={stylesPopoverDialog.fill} style={style}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const bookmarkCardContext = React.createContext<{
    itemEdited: number;
    setItemToEdit: (i: number) => void;
    goToLocator: (locator: Locator, closeNavPanel?: boolean) => void;
    dockedMode: boolean;
    r2Publication: R2Publication;
}>(undefined);

const BookmarkList: React.FC<{ r2Publication: R2Publication, dockedMode: boolean } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const { r2Publication, goToLocator, dockedMode } = props;
    const [__] = useTranslator();
    const bookmarks = useSelector((state: IReaderRootState) => state.reader.bookmark).map(([, v]) => v);

    // const sortedBookmarks = bookmarks;
    // WARNING: .sort() is in-place same-array mutation! (not a new array)
    const sortedBookmarks = React.useMemo(() => bookmarks.sort((a, b) => {
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
    }), [bookmarks, r2Publication.Spine]);

    const MAX_MATCHES_PER_PAGE = 5;

    const pageTotal = Math.ceil(sortedBookmarks.length / MAX_MATCHES_PER_PAGE) || 1;

    const [pageNumber, setPageNumber] = React.useState(1);
    if (pageNumber <= 0) {
        setPageNumber(1);
    } else if (pageNumber > pageTotal) {
        setPageNumber(pageTotal);
    }

    const startIndex = (pageNumber - 1) * MAX_MATCHES_PER_PAGE;

    const bookmarksPagedArray = sortedBookmarks.slice(startIndex, startIndex + MAX_MATCHES_PER_PAGE); // catch the end of the array

    const isLastPage = pageTotal === pageNumber;
    const isFirstPage = pageNumber === 1;
    const isPaginated = pageTotal > 1;
    const pageOptions = Array(pageTotal).fill(undefined).map((_, i) => i + 1).map((v) => ({ id: v, name: `${v} / ${pageTotal}` }));

    const begin = startIndex + 1;
    const end = Math.min(startIndex + MAX_MATCHES_PER_PAGE, sortedBookmarks.length);

    const [itemEdited, setItemToEdit] = React.useState(-1);

    const paginatorBookmarksRef = React.useRef<HTMLSelectElement>();

    return (
        <>
            <bookmarkCardContext.Provider value={{
                goToLocator,
                dockedMode,
                r2Publication,
                itemEdited,
                setItemToEdit,
            }}>

                {
                    bookmarksPagedArray.map((bookmark, i) =>
                        <BookmarkItem
                            key={`bookmark_card-${i}`}
                            bookmark={bookmark}
                            i={i + 1 + ((pageNumber - 1) * MAX_MATCHES_PER_PAGE)}
                        />,
                    )
                }
            </bookmarkCardContext.Provider>
            {
                isPaginated ? <>
                    <div className={stylesPopoverDialog.navigation_container}>
                        <button title={__("opds.firstPage")}
                            onClick={() => { setPageNumber(1); setItemToEdit(-1); setTimeout(() => paginatorBookmarksRef.current?.focus(), 100); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")}
                            onClick={() => { setPageNumber(pageNumber - 1); setItemToEdit(-1); setTimeout(() => paginatorBookmarksRef.current?.focus(), 100); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>
                        <div className={stylesPopoverDialog.pages}>
                            {/* <SelectRef
                                id="paginatorBookmarks"
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
                            <select onChange={(e) => {
                                setPageNumber(pageOptions.find((option) => option.id === parseInt(e.currentTarget.value, 10)).id);
                                setTimeout(() => paginatorBookmarksRef.current?.focus(), 100);
                            }}
                                id="paginatorBookmarks"
                                ref={paginatorBookmarksRef}
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
                                    setPageNumber(id as number); setItemToEdit(-1);
                                }}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </ComboBox> */}
                        </div>
                        <button title={__("opds.next")}
                            onClick={() => { setPageNumber(pageNumber + 1); setItemToEdit(-1); setTimeout(() => paginatorBookmarksRef.current?.focus(), 100); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")}
                            onClick={() => { setPageNumber(pageTotal); setItemToEdit(-1); setTimeout(() => paginatorBookmarksRef.current?.focus(), 100); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowLastIcon} />
                        </button>
                    </div>
                    {
                        sortedBookmarks.length &&
                        <p
                            style={{
                                textAlign: "center",
                                padding: 0,
                                margin: 0,
                                marginTop: "-16px",
                                marginBottom: "20px",
                            }}>{`[ ${begin === end ? `${end}` : `${begin} ... ${end}`} ] / ${sortedBookmarks.length}`}</p>
                    }
                </>
                    : <></>
            }
        </>);
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
            </label> : <></>}
        <form
            id="gotoPageForm"
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
    const { /* toggleMenu */ pdfToc, isPdf, focusMainAreaLandmarkAndCloseMenu,
        pdfNumberOfPages, currentLocation, goToLocator, openedSection: tabValue, setOpenedSection: setTabValue } = props;
    const { doFocus, annotationUUID, handleLinkClick, resetAnnotationUUID } = props;
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";
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

    React.useEffect(() => {

        console.log("##########");
        console.log(`USE EFFECT [annotationUUID=${annotationUUID}] [doFocus=${doFocus}] [tabValue=${tabValue}] [dockedMode=${dockingMode}]`);
        console.log("##########");

        if (annotationUUID) {

            setTimeout(() => {
                const elem = document.getElementById(annotationUUID) as HTMLDivElement;
                if (elem) {
                    console.log(`annotationDiv found "(${elem.tagName})" and Focus on [${annotationUUID}]`);

                    // annotationDivRef.current = elem;

                    // TODO: what is the logic for stealing focus here? The result of keyboard or mouse interaction?
                    elem.focus();

                } else {
                    console.log(`annotationUUID=${annotationUUID} not found!`);
                }
            }, 1);

        } else if (dockingMode !== "full") {

            setTimeout(() => {
                if (dockedModeRef.current) {

                    console.log("Focus on docked mode combobox");

                    // TODO: what is the logic for stealing focus here? The result of keyboard or mouse interaction?
                    dockedModeRef.current.focus();
                } else {
                    console.error("!no dockedModeRef on combobox");
                }
            }, 1);

        } else {

        }

    }, [tabValue, annotationUUID, doFocus, dockingMode]);

    const setReaderConfig = useSaveReaderConfig();
    // memoization not needed here, onCick not passed as child component props (only event re-bind in local HTML element)
    // ... plus, see setDockingModeFull() and setDockingModeLeftSide() and setDockingModeRightSide() below which are the ones used in onClick!
    // const setDockingMode = React.useCallback((value: ReaderConfig["readerDockingMode"]) => {
    //     setReaderConfig({readerDockingMode: value});
    // }, [setReaderConfig]);
    const setDockingMode = (value: ReaderConfig["readerDockingMode"]) => {
        setReaderConfig({ readerDockingMode: value });
    };
    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");

    if (!r2Publication) {
        return <>Critical Error no R2Publication available</>;
    }

    const sectionsArray: Array<React.JSX.Element> = [];
    const options: Array<{ id: number, value: string, name: string, disabled: boolean, svg: {} }> = [];

    const TocTrigger =
        <Tabs.Trigger value="tab-toc" key={"tab-toc"} data-value={"tab-toc"}
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
        <Tabs.Trigger value="tab-landmark" key={"tab-landmark"} data-value={"tab-landmark"} title={__("reader.marks.landmarks")} disabled={!r2Publication.Landmarks || r2Publication.Landmarks.length === 0}>
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
        <Tabs.Trigger value="tab-bookmark" key={"tab-bookmark"} data-value={"tab-bookmark"} title={__("reader.marks.bookmarks")}>
            <SVG ariaHidden svg={BookmarkIcon} />
            <h3>{__("reader.marks.bookmarks")}</h3>
        </Tabs.Trigger>;
    const optionBookmarkItem = {
        id: 2, value: "tab-bookmark", name: __("reader.marks.bookmarks"), disabled: false, // !bookmarks || bookmarks.length === 0,
        svg: BookmarkIcon,
    };

    const SearchTrigger =
        <Tabs.Trigger value="tab-search" key={"tab-search"} data-value={"tab-search"} title={__("reader.marks.search")} disabled={/*!searchEnable ||*/ isPdf}>
            <SVG ariaHidden svg={SearchIcon} />
            <h3>{__("reader.marks.search")}</h3>
        </Tabs.Trigger>;
    const optionSearchItem = {
        id: 3, value: "tab-search", name: __("reader.marks.search"), disabled: /*!searchEnable ||*/ isPdf,
        svg: SearchIcon,
    };

    const GoToPageTrigger =
        <Tabs.Trigger value="tab-gotopage" key={"tab-gotopage"} title={__("reader.marks.goTo")} data-value={"tab-gotopage"}>
            <SVG ariaHidden svg={TargetIcon} />
            <h3>{__("reader.marks.goTo")}</h3>
        </Tabs.Trigger>;
    const optionGoToPageItem = {
        id: 4, value: "tab-gotopage", name: __("reader.marks.goTo"), disabled: false,
        svg: TargetIcon,
    };

    // disabled={!annotations || annotations.length === 0}
    const AnnotationTrigger =
        <Tabs.Trigger value="tab-annotation" key={"tab-annotation"} data-value={"tab-annotation"} title={__("reader.marks.annotations")} >
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
    sectionsArray.push(SearchTrigger);
    options.push(optionSearchItem);
    sectionsArray.push(GoToPageTrigger);
    options.push(optionGoToPageItem);
    sectionsArray.push(Separator);
    sectionsArray.push(BookmarksTrigger);
    options.push(optionBookmarkItem);
    sectionsArray.push(AnnotationTrigger);
    options.push(optionAnnotationItem);

    const optionSelected = options.find(({ value }) => value === tabValue)?.id || 0;

    const isRTL_ = isRTL(r2Publication);
    const renderLinkTree_ = renderLinkTree(currentLocation, isRTL_, handleLinkClick, dockedMode);
    const renderLinkList_ = renderLinkList(isRTL_, handleLinkClick, dockedMode);

    const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
    SelectRef.displayName = "Select";

    const TabHeader = () => {
        return (
            dockedMode ? <></> :
                <div key="modal-header" className={stylesSettings.close_button_div}>
                    <TabTitle value={tabValue} />
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
                            svg={options.find(({ value }) => value === tabValue)?.svg}
                            onSelectionChange={(id) => {
                                console.log("selectionchange: ", id);
                                const value = options.find(({ id: _id }) => _id === id)?.value;
                                if (value) {
                                    setTabValue(value);
                                    setTimeout(() => {
                                        // TODO: is stealing focus here necessary? Should this vary depending on keyboard or mouse interaction?
                                        const elem = document.getElementById(`readerMenu_tabs-${value}`);
                                        elem?.blur();
                                        elem?.focus();
                                    }, 1);
                                    console.log("set Tab Value = ", value);

                                } else {
                                    console.error("Combobox No value !!!");
                                }
                            }}
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
                        >
                            {item => <SelectItem>{item.name}</SelectItem>}
                        </SelectRef>
                    </>
                    : <></>
            }
            <Tabs.Root value={tabValue} onValueChange={(value) => dockedMode ? null : setTabValue(value)} data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                {
                    dockedMode ? <></> :
                        <Tabs.List ref={tabModeRef} className={stylesSettings.settings_tabslist} aria-orientation="vertical" data-orientation="vertical">
                            {sectionsArray}
                        </Tabs.List>
                }
                <div className={stylesSettings.settings_content}
                    ref={popoverBoundary}
                    style={{ marginTop: dockedMode && "0" }}>
                    <Tabs.Content value="tab-toc" tabIndex={-1} id={"readerMenu_tabs-tab-toc"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            {(isPdf && pdfToc?.length && renderLinkTree_(__("reader.marks.toc"), pdfToc, 1, undefined)) ||
                                (isPdf && !pdfToc?.length && <p>{__("reader.toc.publicationNoToc")}</p>) ||
                                // tslint:disable-next-line: max-line-length
                                (!isPdf && r2Publication.TOC && renderLinkTree_(__("reader.marks.toc"), r2Publication.TOC, 1, undefined)) ||
                                (!isPdf && r2Publication.Spine && renderLinkList_(__("reader.marks.toc"), r2Publication.Spine))}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-landmark" tabIndex={-1} id={"readerMenu_tabs-tab-landmark"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            {r2Publication.Landmarks &&
                                renderLinkList_(__("reader.marks.landmarks"), r2Publication.Landmarks)}
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-bookmark" tabIndex={-1} id={"readerMenu_tabs-tab-bookmark"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={stylesSettings.settings_tab}>
                            <BookmarkList r2Publication={r2Publication} goToLocator={goToLocator} dockedMode={dockedMode} />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-annotation" tabIndex={-1} id={"readerMenu_tabs-tab-annotation"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                        <TabHeader />
                        <div className={classNames(stylesSettings.settings_tab, stylesAnnotations.annotations_tab)}>
                            <AnnotationList 
                            goToLocator={goToLocator} 
                            annotationUUIDFocused={annotationUUID} 
                            resetAnnotationUUID={resetAnnotationUUID} 
                            doFocus={doFocus} 
                            popoverBoundary={popoverBoundary.current}
                            advancedAnnotationsOnChange={advancedAnnotationsOnChange}
                            quickAnnotationsOnChange={quickAnnotationsOnChange}
                            marginAnnotationsOnChange={marginAnnotationsOnChange}
                            hideAnnotationOnChange={hideAnnotationOnChange}
                            serialAnnotator={serialAnnotator}
                             />
                        </div>
                    </Tabs.Content>

                    <Tabs.Content value="tab-search" tabIndex={-1} id={"readerMenu_tabs-tab-search"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
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

                    <Tabs.Content value="tab-gotopage" tabIndex={-1} id={"readerMenu_tabs-tab-gotopage"} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
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
