// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IOpdsTagView } from "readium-desktop/common/views/opds";

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
                <li key={`tag-${index}`}>
                    {
                        children(tag, index)
                    }
                </li>,
            );
        }

        return (
            <ul>
                {
                    tags
                }
            </ul>
        );
    }

    return <></>;
};
