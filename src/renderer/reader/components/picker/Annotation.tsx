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
            <></>
        );

    }

}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        picker: state.picker,
    };
};

const mapDispatchToProps = (_dispatch: TDispatch) => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(AnnotationPicker);
