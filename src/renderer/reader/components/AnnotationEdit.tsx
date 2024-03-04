// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IAnnotationState, IColor } from "readium-desktop/common/redux/states/renderer/annotation";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesReaderHeader from "readium-desktop/renderer/assets/styles/components/readerHeader.scss";
import * as Popover from "@radix-ui/react-popover";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";


interface IPros {
    save: (color: IColor, comment: string) => void;
    cancel: () => void;
    // onColorChanged?: (color: IColor) => void;
    uuid?: string;
}

const annotationsColors = [
    "#B80000",
    "#DB3E00",
    "#FCCB00",
    "#008B02",
    "#006B76",
    "#1273DE",
    "#004DCF",
    "#5300EB"];

export const AnnotationEdit: React.FC<IPros> = (props) => {

    const { save, cancel, uuid } = props;

    const displayFromReaderMenu = !!uuid;
    const [__] = useTranslator();
    const { annotation_defaultColor } = useSelector((state: IReaderRootState) => state.reader.defaultConfig);
    const { cleanText } = useSelector((state: IReaderRootState) => state.annotation);

    let annotationState: Pick<IAnnotationState, "color"|"comment"> = {color: annotation_defaultColor, comment: ""};
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

    const component = <form
        className={stylesReader.annotation_form}
    >
        <h4>{__("reader.annotations.highlight")}</h4>
        <div
            className={stylesPopoverDialog.annotations_line}>
            <p>{cleanText}</p>
            <textarea id="addNote" name="addNote" className={stylesReader.annotation_form_textarea} defaultValue={annotationState.comment} ref={textAreaRef}></textarea>

        </div>
        {/* <div className={stylesReader.annotation_form_textarea_container}> */}
            <div className={stylesReaderHeader.colorPicker}
                role="group">
                {annotationsColors.map((color) => (
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
                {
                    // mise en évidence
                }
            </div>

            {/* <label htmlFor="addNote">{__("reader.annotations.addNote")}</label> */}
            <div className={stylesReader.annotation_form_textarea_buttons}>
                {displayFromReaderMenu
                    ? <button className={stylesButtons.button_secondary_blue} aria-label="cancel" onClick={cancel}>{__("dialog.cancel")}</button>
                    : <Popover.Close className={stylesButtons.button_secondary_blue} aria-label="cancel" onClick={cancel}>{__("dialog.cancel")}</Popover.Close>
                }
                {displayFromReaderMenu
                    ? <button type="submit" className={stylesButtons.button_secondary_blue} aria-label="save" onClick={(e) => { e.preventDefault(); save(colorObj, textAreaRef?.current?.value || ""); }}>{__("dialog.save")}</button>
                    : <Popover.Close type="submit" className={stylesButtons.button_secondary_blue} aria-label="save" onClick={(e) => { e.preventDefault(); save(colorObj, textAreaRef?.current?.value || ""); }}>{__("dialog.save")}</Popover.Close>
                }
            </div>
        {/* </div> */}
    </form>;

    return component;
};
