// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeURIComponent_RFC3986 } from "r2-utils-js/dist/es8-es2017/src/_utils/http/UrlUtils";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.css";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "../../routing";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    name: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class GridTagButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {

        return (
            <Link
                to={{
                    ...this.props.location,
                    pathname: `/library/search/tag/${encodeURIComponent_RFC3986(this.props.name)}`,
                }}
                state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                className={stylesTags.tag}
            >
                {this.props.name}
                {/*<div id={style.count}>
                    {this.props.tag.length}
                </div>*/}
            </Link>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(GridTagButton);
