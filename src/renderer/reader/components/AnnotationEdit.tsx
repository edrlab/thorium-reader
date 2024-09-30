// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";

import * as React from "react";
import { IAnnotationState, IColor, TDrawType } from "readium-desktop/common/redux/states/renderer/annotation";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

import * as Popover from "@radix-ui/react-popover";
// import * as PenIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import * as HighLightIcon from "readium-desktop/renderer/assets/icons/highlight-icon.svg";
import * as UnderLineIcon from "readium-desktop/renderer/assets/icons/underline-icon.svg";
import * as TextStrikeThroughtIcon from "readium-desktop/renderer/assets/icons/TextStrikethrough-icon.svg";
import * as TextOutlineIcon from "readium-desktop/renderer/assets/icons/TextOutline-icon.svg";
import * as TagIcon from "readium-desktop/renderer/assets/icons/tag-icon.svg";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionSetConfig } from "../redux/actions";
import classNames from "classnames";
import { TextArea } from "react-aria-components";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { hexToRgb, rgbToHex } from "readium-desktop/common/rgb";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";

// import { readiumCSSDefaults } from "@r2-navigator-js/electron/common/readium-css-settings";

interface IProps {
    save: (color: IColor, comment: string, drawType: TDrawType, tags: string[]) => void;
    cancel: () => void;
    uuid?: string;
    dockedMode: boolean;
    btext?: string;
}

// __("reader.annotations.colors.red")
// __("reader.annotations.colors.orange")
// __("reader.annotations.colors.yellow")
// __("reader.annotations.colors.green")
// __("reader.annotations.colors.bluegreen")
// __("reader.annotations.colors.lightblue")
// __("reader.annotations.colors.cyan")
// __("reader.annotations.colors.purple")

