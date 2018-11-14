import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/library.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import Header from "readium-desktop/renderer/components/Header";
import MyBooks from "readium-desktop/renderer/components/MyBooks";

import { Publication } from "readium-desktop/common/models/publication";

interface States {
    activePage: number;
}

export default class PageManager extends React.Component<{}, States> {

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: any) {
        super(props);

        this.state = {
            activePage: 0,
        };

        this.handlePageClick = this.handlePageClick.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const activePage = this.state.activePage;
        return (
            <>
            <Header activePage={activePage} handlePageClick={this.handlePageClick}/>
            { this.state.activePage === 0 ?
                <MyBooks/>
            : this.state.activePage === 1 ?
                <div>Catalogues</div>
            :
                <div>Préférences</div>
            }
            </>
        );
    }

    private handlePageClick(id: number) {
        this.setState({activePage: id});
    }
}
