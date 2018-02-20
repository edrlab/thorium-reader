import * as React from "react";

import { Publication } from "readium-desktop/common/models/publication";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { Styles } from "readium-desktop/renderer/components/styles";

import { Contributor } from "readium-desktop/common/models/contributor";

interface ICoverProps {
    publication: Publication;
}

export default class Cover extends React.Component<ICoverProps, null> {
    public render(): React.ReactElement<{}>  {
        // TODO: should get language from view state? (user preferences)
        const lang = "en";

        if (this.props.publication.cover === null || this.props.publication.cover === undefined) {
            let authors = "";
            let bodyCSS = Object.assign({}, Styles.BookCover.body);
            let colors = this.props.publication.customCover;
            if (colors === undefined) {
                colors = {
                    topColor: "#d18e4b",
                    bottomColor: "#7c4c1c",
                };
            }
            bodyCSS.backgroundImage = "linear-gradient(" + colors.topColor + ", " + colors.bottomColor + ")";

            for (let author of this.props.publication.authors) {
                let newAuthor: Contributor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += getMultiLangString(newAuthor.name, lang);
            }

            return (
                <div style={bodyCSS}>
                    <div style={Styles.BookCover.box}>
                        <p style={Styles.BookCover.title}>{getMultiLangString(this.props.publication.title, lang)}</p>
                        <p style={Styles.BookCover.author}>{authors}</p>
                    </div>
                </div>
            );
        } else {
            return <img src={this.props.publication.cover.url}/>;
        }
    }
}
