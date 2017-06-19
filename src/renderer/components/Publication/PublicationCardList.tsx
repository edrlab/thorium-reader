import * as React from "react";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard } from "readium-desktop/renderer/components/Publication/index";

import LazyLoad from "react-lazyload";

import "./placeholder.css";

interface IPublicationState {
    isFlipped: boolean;
}

interface IPublicationProps {
    catalog: Catalog;
    downloadEPUB: Function;
    downloadable: boolean;
    handleRead: Function;
    cancelDownload: Function;
}

export default class PublicationCardList extends React.Component<IPublicationProps, IPublicationState> {
    constructor() {
        super();
    }

    public render(): React.ReactElement<{}>  {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(
                <LazyLoad offset={400} height={400} key={i}>
                    <PublicationCard
                        publicationId={i}
                        downloadable={true}
                        publication={this.props.catalog.publications[i]}
                        downloadEPUB={this.props.downloadEPUB}
                        handleRead={this.props.handleRead.bind(this)}
                        cancelDownload={this.props.cancelDownload} />
                </LazyLoad>,
            );
        }

        return (
            <div>
                {list}
            </div>
        );
    }
}
