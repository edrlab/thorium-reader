// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

export interface IProps extends React.PropsWithChildren {
    tag: string | IOpdsTagView;
    index?: number;
    __?: I18nTyped;
    pubId?: string;
    onClickDeleteCb?: (index: number) => () => void | undefined;
    onClickLinkCb?: (tag: IOpdsTagView) => () => void | undefined;
}

export const TagButton: React.FC<IProps> = (props) => {

    const { tag, index, __, pubId, onClickDeleteCb, onClickLinkCb } = props;

    let button = <></>;

    let tagString = "";
    if (typeof tag === "string") {
        tagString = tag;
    } else {
        tagString = tag.name;
    }

    if (pubId && onClickDeleteCb && __) {
        button = (
            <>
                {tagString}
                <button
                    onClick={
                        // () => this.deleteTag(index)
                        onClickDeleteCb(index)
                    }
                    title={__("catalog.deleteTag")}
                >
                    <SVG ariaHidden={true} svg={CrossIcon} />
                </button>
            </>
        );
    } else if (typeof tag === "object" && tag?.link?.length && onClickLinkCb) {
        button = (
            <>
                <a
                    onClick={
                        // () => this.props.link(tag.link[0], this.props.location, tag.name)
                        onClickLinkCb(tag)
                    }
                >
                    {tagString}
                </a>
            </>
        );
    } else {
        button = (
            <>
                {tagString}
            </>
        );
    }

    return button;
};
