// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IAnnotationState, IColor, TDrawType } from "readium-desktop/common/redux/states/renderer/annotation";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";

import * as Popover from "@radix-ui/react-popover";
// import * as PenIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import * as HighLightIcon from "readium-desktop/renderer/assets/icons/highlight-icon.svg";
import * as UnderLineIcon from "readium-desktop/renderer/assets/icons/underline-icon.svg";
import * as TextStrikeThroughtIcon from "readium-desktop/renderer/assets/icons/TextStrikethrough-icon.svg";
import * as TextOutlineIcon from "readium-desktop/renderer/assets/icons/TextOutline-icon.svg";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionSetConfig } from "../redux/actions";
import classNames from "classnames";
import { TextArea } from "react-aria-components";

// import { readiumCSSDefaults } from "@r2-navigator-js/electron/common/readium-css-settings";

interface IProps {
    save: (color: IColor, comment: string, drawType: TDrawType) => void;
    cancel: () => void;
    uuid?: string;
    dockedMode: boolean;
    btext?: string;
}

// const annotationsColors = [
//     "#B80000",
//     "#DB3E00",
//     "#FCCB00",
//     "#008B02",
//     "#006B76",
//     "#1273DE",
//     "#004DCF",
//     "#5300EB"];

const annotationsColorsLight = [
    "#EB9694",
    "#FAD0C3",
    "#FEF3BD",
    "#C1EAC5",
    "#BEDADC",
    "#C4DEF6",
    "#BED3F3",
    "#D4C4FB",
];

const drawType: TDrawType[] = [
    "solid_background",
    "underline",
    "strikethrough",
    "outline",
];

export const AnnotationEdit: React.FC<IProps> = (props) => {

    const { save, cancel, uuid, dockedMode} = props;

    const displayFromReaderMenu = !!uuid;
    const [__] = useTranslator();
    const { annotation_defaultColor, annotation_defaultDrawType } = useSelector((state: IReaderRootState) => state.reader.defaultConfig);

    const { locatorExtended } = useSelector((state: IReaderRootState) => state.annotation);
    const annotationReaderState = useSelector((state: IReaderRootState) => state.reader.annotation);

    const annotationStateDEFAULT: Omit<IAnnotationState, "uuid"> = { color: annotation_defaultColor, comment: "", drawType: annotation_defaultDrawType, locatorExtended };
    let annotationState: typeof annotationStateDEFAULT = annotationStateDEFAULT;
    console.log(uuid, annotationState);
    if (uuid) {
        const tpl = annotationReaderState.find(([, annotationState]) => annotationState.uuid === uuid);
        if (tpl) {
            console.log("tpl");
            const [, iannotationState] = tpl;
            if (iannotationState) {
                console.log("iannotationState", iannotationState);
                annotationState = iannotationState;
            }
        }
    }

    // console.log("iannotationState", iannotationState);
    // return <></>;

    const colorStr = `#${annotationState.color.red.toString(16).padStart(2, "0")}${annotationState.color.green.toString(16).padStart(2, "0")}${annotationState.color.blue.toString(16).padStart(2, "0")}`.toUpperCase();

    const [colorSelected, setColor] = React.useState(colorStr);

    const dispatch = useDispatch();
    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    const rgbresultmatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorSelected);
    const colorObj = rgbresultmatch ? {
        red: parseInt(rgbresultmatch[1], 16),
        green: parseInt(rgbresultmatch[2], 16),
        blue: parseInt(rgbresultmatch[3], 16),
      } : annotationState.color;

    const previousColorSelected = React.useRef<IColor>(colorObj);

    const textAreaRef = React.useRef<HTMLTextAreaElement>();

    const [drawTypeSelected, setDrawType] = React.useState(annotationState.drawType);
    const previousDrawTypeSelected = React.useRef<TDrawType>(drawTypeSelected);

    const drawIcon = [
        HighLightIcon,
        UnderLineIcon,
        TextStrikeThroughtIcon,
        TextOutlineIcon,
    ];

