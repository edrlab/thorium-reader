// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";

import { readerLocalActionPicker, readerLocalActionSearch } from "../../redux/actions";
import { IPickerState } from "../../redux/state/picker";
import AnnotationPicker from "./Annotation";
import SearchPicker from "./Search";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps>, TranslatorProps {
}

interface IState {
    pickerTop: number;
    pickerLeft: number;
}

class PickerManager extends React.Component<IProps, IState> {

    private left = 0;
    private top = 0;

    constructor(props: IProps) {
        super(props);

        this.state = {
            pickerTop: 0,
            pickerLeft: 0,
        };

    }

    public componentDidUpdate(prevProps: IProps) {
        const { picker: { open: o } } = prevProps;
        const { picker: { open: n } } = this.props;

        if (n !== o) {
            this.setState({
                pickerTop: 70,
                pickerLeft: Math.round(window.innerWidth / 3),
            });

        }
    }

    public render(): React.ReactElement<{}> {
        const { open, type } = this.props.picker;
        const { __ } = this.props;

        if (!open) {
            return (<></>);
        }

        return (

            <div style={{
                position: "absolute",
                display: "flex",
                justifyContent: "left",
                alignItems: "center",
                width: 500,
                height: 30,
                top: this.state.pickerTop,
                left: this.state.pickerLeft,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "1px solid gray",
                zIndex: 9,
            }}
                onMouseDown={this.startMove}
                onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Escape") {
                        this.props.closePicker(type);
                    }
                }}
            >
                <span style={{
                    fontSize: "1ex",
                    margin: "10px",
                }}>
                    {
                        type === "search"
                            ? __("reader.picker.searchTitle")
                            : __("reader.picker.annotationTitle")
                    }
                </span>
                <>
                    {

                        type === "search"
                            ? <SearchPicker></SearchPicker>
                            : <AnnotationPicker></AnnotationPicker>
                    }
                </>

                <button
                    style={{
                        position: "absolute",
                        right: "5px",
                        top: "3px",
                        fontSize: "2ex",
                    }}
                    onClick={() => this.props.closePicker(type)}
                >
                    X
                </button>

            </div>
        );

    }

    private startMove = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

        ev.target.addEventListener("mouseup", this.stopMove as any);
        ev.target.addEventListener("mousemove", this.move as any);
        ev.target.addEventListener("mouseleave", this.stopMove as any);

        this.top = ev.pageY;
        this.left = ev.pageX;
    }

    private stopMove = (ev: MouseEvent) => {

        ev.target.removeEventListener("mouseup", this.stopMove as any);
        ev.target.removeEventListener("mousemove", this.move as any);
    }

    private move = (evt: MouseEvent) => {

        this.setState({
            pickerTop: this.state.pickerTop + evt.pageY - this.top,
            pickerLeft: this.state.pickerLeft + evt.pageX - this.left,
        });

        this.top = evt.pageY;
        this.left = evt.pageX;
    }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        picker: state.picker,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => ({
    // tslint:disable-next-line: max-line-length
    /* Exported variable 'mapDispatchToProps' has or is using name 'IPayload' from external module "/Users/Pierre/Documents/thorium/src/renderer/reader/redux/actions/picker/picker" but cannot be named.ts(4023) */
    closePicker: (type: IPickerState["type"]) => {
        if (type === "search") {
            dispatch(readerLocalActionSearch.cancel.build());
        }
        dispatch(readerLocalActionPicker.manager.build(false));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PickerManager));
