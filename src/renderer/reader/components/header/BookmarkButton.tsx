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

import SVG from "readium-desktop/renderer/common/components/SVG";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { isLocatorVisible } from "@r2-navigator-js/electron/renderer";
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

export interface IProps {
    shortcutEnable: boolean;
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

let __time = false;
export const BookmarkButton: React.FC<IProps> = ({shortcutEnable}) => {

    const [__] = useTranslator();
    const [visibleBookmarks, setVisibleBookmarks] = React.useState<IBookmarkState[]>([]);
    const numberOfVisibleBookmarks = visibleBookmarks.length;

    // const selectionIsNew = useSelector((state: IReaderRootState) => state.reader.locator.selectionIsNew);
    const { bookmark: bookmarksQueueState, locator: locatorExtended } = useSelector((state: IReaderRootState) => state.reader, equalFn);
    // const selectionIsNew = locatorExtended.selectionIsNew;

    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const isDivina = React.useMemo(() => isDivinaFn(r2Publication), [r2Publication]);
    const isPdf = React.useMemo(() => isPdfFn(r2Publication), [r2Publication]);
    const isAudiobook = !!locatorExtended.audioPlaybackInfo;
    const isEpubNavigator = !(isDivina || isPdf || isAudiobook);
    const isNavigator = isAudiobook || isEpubNavigator;

    const allBookmarks = React.useMemo(() => bookmarksQueueState.map(([, v]) => v), [bookmarksQueueState]);
    const allBookmarksForCurrentLocationHref = React.useMemo(() => allBookmarks.filter((bookmark) => bookmark.locator.href === locatorExtended.locator.href), [allBookmarks, locatorExtended]);
    const [bookmarkSelected, bookmarkSelectedIndex] = React.useMemo(() => {

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
            return [allBookmarksForCurrentLocationHref[index], index];
        }
        return [undefined, undefined];
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
    const deleteBookmark = React.useCallback((bookmark: IBookmarkState) => dispatch(readerActions.bookmark.pop.build(bookmark)), [dispatch]);
    const addBookmark = React.useCallback((bookmark: IBookmarkStateWithoutUUID) => dispatch(readerActions.bookmark.push.build(bookmark)), [dispatch]);
    const toasty = React.useCallback((msg: string) => dispatch(toastActions.openRequest.build(ToastType.Success, msg)), [dispatch]);

    const toggleBookmark = React.useCallback((fromKeyboard?: boolean) => {

        if (isNavigator) {

            if (!locatorExtended?.locator) {
                return;
            }

            if (
                !fromKeyboard &&
                bookmarkSelected
            ) {
                toasty(`${__("catalog.delete")} - ${__("reader.marks.bookmarks")} [${allBookmarks.length - bookmarkSelectedIndex}] ${bookmarkSelected.name ? `(${bookmarkSelected.name})` : ""}`);
                deleteBookmark(bookmarkSelected);
                return ;
            }

            if (!bookmarkSelected) {

                let name: string | undefined;
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

                // reader.navigation.bookmarkTitle
                const msg = `${__("catalog.addTagsButton")} - ${__("reader.marks.bookmarks")} [${allBookmarks.length ? allBookmarks.length + 1 : 1}] ${name ? ` (${name})` : ""}`;
                // this.setState({bookmarkMessage: msg});
                toasty(msg);

                if (locatorExtended.locator.locations && !locatorExtended.locator.locations.rangeInfo && locatorExtended.selectionInfo?.rangeInfo) {
                    locatorExtended.locator.locations.rangeInfo = locatorExtended.selectionInfo.rangeInfo;
                }

                addBookmark({
                    locator: locatorExtended.locator,
                    name,
                });

            }

        } else {

            const href = locatorExtended.locator.href;
            const name = isDivina ? href : isPdf ? (parseInt(href, 10) + 1).toString() : "";
            if (href) {

                if (bookmarkSelected) {
                    deleteBookmark(bookmarkSelected);
                } else {
                    addBookmark({
                        locator: locatorExtended.locator,
                        name,
                    });
                }
            }
        }
    }, [
        __, addBookmark, allBookmarks, deleteBookmark, isDivina, isNavigator, isPdf, locatorExtended.audioPlaybackInfo, locatorExtended.locator, locatorExtended.selectionInfo?.cleanText, locatorExtended.selectionInfo?.rangeInfo, toasty, bookmarkSelected, bookmarkSelectedIndex,
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
        toggleBookmark(true);
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

    // console.log("numberOfVisibleBookmarks", numberOfVisibleBookmarks);
    return <>

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
                onKeyUp={(e) => {
                    if (e.key === "Enter") { toggleBookmark(); }
                }}
                onChange={() => toggleBookmark()}

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
    </>;

};
