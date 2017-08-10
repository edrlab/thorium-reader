import * as React from "react";

import { Catalog } from "readium-desktop/models/catalog";
import { OpdsListElement } from "readium-desktop/renderer/components/opds/index";

import { Styles } from "readium-desktop/renderer/components/styles";

interface IPublicationProps {
    catalog: Catalog;
    handleCheckboxChange: Function;
}

export default class OpdsList extends React.Component<IPublicationProps, null> {
    public render(): React.ReactElement<{}>  {
        let list: any = [];
        for (let i = 0; i < this.props.catalog.publications.length; i++) {
            list.push(<OpdsListElement key={i}
                publication={this.props.catalog.publications[i]}
                handleCheckboxChange={this.props.handleCheckboxChange} />);
        }
        return <div style={Styles.OpdsList.list}> {list} </div>;
    }
}
