// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
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

class GridTagLayout extends React.Component<IProps> {

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <section>
                <div className={stylesGlobal.heading}>
                    <h2>{__("catalog.tags")}</h2>
                    {this.props.tags.length === 0 ?
                        <></>
                        :
                        <Menu
                            button={
                                <>
                                    {__("catalog.sort")}
                                    <SVG ariaHidden={true} svg={ArrowIcon} />
                                </>
                            }
                        >
                            {this.props.content}
                        </Menu>
                    }
                </div>
                {this.props.tags.length === 0 ?
                    <> {__("catalog.emptyTagList")} </>
                    :
                    <div className={stylesTags.tags_wrapper}>
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
}

export default withTranslator(GridTagLayout);
