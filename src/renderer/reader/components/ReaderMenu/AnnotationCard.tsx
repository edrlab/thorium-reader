// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
import * as stylesMarkdown from "readium-desktop/renderer/assets/styles/github-markdown.scss";
import classNames from "classnames";
import * as React from "react";
import FocusLock from "react-focus-lock";

import SVG from "readium-desktop/renderer/common/components/SVG";

import * as DeleteIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as BookOpenIcon from "readium-desktop/renderer/assets/icons/bookOpen-icon.svg";
import * as CalendarIcon from "readium-desktop/renderer/assets/icons/calendar-icon.svg";
import * as AvatarIcon from "readium-desktop/renderer/assets/icons/avatar-icon.svg";
import * as Popover from "@radix-ui/react-popover";
import { AnnotationEdit } from "../AnnotationEdit";

import { IReaderMenuProps } from "../options-values";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerActions } from "readium-desktop/common/redux/actions";
import { useReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { rgbToHex } from "readium-desktop/common/rgb";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { EDrawType, INoteState, noteColorCodeToColorTranslatorKeySet, TDrawType } from "readium-desktop/common/redux/states/renderer/note";

import DOMPurify from "dompurify";
import { clone } from "ramda";
import { marked } from "readium-desktop/renderer/common/marked/marked";
import { computeProgression } from "./ReaderMenu";

export const AnnotationCard: React.FC<{ annotation: INoteState, isEdited: boolean, triggerEdition: (v: boolean) => void, setTagFilter: (v: string) => void, setCreatorFilter: (v: string) => void } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

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
                const hrefSanitized = parsed.replace(regex, (_substring, url) => {

                    if (url && !/^https?:\/\//.test(url)) {
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
        // dispatch(readerActions.bookmarkTotalCount.build(noteTotalCount + 1));
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
        style={{ backgroundColor: dockedEditAnnotation ? "var(--color-gray-50" : "", borderLeft: dockedEditAnnotation ? "none" : `4px solid ${annotationColor}` }}
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
        <div className={stylesAnnotations.annnotation_container}>
            {isEdited ?
                <></>
                : <button className={classNames(stylesAnnotations.annotation_name, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                    // title={bname}
                    aria-label={`${__("reader.goToContent")} (${btext})`}
                    style={{ borderLeft: dockedEditAnnotation && "2px solid var(--color-brand-primary)" }}
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
                    { !dockedMode ? __("reader.marks.delete") : undefined}
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
    </li>);
};
