import * as uuid from "uuid";

import * as qs from "query-string";

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import { RouteComponentProps } from "react-router-dom";

import { apiActions } from "readium-desktop/common/redux/actions";

import { CatalogView, CatalogEntryView } from "readium-desktop/common/views/catalog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import PublicationInfoDialog from "readium-desktop/renderer/components/publication/PublicationInfoDialog";

import Header, { DisplayType } from "./Header";

import GridView from "./GridView";
import ListView from "./ListView";

interface CatalogProps extends TranslatorProps, RouteComponentProps {
    catalog?: CatalogView;
    blur: boolean;
}

export class Catalog extends React.Component<CatalogProps, undefined> {
    public render(): React.ReactElement<{}> {
        if (!this.props.catalog) {
            return (<></>);
        }

        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType == DisplayType.List) {
                DisplayView = ListView;
                displayType = DisplayType.List;
            }
        }

        return (
            <LibraryLayout>
                <div style={ this.props.blur ? {filter: "blur(2px)"} : {} }>
                    <Header displayType={ displayType } />
                    <DisplayView catalogEntries={ this.props.catalog.entries } />
                </div>
                <PublicationInfoDialog />
            </LibraryLayout>
        );
    }
}

export default withApi(
    Catalog,
    {
        moduleId: "catalog",
        methodId: "get",
        dstProp: "catalog",
    }
);
