import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import Header from "readium-desktop/renderer/components/Header";
import SettingsHeader from "readium-desktop/renderer/components/settings/SettingsHeader";
import DragAndDropList from "readium-desktop/renderer/components/utils/DragAndDropList";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { Tag } from "readium-desktop/common/models/tag";

import { addTagRequest, editTagRequest, removeTagRequest } from "readium-desktop/common/redux/actions/catalog";

import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as DragableIcon from "readium-desktop/renderer/assets/icons/baseline-drag_handle-24px.svg";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";

interface Props {
    tagList: Tag[];
    addTag: (name: string) => void;
    removeTag: (id: string) => void;
    editTag: (id: string, name: string) => void;
}

interface States {
    addTagName: string;
    editTagId: string;
    editTagName: string;
}

export class SettingsTags extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: Props) {
        super(props);

        this.state = {
            addTagName: "",
            editTagId: "",
            editTagName: "",
        };

        this.handleAddSubmit = this.handleAddSubmit.bind(this);
        this.handleAddTagNameChange = this.handleAddTagNameChange.bind(this);
        this.handleEditIdChange = this.handleEditIdChange.bind(this);
        this.handleEditNameChange = this.handleEditNameChange.bind(this);
        this.handleEditSubmit = this.handleEditSubmit.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <>
                <Header activePage={2}/>
                <SettingsHeader section={0} />
                <main id={styles.main} role="main">
                    <a id={styles.contenu} tabIndex={-1}></a>
                    <div className={styles.section_title}>Disposition sur l'écran d'accueil</div>
                    <DragAndDropList
                        elementContent={(tag: Tag) =>
                            <>
                                <SVG title="ce bloc est déplacable au clic" svg={DragableIcon}/>
                                {tag.name}
                                <span>{tag.count}</span>
                                <SVG svg={DeleteIcon}/>
                            </>
                        }
                        list={this.props.tagList}
                        id={styles.draggable_list}
                    />
                    <form onSubmit={this.handleAddSubmit} id={styles.tag_add}>
                        <input
                            type="text"
                            value={this.state.addTagName}
                            className={styles.pref_tag_inputs}
                            placeholder="Ajouter un tag"
                            title="Ajouter un tag"
                            onChange={this.handleAddTagNameChange}
                        />
                    </form>
                    <div className={styles.section_title}>Renommer un tag</div>
                    <form onSubmit={this.handleEditSubmit} id={styles.tag_add}>
                        <input
                            type="search"
                            className={styles.pref_tag_inputs}
                            placeholder="Tag à renommer"
                            title="Tag à renommer"
                            onChange={this.handleEditIdChange}
                        />
                        <SVG svg={SearchIcon}/>
                        <input
                            type="text"
                            className={styles.pref_tag_inputs}
                            placeholder="Nouveau nom"
                            title="nouveau nom"
                            onChange={this.handleEditNameChange}
                        />
                        <input type="submit" title="Confirmer" />
                    </form>
                </main>
            </>
        );
    }

    private handleAddTagNameChange(e: any) {
        this.setState({
            addTagName: e.target.value,
        });
    }

    private handleAddSubmit(e: any) {
        e.preventDefault();
        this.props.addTag(this.state.addTagName);
    }

    private handleEditIdChange(e: any) {
        this.setState({
            editTagId: e.target.value,
        });
    }

    private handleEditNameChange(e: any) {
        this.setState({
            editTagName: e.target.value,
        });
    }

    private handleEditSubmit(e: any) {
        e.preventDefault();
        this.props.addTag(this.state.addTagName);
    }
}

const mapStateToProps = (state: any) => {
    return {
        tagList: state.catalog.tagList,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
      addTag: (name: string) => dispatch(addTagRequest(name)),
      removeTag: (id: string) => dispatch(removeTagRequest(id)),
      editTag: (id: string, name: string) => dispatch(editTagRequest(id, name)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTags);
