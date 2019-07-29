// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import * as PlusIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";

import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

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
                    <form id={styles.flux_search}>
                        <input
                            type="text"
                            className={styles.tag_inputs}
                            title={ __("catalog.addTags")}
                            placeholder={ __("catalog.addTags")}
                            onChange={this.handleChangeName}
                            value={this.state.nameNewTag}
                            onKeyDown={(e) => {
                                if (e.keyCode === 13) {
                                    e.preventDefault();
                                    return (false);
                                }
                            }}
                        />
                        <button onClick={this.addTag}>
                            <SVG svg={PlusIcon} title={__("catalog.confirmAddTag")}/>
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
        const currentTag = this.state.nameNewTag.trim();

        if (currentTag && tags.indexOf(currentTag) < 0) {
            tags.push(currentTag);
            this.sendTags(tags);
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
        const currentTag: string = e.target.value.trim();

        this.setState({ nameNewTag: currentTag });
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
