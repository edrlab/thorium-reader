// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import * as React from "react";
import { connect } from "react-redux";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

import BreadCrumb from "../layout/BreadCrumb";
import BrowserResult from "./BrowserResult";
import Header from "./Header";
import SearchForm from "./SearchForm";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ForbiddenIcon from "readium-desktop/renderer/assets/icons/forbidden-icon.svg";

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

class Browser extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<IProps>  {
        const secondaryHeader = <Header/>;
        const breadCrumb = <BreadCrumb />;
        const search = <SearchForm />;

        const profileIsDefault = this.props.profile.name === "Default";
        const catalogTitle = profileIsDefault ? this.props.breadrumb[1]?.name : this.props.profile.name;


        return (
            <LibraryLayout
                page={this.props.__("opds.breadcrumbRoot")}
                title={catalogTitle}
                secondaryHeader={secondaryHeader}
                breadCrumb={breadCrumb}
                search={search}
            >
                {this.props.breadrumb.length ?
                    <BrowserResult/>
                    :
                    <p className={stylesCatalogs.noPublication}>
                        <SVG ariaHidden svg={ForbiddenIcon} />
                        {this.props.__("opds.empty")}
                    </p>
                }
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    breadrumb: state.opds.browser.breadcrumb,
    location: state.router.location,
    locale: state.i18n.locale, // refresh
    profile: state.profile,
});

export default connect(mapStateToProps, undefined)(withTranslator(Browser));
