import * as React from "react";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/models/publication";

import { Translator }   from "readium-desktop/i18n/translator";

import { Styles } from "readium-desktop/renderer/components/styles";

interface IPublicationProps {
    publication: Publication;
    downloadEPUB: Function;
    createCover: Function;
    handleCheckboxChange: Function;
}

export default class OpdsListElement extends React.Component<IPublicationProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;

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
                        {this.props.createCover(this.props.publication)}
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
