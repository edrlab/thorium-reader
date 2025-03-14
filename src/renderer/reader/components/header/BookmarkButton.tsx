// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesReaderHeader from "readium-desktop/renderer/assets/styles/components/readerHeader.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
// import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesBookmarks from "readium-desktop/renderer/assets/styles/components/bookmarks.scss";

import * as SaveIcon from "readium-desktop/renderer/assets/icons/export-icon.svg";
import * as MarkIcon from "readium-desktop/renderer/assets/icons/bookmarkSingle-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as RemoveBookMarkIcon from "readium-desktop/renderer/assets/icons/BookmarkRemove-icon.svg";
import * as Popover from "@radix-ui/react-popover";

import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { isLocatorVisible, MediaOverlaysStateEnum, TTSStateEnum } from "@r2-navigator-js/electron/renderer";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { IBookmarkState, IBookmarkStateWithoutUUID } from "readium-desktop/common/redux/states/bookmark";
import { isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { ToastType } from "readium-desktop/common/models/toast";
import { formatTime } from "readium-desktop/common/utils/time";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { registerKeyboardListener, unregisterKeyboardListener } from "readium-desktop/renderer/common/keyboard";
import { DEBUG_KEYBOARD } from "readium-desktop/common/keyboard";
import { ReadiumElectronBrowserWindow } from "@r2-navigator-js/electron/renderer/webview/state";
import { readerLocalActionHighlights, readerLocalActionLocatorHrefChanged, readerLocalActionSetConfig } from "../../redux/actions";
import { TextArea } from "react-aria-components";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

export interface IProps {
    shortcutEnable: boolean;
    isOnSearch: boolean;
}

const equalFn = (prev: IReaderStateReader, current: IReaderStateReader) => {

    const previousLocator = prev.locator;
    const currentLocator = current.locator;

    if (
        previousLocator && currentLocator &&
        (
            previousLocator.locEventID !== currentLocator.locEventID ||
            previousLocator.locator.href !== currentLocator.locator.href ||
            previousLocator.locator.locations.cssSelector !== currentLocator.locator.locations.cssSelector ||
            previousLocator.locator.locations.position !== currentLocator.locator.locations.position
        )
    ) {
        return false;
    }

    const previousBookmarks = prev.bookmark.map(([, v]) => v);
    const currentBookmarks = current.bookmark.map(([, v]) => v);

    if (
        (
            Array.isArray(previousBookmarks) && Array.isArray(currentBookmarks) && (
                previousBookmarks.length !== currentBookmarks.length ||
                !previousBookmarks.reduce((acc, cv) => acc && !!currentBookmarks.find((v) => v.uuid === cv.uuid), true))
        )
    ) {
        return false;
    }

    return true;
};

enum EBookmarkIcon {
    NEUTRAL,
    ADD,
    DELETE
}

const getBookmarkName = (locatorExtended: MiniLocatorExtended) => {
    let name = "";
    if (locatorExtended.locator.text?.highlight) {
        name = locatorExtended.locator.text.highlight;
    } else if (locatorExtended.selectionInfo?.cleanText) {
        name = locatorExtended.selectionInfo.cleanText;
    } else if (locatorExtended.audioPlaybackInfo) {

        const audioPlaybackInfo = locatorExtended.audioPlaybackInfo;

        if (audioPlaybackInfo.globalProgression && audioPlaybackInfo.globalTime) {
            const percent = Math.floor(100 * audioPlaybackInfo.globalProgression);
            const timestamp = formatTime(audioPlaybackInfo.globalTime);
            name = `${timestamp} (${percent}%)`;
        } else {
            const percent = Math.floor(100 * audioPlaybackInfo.localProgression);
            const timestamp = formatTime(audioPlaybackInfo.localTime);
            name = `[${locatorExtended.locator.href}] ${timestamp} ${percent}%`;
        }
    }
    return name;
};

let __time = false;
export const BookmarkButton: React.FC<IProps> = ({shortcutEnable, isOnSearch}) => {

    const [__] = useTranslator();
    const [visibleBookmarks, setVisibleBookmarks] = React.useState<IBookmarkState[]>([]);
    const numberOfVisibleBookmarks = visibleBookmarks.length;

    // const selectionIsNew = useSelector((state: IReaderRootState) => state.reader.locator.selectionIsNew);
    const { bookmark: bookmarksQueueState, locator: locatorExtended } = useSelector((state: IReaderRootState) => state.reader, equalFn);
    // const selectionIsNew = locatorExtended.selectionIsNew;

    const defaultDrawView = useSelector((state: IReaderRootState) => state.reader.config.annotation_defaultDrawView);
    const bookmarkTotalCount = useSelector((state: IReaderRootState) => state.reader.bookmarkTotalCount.state);
    const currentLocation = useSelector((state: IReaderRootState) => state.reader.locator);

    const ttsState = useSelector((state: IReaderRootState) => state.reader.tts.state);
    const mediaOverlaysState = useSelector((state: IReaderRootState) => state.reader.mediaOverlay.state);

    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const isDivina = React.useMemo(() => isDivinaFn(r2Publication), [r2Publication]);
    const isPdf = React.useMemo(() => isPdfFn(r2Publication), [r2Publication]);
    const isAudiobook = !!locatorExtended.audioPlaybackInfo;
    const isEpubNavigator = !(isDivina || isPdf || isAudiobook);
    const isNavigator = isAudiobook || isEpubNavigator;

    const allBookmarks = React.useMemo(() => bookmarksQueueState.map(([, v]) => v), [bookmarksQueueState]);
    const allBookmarksForCurrentLocationHref = React.useMemo(() => allBookmarks.filter((bookmark) => bookmark.locator.href === locatorExtended.locator.href), [allBookmarks, locatorExtended]);
    const bookmarkSelected = React.useMemo(() => {

        let index = undefined;
        if (isEpubNavigator) {
            index = allBookmarksForCurrentLocationHref.findIndex((bookmark) =>
                // bookmark.locator.href === locatorExtended.locator.href &&
                bookmark.locator.locations.cssSelector === locatorExtended.locator.locations.cssSelector,
            );
        } else if (isAudiobook) {
            index = allBookmarksForCurrentLocationHref.findIndex((bookmark) =>
                // bookmark.locator.href === locatorExtended.locator.href &&
                Math.floor(locatorExtended.audioPlaybackInfo.globalTime) === Math.floor(locatorExtended.audioPlaybackInfo.globalDuration * bookmark.locator.locations.position),
            );
        } else {
            // index = allBookmarksForCurrentLocationHref.findIndex((bookmark) => bookmark.locator.href === locatorExtended.locator.href);
            index = allBookmarksForCurrentLocationHref.length ? 0 : -1;
        }
        if (index > -1) {
            return allBookmarksForCurrentLocationHref[index];
        }
        return undefined;
    }, [allBookmarksForCurrentLocationHref, locatorExtended, isAudiobook, isEpubNavigator]);

    let bookmarkIcon: EBookmarkIcon = EBookmarkIcon.NEUTRAL;
    if (bookmarkSelected) {
        bookmarkIcon = EBookmarkIcon.DELETE;
    } else {
        bookmarkIcon = EBookmarkIcon.ADD;
    }

    const [webviewLoaded, setWebviewLoaded] = React.useState(false);
    React.useEffect(() => {

        if (!isEpubNavigator) {
            return ;
        }

        const intervalId = window.setInterval(() => {

            const win = global.window as ReadiumElectronBrowserWindow;

            // const atLeastOneWebViewIsLoaded = win.READIUM2?.getActiveWebViews().map((webview) => webview.READIUM2.DOMisReady).reduce((prevDomIsLoaded, currentDomIsLoaded) => prevDomIsLoaded || currentDomIsLoaded, false);
            const allWebViewsAreLoaded = win.READIUM2?.getActiveWebViews()
                .map((webview) => webview.READIUM2.DOMisReady)
                .reduce((prevDomIsLoaded, currentDomIsLoaded) => prevDomIsLoaded && currentDomIsLoaded, true);

            if (allWebViewsAreLoaded) {
                clearInterval(intervalId);
                setWebviewLoaded(true);
            }
        }, 100);
    }, [isEpubNavigator]);

    const dispatch = useDispatch();
    const deleteBookmark = React.useCallback((bookmark: IBookmarkState) => {
        dispatch(readerActions.bookmark.pop.build(bookmark));
        // if (bookmark.locator.locations.rangeInfo)
        dispatch(readerLocalActionHighlights.handler.pop.build([
            {
                uuid: bookmark.uuid,
            },
        ]));
    }, [dispatch]);

    const toasty = React.useCallback((msg: string) => dispatch(toastActions.openRequest.build(ToastType.Success, msg)), [dispatch]);

    const addBookmark = React.useCallback((bookmark: IBookmarkStateWithoutUUID) => {

        if (ttsState !== TTSStateEnum.STOPPED ||
            mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
        ) {
            // ToastType.Error
            toasty(`${__("reader.tts.stop")} / ${__("reader.media-overlays.stop")}`);
            return;
        }

        dispatch(readerActions.bookmark.push.build(bookmark));
        // console.log("...bookmark.locator.locations.rangeInfo", JSON.stringify(bookmark.locator.locations.rangeInfo, null, 4));
        // if (bookmark.locator.locations.rangeInfo)
        dispatch(readerLocalActionHighlights.handler.push.build([
            {
                uuid: bookmark.uuid,
                href: bookmark.locator.href,
                def: {
                    textPopup: bookmark.name ? {
                        text: bookmark.name, // multiline
                        dir: "ltr", // TODO
                        lang: "en", // TODO
                    } : undefined,
                    selectionInfo: {
                        textFragment: undefined,
                        rangeInfo: bookmark.locator.locations.rangeInfo || {
                            startContainerElementCssSelector: bookmark.locator.locations.cssSelector,
                            startContainerElementCFI: undefined,
                            startContainerElementXPath: undefined,
                            startContainerChildTextNodeIndex: -1,
                            startOffset: -1,
                            endContainerElementCssSelector: bookmark.locator.locations.cssSelector,
                            endContainerElementCFI: undefined,
                            endContainerElementXPath: undefined,
                            endContainerChildTextNodeIndex: -1,
                            endOffset: -1,
                            cfi: undefined,
                        },
                        cleanBefore: bookmark.locator.text?.before || "",
                        cleanText: bookmark.locator.text?.highlight || bookmark.locator.title || bookmark.name,
                        cleanAfter: bookmark.locator.text?.after || "",
                        rawBefore: bookmark.locator.text?.beforeRaw || "",
                        rawText: bookmark.locator.text?.highlightRaw || bookmark.locator.title || bookmark.name,
                        rawAfter: bookmark.locator.text?.afterRaw || "",
                    },
                    color: {red:  52, green: 152, blue: 219},
                    group: "bookmark",
                    drawType: 6,
                },
            },
        ]));

        if (defaultDrawView === "hide"
            // SKIP ENTIRELY, see ABOVE
            // ttsState === TTSStateEnum.STOPPED &&
            // mediaOverlaysState === MediaOverlaysStateEnum.STOPPED
        ) { // NOT "margin" or "annotation"
            dispatch(readerLocalActionSetConfig.build({ annotation_defaultDrawView: "annotation" }));
            const href1 = currentLocation?.locator?.href;
            const href2 = currentLocation?.secondWebViewHref;
            dispatch(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
        }

    }, [dispatch, defaultDrawView, currentLocation, ttsState, mediaOverlaysState, __, toasty]);

    const toggleBookmark = React.useCallback((fromKeyboard?: boolean, name?: string) => {

        const bookmarkIndex = bookmarkTotalCount + 1;

        if (isNavigator) {

            if (!locatorExtended?.locator) {
                return;
            }

            if (
                !fromKeyboard &&
                bookmarkSelected
            ) {
                toasty(`${__("catalog.delete")} - ${bookmarkSelected.name ? bookmarkSelected.name : `${__("reader.marks.bookmarks")} [${bookmarkIndex}]`}`);
                deleteBookmark(bookmarkSelected);
                return ;
            }

            if (!bookmarkSelected) {
                const msg = `${__("catalog.addTagsButton")} - ${name ? name : `${__("reader.marks.bookmarks")} [${bookmarkIndex}]`}`;
                toasty(msg);

                if (locatorExtended.locator.locations && !locatorExtended.locator.locations.rangeInfo && locatorExtended.selectionInfo?.rangeInfo) {
                    locatorExtended.locator.locations.rangeInfo = locatorExtended.selectionInfo.rangeInfo;
                }

                addBookmark({
                    locator: locatorExtended.locator,
                    name,
                    created: (new Date()).getTime(),
                    index: bookmarkIndex,
                });
            }

        } else {

            const href = locatorExtended.locator.href;
            const pdfOrDivinaName = name ? name : isDivina ? href : isPdf ? (parseInt(href, 10) + 1).toString() : "";
            if (href) {

                if (bookmarkSelected) {
                    toasty(`${__("catalog.delete")} - ${bookmarkSelected.name ? bookmarkSelected.name : `${__("reader.marks.bookmarks")} [${bookmarkIndex}]`}`);
                    deleteBookmark(bookmarkSelected);
                } else {
                    toasty(`${__("catalog.addTagsButton")} - ${pdfOrDivinaName ? pdfOrDivinaName : `${__("reader.marks.bookmarks")} [${bookmarkIndex}]`}`);
                    addBookmark({
                        locator: locatorExtended.locator,
                        name: pdfOrDivinaName,
                        created: (new Date()).getTime(),
                        index: bookmarkIndex,
                    });
                }
            }
        }
    }, [
        __, addBookmark, deleteBookmark, locatorExtended.locator, locatorExtended.selectionInfo?.rangeInfo, isDivina, isNavigator, isPdf, toasty, bookmarkSelected, bookmarkTotalCount,
    ],
    );

    const keyboardShortcuts = useSelector((state: IReaderRootState) => state.keyboard.shortcuts);

    const onKeyboardBookmark = React.useCallback(() => {
        if (!shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardBookmark)");
            }
            return;
        }
        toggleBookmark(true, getBookmarkName(locatorExtended));
    }, [shortcutEnable, toggleBookmark, locatorExtended]);
    React.useEffect(() => {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            keyboardShortcuts.ToggleBookmark,
            onKeyboardBookmark);

        return () => {
            unregisterKeyboardListener(onKeyboardBookmark);
        };
    }, [onKeyboardBookmark, keyboardShortcuts]);

    const [isBookmarkNeedEditing, setIsBookmarkNeedEditing] = React.useState(false);
    if (bookmarkSelected && isBookmarkNeedEditing) {
        setIsBookmarkNeedEditing(false);
    }
    const onKeyboardEditBookmark = React.useCallback(() => {
        if (!shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardEditBookmark)");
            }
            return;
        }
        setIsBookmarkNeedEditing(true);
    }, [shortcutEnable, setIsBookmarkNeedEditing]);
    React.useEffect(() => {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            keyboardShortcuts.AddBookmarkWithLabel,
            onKeyboardEditBookmark);

        return () => {
            unregisterKeyboardListener(onKeyboardEditBookmark);
        };
    }, [onKeyboardEditBookmark, keyboardShortcuts]);

    React.useEffect(() => {

        if (isEpubNavigator) {

            if (!webviewLoaded) {
                return;
            }

            const fetchVisibleBookmarks = () => {

                if (IS_DEV) {
                    if (!__time) {
                        __time = true;
                        console.time("UPDATE_BOOKMARK_NEW_METHOD");
                    } else {
                        console.timeEnd("UPDATE_BOOKMARK_NEW_METHOD");
                        console.time("UPDATE_BOOKMARK_NEW_METHOD");
                    }
                }

                const visibleBookmarksPromise = allBookmarksForCurrentLocationHref.map<Promise<boolean>>((bookmark) => isLocatorVisible(bookmark.locator));
                Promise.all(visibleBookmarksPromise).then(
                    (visibleBookmarks) => {
                        const visibleBookmarksFiltered = visibleBookmarks.map((isVisible, index) => isVisible ? allBookmarksForCurrentLocationHref[index] : undefined).filter((bookmark) => !!bookmark);
                        setVisibleBookmarks(visibleBookmarksFiltered);
                    },
                ).catch(async (e) => {
                    console.log("Promise.all(visibleBookmarksPromise) REJECT!!?");
                    console.log(e); // isLocatorVisible - no webview href match.
                    // setVisibleBookmarks([]);
                    // fallback to sequential checking:
                    const arr: IBookmarkState[] = [];
                    for (const bookmark of allBookmarks) {
                        try {
                            if (await isLocatorVisible(bookmark.locator)) {
                                arr.push(bookmark);
                            }
                        } catch (_e) {
                            // ignore
                        }
                    }
                    setVisibleBookmarks(arr);
                }).finally(() => {
                    if (IS_DEV) {
                        console.timeEnd("UPDATE_BOOKMARK_NEW_METHOD");
                        __time = false;
                    }
                });
            };
            setTimeout(() => fetchVisibleBookmarks(), 1);
        } else if (isAudiobook) {

            // const visibleBookmarks = allBookmarks.filter((bookmark) =>
            //     bookmark.locator.href === locatorExtended.locator.href
            //     // &&
            //     // Math.floor(locatorExtended.audioPlaybackInfo.globalTime) === Math.floor(locatorExtended.audioPlaybackInfo.globalDuration * bookmark.locator.locations.position)
            //     ,
            // );
            setVisibleBookmarks(allBookmarksForCurrentLocationHref);
        } else {
            // const visibleBookmarks = allBookmarks.filter((bookmark) => bookmark.locator.href === locatorExtended.locator.href);
            setVisibleBookmarks(allBookmarksForCurrentLocationHref);
        }

    }, [allBookmarks, allBookmarksForCurrentLocationHref, locatorExtended, isEpubNavigator, webviewLoaded, isAudiobook]);

    const bookmarkMaxLength = 1500;
    const [textAreaValue, setTextAreaValue] = React.useState("");
    const textAreaDefaultValueWhenEditing = React.useMemo(() => isBookmarkNeedEditing ? getBookmarkName(locatorExtended) : "", [isBookmarkNeedEditing, locatorExtended]);
    React.useEffect(() => {
        if (isBookmarkNeedEditing) {
            setTextAreaValue(textAreaDefaultValueWhenEditing.slice(0, bookmarkMaxLength));
        }
    }, [isBookmarkNeedEditing, setTextAreaValue, textAreaDefaultValueWhenEditing]);

    // console.log("numberOfVisibleBookmarks", numberOfVisibleBookmarks);
    return <>

        <Popover.Root open={isBookmarkNeedEditing} onOpenChange={(open) => {
            if (isBookmarkNeedEditing) {
                setIsBookmarkNeedEditing(open);
            }
        }}>
            <Popover.Trigger asChild>
                <li
                    {...(numberOfVisibleBookmarks ?
                        { style: { backgroundColor: "var(--color-blue" } }
                        : {})}
                >
                    <input
                        id="bookmarkButton"
                        className={stylesReader.bookmarkButton}
                        type="checkbox"
                        checked={!!numberOfVisibleBookmarks}
                        onClick={() => {
                            toggleBookmark();
                        }}
                        onKeyUp={(e) => {
                            if (e.key === "Enter") { e.currentTarget.click(); }
                        }}
                        onChange={(e) => e.currentTarget.click()}

                        aria-label={`${__("reader.navigation.bookmarkTitle")} (${bookmarkIcon === EBookmarkIcon.DELETE ? __("catalog.delete") : __("catalog.addTagsButton")
                            })`}
                        title={`${__("reader.navigation.bookmarkTitle")} (${bookmarkIcon === EBookmarkIcon.ADD ? __("catalog.addTagsButton") : __("catalog.delete")
                            })`}
                    />
                    {
                        // "htmlFor" is necessary as input is NOT located suitably for mouse hit testing
                    }
                    <label
                        htmlFor="bookmarkButton"
                        aria-hidden="true"
                        className={stylesReader.menu_button}
                        id="bookmarkLabel"

                        aria-label={`${__("reader.navigation.bookmarkTitle")} (${bookmarkIcon === EBookmarkIcon.DELETE ? __("catalog.delete") : __("catalog.addTagsButton")
                            })`}
                        title={`${__("reader.navigation.bookmarkTitle")} (${bookmarkIcon === EBookmarkIcon.ADD ? __("catalog.addTagsButton") : __("catalog.delete")
                            })`}
                    >
                        <SVG ariaHidden={true} svg={MarkIcon} className={classNames(stylesReaderHeader.bookmarkIcon,
                            numberOfVisibleBookmarks > 0
                                ? stylesReaderHeader.active_svg_option : "")} />

                        <SVG ariaHidden={true} svg={RemoveBookMarkIcon} className={classNames(stylesReaderHeader.bookmarkRemove,
                            bookmarkIcon === EBookmarkIcon.DELETE
                                ? stylesReaderHeader.active_svg_option : "")} />

                        <SVG ariaHidden={true} svg={PlusIcon} className={classNames(stylesReaderHeader.bookmarkAdd,
                            bookmarkIcon === EBookmarkIcon.ADD
                                ? stylesReaderHeader.active_svg_option : "")} />
                    </label>
                </li>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content sideOffset={isOnSearch ? 50 : 18} align="end" style={{ zIndex: 101 }}
                // onPointerDownOutside={(e) => { e.preventDefault(); console.log("annotationPopover onPointerDownOutside"); }}
                // onInteractOutside={(e) => { e.preventDefault(); console.log("annotationPopover onInteractOutside"); }}
                >
                    <form className={stylesBookmarks.bookmark_form}>
                        <div style={{ backgroundColor: "var(--color-extralight-grey)"}}>

                            <p>{locatorExtended.selectionInfo?.cleanText ? (locatorExtended.selectionInfo.cleanText.length > (200 - 3) ? `${locatorExtended.selectionInfo.cleanText.slice(0, 200)}...` : locatorExtended.selectionInfo.cleanText) : ""}</p>
                            <div>
                                <TextArea value={textAreaValue} name="editBookmark" wrap="hard"
                                    className={stylesBookmarks.bookmark_form_textarea}
                                    maxLength={bookmarkMaxLength} onChange={(a) => setTextAreaValue(a.currentTarget.value)}
                                ></TextArea>
                                <span style={{ fontSize: "10px", color: "var(--color-medium-grey)", position: "relative", left: "350px" }}>{textAreaValue.length}/{bookmarkMaxLength}</span>
                            </div>
                        </div>
                        <div className={stylesBookmarks.bookmark_form_textarea_buttons}>
                            <Popover.Close className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")}>{__("dialog.cancel")}</Popover.Close>
                            <button type="submit"
                                className={stylesButtons.button_primary_blue}
                                aria-label={__("reader.marks.saveMark")}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const textareaNormalize = textAreaValue.trim().replace(/\s*\n\s*/gm, "\0").replace(/\s\s*/g, " ").replace(/\0/g, "\n");
                                    // if (textareaNormalize) {
                                        toggleBookmark(true, textareaNormalize);
                                        setIsBookmarkNeedEditing(false);
                                    // }
                                }}
                            >
                                <SVG ariaHidden svg={SaveIcon} />
                                {__("reader.marks.saveMark")}
                            </button>
                        </div>
                    </form>
                    <Popover.Arrow style={{ fill: "var(--color-extralight-grey)" }} width={15} height={10} />
                </Popover.Content>
            </Popover.Portal>

        </Popover.Root>
    </>;

};
