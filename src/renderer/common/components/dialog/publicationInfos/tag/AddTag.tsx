// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as debug_ from "debug";
import * as React from "react";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
import { TFormEvent } from "readium-desktop/typings/react";
import SVG from "../../../SVG";
import * as AddTagIcon from "readium-desktop/renderer/assets/icons/addTag-icon.svg";
import * as TagIcon from "readium-desktop/renderer/assets/icons/tag-icon.svg";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { connect } from "react-redux";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { TranslatorProps, withTranslator } from "../../../hoc/translator";
import { trimNormaliseWhitespaceAndCollapse } from "readium-desktop/common/string";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends ReturnType<typeof mapStateToProps>, TranslatorProps {
    pubId: string;
    tagArray: string[] | IOpdsTagView[];
    setTags: (tagsArray: string[]) => void;
}

interface IState {
    tagName: string;
}

// Logger
const debug = debug_("readium-desktop:renderer:common:publication-info:AddTag");
debug("_");

class AddTag extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            tagName: "",
        };
    }

    public render() {

        const { __, tagArray: tagArrayPublication, tags: allTagsLocally } = this.props;

        const tagsOptions = allTagsLocally.filter((name) => !(tagArrayPublication || []).includes(name as any)).map((v, i) => ({ id: i, value: i, name: v }));

        return (
            this.props.pubId
                ? <form onSubmit={this.addTag} style={{minWidth: "unset"}}>
                    <ComboBox
                        label={__("catalog.tag")}
                        defaultItems={tagsOptions}
                        defaultSelectedKey={
                            tagsOptions.findIndex((tag) =>
                                tag.name?.toLowerCase() === this.state.tagName.toLowerCase())
                        }
                        selectedKey={
                            tagsOptions.findIndex((tag) =>
                                tag.name?.toLowerCase() === this.state.tagName.toLowerCase())
                        }
                        onSelectionChange={(key) => {

                            if (key === null) {
                                // nothing
                            } else {

                                const found = tagsOptions.find((tag) => tag.id === key);
                                if (found) {
                                    this.setState({ tagName: found.name });
                                }
                            }
                        }}
                        svg={TagIcon}
                        allowsCustomValue
                        onInputChange={(v) => this.setState({ tagName: v })}
                        inputValue={this.state.tagName}
                        defaultInputValue={this.state.tagName}
                        aria-labe={__("catalog.addTags")}
                        customWidth={250}
                    >
                        {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                    </ComboBox>
                    <button style={{marginTop: "9px"}}
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
        const tagName = trimNormaliseWhitespaceAndCollapse(this.state.tagName).toLowerCase();

        this.setState({ tagName: "" });

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
}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    tags: state.publication.tag,
    locale: state.i18n.locale, // refresh
});


export default connect(mapStateToProps)(withTranslator(AddTag));
