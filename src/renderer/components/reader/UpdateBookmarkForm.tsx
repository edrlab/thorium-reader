// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { LocatorView } from "readium-desktop/common/views/locator";
import { TReaderApiUpdateBookmark } from "readium-desktop/main/api/reader";

interface Props {
    close: () => void;
    bookmark: LocatorView;
    updateBookmark?: TReaderApiUpdateBookmark;
}

interface State {
    bookmarkToUpdate: { id: number, name: string };
}

export class UpdateBookmarkForm extends React.Component<Props, State> {
    private inputRef: any;
    private formRef: any;

    public constructor(props: Props) {
        super(props);

        this.state = {
            bookmarkToUpdate: undefined,
        };

        this.inputRef = React.createRef();
        this.formRef = React.createRef();

        this.submiteBookmark = this.submiteBookmark.bind(this);
    }

    public componentDidMount() {
        this.inputRef.current.focus();
    }

    public render(): React.ReactElement<{}> {
        const { bookmark } = this.props;
        const defaultName = bookmark.name ? bookmark.name : "";

        return (
            <form ref={this.formRef} onSubmit={this.submiteBookmark}>
                <input
                    onBlur={this.props.close}
                    ref={this.inputRef}
                    defaultValue={defaultName}
                    type="text"
                />
            </form>
        );
    }

    private submiteBookmark(e: any) {
        e.preventDefault();
        const { bookmark, updateBookmark } = this.props;
        bookmark.name = this.inputRef.current.value;
        updateBookmark(bookmark.identifier, bookmark.publication.identifier, bookmark.locator, bookmark.name);
        this.props.close();
    }
}

export default withApi(
    UpdateBookmarkForm,
    {
        operations: [
            {
                moduleId: "reader",
                methodId: "updateBookmark",
                callProp: "updateBookmark",
            },
        ],
    },
);
