import * as React from "react";

import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { RouteComponentProps, withRouter } from "react-router-dom";

export class SearchForm extends React.Component<RouteComponentProps, undefined> {
    private inputRef: any;

    public constructor(props: any) {
        super(props);

        this.inputRef = React.createRef();

        this.search = this.search.bind(this);
    }
    public render(): React.ReactElement<{}> {
        return (
            <form onSubmit={this.search} role="search">
                <input
                    ref={this.inputRef}
                    type="search"
                    id="menu_search"
                    aria-label="Rechercher un livre, un tag, ou un type de littérature"
                    placeholder="Rechercher"
                />
                <button>
                    <SVG svg={SearchIcon} title="Lancer la recherche"/>
                </button>
            </form>
        );
    }

    public search(e: any) {
        e.preventDefault();
        const value = this.inputRef.current.value;

        this.props.history.push("/opds/" + (this.props.match.params as any).opdsId + "/search/text/" + value);
    }
}

export default withRouter(SearchForm);
