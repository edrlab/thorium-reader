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
}



export default class PublicationCardList extends React.Component<IPublicationProps, IPublicationState> {
    constructor() {
        super();
    }

    public render(): React.ReactElement<{}>  {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(
                <PublicationCard key={i}
                    publicationId={i}
                    downloadable={true}
                    publication={this.props.catalog.publications[i]}
                    downloadEPUB={this.props.downloadEPUB}
                    handleRead={this.props.handleRead.bind(this)} />);
        }

        return (
            <div>
                {list}
            </div>
        );
    }
}
