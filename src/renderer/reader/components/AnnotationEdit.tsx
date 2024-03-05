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
import * as Popover from "@radix-ui/react-popover";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as PenIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";


interface IPros {
    save: (color: IColor, comment: string, drawType: TDrawType) => void;
    cancel: () => void;
    // onColorChanged?: (color: IColor) => void;
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
    "#1D4C4FB"
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

    // const { cleanText } = useSelector((state: IReaderRootState) => state.annotation);

    let annotationState: Pick<IAnnotationState, "color"|"comment"|"drawType"> = {color: annotation_defaultColor, comment: "", drawType: annotation_defaultDrawType};
    if (uuid) {
        [, annotationState] = useSelector((state: IReaderRootState) => state.reader.annotation.find(([, annotationState]) => annotationState.uuid === uuid));
    }

    const colorStr = `#${annotationState.color.red.toString(16).padStart(2, "0")}${annotationState.color.green.toString(16).padStart(2, "0")}${annotationState.color.blue.toString(16).padStart(2, "0")}`;

    const [colorSelected, setColor] = React.useState(colorStr);

    const rgbresultmatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorSelected);
    const colorObj = rgbresultmatch ? {
        red: parseInt(rgbresultmatch[1], 16),
        green: parseInt(rgbresultmatch[2], 16),
        blue: parseInt(rgbresultmatch[3], 16),
      } : annotationState.color;

    // React.useEffect(() => {
    //     if (props.onColorChanged) props.onColorChanged(colorObj);
    // }, [colorSelected])

    const textAreaRef = React.useRef<HTMLTextAreaElement>();

    const [drawTypeSelected, setDrawType] = React.useState(annotationState.drawType);

    const component = <form
        className={displayFromReaderMenu ? stylesPopoverDialog.annotation_edit_form : stylesPopoverDialog.annotation_form}
    >
        {displayFromReaderMenu ? <></> :
        <h4>{__("reader.annotations.highlight")}</h4>
    }
        <div
            className={displayFromReaderMenu ? "" : stylesPopoverDialog.annotations_line}
            style={{borderLeft: dockedMode && "2px solid var(--color-blue)", padding: dockedMode && "0 10px", marginTop: dockedMode && "5px" }}>
            <p>{props.btext}</p>
            <textarea id="addNote" name="addNote" className={displayFromReaderMenu ? stylesPopoverDialog.annotation_edit_form_textarea : stylesPopoverDialog.annotation_form_textarea} defaultValue={annotationState.comment} ref={textAreaRef}></textarea>

        </div>
        <div className={stylesPopoverDialog.annotation_actions} style={{flexDirection: dockedMode ? "column" : "row", alignItems: dockedMode ? "start" : "center"}}>
            {/* <div className={stylesReader.annotation_form_textarea_container}> */}
            <div className={stylesPopoverDialog.colorPicker}
                role="group">
                {annotationsColorsLight.map((color) => (
                    <div key={color}>
                        <input type="radio" id={color} name="colorpicker" value={color}
                            onChange={() => setColor(color)}
                            checked={colorSelected === color}
                        />
                        <label htmlFor={color}
                            style={{ backgroundColor: color }}
                        ></label>
                    </div>
                ),
                )}
            </div>
            <div role="group" className={stylesPopoverDialog.stylePicker}>
                {drawType.map((type) => (
                    <div key={type}>
                        <input type="radio" id={type} name="drawtype" value={type}
                            onChange={() => setDrawType(type)}
                            checked={drawTypeSelected === type}
                        />
                        <label htmlFor={type} aria-label={type}><SVG ariaHidden svg={PenIcon} /></label>
                    </div>
                ),
                )}
            </div>
        </div>

            {/* <label htmlFor="addNote">{__("reader.annotations.addNote")}</label> */}
            <div className={stylesPopoverDialog.annotation_form_textarea_buttons}>
                {displayFromReaderMenu
                    ? <button className={stylesButtons.button_secondary_blue} aria-label="cancel" onClick={cancel}>{__("dialog.cancel")}</button>
                    : <Popover.Close className={stylesButtons.button_secondary_blue} aria-label="cancel" onClick={cancel}>{__("dialog.cancel")}</Popover.Close>
                }
                {displayFromReaderMenu
                    ? <button type="submit" className={stylesButtons.button_primary_blue} aria-label="save" onClick={(e) => { e.preventDefault(); save(colorObj, textAreaRef?.current?.value || "", drawTypeSelected); }}>{__("dialog.save")}</button>
                    : <Popover.Close type="submit" className={stylesButtons.button_primary_blue} aria-label="save" onClick={(e) => { e.preventDefault(); save(colorObj, textAreaRef?.current?.value || "", drawTypeSelected); }}>{__("dialog.save")}</Popover.Close>
                }
            </div>
        {/* </div> */}
    </form>;

    return component;
};