//     switch (drawType) {
//         case "solid_background":
//             drawIcon = HighLightIcon;
//             break;
//         case "underline":
//             drawIcon = UnderLineIcon;
//             break;
//         case "strikethrough":
//             drawIcon = TextStrikeThroughtIcon;
//             break;
//         case "outline":
//             drawIcon = TextOutlineIcon;
//             break;
// }
    
    const saveConfig = () => {

        let flag = false;
        if (previousColorSelected.current.red !== colorObj.red || previousColorSelected.current.blue !== colorObj.blue || previousColorSelected.current.green !== colorObj.green) {
            flag = true;
        }
        if (previousDrawTypeSelected.current !== drawTypeSelected) {
            flag = true;
        }

        if (flag) {
            const newReaderConfig = { ...readerConfig };
            newReaderConfig.annotation_defaultColor = { ...colorObj };
            newReaderConfig.annotation_defaultDrawType = drawTypeSelected;
            dispatch(readerLocalActionSetConfig.build(newReaderConfig));
        }

        previousColorSelected.current = { ...colorObj };
        previousDrawTypeSelected.current = drawTypeSelected;
    };

    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 3 + "px";
            textAreaRef.current.focus();
        }
    }, []);

    const component = <form
        className={displayFromReaderMenu ? stylesAnnotations.annotation_edit_form : stylesAnnotations.annotation_form}
    >
        {displayFromReaderMenu ? <></> :
            <h4>{__("reader.annotations.addNote")}</h4>
        }
        <div
            className={classNames(displayFromReaderMenu ? "" : stylesAnnotations.annotations_line, dockedMode ? stylesAnnotations.docked_annotation_line : "")} style={{backgroundColor: !displayFromReaderMenu ? "var(--color-extralight-grey)" : ""}}>
            <p>{annotationState.locatorExtended ? (annotationState.locatorExtended.selectionInfo.cleanText.length > (200-3) ? `${annotationState.locatorExtended.selectionInfo.cleanText.slice(0, 200)}...` : annotationState.locatorExtended.selectionInfo.cleanText) : ""}</p>
            <TextArea id="addNote" name="addNote" wrap="hard" className={displayFromReaderMenu ? stylesAnnotations.annotation_edit_form_textarea : stylesAnnotations.annotation_form_textarea} defaultValue={annotationState.comment} ref={textAreaRef}
            ></TextArea>

        </div>
        <div className={stylesAnnotations.annotation_actions}>
            {/* <div className={stylesReader.annotation_form_textarea_container}> */}
            <div className={stylesAnnotations.annotation_actions_container}>
                <h4>{__("reader.annotations.Color")}</h4>
                <div className={stylesAnnotations.colorPicker}
                    role="radiogroup">
                    {annotationsColorsLight.map((color, i) => (
                        <div key={color}>
                            <input type="radio"  id={`anno_color_${uuid}_${color}`} name="colorpicker" value={color}
                                onChange={() => setColor(color)}
                                checked={colorSelected === color}
                                aria-label={`${__("reader.annotations.Color")} ${i} (${color.split("").join(" ")})`}
                            />
                            <label htmlFor={`anno_color_${uuid}_${color}`}
                                style={{ backgroundColor: color, border: colorSelected === color ? "1px solid var(--color-dark-grey)" : "" }}
                            >
                                {colorSelected === color ? <SVG ariaHidden svg={CheckIcon} /> : <></>}
                            </label>
                        </div>
                    ),
                    )}
                </div>
            </div>
            <div className={stylesAnnotations.annotation_actions_container}>
                <h4>{__("reader.annotations.highlight")}</h4>
                <div role="radiogroup" className={stylesAnnotations.stylePicker}>
                    {drawType.map((type, i) => (
                        <div key={type}>
                            <input type="radio" id={`anno_type_${uuid}_${type}`} name="drawtype" value={type}
                                onChange={() => setDrawType(type)}
                                checked={drawTypeSelected === type}
                                aria-label={`${__("reader.annotations.highlight")} ${type === "solid_background" ? __("reader.annotations.type.solid") : type === "outline" ? __("reader.annotations.type.outline") : type === "underline" ? __("reader.annotations.type.underline") : type === "strikethrough" ? __("reader.annotations.type.strikethrough") : __("reader.annotations.type.solid")}`}
                            />
                            <label htmlFor={`anno_type_${uuid}_${type}`}
                                title={`${type === "solid_background" ? __("reader.annotations.type.solid") : type === "outline" ? __("reader.annotations.type.outline") : type === "underline" ? __("reader.annotations.type.underline") : type === "strikethrough" ? __("reader.annotations.type.strikethrough") : __("reader.annotations.type.solid")}`}
                                className={drawTypeSelected === type ? stylesAnnotations.drawType_active : ""}
                            ><SVG ariaHidden svg={drawIcon[i]} /></label>
                        </div>
                    ),
                    )}
                </div>
            </div>
{/* annotationState.locatorExtended &&
            <details><summary>{__("reader.settings.preview")}</summary><div>{<p style={{
                backgroundColor: (!readerConfig.theme || readerConfig.theme === "neutral") ? (readiumCSSDefaults.backgroundColor || "white") :
                    readerConfig.theme === "sepia" ? "#faf4e8" :
                    readerConfig.theme === "night" ? "#121212" :
                    readerConfig.theme === "paper" ? "#E9DDC8" :
                    readerConfig.theme === "contrast1" ? "#000000" :
                    readerConfig.theme === "contrast2" ? "#000000" :
                    readerConfig.theme === "contrast3" ? "#181842" :
                    readerConfig.theme === "contrast4" ? "#C5E7CD" :
                    (readiumCSSDefaults.backgroundColor || "white"),
                color: (!readerConfig.theme || readerConfig.theme === "neutral") ? (readiumCSSDefaults.textColor || "black") :
                    readerConfig.theme === "sepia" ? "black" :
                    readerConfig.theme === "night" ? "#fff" :
                    readerConfig.theme === "paper" ? "#000000" :
                    readerConfig.theme === "contrast1" ? "#fff" :
                    readerConfig.theme === "contrast2" ? "#FFFF00" :
                    readerConfig.theme === "contrast3" ? "#FFFF" :
                    readerConfig.theme === "contrast4" ? "#000000" :
                    (readiumCSSDefaults.textColor || "black"),
            }}><span>{annotationState.locatorExtended.selectionInfo.cleanBefore}</span><span style={{
                backgroundColor: colorSelected,
            }}>{annotationState.locatorExtended.selectionInfo.cleanText}</span><span>{annotationState.locatorExtended.selectionInfo.cleanAfter}</span></p>}</div></details> */}
        </div>

        {/* <label htmlFor="addNote">{__("reader.annotations.addNote")}</label> */}
        <div className={stylesAnnotations.annotation_form_textarea_buttons}>
            {displayFromReaderMenu
                ? <button className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")} onClick={cancel} type="button">{__("dialog.cancel")}</button>
                : <Popover.Close className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")} onClick={cancel}>{__("dialog.cancel")}</Popover.Close>
            }
            {displayFromReaderMenu
                ? <button type="submit"
                    className={stylesButtons.button_primary_blue}
                    aria-label={__("reader.annotations.saveNote")}
                    onClick={(e) => {
                        e.preventDefault();

                        const textareaValue = textAreaRef?.current?.value || "";
                        const textareaNormalize = textareaValue.trim().replace(/\s*\n\s*/gm, "\0").replace(/\s\s*/g, " ").replace(/\0/g, "\n");
                        save(colorObj, textareaNormalize, drawTypeSelected);
                        saveConfig();
                    }}
                >
                    <SVG ariaHidden svg={SaveIcon} />
                    {__("reader.annotations.saveNote")}
                </button>
                :
                <Popover.Close
                    type="submit"
                    className={stylesButtons.button_primary_blue}
                    aria-label={__("reader.annotations.saveNote")}
                    onClick={(e) => {
                        e.preventDefault();

                        const textareaValue = textAreaRef?.current?.value || "";
                        const textareaNormalize = textareaValue.trim().replace(/\s*\n\s*/gm, "\0").replace(/\s\s*/g, " ").replace(/\0/g, "\n");
                        save(colorObj, textareaNormalize, drawTypeSelected);
                        saveConfig();
                    }}
                >
                    <SVG ariaHidden svg={SaveIcon} />
                    {__("reader.annotations.saveNote")}
                </Popover.Close>
            }
        </div>
        {/* </div> */}
    </form>;

    return component;
};
