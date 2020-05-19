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
}

class PickerManager extends React.Component<IProps, IState> {

    private left = 0;
    private top = 0;

    constructor(props: IProps) {
        super(props);

        this.state = {
            pickerTop: 70,
            pickerLeft: 300,
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
    closePicker: () => (dispatch(readerLocalActionPicker.manager.build(false, "search")), 0),
});

export default connect(mapStateToProps, mapDispatchToProps)(PickerManager);
