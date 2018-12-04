import * as qs from "query-string";

import * as React from "react";

import { Link, RouteComponentProps } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header, { DisplayType } from "../catalog/Header";

import GridView from "readium-desktop/renderer/components/searchResult/GridView";
import ListView from "readium-desktop/renderer/components/searchResult/ListView";

import { Publication } from "readium-desktop/common/models/publication";

import * as styles from "readium-desktop/renderer/assets/styles/searchResult.css";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg";
import SVG from "../utils/SVG";

interface SearchResultProps extends TranslatorProps, RouteComponentProps {
    publications?: Publication[];
    requestCatalog: any;
    findPublicationsByTag: (tag: string) => void;
    findAllPublications: () => void;
}

interface SearResultState {
    title: string;
}

export class SearchResult extends React.Component<SearchResultProps, SearResultState> {
    public constructor(props: SearchResultProps) {
        super(props);

        const parsedResult = qs.parse(this.props.location.search);
        let title: any;

        if (parsedResult.tag) {
            this.props.findPublicationsByTag(parsedResult.tag as string);
            title = parsedResult.tag;
        } else if (parsedResult.search) {
            console.log("search of", parsedResult.search);
            title = parsedResult.search;
        } else {
            this.props.findAllPublications();
            title = "Tous mes livres";
        }

        this.state = {
            title,
        };
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.publications) {
            return (<></>);
        }

        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
                DisplayView = ListView;
                displayType = DisplayType.List;
            }
        }

        return (
            <LibraryLayout>
                <div>
                    <Header displayType={ displayType } />
                    <div className={styles.breadcrumb}>
                        <Link to={{pathname: "/library", search: this.props.location.search}}><
                            SVG svg={ArrowIcon}/>
                        </Link>
                        <Link to={{pathname: "/library", search: this.props.location.search}}>Mes livres</Link>
                        /<span>{this.state.title}</span>
                    </div>
                    <DisplayView publications={ this.props.publications } />
                </div>
            </LibraryLayout>
        );
    }
}

export default withApi(
    SearchResult,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findByTag",
                callProp: "findPublicationsByTag",
                resultProp: "publications",
            },
            {
                moduleId: "publication",
                methodId: "findAll",
                callProp: "findAllPublications",
                resultProp: "publications",
            },
        ],
        refreshTriggers: [
            {
                moduleId: "publication",
                methodId: "import",
            },
            {
                moduleId: "publication",
                methodId: "delete",
            },
            {
                moduleId: "catalog",
                methodId: "addEntry",
            },
            {
                moduleId: "publication",
                methodId: "updateTags",
            },
        ],
    },
);
