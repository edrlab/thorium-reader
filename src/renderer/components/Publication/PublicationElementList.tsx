import * as React from "react";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

import LazyLoad from "react-lazyload";

interface IPublicationProps {
    catalog: Catalog;
    downloadEPUB: Function;
    handleRead: Function;
}

interface IDownload {
    link: string;
    progress: number;
}

const styles = {
    BookListElement: {
        body: {
            boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px",
            fontFamily: "Roboto, sans-serif",
            margin: "5px 0px",
            width: "1200px",
        },
        column: {
            display: "inline-block",
            width: "250px",
        },
        container: {
            display: "inline-block",
            maxWidth: 1200,
            textAlign: "left",
        },
        description: {
            display: "inline-block",
            height: 140,
            marginLeft: "5px",
        },
        image: {
            display: "inline-block",
            float: "left",
            height: 140,
            width: 91,
        },
        title: {
            margin: "10px 0px",
        },
    },
};

export default class PublicationElementList extends React.Component<IPublicationProps, null> {
    public render(): React.ReactElement<{}>  {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(
                    <PublicationListElement key={i}
                        publication={this.props.catalog.publications[i]}
                        publicationId={i}
                        downloadEPUB={this.props.downloadEPUB}
                        handleRead={this.props.handleRead.bind(this)} />
            );
        }
        return (
            <div style={styles.BookListElement.container}>
                {list}
            </div>
        );
    }
}
