// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";

interface TagManagerProps {
    publicationIdentifier: string;
    tags: string[];
    updatedPublication?: PublicationView;
    updateTags?: (data: {identifier: string, tags: string[]}) => void;
}

interface TagManagerState {
    tags: string[];
    nameNewTag: string;
}

export class TagManager extends React.Component<TagManagerProps, TagManagerState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            tags: props.tags ? props.tags : [],
            nameNewTag: "",
        }

        this.deleteTag = this.deleteTag.bind(this);
        this.handleChangeName = this.handleChangeName.bind(this);
        this.addTag = this.addTag.bind(this);
    }

    public componentDidUpdate() {
        if (this.props.updatedPublication && this.props.updatedPublication.tags && this.state.tags !== this.props.updatedPublication.tags) {
            this.setState({tags: this.props.updatedPublication.tags});
        }
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <ul>
                    {this.state.tags.map((tag: string, index: number) =>
                        <li key={index}> {tag}
                            <button onClick={() => this.deleteTag(index)}>
                                <SVG svg={CrossIcon} title="supprimer le tag" />
                            </button>
                        </li>
                    )}
                </ul>
                <form onSubmit={this.addTag} id={styles.flux_search}>
                    <input
                        type="text"
                        className={styles.tag_inputs}
                        title="ajouter un tag"
                        placeholder="Ajouter un tag"
                        onChange={this.handleChangeName}
                        value={this.state.nameNewTag}
                    />
                </form>
            </div>
        );
    }

    private deleteTag(index: number) {
        const { tags } = this.state;
        tags.splice(index, 1);
        this.sendTags(tags);
    }

    private addTag(e: any) {
        e.preventDefault();
        const { tags } = this.state;
        tags.push(this.state.nameNewTag);
        this.sendTags(tags);
        this.setState({nameNewTag: ""});
    }

    private sendTags(tags: string[]) {
        this.props.updateTags({
            identifier: this.props.publicationIdentifier,
            tags,
        });
    }

    private handleChangeName(e: any) {
        this.setState({nameNewTag: e.target.value});
    }
}

export default withApi(
    TagManager,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "updateTags",
                resultProp: "updatedPublication",
                callProp: "updateTags",
            },
        ],
    },
);
