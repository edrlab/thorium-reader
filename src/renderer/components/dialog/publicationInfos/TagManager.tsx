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
import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { dispatchOpdsLink } from "readium-desktop/renderer/opds/handleLink";
import { apiDispatch } from "readium-desktop/renderer/redux/api/api";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TPublication } from "readium-desktop/renderer/type/publication.type";
import { TChangeEventOnInput, TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// Logger
const debug = debug_("readium-desktop:renderer:dialog:pubInfo:tagManager");
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

export class TagManager extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            newTagName: "",
        };
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const tagButtonComponent = (tag: string | IOpdsTagView, index: number) => {
            let button = <></>;

            let tagString = "";
            if (typeof tag === "string") {
                tagString = tag;
            } else {
                tagString = tag.name;
            }

            if (this.props.pubId) {
                button = (
                    <>
                        {
                            tagString
                        }
                        <button
                            onClick={
                                () => this.deleteTag(index)
                            }
                        >
                            <SVG svg={CrossIcon} title={__("catalog.deleteTag")} />
                        </button>
                    </>
                );
            } else if (typeof tag === "object" && tag?.link?.length) {
                button = (
                    <>
                        <a
                            onClick={
                                () => this.props.link(tag.link[0], this.props.location, tag.name)
                            }
                        >
                            {
                                tagString
                            }
                        </a>
                        <button>
                        </button>
                    </>
                );
            } else {
                button = (
                    <>
                        {
                            tagString
                        }
                    </>
                );
            }

            return button;
        };

        const tagComponent = () => {

            const tags: JSX.Element[] = [];
            for (const [index, tag] of this.props.tagArray.entries()) {

                tags.push(
                    <li key={`tag-${index}`}>
                        {
                            tagButtonComponent(tag, index)
                        }
                    </li>,
                );
            }

            return tags;
        };

        const tagListComponent = () =>
            this.props.tagArray?.length
                ? <ul>
                    {
                        tagComponent()
                    }
                </ul>
                : <></>;

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
                {
                    tagListComponent()
                }
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
        this.props.setTags(this.props.pubId, this.props.publication, tagsName, tags);

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
    setTags: (pubId: string, publication: TPublication, tagsName: string[], tagsOpds: string[] | IOpdsTagView[]) => {
        apiDispatch(dispatch)()("publication/updateTags")(pubId, tagsName);
        dispatch(
            dialogActions.updateRequest.build<DialogTypeName.PublicationInfoLib>(
                {
                    publication: {
                        ...publication,
                        ...{
                            tagsOpds,
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
