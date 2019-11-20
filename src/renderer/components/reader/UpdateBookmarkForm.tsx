// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { LocatorView } from "readium-desktop/common/views/locator";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { TFormEvent } from "readium-desktop/typings/react";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    close: () => void;
    bookmark: LocatorView;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    bookmarkToUpdate: { id: number, name: string };
}

export class UpdateBookmarkForm extends React.Component<IProps, IState> {
    private inputRef: any;
    private formRef: any;

    constructor(props: IProps) {
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

    private submiteBookmark(e: TFormEvent) {
        e.preventDefault();
        const { bookmark } = this.props;
        const value: string = this.inputRef.current.value;
        const normalizedValue = value.trim().replace(/\s\s+/g, " ");
        if (normalizedValue.length > 0) {
            bookmark.name = normalizedValue;
            apiAction("reader/updateBookmark",
                bookmark.identifier,
                bookmark.identifiableView.identifier,
                bookmark.locator,
                bookmark.name,
            ).catch((error) => console.error("Error to fetch api reader/updateBookmark", error));
        }

        this.props.close();
    }
}

export default UpdateBookmarkForm;
