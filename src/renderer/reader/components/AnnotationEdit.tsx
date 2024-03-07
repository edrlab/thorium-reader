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

interface IPros {
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

export const AnnotationEdit: React.FC<IPros> = (props) => {

    const { save, cancel, uuid, dockedMode} = props;

    const displayFromReaderMenu = !!uuid;
    const [__] = useTranslator();
    const { annotation_defaultColor, annotation_defaultDrawType } = useSelector((state: IReaderRootState) => state.reader.defaultConfig);

    const { cleanText } = useSelector((state: IReaderRootState) => state.annotation);

    let annotationState: Pick<IAnnotationState, "color" | "comment" | "drawType"> & { locatorExtended: { selectionInfo: { cleanText: string } } }
        = { color: annotation_defaultColor, comment: "", drawType: annotation_defaultDrawType, locatorExtended: { selectionInfo: { cleanText } } };
    if (uuid) {
        [, annotationState] = useSelector((state: IReaderRootState) => state.reader.annotation.find(([, annotationState]) => annotationState.uuid === uuid));
    } 

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
            className={classNames(displayFromReaderMenu ? "" : stylesAnnotations.annotations_line, dockedMode ? stylesAnnotations.docked_annotation_line : "")}>
            <p>{annotationState.locatorExtended.selectionInfo.cleanText}</p>
            <textarea id="addNote" name="addNote" wrap="hard" className={displayFromReaderMenu ? stylesAnnotations.annotation_edit_form_textarea : stylesAnnotations.annotation_form_textarea} defaultValue={annotationState.comment} ref={textAreaRef}
            ></textarea>

        </div>
        <div className={stylesAnnotations.annotation_actions} style={{ flexDirection: dockedMode ? "column" : "row", alignItems: dockedMode ? "start" : "center" }}>
            {/* <div className={stylesReader.annotation_form_textarea_container}> */}
            <div className={stylesAnnotations.annotation_actions_container}>
                <h4>{__("reader.annotations.Color")}</h4>
                <div className={stylesAnnotations.colorPicker}
                    role="group">
                    {annotationsColorsLight.map((color) => (
                        <div key={color}>
                            <input type="radio" id={color} name="colorpicker" value={color}
                                onChange={() => setColor(color)}
                                checked={colorSelected === color}
                            />
                            <label htmlFor={color}
                                style={{ backgroundColor: color, border: colorSelected === color ? "1px solid var(--color-primary)" : "" }}
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
                <div role="group" className={stylesAnnotations.stylePicker}>
                    {drawType.map((type, i) => (
                        <div key={type}>
                            <input type="radio" id={type} name="drawtype" value={type}
                                onChange={() => setDrawType(type)}
                                checked={drawTypeSelected === type}
                            />
                            <label htmlFor={type} aria-label={type}
                                className={drawTypeSelected === type ? stylesAnnotations.drawType_active : ""}
                            ><SVG ariaHidden svg={drawIcon[i]} /></label>
                        </div>
                    ),
                    )}
                </div>
            </div>
        </div>

        {/* <label htmlFor="addNote">{__("reader.annotations.addNote")}</label> */}
        <div className={stylesAnnotations.annotation_form_textarea_buttons}>
            {displayFromReaderMenu
                ? <button className={stylesButtons.button_secondary_blue} aria-label="cancel" onClick={cancel}>{__("dialog.cancel")}</button>
                : <Popover.Close className={stylesButtons.button_secondary_blue} aria-label="cancel" onClick={cancel}>{__("dialog.cancel")}</Popover.Close>
            }
            {displayFromReaderMenu
                ? <button type="submit"
                    className={stylesButtons.button_primary_blue}
                    aria-label="save"
                    onClick={(e) => { e.preventDefault(); save(colorObj, textAreaRef?.current?.value || "", drawTypeSelected); saveConfig(); }}
                >
                    <SVG ariaHidden svg={SaveIcon} />
                    {__("reader.annotations.saveNote")}
                </button>
                :
                <Popover.Close
                    type="submit"
                    className={stylesButtons.button_primary_blue}
                    aria-label="save"
                    onClick={(e) => { e.preventDefault(); save(colorObj, textAreaRef?.current?.value || "", drawTypeSelected); saveConfig(); }}
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
