// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TagButton,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagButton";
import {
    TagList,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagList";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { TPublication } from "readium-desktop/renderer/common/type/publication.type";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { RootState } from "readium-desktop/renderer/library/redux/states";
import { TChangeEventOnInput, TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// Logger
const debug = debug_("readium-desktop:renderer:reader:dialog:pubInfo:tagManager");
debug("tagManager");

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    newTagName: string;
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

        const addTagComponent = () =>
            this.props.pubId
                ? <form
                    onSubmit={this.addTag}
                    id={styles.flux_search}
                >
                    <input
                        type="text"
                        className={styles.tag_inputs}
                        title={__("catalog.addTags")}
                        placeholder={__("catalog.addTags")}
                        onChange={this.handleChangeName}
                        value={this.state.newTagName}
                    />
                    <button
                        type="submit"
                        className={styles.addTagButton}
                    >
                        {__("catalog.addTagsButton")}
                    </button>
                </form>
                : <></>;

        return (
            <div>
                <TagList tagArray={this.props.tagArray}>
                    {
                        (tag, index) =>
                            <TagButton
                                tag={tag}
                                index={index}
                                __={__}
                                pubId={this.props.pubId}
                                onClickDeleteCb={
                                    (_index) => () => this.deleteTag(_index)
                                }
                                onClickLinkCb={
                                    (_tag) => () => this.props.link(
                                        _tag.link[0], this.props.location, _tag.name)
                                }
                            >
                            </TagButton>
                    }
                </TagList>
                {
                    addTagComponent()
                }
            </div>
        );
    }

    private deleteTag = (index: number) => {
        const { tagArray } = this.props;

        const tags = Array.isArray(tagArray) ? tagArray.slice() : [];

        tags.splice(index, 1);

        const tagsName: string[] = [];
        for (const tag of tags) {
            if (typeof tag === "string") {
                tagsName.push(tag);
            } else {
                tagsName.push(tag.name);
            }
        }

        this.props.setTags(this.props.pubId, this.props.publication, tagsName, tags);
    }

    private addTag = (e: TFormEvent) => {
        e.preventDefault();
        const { tagArray } = this.props;

        const tags = Array.isArray(tagArray) ? tagArray.slice() : [];
        const tagName = this.state.newTagName.trim().replace(/\s\s+/g, " ");

        this.setState({ newTagName: "" });

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
        this.props.setTags(this.props.pubId, this.props.publication, tagsName);

    }

    private handleChangeName = (e: TChangeEventOnInput) => {
        this.setState({ newTagName: e.target.value });
    }
}

const mapStateToProps = (state: RootState) => ({
    tagArray: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib])?.publication?.tags,
    pubId: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib])?.publication?.identifier,
    publication: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoLib])?.publication,
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => ({
    setTags: (pubId: string, publication: TPublication, tagsName: string[]) => {
        apiDispatch(dispatch)()("publication/updateTags")(pubId, tagsName);
        dispatch(
            dialogActions.updateRequest.build<DialogTypeName.PublicationInfoLib>(
                {
                    // @ts-ignore
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
