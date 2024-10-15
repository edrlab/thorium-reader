// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
// import AddTag from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/AddTag";
import * as TagIcon from "readium-desktop/renderer/assets/icons/tag-icon.svg";
import {
    TagButton,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagButton";
import {
    TagList,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagList";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { deleteTag } from "readium-desktop/renderer/common/logics/publicationInfos/tags/deleteTag";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import classNames from "classnames";
// import { InputPredict } from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/TagPredict";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { HoverEvent } from "react-aria";
// import GridTagButton from "../../catalog/GridTagButton";


// Logger
const debug = debug_("readium-desktop:renderer:reader:dialog:pubInfo:tagManager");
debug("tagManager");

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    newTagName: string,
}

class TagManager extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            newTagName: "",
        };
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const setTagsCb =
            (tagsArray: string[]) =>
                this.props.setTags(
                    this.props.pubId,
                    this.props.publication as PublicationView,
                    tagsArray,
                );

        const updateTagsCb =
            (index: number) =>
                () =>
                    deleteTag(this.props.tagArray, setTagsCb)(index);


        const tagsOptions = this.props.tags.map((v, i) => ({ id: i, value: i, name: v }));

        return (
            <section className={stylePublication.publicationInfo_tagContainer}>
                <div className={classNames(stylePublication.publicationInfo_heading, stylePublication.tag_list)}>
                    <h4>{__("catalog.tags")} {this.props.tagArray?.length > 0 ? ":" : ""}</h4>
                    <TagList tagArray={this.props.tagArray}>
                        {
                            (tag, index) =>
                                <TagButton
                                    tag={tag}
                                    index={index}
                                    pubId={this.props.pubId}
                                    onClickDeleteCb={updateTagsCb}
                                    onClickLinkCb={
                                        (_tag) => () => this.props.link(
                                            _tag.link[0], this.props.location, _tag.name)
                                    }
                                    location={this.props.location}
                                >
                                </TagButton>
                            // <GridTagButton name={tag as string} key={index} />
                        }
                    </TagList>
                </div>
                {/* <AddTag
                    pubId={this.props.pubId}
                    tagArray={this.props.tagArray}
                    __={__}
                    setTags={setTagsCb}
                /> */}
                {/* <InputPredict dictionary={this.props.tags} pubId={this.props.pubId}
                    tagArray={this.props.tagArray}
                    setTags={setTagsCb} /> */}
                <ComboBox
                    defaultItems={tagsOptions}
                    onSelectionChange={this.handleSelectionChange}
                    svg={TagIcon}
                    allowsCustomValue
                    placeholder={this.props.__("catalog.addTags")}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            this.handleKeyUp(e);
                        }
                    }}
                    style={{width: "250px"}}
                >
                    {item => <ComboBoxItem
                        onHoverStart={(e: HoverEvent) => {
                            if (!e.target.getAttribute("title")) {
                                e.target.setAttribute("title", item.name);
                            }
                        }}
                    // aria-label={item.name}
                    >{item.name}</ComboBoxItem>}
                </ComboBox>
            </section>
        );
    }

    private handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        this.setState({ newTagName: e.currentTarget.value }, this.addTag);
    };



    private handleSelectionChange = (key: React.Key) => {
        const selectedTag = this.props.tags[Number(key)];
        if (selectedTag && key) {
            this.setState({ newTagName: selectedTag }, this.addTag);
        }
    };


    private addTag = () => {
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
            this.props.setTags(this.props.pubId, this.props.publication as PublicationView, tagsName);
        }
    };
}


const mapStateToProps = (state: ILibraryRootState) => ({
    tagArray: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib])?.publication?.tags,
    pubId: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib])?.publication?.identifier,
    publication: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib])?.publication,
    location: state.router.location,
    tags: state.publication.tag,
    locale: state.i18n.locale, // refresh
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => ({
    setTags: (pubId: string, publication: PublicationView, tagsName: string[]) => {
        apiDispatch(dispatch)()("publication/updateTags")(pubId, tagsName);
        dispatch(
            dialogActions.updateRequest.build<DialogTypeName.PublicationInfoLib>(
                {
                    publication: {
                        ...publication,
                        ...{
                            tags: tagsName,
                        },
                    },
                },
            ),
        );
    },
    link: (...data: Parameters<ReturnType<typeof dispatchOpdsLink>>) =>
        dispatchOpdsLink(dispatch)(...data),
});
export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(TagManager));
