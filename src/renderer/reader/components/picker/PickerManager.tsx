// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TDispatch } from "readium-desktop/typings/redux";
import { IEventBusPdfPlayer } from "../../pdf/common/pdfReader.type";

import { readerLocalActionPicker, readerLocalActionSearch } from "../../redux/actions";
import { IPickerState } from "readium-desktop/common/redux/states/renderer/picker";
import AnnotationPicker from "./Annotation";
import SearchPicker from "./Search";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    showSearchResults: () => void;
    pdfEventBus: IEventBusPdfPlayer;
    isPdf: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps>, TranslatorProps {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
    // pickerTop: number;
    // pickerLeft: number;
}

class PickerManager extends React.Component<IProps, IState> {

    // private left = 0;
    // private top = 0;

    constructor(props: IProps) {
        super(props);

        // this.state = {
        //     pickerTop: 0,
        //     pickerLeft: 0,
        // };
    }

    // public componentDidUpdate(prevProps: IProps) {
    //     const { picker: { open: o } } = prevProps;
    //     const { picker: { open: n } } = this.props;

    //     if (n !== o) {
    //         this.setState({
    //             pickerTop: 70,
    //             pickerLeft: Math.round(window.innerWidth / 3),
    //         });
    //     }
    // }

    public render(): React.ReactElement<{}> {
        const { open, type } = this.props.picker;
        const { __ } = this.props;

        if (!open) {
            return (<></>);
        }

        // onMouseDown={this.startMove}
        // top: this.state.pickerTop,
        // left: this.state.pickerLeft,
        // width: 500,
        // height: 30,
        // backgroundColor: "rgba(255, 255, 255, 0.8)",
        return (
            // z-index 102 is just above top toolbar, below dialog
            // (but index stacking results in overlay on top of side panels, so not viable)
            <div style={{
                zIndex: 101,
                position: "absolute",
                left: "30px",
                right: "30px",
                top: "70px",
                height: "40px",
                padding: 0,
                margin: 0,

                backgroundColor: "var(--reader-mainColor)",
                border: "1px solid var(--reader-separatorColor)",
                borderRadius: "6px",

                display: "flex",
                justifyContent: "left",
                alignItems: "center",

                boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.3)",
            }}
                onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Escape") {
                        this.props.closePicker(type);
                    }
                }}
            >
                <span style={{
                    fontSize: "1em",
                    backgroundColor: "transparent",
                    margin: 0,
                    padding: 0,
                    paddingLeft: "1em",
                    paddingRight: "1em",
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
                            ? <SearchPicker
                                showSearchResults={this.props.showSearchResults}
                                pdfEventBus={this.props.pdfEventBus}
                                isPdf={this.props.isPdf}
                            ></SearchPicker>
                            : <AnnotationPicker></AnnotationPicker>
                    }
                </>

                <button
                    style={{
                        width: "30px",
                        marginLeft: "auto",
                        marginRight: "0.4em",
                        backgroundColor: "transparent",
                        color: "black",
                        fill: "black",
                    }}
                    type="button"
                    aria-label={__("accessibility.closeDialog")}
                    title={__("accessibility.closeDialog")}
                    onClick={() => this.props.closePicker(type)}
                >
                    <SVG ariaHidden={true} svg={QuitIcon} />
                </button>
            </div>
        );
    }

    // private startMove = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

    //     ev.target.addEventListener("mouseup", this.stopMove as any);
    //     ev.target.addEventListener("mousemove", this.move as any);
    //     ev.target.addEventListener("mouseleave", this.stopMove as any);

    //     this.top = ev.pageY;
    //     this.left = ev.pageX;
    // }

    // private stopMove = (ev: MouseEvent) => {

    //     ev.target.removeEventListener("mouseup", this.stopMove as any);
    //     ev.target.removeEventListener("mousemove", this.move as any);
    // }

    // private move = (evt: MouseEvent) => {

    //     this.setState({
    //         pickerTop: this.state.pickerTop + evt.pageY - this.top,
    //         pickerLeft: this.state.pickerLeft + evt.pageX - this.left,
    //     });

    //     this.top = evt.pageY;
    //     this.left = evt.pageX;
    // }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        picker: state.picker,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => ({
    // tslint:disable-next-line: max-line-length
    /* Exported variable 'mapDispatchToProps' has or is using name 'IPayload' from external module "/Users/Pierre/Documents/thorium/src/renderer/reader/redux/actions/picker/picker" but cannot be named.ts(4023) */
    closePicker: (type: IPickerState["type"]) => {
        console.log("closepicker", type, props);
        if (type === "search") {
            dispatch(readerLocalActionSearch.cancel.build());
            if (props.isPdf) {
                props.pdfEventBus?.dispatch("search-wipe");
            }
        }
        dispatch(readerLocalActionPicker.manager.build(false));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PickerManager));
