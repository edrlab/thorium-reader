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
import * as CheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import { TextArea } from "react-aria-components";
import { BookmarkLocatorInfo } from "./BookmarkLocatorInfo";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { noteColorCodeToColorTranslatorKeySet } from "readium-desktop/common/redux/states/note";
import { hexToRgb, rgbToHex } from "readium-desktop/common/rgb";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionSetConfig } from "../redux/actions";

interface IProps {
    save: (name: string, color: IColor) => void,
    cancel?: () => void;
    dockedMode?: boolean;
    locatorExtended: MiniLocatorExtended;
    uuid?: string;
    name: string;
    color: IColor;
}


export const BookmarkEdit: React.FC<IProps> = (props) => {

    const { cancel, uuid, /*dockedMode,*/ save, name, locatorExtended, color } = props;

    const displayFromReaderMenu = !!uuid;
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const textAreaRef = React.useRef<HTMLTextAreaElement>();
    const bookmarkMaxLength = 1500;
    const [textAreaValue, setTextAreaValue] = React.useState("");
    React.useEffect(() => {
        if (name) {
            setTextAreaValue(name.slice(0, bookmarkMaxLength));
        }
    }, [name]);

    const colorStr = rgbToHex(color);
    const [colorSelected, setColor] = React.useState(colorStr);
    const previousColorSelected = React.useRef<string>(colorStr);

    const saveConfig = React.useCallback(() => {

        let flag = false;
        if (previousColorSelected.current !== colorSelected) {
            flag = true;
        }

        if (flag) {
            dispatch(readerLocalActionSetConfig.build({ annotation_defaultColor: hexToRgb(colorStr) }));
        }

        previousColorSelected.current = colorSelected;
    }, [colorStr, dispatch]);

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
            <div className={stylesBookmarks.bookmarks_actions_container}>
                <h4>{__("reader.annotations.Color")}</h4>
                <div className={stylesBookmarks.colorPicker}
                    role="radiogroup">
                    {Object.entries(noteColorCodeToColorTranslatorKeySet).map(([colorHex, translatorKey]) => (
                        <div key={`${uuid}_color-${colorHex}`}>
                            <input type="radio" id={`${uuid}_color-${colorHex}`} name="colorpicker" value={colorHex}
                                onChange={() => setColor(colorHex)}
                                checked={colorSelected === colorHex}
                                aria-label={__(translatorKey)}
                            />
                            <label aria-hidden={true} title={__(translatorKey)} htmlFor={`${uuid}_${colorHex}`}
                                style={{ backgroundColor: colorHex, border: colorSelected === colorHex ? "1px solid var(--color-dark-grey)" : "" }}
                            >
                                {colorSelected === colorHex ? <SVG ariaHidden svg={CheckIcon} /> : <></>}
                            </label>
                        </div>
                    ),
                    )}
                </div>
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
                    save(textareaNormalize, hexToRgb(colorSelected));
                    saveConfig();
                    // }
                }}
            >
                <SVG ariaHidden svg={SaveIcon} />
                {__("reader.marks.saveMark")}
            </button>
        </div>
    </form>;
};
