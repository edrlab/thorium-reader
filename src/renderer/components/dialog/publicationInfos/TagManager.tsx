// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { apiDispatch } from "readium-desktop/renderer/redux/api/api";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TPublication } from "readium-desktop/renderer/type/publication.type";
import { TChangeEventOnInput, TFormEvent } from "readium-desktop/typings/react";
import { Dispatch } from "redux";

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

        const tagComponent = () =>
            this.props.tagArray?.length
                ? <ul>
                    {this.props.tagArray.map(
                        (tag, idx) =>
                            <li key={idx}>
                                {tag}
                                {
                                    this.props.pubId &&
                                    <button
                                        onClick={
                                            () => this.deleteTag(idx)
                                        }
                                    >
                                        <SVG svg={CrossIcon} title={__("catalog.deleteTag")} />
                                    </button>
                                }
                            </li>,
                    )}
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
                    tagComponent()
                }
                {
                    addTagComponent()
                }
            </div>
        );
    }

    private deleteTag = (index: number) => {
        const { tagArray } = this.props;

        const tags = tagArray.slice();

        tags.splice(index, 1);
        this.props.setTags(this.props.pubId, this.props.publication, tags);
    }

    private addTag = (e: TFormEvent) => {
        e.preventDefault();
        const { tagArray } = this.props;

        const tags = Array.isArray(tagArray) ? tagArray.slice() : [];
        const tagName = this.state.newTagName.trim().replace(/\s\s+/g, " ");

        if (tagName !== ""
            && tags.indexOf(tagName) < 0) {

            tags.push(tagName);
            this.props.setTags(this.props.pubId, this.props.publication, tags);
        }

        this.setState({ newTagName: "" });
    }

    private handleChangeName = (e: TChangeEventOnInput) => {
        this.setState({ newTagName: e.target.value });
    }
}

const mapDispatchToProps = (dispatch: Dispatch, _props: IBaseProps) => ({
    setTags: (pubId: string, publication: TPublication, tags: string[]) => {
        apiDispatch(dispatch)()("publication/updateTags")(pubId, tags);
        dispatch(
            dialogActions.updateRequest.build<"publication-info-lib">(
                {
                    publication: {
                        ...publication,
                        ...{
                            tags,
                        },
                    },
                },
            ),
        );
    },
});

const mapStateToProps = (state: RootState) => ({
    tagArray: (state.dialog.data as DialogType["publication-info-lib"])?.publication?.tags,
    pubId: (state.dialog.data as DialogType["publication-info-lib"])?.publication?.identifier,
    publication: (state.dialog.data as DialogType["publication-info-lib"])?.publication,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(TagManager));
