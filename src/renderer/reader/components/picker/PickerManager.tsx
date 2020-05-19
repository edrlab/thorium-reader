// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { TDispatch } from "readium-desktop/typings/redux";

import { readerLocalActionPicker } from "../../redux/actions";
import AnnotationPicker from "./annotation";
import SearchPicker from "./search";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    pickerTop: number;
    pickerLeft: number;
    deltaX: number;
    deltaY: number;
}

class PickerManager extends React.Component<IProps, IState> {

    private left = 0;
    private top = 0;

    constructor(props: IProps) {
        super(props);

        this.state = {
            pickerTop: 70,
            pickerLeft: 300,
            deltaX: 0,
            deltaY: 0,
        };
    }

    public render(): React.ReactElement<{}> {
        const { open, type } = this.props.picker;

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
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: "1px solid gray",
                zIndex: 999,
            }}
                onMouseDown={this.startMove}
            >
                <span style={{
                    fontSize: "2ex",
                    margin: "10px",
                }}>
                    {
                        type === "search"
                            ? "Search: "
                            : "Annotation: "
                    }
                </span>
                {
                    type === "search"
                        ? <SearchPicker></SearchPicker>
                        : <AnnotationPicker></AnnotationPicker>
                }

                <button
                    style={{
                        position: "absolute",
                        right: "10px",
                        top: "3px",
                        fontSize: "2ex",
                    }}
                    onClick={() => this.props.closePicker()}
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

        this.left = ev.pageX;
        this.top = ev.pageY;
    }

    private stopMove = (ev: MouseEvent) => {

        ev.target.removeEventListener("mouseup", this.stopMove as any);
        ev.target.removeEventListener("mousemove", this.move as any);
    }

    private move = (evt: MouseEvent) => {

        this.setState({
            deltaX: evt.pageX - this.left,
            deltaY: evt.pageY - this.top,
            pickerTop: this.state.pickerTop + this.state.deltaY,
            pickerLeft: this.state.pickerLeft + this.state.deltaX,
        });

        this.left = evt.pageX;
        this.top = evt.pageY;
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
    closePicker: () => (dispatch(readerLocalActionPicker.manager.build(false, "search")), 0),
});

export default connect(mapStateToProps, mapDispatchToProps)(PickerManager);
