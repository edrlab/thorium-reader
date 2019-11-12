// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";
import GridTagButton from "readium-desktop/renderer/components/catalog/GridTagButton";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import Menu from "readium-desktop/renderer/components/utils/menu/Menu";
import SVG from "readium-desktop/renderer/components/utils/SVG";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    tags: string[];
    content?: any;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
        showMenu: boolean;
}

class GridTagLayout extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            showMenu: false,
        };
        this.togglemenu = this.togglemenu.bind(this);
    }
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <section id={style.myTags}>
                <h1> {__("catalog.tags")} </h1>
                {this.props.tags.length === 0 ?
                    <> {__("catalog.emptyTagList")} </>
                    :
                    <>
                        <div id={style.sortMenu}>
                            <Menu
                                button={
                                    <div>
                                        {__("catalog.sort")}
                                        <SVG svg={ArrowIcon} />
                                    </div>
                                }
                                content={
                                    <div>
                                        {this.props.content}
                                    </div>
                                }
                                open={this.state.showMenu}
                                dir="left"
                                toggle={this.togglemenu}
                            />
                        </div>
                        <section id={style.content}>
                            {this.props.tags.map((tag, i: number) => {
                                return (
                                    <GridTagButton
                                        name={tag}
                                        key={i + 1000}
                                    /*tag={[]}*/
                                    />);
                            })}
                        </section>
                    </>
                }
            </section>
        );
    }

    private togglemenu() {
        this.setState({
            showMenu: !this.state.showMenu,
        });
    }
}

export default withTranslator(GridTagLayout);
