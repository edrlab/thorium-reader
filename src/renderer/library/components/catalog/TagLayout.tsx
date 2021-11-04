// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import classNames from "classnames";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import GridTagButton from "readium-desktop/renderer/library/components/catalog/GridTagButton";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    tags: string[];
    content?: React.ReactElement<{}>;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
            <section>
                <div className={styles.heading}>
                    <h2>{__("catalog.tags")}</h2>
                    {this.props.tags.length === 0 ?
                        <></>
                        :
                        <Menu
                            button={
                                <>
                                    {__("catalog.sort")}
                                    <SVG svg={ArrowIcon} />
                                </>
                            }
                            content={
                                <div className={classNames(styles.dropdown_menu, styles.dropdown_right)}>
                                    {this.props.content}
                                </div>
                            }
                            open={this.state.showMenu}
                            dir="right"
                            toggle={this.togglemenu}
                        />
                    }
                    
                </div>
                {this.props.tags.length === 0 ?
                    <> {__("catalog.emptyTagList")} </>
                    :
                    <div className={styles.tags_wrapper}>
                        {this.props.tags.map((tag, i: number) => {
                            return (
                                <GridTagButton
                                    name={tag}
                                    key={i + 1000}
                                    /*tag={[]}*/
                                />
                            );
                        })}
                    </div>
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