export const annotationsColorsLight: Record<string, TTranslatorKeyParameter> = {
    "#EB9694": "reader.annotations.colors.red",
    "#FAD0C3": "reader.annotations.colors.orange",
    "#FEF3BD": "reader.annotations.colors.yellow",
    "#C1EAC5": "reader.annotations.colors.green",
    "#BEDADC": "reader.annotations.colors.bluegreen",
    "#C4DEF6": "reader.annotations.colors.lightblue",
    "#BED3F3": "reader.annotations.colors.cyan",
    "#D4C4FB": "reader.annotations.colors.purple",
};

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
    const { annotation_defaultColor, annotation_defaultDrawType } = useSelector((state: IReaderRootState) => state.reader.config);

    const { locatorExtended } = useSelector((state: IReaderRootState) => state.annotation);
    const annotationReaderState = useSelector((state: IReaderRootState) => state.reader.annotation);

    let annotationState: IAnnotationState = { uuid: "", color: annotation_defaultColor, comment: "", drawType: annotation_defaultDrawType, locatorExtended };
    if (uuid) {
        const tpl = annotationReaderState.find(([, annotationState]) => annotationState.uuid === uuid);
        if (tpl) {
            const [, iannotationState] = tpl;
            if (iannotationState) {
                annotationState = iannotationState;
            }
        }
    }

    const colorStr = rgbToHex(annotationState.color);

    const [colorSelected, setColor] = React.useState(colorStr);

    const dispatch = useDispatch();

    const colorObj = hexToRgb(colorSelected) || annotationState.color;

    const previousColorSelected = React.useRef<IColor>(colorObj);

    const textAreaRef = React.useRef<HTMLTextAreaElement>();

    const [drawTypeSelected, setDrawType] = React.useState(annotationState.drawType);
    const previousDrawTypeSelected = React.useRef<TDrawType>(drawTypeSelected);

    const [tag, setTag] = React.useState<string>((annotationState.tags || [])[0] || "");
    const tagsIndexList = useSelector((state: IReaderRootState) => state.annotationTagsIndex);
    const selectTagOption = ObjectKeys(tagsIndexList).map((v, i) => ({id: i, name: v}));

    const annotationMaxLength = 1500;
    const [annotationLength, setAnnotationLength] = React.useState(annotationState.comment.length);

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
            const annotation_defaultColor = { ...colorObj };
            const annotation_defaultDrawType = drawTypeSelected;
            dispatch(readerLocalActionSetConfig.build({ annotation_defaultColor, annotation_defaultDrawType }));
        }

        previousColorSelected.current = { ...colorObj };
        previousDrawTypeSelected.current = drawTypeSelected;
    };

    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight + 3}px`;
            textAreaRef.current.focus();
        }
    }, []); // empty => runs once on mount (undefined => runs on every render)

    const component = <form
        className={displayFromReaderMenu ? stylesAnnotations.annotation_edit_form : stylesAnnotations.annotation_form}
    >
        {displayFromReaderMenu ? <></> :
            <h4>{__("reader.annotations.addNote")}</h4>
        }
        <div
            className={classNames(displayFromReaderMenu ? "" : stylesAnnotations.annotations_line, dockedMode ? stylesAnnotations.docked_annotation_line : "")} style={{backgroundColor: !displayFromReaderMenu ? "var(--color-extralight-grey)" : ""}}>
            <p>{annotationState.locatorExtended ? (annotationState.locatorExtended.selectionInfo.cleanText.length > (200-3) ? `${annotationState.locatorExtended.selectionInfo.cleanText.slice(0, 200)}...` : annotationState.locatorExtended.selectionInfo.cleanText) : ""}</p>
            <TextArea id="addNote" name="addNote" wrap="hard" className={displayFromReaderMenu ? stylesAnnotations.annotation_edit_form_textarea : stylesAnnotations.annotation_form_textarea} defaultValue={annotationState.comment} ref={textAreaRef} maxLength={annotationMaxLength} onChange={(a) => setAnnotationLength(a.currentTarget.value.length)}
            ></TextArea>
            <span style={{fontSize: "10px", color: "var(--color-medium-grey)", width: "420px", textAlign: "end"}}>{annotationLength}/{annotationMaxLength}</span>

        </div>
        <div className={stylesAnnotations.annotation_actions}>
            {/* <div className={stylesReader.annotation_form_textarea_container}> */}
            <div className={stylesAnnotations.annotation_actions_container}>
                <h4>{__("reader.annotations.Color")}</h4>
                <div className={stylesAnnotations.colorPicker}
                    role="radiogroup">
                    {Object.entries(annotationsColorsLight).map(([colorHex, translatorKey]) => (
                        <div key={`anno_color_${uuid}_${colorHex}_key`}>
                            <input type="radio"  id={`anno_color_${uuid}_${colorHex}`} name="colorpicker" value={colorHex}
                                onChange={() => setColor(colorHex)}
                                checked={colorSelected === colorHex}
                                aria-label={__(translatorKey)}
                            />
                            <label htmlFor={`anno_color_${uuid}_${colorHex}`}
                                style={{ backgroundColor: colorHex, border: colorSelected === colorHex ? "1px solid var(--color-dark-grey)" : "" }}
                            >
                                {colorSelected === colorHex ? <SVG ariaHidden svg={CheckIcon} /> : <></>}
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
            <div className={stylesAnnotations.annotation_actions_container} style={{width: "95%"}}>
                <h4>{__("catalog.tag")}</h4>
                <ComboBox defaultItems={selectTagOption}
                    placeholder={__("catalog.addTags")}
                    defaultInputValue={tag}
                    defaultSelectedKey={selectTagOption.findIndex(({name}) => name === tag)}
                    selectedKey={selectTagOption.findIndex(({name}) => name === tag)}
                    onSelectionChange={
                        (key: React.Key) => {


                            if (key === null) {

                                // nothing
                            } else {
                                const found = selectTagOption.find((v) => v.id === key);
                                if (found)
                                    setTag(found.name);
                            }
                        }}
                    svg={TagIcon}
                    allowsCustomValue
                    onInputChange={(v) => setTag(v)}
                    inputValue={tag}
                >
                    {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                </ComboBox>
            </div>
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
                        save(colorObj, textareaNormalize, drawTypeSelected, tag ? [tag] : []);
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
                        save(colorObj, textareaNormalize, drawTypeSelected, tag ? [tag] : []);
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
