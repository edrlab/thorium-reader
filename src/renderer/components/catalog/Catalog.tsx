import * as uuid from "uuid";

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import { apiActions } from "readium-desktop/common/redux/actions";

import { CatalogView, CatalogEntryView } from "readium-desktop/common/views/catalog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import CatalogEntry from "./CatalogEntry";

interface CatalogProps extends TranslatorProps {
    catalog?: CatalogView;
}

export class BaseCatalog extends React.Component<CatalogProps, undefined> {
    public render(): React.ReactElement<{}> {
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

export default withApi(
    BaseCatalog,
    {
        moduleId: "catalog",
        methodId: "get",
        dstProp: "catalog",
    }
);
