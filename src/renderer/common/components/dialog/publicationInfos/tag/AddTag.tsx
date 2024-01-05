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
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import { TChangeEventOnInput, TFormEvent } from "readium-desktop/typings/react";
import SVG from "../../../SVG";
import * as AddTagIcon from "readium-desktop/renderer/assets/icons/addTag-icon.svg";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
    pubId: string;
    __: I18nTyped;
    tagArray: string[] | IOpdsTagView[];
    setTags: (tagsArray: string[]) => void;
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

        return (
            this.props.pubId
                ? <form onSubmit={this.addTag}>
                    <div className={stylesInputs.form_group}>
                        <label>{__("catalog.tag")}</label>
                        <input
                            type="text"
                            className={stylesTags.tag_inputs}
                            title={__("catalog.addTags")}
                            // placeholder={__("catalog.addTags")}
                            onChange={this.handleChangeName}
                            value={this.state.newTagName}
                        />
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
    }

    private addTag = (e: TFormEvent) => {
        e.preventDefault();
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
