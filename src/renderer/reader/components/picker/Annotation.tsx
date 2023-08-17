// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { TChangeEventOnInput, TChangeEventOnTextArea } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { readerLocalActionAnnotationUI, readerLocalActionAnnotations, readerLocalActionPicker } from "../../redux/actions";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { IAnnotationState } from "readium-desktop/common/redux/states/annotation";
import { IAnnotationUserInterfaceState } from "../../redux/state/annotation";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
}

class AnnotationPicker extends React.Component<IProps, IState> {

    public render(): React.ReactElement<{}> {

        return (
            <form id="myForm" style={{ display: 'block' }}>
              <input type="text" id="name" name="name" value={this.props.annotation.name} maxLength={20} style={{ width: '100px' }} onChange={this.nameChange}/>
      
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'red', border: 'none', margin: '5px', cursor: 'pointer' }} onClick={(e) => (e.preventDefault(),this.colorChange("red"))}></button>
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'green', border: 'none', margin: '5px', cursor: 'pointer' }} onClick={(e) => (e.preventDefault(),this.colorChange("green"))}></button>
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'blue', border: 'none', margin: '5px', cursor: 'pointer' }} onClick={(e) => (e.preventDefault(),this.colorChange("blue"))}></button>
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'yellow', border: 'none', margin: '5px', cursor: 'pointer' }} onClick={(e) => (e.preventDefault(),this.colorChange("yellow"))}></button>
      
              <textarea id="comment" name="comment" value={this.props.annotation.comment} style={{ width: '200px' }} onChange={this.commentChange}></textarea>
      
              <button type="button" id="deleteButton" style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '1px 2px', cursor: 'pointer' }} onClick={(_e) => (this.props.deleteAnnotation(this.props.annotationItem))}>Delete</button>
              <button type="button" id="submitButton" style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '1px 2px', cursor: 'pointer' }} onClick={(_e) => (this.props.updateAnnotation(this.props.annotation, this.props.annotationItem))}>Submit</button>
            </form>
          );
    }

    private nameChange = (e: TChangeEventOnInput) => {
        const v = e.target.value;
        const {comment, color, newFocusAnnotationUUID: uuid} = this.props.annotation;

        this.props.updateAnnotationPicker(v, comment, color, uuid);
    }
    
    private commentChange = (e: TChangeEventOnTextArea) => {
        const v = e.target.value;
        const {name, color, newFocusAnnotationUUID: uuid} = this.props.annotation;

        this.props.updateAnnotationPicker(name, v, color, uuid);
    }
    
    private colorChange = (localColor: "red"|"green"|"blue"|"yellow") => {
        const {name, comment, newFocusAnnotationUUID: uuid} = this.props.annotation;

        let color: IColor;
        switch (localColor) {

            case "red": {
                color = {
                    red: 200,
                    green: 0,
                    blue: 0,
                }
                break;
            }
            case "green": {
                color = {
                    red: 0,
                    green: 200,
                    blue: 0,
                }
                break;
            }
            case "blue": {
                color = {
                    red: 0,
                    green: 0,
                    blue: 200,
                }
                break;
            }
            case "yellow": {
                color = {
                    red: 255,
                    green: 210,
                    blue: 1,
                }
                break;
            }
            default: {
                color = this.props.annotation.color;
            }
        }

        this.props.updateAnnotationPicker(name, comment, color, uuid);
    }

}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        picker: state.picker,
        annotation: state.annotation,
        annotationItem: state.reader.annotation.map(([,v]) => v).find((v) => v.uuid === state.annotation.newFocusAnnotationUUID),
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => ({
    updateAnnotationPicker: (name: string, comment: string, color: IColor, uuid: string) => {
        dispatch(readerLocalActionAnnotationUI.picker.build(name, comment, color, uuid))
    },
    deleteAnnotation: (annotation: IAnnotationState) => {
        dispatch(readerLocalActionPicker.manager.build(false));
        dispatch(readerLocalActionAnnotations.pop.build(annotation));
    },
    updateAnnotation: (updatedState: IAnnotationUserInterfaceState, annotation: IAnnotationState) => {
        const {color, name, comment} = updatedState;
        annotation.def.color = color || annotation.def.color;
        annotation.comment = comment;
        annotation.name = name;
        dispatch(readerLocalActionAnnotations.update.build(annotation));
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(AnnotationPicker);
