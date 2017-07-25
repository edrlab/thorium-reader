import * as React from "react";

import { Catalog } from "readium-desktop/models/catalog";
import { OpdsListElement } from "readium-desktop/renderer/components/Publication/index";

import { Styles } from "readium-desktop/renderer/components/styles";

interface IPublicationProps {
    catalog: Catalog;
    downloadEPUB: Function;
    handleCheckboxChange: Function;
}

export default class OpdsList extends React.Component<IPublicationProps, null> {
    public render(): React.ReactElement<{}>  {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(<OpdsListElement key={i}
                publication={this.props.catalog.publications[i]}
                downloadEPUB={this.props.downloadEPUB.bind(this)}
                handleCheckboxChange={this.props.handleCheckboxChange} />);
        }
        return <div style={Styles.OpdsList.list}> {list} </div>;
    }
}
