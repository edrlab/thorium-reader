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
              <input type="text" id="name" name="name" value={this.props.annotation.name} maxLength={20} style={{ width: '100px' }} readOnly={true}/>
      
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'red', border: 'none', margin: '5px', cursor: 'pointer' }}></button>
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'green', border: 'none', margin: '5px', cursor: 'pointer' }}></button>
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'blue', border: 'none', margin: '5px', cursor: 'pointer' }}></button>
              <button className="color-button" style={{ width: '20px', height: '20px', backgroundColor: 'yellow', border: 'none', margin: '5px', cursor: 'pointer' }}></button>
      
              <textarea id="comment" name="comment" value={this.props.annotation.comment} style={{ width: '200px' }} readOnly={true}></textarea>
      
              <button type="button" id="deleteButton" style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '1px 2px', cursor: 'pointer' }}>Delete</button>
              <button type="button" id="submitButton" style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '1px 2px', cursor: 'pointer' }}>Submit</button>
            </form>
          );
    }

}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        picker: state.picker,
        annotation: state.annotation,
    };
};

const mapDispatchToProps = (_dispatch: TDispatch) => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(AnnotationPicker);
