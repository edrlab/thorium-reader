// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface Props extends TranslatorProps {
    publicationIdentifier: string;
    tags: string[];
    updatedPublication?: PublicationView;
    updateTags?: (data: {identifier: string, tags: string[]}) => void;
    canModifyTag?: boolean;
}

interface TagManagerState {
    tags: string[];
    nameNewTag: string;
}

export class TagManager extends React.Component<Props, TagManagerState> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            tags: props.tags ? props.tags : [],
            nameNewTag: "",
        };

        this.deleteTag = this.deleteTag.bind(this);
        this.handleChangeName = this.handleChangeName.bind(this);
        this.addTag = this.addTag.bind(this);
    }

    public componentDidUpdate(oldProps: Props) {
        if (this.props.tags !== oldProps.tags) {
            this.setState({tags: this.props.tags});
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        return (
            <div>
                { this.state.tags.length > 0 && <ul>
                    {this.state.tags.map((tag: string, index: number) =>
                        <li key={index}> {tag}
                            {this.props.canModifyTag &&
                                <button onClick={() => this.deleteTag(index)}>
                                    <SVG svg={CrossIcon} title={__("catalog.deleteTag")} />
                                </button>
                            }
                        </li>,
                    )}
                </ul>}
                {this.props.canModifyTag &&
                    <form onSubmit={this.addTag} id={styles.flux_search}>
                        <input
                            type="text"
                            className={styles.tag_inputs}
                            title={ __("catalog.addTags")}
                            placeholder={ __("catalog.addTags")}
                            onChange={this.handleChangeName}
                            value={this.state.nameNewTag}
                        />
                        <button
                            type="submit"
                            className={styles.addTagButton}
                        >
                            { __("catalog.addTagsButton")}
                        </button>
                    </form>
                }
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

        if (this.state.nameNewTag) {
            const normalizedTagName = this.state.nameNewTag.trim().replace(/\s\s+/g, " ");

            if (normalizedTagName.length && tags.indexOf(normalizedTagName) < 0) {
                tags.push(normalizedTagName);
                this.sendTags(tags);
            }
        }

        this.setState({ nameNewTag: "" });
    }

    private sendTags(tags: string[]) {
        this.props.updateTags({
            identifier: this.props.publicationIdentifier,
            tags,
        });
    }

    private handleChangeName(e: any) {
        this.setState({ nameNewTag: e.target.value });
    }
}

export default withTranslator(withApi(
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
));
