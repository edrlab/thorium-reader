// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { readerLocalActionBookmarks } from "../redux/actions";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    close: () => void;
    bookmark: IBookmarkState;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    bookmarkToUpdate: { id: number, name: string };
}

export class UpdateBookmarkForm extends React.Component<IProps, IState> {
    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.inputRef = React.createRef<HTMLInputElement>();

        this.state = {
            bookmarkToUpdate: undefined,
        };

        this.submitBookmark = this.submitBookmark.bind(this);
    }

    public componentDidMount() {
        if (this.inputRef?.current) {
            this.inputRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        const { bookmark } = this.props;
        const defaultName = bookmark.name ? bookmark.name : "";

        return (
            <form onSubmit={this.submitBookmark}>
                <input
                    onBlur={this.props.close}
                    ref={this.inputRef}
                    defaultValue={defaultName}
                    type="text"
                />
            </form>
        );
    }

    private submitBookmark(e: TFormEvent) {
        e.preventDefault();
        if (!this.inputRef?.current) {
            return;
        }
        const { bookmark } = this.props;
        const value: string = this.inputRef.current.value;
        const normalizedValue = value.trim().replace(/\s\s+/g, " ");

        if (normalizedValue.length > 0) {
            const newBookmark = { ...bookmark };
            newBookmark.name = normalizedValue;
            this.props.updateBookmark(newBookmark);
        }

        this.props.close();
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {


    return {
        updateBookmark: (bookmark: IBookmarkState) => {
            dispatch(readerLocalActionBookmarks.update.build(bookmark));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(UpdateBookmarkForm);
