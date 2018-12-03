import * as qs from "query-string";

import * as React from "react";

import { RouteComponentProps } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header, { DisplayType } from "../catalog/Header";

import GridView from "readium-desktop/renderer/components/searchResult/GridView";
import ListView from "readium-desktop/renderer/components/searchResult/ListView";

import { Publication } from "readium-desktop/common/models/publication";

import * as styles from "readium-desktop/renderer/assets/styles/searchResult.css";

import SVG from "../utils/SVG";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg"

interface SearchResultProps extends TranslatorProps, RouteComponentProps {
    publications?: Publication[];
    requestCatalog: any;
    findPublicationsByTag: (tag: string) => void;
    findAllPublications: () => void;
}

export class SearchResult extends React.Component<SearchResultProps, undefined> {
    public componentDidMount() {
        const parsedResult = qs.parse(this.props.location.search);

        console.log(parsedResult);

        if (parsedResult.tag) {
            this.props.findPublicationsByTag(parsedResult.tag as string);
        } else if (parsedResult.search) {
            console.log("search of", parsedResult.search);
        } else {
            this.props.findAllPublications();
        }
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
                    <div className={styles.breadcrumb}> <SVG svg={ArrowIcon}/> <a>Mes Livres</a>/<span>Favoris</span> </div>
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
