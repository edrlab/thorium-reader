import * as React from "react";

import { Publication, getTitleString } from "readium-desktop/common/models/publication";

import { Styles } from "readium-desktop/renderer/components/styles/styles";

import { Cover } from "readium-desktop/renderer/components/Publication/index";

interface IPublicationProps {
    publication: Publication;
    handleCheckboxChange: Function;
}

export default class OpdsListElement extends React.Component<IPublicationProps, null> {
    public render(): React.ReactElement<{}>  {
        const publication: Publication = this.props.publication;

        let image: string = "";
        let authors = "";

        if (publication.cover) {
            image = publication.cover.url;
        }

        if (publication.authors) {
            let i = 0;
            for (let author of publication.authors) {
                if (i > 0) {
                    authors += " & ";
                }
                authors += author.name;
                i++;
            }
        }

        // TODO: should get language from view state? (user preferences)
        const lang = "en";

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
                        <h4 style={Styles.OpdsList.Publication.title}>{getTitleString(publication.title, lang)}</h4>
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
