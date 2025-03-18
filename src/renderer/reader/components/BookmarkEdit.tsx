// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesBookmarks from "readium-desktop/renderer/assets/styles/components/bookmarks.scss";

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

import * as Popover from "@radix-ui/react-popover";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import { TextArea } from "react-aria-components";
import { BookmarkLocatorInfo } from "./BookmarkLocatorInfo";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

interface IProps {
    toggleBookmark: (name?: string) => void,
    cancel?: () => void;
    uuid?: string;
    dockedMode?: boolean;
    name: string;
    locatorExtended: MiniLocatorExtended;
}


export const BookmarkEdit: React.FC<IProps> = (props) => {

    const { cancel, uuid, /*dockedMode,*/ toggleBookmark, name, locatorExtended } = props;

    const displayFromReaderMenu = !!uuid;
    const [__] = useTranslator();

    const textAreaRef = React.useRef<HTMLTextAreaElement>();
    const bookmarkMaxLength = 1500;
    const [textAreaValue, setTextAreaValue] = React.useState("");
    React.useEffect(() => {
        if (name) {
            setTextAreaValue(name.slice(0, bookmarkMaxLength));
        }
    }, [name]);

    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight + 3}px`;
            textAreaRef.current.focus();
        }
    }, []); // empty => runs once on mount (undefined => runs on every render)

    return <form className={stylesBookmarks.bookmark_form}>
        <div style={{ backgroundColor: "var(--color-extralight-grey)" }}>

            {/* <p>{bookmark.locatorExtended.selectionInfo?.cleanText ?
            (bookmark.locatorExtended.selectionInfo.cleanText.length > (200 - 3) ?
            `${bookmark.locatorExtended.selectionInfo.cleanText.slice(0, 200)}...` : bookmark.locatorExtended.selectionInfo.cleanText) : ""}</p> */}
            <p><BookmarkLocatorInfo fallback="" locatorExtended={locatorExtended}/></p>
            <div>
                <TextArea value={textAreaValue} name="editBookmark" wrap="hard"
                    className={stylesBookmarks.bookmark_form_textarea}
                    maxLength={bookmarkMaxLength} onChange={(a) => setTextAreaValue(a.currentTarget.value)}
                    ref={textAreaRef}
                ></TextArea>
                <span style={{ fontSize: "10px", color: "var(--color-medium-grey)", position: "relative", left: "350px" }}>{textAreaValue.length}/{bookmarkMaxLength}</span>
            </div>
        </div>
        <div className={stylesBookmarks.bookmark_form_textarea_buttons}>
            {displayFromReaderMenu
                ? <button className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")} onClick={cancel} type="button">{__("dialog.cancel")}</button>
                : <Popover.Close className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")} onClick={cancel}>{__("dialog.cancel")}</Popover.Close>
            }
            <button type="submit"
                className={stylesButtons.button_primary_blue}
                aria-label={__("reader.marks.saveMark")}
                onClick={(e) => {
                    e.preventDefault();
                    const textareaNormalize = textAreaValue.trim().replace(/\s*\n\s*/gm, "\0").replace(/\s\s*/g, " ").replace(/\0/g, "\n");
                    // if (textareaNormalize) {
                    toggleBookmark(textareaNormalize);
                    // }
                }}
            >
                <SVG ariaHidden svg={SaveIcon} />
                {__("reader.marks.saveMark")}
            </button>
        </div>
    </form>;
};
