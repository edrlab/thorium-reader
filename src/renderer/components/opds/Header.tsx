import * as React from "react";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { withRouter } from "react-router-dom";

import SearchForm from "./SearchForm";

export class Header extends React.Component<undefined, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <SecondaryHeader>
                <SearchForm />
            </SecondaryHeader>
        );
    }
}

export default withRouter(Header);
