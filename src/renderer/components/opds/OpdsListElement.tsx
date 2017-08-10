import * as React from "react";

import { Publication } from "readium-desktop/models/publication";

import { Styles } from "readium-desktop/renderer/components/styles";

import { Cover } from "readium-desktop/renderer/components/Publication/index";

interface IPublicationProps {
    publication: Publication;
    handleCheckboxChange: Function;
}

export default class OpdsListElement extends React.Component<IPublicationProps, null> {
    public render(): React.ReactElement<{}>  {
        const publication: Publication = this.props.publication;

        let image: string = "";

        if (publication.cover) {
            image = publication.cover.url;
        }

        return (
            <div style={Styles.OpdsList.body}>
                {publication.cover ? (
                    <img style={Styles.OpdsList.image} src={publication.cover.url}/>
                ) : (
                    <div style={Styles.OpdsList.image}>
                        <Cover publication={publication}/>
                    </div>
                )}
                <div style={Styles.OpdsList.description}>
                    <div style={Styles.OpdsList.column}>
                        <h4 style={Styles.OpdsList.title}>{publication.title}</h4>
                    </div>
                    <div style={Styles.OpdsList.column}>
                        <input type="checkbox" onChange={this.props.handleCheckboxChange.bind(this, publication)}/>
                    </div>
                </div>
            </div>
        );
    }
}
