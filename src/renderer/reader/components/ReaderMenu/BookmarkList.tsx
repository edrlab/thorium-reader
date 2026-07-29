// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { IReaderMenuProps } from "../options-values";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

import { BookmarkCard } from "../ReaderMenu/BookmarkCard";
import { NoteList } from "./NoteList";

export const BookmarkList: React.FC<{ popoverBoundary: HTMLDivElement, hideBookmarkOnChange: () => void, START_PAGE: number, MAX_MATCHES_PER_PAGE: number } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const { goToLocator, popoverBoundary, hideBookmarkOnChange, START_PAGE, MAX_MATCHES_PER_PAGE } = props;
    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);
    const [__] = useTranslator();

    return (
        <NoteList
            cardKeyPrefix="bookmark-card"
            exportTitleFallback="thorium-notes_bookmarks"
            group="bookmark"
            maxMatchesPerPage={MAX_MATCHES_PER_PAGE}
            options={[{
                id: "hideBookmark",
                name: "hideBookmark",
                checked: readerConfig.annotation_defaultDrawView === "hide",
                onChange: hideBookmarkOnChange,
                label: __("reader.annotations.hide"),
                ariaLabel: __("reader.annotations.hide"),
                labelStyle: { marginLeft: "10px" },
            }]}
            popoverBoundary={popoverBoundary}
            renderNote={(bookmarkItem, context) => (
                <BookmarkCard
                    bookmark={bookmarkItem}
                    goToLocator={goToLocator}
                    isEdited={context.isEdited}
                    isSelected={context.isSelected}
                    focusRequestId={context.focusRequestId}
                    triggerEdition={context.triggerEdition}
                    setCreatorFilter={context.setCreatorFilter}
                    setTagFilter={context.setTagFilter}
                />
            )}
            startPage={START_PAGE}
        />
    );
};
