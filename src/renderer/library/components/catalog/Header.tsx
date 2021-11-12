// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import SecondaryHeader from "readium-desktop/renderer/library/components/SecondaryHeader";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType } from "readium-desktop/renderer/library/routing";

import PublicationAddButton from "./PublicationAddButton";
import SearchForm from "./SearchForm";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, location } = this.props;
        const displayType = location?.state?.displayType || DisplayType.Grid;

        return (
            <SecondaryHeader>
                <Link
                    to={{
                        ...this.props.location,
                        state: {
                            displayType: DisplayType.Grid,
                        },
                    }}
                    replace={true}
                    className={(displayType === DisplayType.Grid) ?
                        stylesButtons.button_transparency_icon :
                        stylesButtons.button_transparency_icon_inactive
                    }
                    title={__("header.gridTitle")}
                    aria-pressed={displayType === DisplayType.Grid}
                    role={"button"}
                >
                    <SVG svg={GridIcon} ariaHidden/>
                </Link>
                <Link
                    to={{
                        ...this.props.location,
                        state: {
                            displayType: DisplayType.List,
                        },
                    }}
                    replace={true}
                    className={(displayType === DisplayType.List) ?
                        stylesButtons.button_transparency_icon :
                        stylesButtons.button_transparency_icon_inactive
                    }
                    title={__("header.listTitle")}
                    aria-pressed={displayType === DisplayType.List}
                    role={"button"}
                >
                    <SVG svg={ListIcon} ariaHidden/>
                </Link>
                <SearchForm />
                {this.AllBooksButton(window.location.hash)}
                <PublicationAddButton />
            </SecondaryHeader>
        );
    }

    private AllBooksButton(hash: string) {
        const search = hash.indexOf("search");
        if (search === -1) {
            return (
                <Link
                    className={stylesButtons.button_primary_small}
                    to={{
                        ...this.props.location,
                        pathname: "/library/search/all",
                    }}
                >
                    {this.props.__("header.allBooks")}
                </Link>
            );
        }
        return (<></>);
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(Header));
