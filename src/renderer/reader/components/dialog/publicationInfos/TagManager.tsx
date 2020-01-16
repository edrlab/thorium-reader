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
import {
    TagButton,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagButton";
import {
    TagList,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagList";
import {
    TranslatorProps,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { RootState } from "readium-desktop/renderer/reader/redux/states";

// Logger
const debug = debug_("readium-desktop:renderer:reader:components:dialog:publicationInfos:TagManager");
debug("tagManager");

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

export class TagManager extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            newTagName: "",
        };
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <TagList tagArray={this.props.tagArray}>
                    {
                        (tag) =>
                            <TagButton
                                tag={tag}
                            >
                            </TagButton>
                    }
                </TagList>
            </div>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    tagArray: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader])?.publication?.tags,
});

export default connect(mapStateToProps)(TagManager);
