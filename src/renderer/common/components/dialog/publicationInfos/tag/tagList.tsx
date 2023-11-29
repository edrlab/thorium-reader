// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { IOpdsTagView } from "readium-desktop/common/views/opds";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.css";

interface IProps {
    tagArray: string[] | IOpdsTagView[];
    children: (tag: string | IOpdsTagView, index: number) => React.ReactNode;
}

export const TagList: React.FC<IProps> = (props) => {

    const { tagArray, children } = props;

    if (tagArray?.length) {

        const tags: JSX.Element[] = [];

        for (const [index, tag] of tagArray.entries()) {

            tags.push(
                <div key={`tag-${index}`} className={classNames(
                    stylesTags.tag,
                    // pointer hover style for IOpdsTagView links
                    typeof tag === "string" || !tag.link?.length ? stylesTags.no_hover : undefined,
                )}>
                    {
                        children(tag, index)
                    }
                </div>,
            );
        }

        return (
            <div className={stylesTags.tags_wrapper}>
                {tags}
            </div>
        );
    }

    return <></>;
};
