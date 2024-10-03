// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import React from "react";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
// import { I18nTyped } from "readium-desktop/common/services/translator";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import { TFormEvent } from "readium-desktop/typings/react";
import SVG from "../../../SVG";
import * as AddTagIcon from "readium-desktop/renderer/assets/icons/addTag-icon.svg";
import classNames from "classnames";
import * as TagIcon from "readium-desktop/renderer/assets/icons/tag-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

interface IProps {
    suggestion?: string;
    dictionary?: string[] | IOpdsTagView[];
    onValueChange?: (value: string, match: boolean) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputStyle?: React.CSSProperties;
    suggestionStyle?: React.CSSProperties;
    value?: string;
    tagArray: string[] | IOpdsTagView[];
    setTags: (tagsArray: string[]) => void;
    pubId: string;
}

export const InputPredict: React.FC<IProps> = (props) => {
    const [value, setValue] = React.useState<string>(props.value || "");
    const [suggestions, setSuggestions] = React.useState<string[]>(props.suggestion ? [props.suggestion] : [""]);
    const [index, setIndex] = React.useState<number>(0);
    const [newTagName, setNewTagName] = React.useState("");
    const [textOverflow, setTextOverflow] = React.useState(false);
    const [__] = useTranslator();

    const containerStyle: React.CSSProperties = {
        position: "relative",
        backgroundColor: "transparent",
        width: "fit-content",
    };

    const inputStyle: React.CSSProperties = {
        background: "transparent",
        zIndex: 0,
    };

    const suggestionStyle: React.CSSProperties = {
        position: "absolute",
        top: 1,
        background: "transparent",
        zIndex: -1,
        fontWeight: "lighter",
        color: "var(--scrollbar-thumb)",
    };

    React.useEffect(() => {
        if (props.suggestion && props.suggestion !== suggestions[0]) {
            setSuggestions([props.suggestion]);
            setIndex(0);
        }
    }, [props.suggestion, suggestions]);


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

        if (value.length > 22) {
            setTextOverflow(true);
        } else {
            setTextOverflow(false);
        }
        if (e.key === "Enter") {
            const { tagArray } = props;

            const tags = Array.isArray(tagArray) ? tagArray.slice() : [];
            const tagName = newTagName.trim().replace(/\s\s+/g, " ");

            setNewTagName("");

            if (tagName) {

                const tagsName: string[] = [];
                for (const tag of tags) {
                    if (typeof tag === "string") {
                        if (tag.toLowerCase() === tagName.toLowerCase()) {
                            return;
                        } else {
                            tagsName.push(tag);
                        }
                    } else {
                        if (tag.name.toLowerCase() === tagName.toLocaleLowerCase()) {
                            return;
                        } else {
                            tagsName.push(tag.name);
                        }
                    }
                }

                tagsName.push(tagName);
                props.setTags(tagsName);
            }
            setValue("");
            setNewTagName("");
            setSuggestions([""]);
            setIndex(0);
        } else if (e.key === "Tab") {
            e.preventDefault();
            const val = suggestions[index];
            setValue(val);
            setNewTagName(val);
            if (props.onValueChange) {
                props.onValueChange(val, true);
            }
        } else if (e.key === "ArrowUp" && index > 0) {
            setIndex(index - 1);
        } else if (e.key === "ArrowDown" && index < (suggestions.length - 1)) {
            setIndex(index + 1);
        }

        if (props.onKeyDown) {
            props.onKeyDown(e);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newSuggestions: string[] = [];
        let match = false;

        if (props.suggestion) {
            if (props.suggestion === e.target.value) {
                match = true;
            }
        } else if (props.dictionary) {
            if (e.target.value.trim().length) {
                for (let i = 0; i < props.dictionary.length; i++) {
                    const regex = new RegExp("^" + e.target.value, "i");
                    if (e.target.value === props.dictionary[i]) {
                        match = true;
                    }
                    if (regex.test(props.dictionary[i] as string)) {
                        newSuggestions.push(e.target.value + (props.dictionary[i] as string).slice(e.target.value.length));
                    }
                }
            }
        }

        if (newSuggestions.length === 0) {
            newSuggestions = [""];
        }

        setValue(e.target.value);
        setSuggestions(props.suggestion ? [props.suggestion] : newSuggestions);
        setIndex(0);
        setNewTagName(e.target.value);

        if (props.onValueChange) {
            props.onValueChange(e.target.value, match);
        }

        if (props.onChange) {
            props.onChange(e);
        }
    };


    const addTag = (e: TFormEvent) => {
        e.preventDefault();
        const { tagArray } = props;

        const tags = Array.isArray(tagArray) ? tagArray.slice() : [];
        const tagName = newTagName.trim().replace(/\s\s+/g, " ");

        setNewTagName("");

        if (tagName) {

            const tagsName: string[] = [];
            for (const tag of tags) {
                if (typeof tag === "string") {
                    if (tag === tagName) {
                        return;
                    } else {
                        tagsName.push(tag);
                    }
                } else {
                    if (tag.name === tagName) {
                        return;
                    } else {
                        tagsName.push(tag.name);
                    }
                }
            }

            tagsName.push(tagName);
            props.setTags(tagsName);
        }
    };

    return (
        props.pubId
            ? <form onSubmit={addTag}>
                <div className={stylesInputs.form_group} style={containerStyle}>
                    <label>{__("catalog.tag")}</label>
                    <SVG ariaHidden svg={TagIcon} />
                    <input
                        type="text"
                        className={classNames(stylesTags.tag_inputs, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                        title={__("catalog.addTags")}
                        placeholder={__("catalog.addTags")}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        value={value}
                        style={props.inputStyle || inputStyle}
                    />
                    {textOverflow ? <></> :
                        <input
                            className="input-predict-suggestion"
                            style={suggestionStyle}
                            type="text"
                            disabled
                            value={suggestions[index]}
                        />}
                </div>
                <button
                    type="submit"
                    className={stylesButtons.button_secondary_blue}
                >
                    <SVG ariaHidden svg={AddTagIcon} />
                    {__("catalog.addTagsButton")}
                </button>
            </form>
            : <></>
    );
};
