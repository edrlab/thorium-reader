import * as uuid from "uuid";

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import { apiActions } from "readium-desktop/common/redux/actions";

import { CatalogView, CatalogEntryView } from "readium-desktop/common/views/catalog";

import CatalogEntry from "./CatalogEntry";

interface CatalogProps {
    apiRequestId?: string;
    catalog?: CatalogView;
    requestCatalog?: any;
    cleanData?: any;
}

export class BaseCatalog extends React.Component<CatalogProps, undefined> {
    @lazyInject("translator")
    private translator: Translator;

    constructor(props: any) {
        super(props);
    }

    public componentDidMount() {
        this.props.requestCatalog();
    }

    public componentWillUnmount() {
        this.props.cleanData();
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        if (!this.props.catalog) {
            return (<></>);
        }

        return (
            <>
                <main id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    {
                        this.props.catalog.entries.map((entry: CatalogEntryView) => {
                            return (<CatalogEntry entry={ entry } />)
                        })
                    }
                </main>
            </>
        );
    }
}


const mapDispatchToProps = (dispatch: any, ownProps: CatalogProps) => {
    const { apiRequestId } = ownProps;

    return {
        requestCatalog: () => {
            dispatch(
                apiActions.buildRequestAction(
                    apiRequestId,
                    "catalog",
                    "get",
                ),
            );
        },
        cleanRequestData: () => {
            dispatch(
                apiActions.clean(apiRequestId),
            );
        },
    };
};

const mapStateToProps = (state: any, ownProps: CatalogProps) => {
    const { apiRequestId } = ownProps;

    let catalog = null;

    if (apiRequestId in state.api.data) {
        catalog = state.api.data[apiRequestId].result;
    }

    return {
        catalog,
    };

};

const Catalog = connect(mapStateToProps, mapDispatchToProps)(BaseCatalog);

(Catalog as any).defaultProps = {
    apiRequestId: uuid.v4(),
};

export default Catalog;
