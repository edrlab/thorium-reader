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

import * as MarkIcon from "readium-desktop/renderer/assets/icons/bookmarkSingle-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as RemoveBookMarkIcon from "readium-desktop/renderer/assets/icons/BookmarkRemove-icon.svg";
import * as Popover from "@radix-ui/react-popover";

import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { isLocatorVisible, keyboardFocusRequest, MediaOverlaysStateEnum, TTSStateEnum } from "@r2-navigator-js/electron/renderer";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { ToastType } from "readium-desktop/common/models/toast";
import { registerKeyboardListener, unregisterKeyboardListener } from "readium-desktop/renderer/common/keyboard";
import { DEBUG_KEYBOARD } from "readium-desktop/common/keyboard";
import { ReadiumElectronBrowserWindow } from "@r2-navigator-js/electron/renderer/webview/state";
import { readerLocalActionHighlights, readerLocalActionReader } from "../../redux/actions";
import { BookmarkEdit } from "../BookmarkEdit";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { EDrawType, INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { clone } from "ramda";

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

    const previousBookmarks = prev.note.filter(({group}) => group === "bookmark");
    const currentBookmarks = current.note.filter(({group}) => group === "bookmark");

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



let __time = false;
export const BookmarkButton: React.FC<IProps> = ({shortcutEnable, isOnSearch}) => {

    const [__] = useTranslator();
    const [visibleBookmarks, setVisibleBookmarks] = React.useState<INoteState[]>([]);
    const numberOfVisibleBookmarks = visibleBookmarks.length;

    // const selectionIsNew = useSelector((state: IReaderRootState) => state.reader.locator.selectionIsNew);
    const { note: notes, locator: locatorExtended } = useSelector((state: IReaderRootState) => state.reader, equalFn);
    // const selectionIsNew = locatorExtended.selectionIsNew;

    const noteTotalCount = useSelector((state: IReaderRootState) => state.reader.noteTotalCount.state);

    const ttsState = useSelector((state: IReaderRootState) => state.reader.tts.state);
    const mediaOverlaysState = useSelector((state: IReaderRootState) => state.reader.mediaOverlay.state);

    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const isDivina = React.useMemo(() => isDivinaFn(r2Publication), [r2Publication]);
    const isPdf = React.useMemo(() => isPdfFn(r2Publication), [r2Publication]);
    const isAudiobook = !!locatorExtended.audioPlaybackInfo;
    const isEpubNavigator = !(isDivina || isPdf || isAudiobook);
    const isNavigator = isAudiobook || isEpubNavigator;

    const allBookmarks = React.useMemo(() => notes.filter(({ group }) => group === "bookmark"), [notes]);
    const allBookmarksForCurrentLocationHref = React.useMemo(() => allBookmarks.filter((bookmark) => bookmark.locatorExtended?.locator.href === locatorExtended.locator.href), [allBookmarks, locatorExtended]);
    const bookmarkSelected = React.useMemo(() => {

        let index = undefined;
        if (isEpubNavigator) {
            index = allBookmarksForCurrentLocationHref.findIndex((bookmark) => {
                if (!bookmark.locatorExtended) {
                    return false;
                }
                const bookmarkLocations = bookmark.locatorExtended.locator.locations;
                const currentLocations = locatorExtended.locator.locations;

                return bookmarkLocations.cssSelector === currentLocations.cssSelector &&
                    bookmarkLocations.caretInfo?.rangeInfo?.startContainerElementCssSelector === currentLocations.caretInfo?.rangeInfo?.startContainerElementCssSelector &&
                    bookmarkLocations.caretInfo?.rangeInfo?.endContainerElementCssSelector === currentLocations.caretInfo?.rangeInfo?.endContainerElementCssSelector &&
                    bookmarkLocations.caretInfo?.rangeInfo?.startOffset === currentLocations.caretInfo?.rangeInfo?.startOffset &&
                    bookmarkLocations.caretInfo?.rangeInfo?.endOffset === currentLocations.caretInfo?.rangeInfo?.endOffset;
            });
        } else if (isAudiobook) {
            index = allBookmarksForCurrentLocationHref.findIndex((bookmark) =>
                bookmark.locatorExtended &&
                // bookmark.locator.href === locatorExtended.locator.href &&
                Math.floor(locatorExtended.audioPlaybackInfo.globalTime) === Math.floor(locatorExtended.audioPlaybackInfo.globalDuration * bookmark.locatorExtended.locator.locations.position),
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
    const deleteBookmark = React.useCallback((bookmark: INoteState) => {
        dispatch(readerActions.note.remove.build(bookmark));
        // if (bookmark.locator.locations.rangeInfo)
        dispatch(readerLocalActionHighlights.handler.pop.build([
            {
                uuid: bookmark.uuid,
            },
        ]));
    }, [dispatch]);

    const toasty = React.useCallback((msg: string) => dispatch(toastActions.openRequest.build(ToastType.Success, msg)), [dispatch]);

    const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    const addBookmark = React.useCallback((bookmark: Omit<INoteState, "uuid">) => {

        if (ttsState !== TTSStateEnum.STOPPED ||
            mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
        ) {
            // ToastType.Error
            toasty(`${__("reader.tts.stop")} / ${__("reader.media-overlays.stop")}`);
            return;
        }

        dispatch(readerActions.note.addUpdate.build(pubId, bookmark));
        dispatch(readerLocalActionReader.bookmarkTotalCount.build(noteTotalCount + 1));
    }, [dispatch, ttsState, mediaOverlaysState, __, toasty, noteTotalCount, pubId]);

    const creatorMyself = useSelector((state: IReaderRootState) => state.creator);
    const colorDefault = useSelector((state: IReaderRootState) => state.reader.config.annotation_defaultColor);
    const toggleBookmark = React.useCallback((name: string = "", color: IColor = colorDefault, tag?: string  ) => {

        if (isNavigator) {

            if (!locatorExtended?.locator) {
                return;
            }

            if (bookmarkSelected) {
                toasty(`${__("catalog.delete")} - ${bookmarkSelected.textualValue ? bookmarkSelected.textualValue : `${__("reader.marks.bookmarks")} [${noteTotalCount}]`}`);
                deleteBookmark(bookmarkSelected);
                return ;
            }

            if (!bookmarkSelected) {
                const msg = `${__("catalog.addTagsButton")} - ${name ? name : `${__("reader.marks.bookmarks")} [${noteTotalCount + 1}]`}`;
                toasty(msg);

                if (locatorExtended.locator.locations && !locatorExtended.locator.locations.caretInfo?.rangeInfo && locatorExtended.selectionInfo?.rangeInfo) {
                    locatorExtended.locator.locations.caretInfo = {
                        ...locatorExtended.selectionInfo,
                    };
                }

                addBookmark({
                    textualValue: name,
                    created: (new Date()).getTime(),
                    index: noteTotalCount + 1,
                    locatorExtended: clone(locatorExtended),
                    creator: clone(creatorMyself),
                    color,
                    tags: tag ? [tag] : undefined,
                    group: "bookmark",
                    drawType: EDrawType.bookmark,
                });
            }

        } else {

            const href = locatorExtended.locator.href;
            // const pdfOrDivinaName = name ? name : isDivina ? href : isPdf ? (parseInt(href, 10) + 1).toString() : "";
            if (href) {

                if (bookmarkSelected) {
                    toasty(`${__("catalog.delete")} - ${bookmarkSelected.textualValue ? bookmarkSelected.textualValue : `${__("reader.marks.bookmarks")} [${noteTotalCount}]`}`);
                    deleteBookmark(bookmarkSelected);
                } else {
                    toasty(`${__("catalog.addTagsButton")} - ${name ? name : `${__("reader.marks.bookmarks")} [${noteTotalCount + 1}]`}`);
                    addBookmark({
                        textualValue: name,
                        created: (new Date()).getTime(),
                        index: noteTotalCount + 1,
                        locatorExtended: clone(locatorExtended),
                        creator: clone(creatorMyself),
                        color,
                        tags: tag ? [tag] : undefined,
                        group: "bookmark",
                        drawType: EDrawType.bookmark,
                    });
                }
            }
        }
    }, [
        __, addBookmark, deleteBookmark, locatorExtended, isNavigator, toasty, bookmarkSelected, noteTotalCount, creatorMyself, colorDefault,
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
        toggleBookmark();
    }, [shortcutEnable, toggleBookmark]);
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
        // registerKeyboardListener(
        //         true, // listen for key up (not key down)
        //         keyboardShortcuts.AddBookmarkWithLabelAlt,
        //         onKeyboardEditBookmark);
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

                if (__TH__IS_DEV__) {
                    if (!__time) {
                        __time = true;
                        console.time("UPDATE_BOOKMARK_NEW_METHOD");
                    } else {
                        console.timeEnd("UPDATE_BOOKMARK_NEW_METHOD");
                        console.time("UPDATE_BOOKMARK_NEW_METHOD");
                    }
                }

                const visibleBookmarksPromise = allBookmarksForCurrentLocationHref.map<Promise<boolean>>((bookmark) => !bookmark.locatorExtended ? Promise.resolve(false) : isLocatorVisible(bookmark.locatorExtended.locator));
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
                    const arr: INoteState[] = [];
                    for (const bookmark of allBookmarks) {
                        try {
                            if (bookmark.locatorExtended && await isLocatorVisible(bookmark.locatorExtended.locator)) {
                                arr.push(bookmark);
                            }
                        } catch (_e) {
                            // ignore
                        }
                    }
                    setVisibleBookmarks(arr);
                }).finally(() => {
                    if (__TH__IS_DEV__) {
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
    const noteDefaultColor = useSelector((state: IReaderRootState) => state.reader.config.annotation_defaultColor);

    return <>

        <Popover.Root open={isBookmarkNeedEditing} onOpenChange={(open) => {
            if (isBookmarkNeedEditing) {
                setIsBookmarkNeedEditing(open);
            }

            setTimeout(() => {
                keyboardFocusRequest(true);
            }, 200);
        }}>
            <Popover.Trigger asChild>
                <li
                    {...(numberOfVisibleBookmarks ?
                        { style: { backgroundColor: "var(--color-brand-primary)" } }
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
                <Popover.Content sideOffset={isOnSearch ? 50 : 18} align="end" style={{ zIndex: 101, width: "420px" }}
                // onPointerDownOutside={(e) => { e.preventDefault(); console.log("annotationPopover onPointerDownOutside"); }}
                // onInteractOutside={(e) => { e.preventDefault(); console.log("annotationPopover onInteractOutside"); }}
                >
                    <BookmarkEdit
                        locatorExtended={locatorExtended}
                        name={""}
                        save={(name, color, tag) => {
                            toggleBookmark(name, color, tag);

                            setTimeout(() => {
                                keyboardFocusRequest(true);
                            }, 200);
                        }}
                        color={noteDefaultColor}
                        tags={[]}
                    />
                    <Popover.Arrow style={{ fill: "var(--color-gray-50" }} width={15} height={10} />
                </Popover.Content>
            </Popover.Portal>

        </Popover.Root>
    </>;

};
