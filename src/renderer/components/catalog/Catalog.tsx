import * as uuid from "uuid";

import * as qs from "query-string";

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { connect } from "react-redux";

import { RouteComponentProps } from "react-router-dom";

import { RootState } from "readium-desktop/renderer/redux/states";

import { apiActions } from "readium-desktop/common/redux/actions";

import { CatalogView, CatalogEntryView } from "readium-desktop/common/views/catalog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header, { DisplayType } from "./Header";

import GridView from "./GridView";
import ListView from "./ListView";

interface CatalogProps extends TranslatorProps, RouteComponentProps {
    catalog?: CatalogView;
    refresh?: boolean;
    blur: boolean;
    requestCatalog: any;
}

export class Catalog extends React.Component<CatalogProps, undefined> {
    public render(): React.ReactElement<{}> {
        if (this.props.refresh) {
            this.props.requestCatalog();
        }

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
            </LibraryLayout>
        );
    }
}

const refreshTriggerActions = [
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
];

const mapStateToProps = (state: RootState, ownProps: any) => {
    let refresh = false;

    if (state.api.lastSuccessAction) {
        const meta = state.api.lastSuccessAction.meta.api;

        const lastAction = {
            moduleId: meta.moduleId,
            methodId: meta.methodId,
        };

        for (const triggerAction of refreshTriggerActions) {
            if (
                triggerAction.moduleId == lastAction.moduleId
                && triggerAction.methodId == lastAction.methodId
            ) {
                refresh = true;
                break;
            }
        }
    }

    return {
        refresh,
    };
};

export default withApi(
    Catalog,
    {
        operations: [
            {
                moduleId: "catalog",
                methodId: "get",
                callProp: "requestCatalog",
                resultProp: "catalog",
                onLoad: true,
            },
        ],
        mapStateToProps,
    },
);
