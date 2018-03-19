import * as React from "react";

import { Publication } from "readium-desktop/common/models/publication";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { Styles } from "readium-desktop/renderer/components/styles";

import { Cover } from "readium-desktop/renderer/components/Publication/index";

interface IPublicationProps {
    publication: Publication;
    handleCheckboxChange: any;
}

export default class OpdsListElement extends React.Component<IPublicationProps, null> {
    public render(): React.ReactElement<{}>  {
        // TODO: should get language from view state? (user preferences)
        const lang = "en";

        const publication: Publication = this.props.publication;

        let image: string = "";
        let authors = "";

        if (publication.cover) {
            image = publication.cover.url;
        }

        if (publication.authors) {
            let i = 0;
            for (const author of publication.authors) {
                if (i > 0) {
                    authors += " & ";
                }
                authors += getMultiLangString(author.name, lang);
                i++;
            }
        }

        return (
            <div style={Styles.OpdsList.body}>
                {publication.cover ? (
                    <img style={Styles.OpdsList.Publication.image} src={publication.cover.url}/>
                ) : (
                    <div style={Styles.OpdsList.Publication.image}>
                        <Cover publication={publication}/>
                    </div>
                )}
                <div style={Styles.OpdsList.Publication.informations}>
                    <div style={Styles.OpdsList.Publication.column}>
                        <h4 style={Styles.OpdsList.Publication.title}>{getMultiLangString(publication.title, lang)}</h4>
                        <p>{authors}</p>
                    </div>
                    <input
                        style={Styles.OpdsList.Publication.checkbox}
                        type="checkbox"
                        onChange={this.props.handleCheckboxChange.bind(this, publication)}/>
                        <p style={Styles.OpdsList.Publication.description}>
                            <span style={Styles.OpdsList.Publication.descriptionInside}>{publication.description}</span>
                        </p>
                </div>
            </div>
        );
    }
}
