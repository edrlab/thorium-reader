// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import { TChangeEventOnInput, TFormEvent } from "readium-desktop/typings/react";
import SVG from "../SVG";
import * as AddTagIcon from "readium-desktop/renderer/assets/icons/addTag-icon.svg";
import classNames from "classnames";
import * as TagIcon from "readium-desktop/renderer/assets/icons/tag-icon.svg";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
    __: I18nTyped;
    tagArray: string[] | IOpdsTagView[];
    setTags: (tagsArray: string[]) => void;
    disableForm?: boolean;
}

interface IState {
    newTagName: string;
}

// Logger
const debug = debug_("readium-desktop:renderer:common:publication-info:AddTag");
debug("_");

export default class AddTag extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            newTagName: "",
        };
    }

    public render() {
        const { __ } = this.props;

        const content = <>
            <div className={stylesInputs.form_group}>
                <label style={this.props.disableForm ? {top: "-20px", height: "0.5rem"} : {}}>{__("catalog.tag")}</label>
                <SVG ariaHidden svg={TagIcon} />
                <input
                    type="text"
                    className={classNames(stylesTags.tag_inputs, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")}
                    title={__("catalog.addTags")}
                    // placeholder={__("catalog.addTags")}
                    onChange={this.handleChangeName}
                    value={this.state.newTagName}
                    onKeyDown={(e) => {
                        if (this.props.disableForm) {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }
                    }}
                    onKeyUp={(e) => {
                        if (this.props.disableForm) {
                            if (e.key === "Enter") {
                                this.addTag();
                            }
                        }
                    }}
                />
            </div>
            {this.props.disableForm ? <button
                className={stylesButtons.button_secondary_blue}
                onClick={() => this.addTag()}
                type="button"
            >
                <SVG ariaHidden svg={AddTagIcon} />
                {__("catalog.addTagsButton")}
            </button>
                : <button
                    type="submit"
                    className={stylesButtons.button_secondary_blue}
                >
                    <SVG ariaHidden svg={AddTagIcon} />
                    {__("catalog.addTagsButton")}
                </button>}
        </>;

        return (
            this.props.disableForm ? <div>{content}</div> : <form onSubmit={this.addTag}>{content}</form>
        );
    }

    private addTag = (e?: TFormEvent) => {
        e?.preventDefault();
        
        const { tagArray } = this.props;

        const tags = Array.isArray(tagArray) ? tagArray.slice() : [];
        const tagName = this.state.newTagName.trim().replace(/\s\s+/g, " ");

        this.setState({ newTagName: "" });

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
            this.props.setTags(tagsName);
        }
    };

    private handleChangeName = (e: TChangeEventOnInput) => {
        this.setState({ newTagName: e.target.value });
    };

}
