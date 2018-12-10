import * as qs from "query-string";

import * as React from "react";

import { RouteComponentProps } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header, { DisplayType } from "../catalog/Header";

import GridView from "readium-desktop/renderer/components/utils/GridView";
import ListView from "readium-desktop/renderer/components/utils/ListView";

import { Publication } from "readium-desktop/common/models/publication";

import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";

interface TextSearchResultProps extends TranslatorProps, RouteComponentProps {
    publications?: Publication[];
}

export class TagSearchResult extends React.Component<TextSearchResultProps, undefined> {
    public render(): React.ReactElement<{}> {
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;

        const title = (this.props.match.params as any).value;

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
                    <BreadCrumb
                        search={this.props.location.search}
                        breadcrumb={[{name: "Mes livres", path: "/library"}, {name: title as string}]}
                    />
                    { this.props.publications ?
                        <DisplayView publications={ this.props.publications } />
                    : <></>}
                </div>
            </LibraryLayout>
        );
    }
}

const buildSearchRequestData = (props: TextSearchResultProps): any => {
    return {
        tag: (props.match.params as any).value,
    };
};

export default withApi(
    TagSearchResult,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findByTag",
                buildRequestData: buildSearchRequestData,
                resultProp: "publications",
                onLoad: true,
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
