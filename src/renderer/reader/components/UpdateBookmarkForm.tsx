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
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import { TextArea } from "react-aria-components";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    close: () => void;
    bookmark: IBookmarkState;
    name: string;
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
    private inputRef: React.RefObject<HTMLTextAreaElement>;

    constructor(props: IProps) {
        super(props);

        this.inputRef = React.createRef<HTMLTextAreaElement>();

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
        // const { bookmark } = this.props;
        // const defaultName = bookmark.name ? bookmark.name : "";

        return (
            <form onSubmit={() => this.submitBookmark} className={stylesPopoverDialog.update_form}>
                <TextArea
                    ref={this.inputRef}
                    defaultValue={this.props.name}
                    className={stylesPopoverDialog.bookmark_textArea}
                />
                <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={this.props.close}
                        className={stylesButtons.button_secondary_blue}>Cancel</button>
                    <button type="submit" className={stylesButtons.button_primary_blue}>Save</button>
                </div>
            </form>
        );
    }

    private submitBookmark(e: TFormEvent) {
        e.preventDefault();
        console.log("submitted", this.inputRef?.current);
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
