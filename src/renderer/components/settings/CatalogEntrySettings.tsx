import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import DragAndDropList from "readium-desktop/renderer/components/utils/DragAndDropList";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { Tag } from "readium-desktop/common/models/tag";

import { addTagRequest, editTagRequest, removeTagRequest } from "readium-desktop/common/redux/actions/catalog";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header from "./Header";

import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as DragableIcon from "readium-desktop/renderer/assets/icons/baseline-drag_handle-24px.svg";

interface Props {
    tagList: Tag[];
    addTag: (name: string) => void;
    removeTag: (id: string) => void;
    editTag: (id: string, name: string) => void;
}

interface States {
    tagList: Tag[],
    entryToUpdate: {
        id: number,
        name: string,
    }
}

export class CatalogEntrySettings extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    private inputRef: any;

    public constructor(props: Props) {
        super(props);

        this.state = {
            tagList: [
                {name: "Manga", count: 857},
                {name: "SF", count: 4},
                {name: "Heroic Fantasy", count: 22},
                {name: "Informatique", count: 13}
            ],
            entryToUpdate: undefined,
        };

        this.inputRef = React.createRef();

        this.handleListOrderChange = this.handleListOrderChange.bind(this);
        this.closeEdit = this.closeEdit.bind(this);
        this.submitEntryEdit = this.submitEntryEdit.bind(this);
        this.changeEditedEntryName = this.changeEditedEntryName.bind(this);
    }

    public componentDidUpdate() {
        if (!this.state.tagList && this.props.tagList) {
            this.setState({tagList: this.props.tagList});
        }

        if (this.state.entryToUpdate) {
            this.inputRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <>
                <LibraryLayout>
                    <Header section={0} />
                    <div className={styles.section_title}>Disposition sur l'écran d'accueil</div>
                    <DragAndDropList
                        elementContent={(tag: Tag, index: number) =>
                            <>
                                <SVG title="ce bloc est déplacable au clic" svg={DragableIcon}/>
                                { this.state.entryToUpdate && this.state.entryToUpdate.id === index ? (
                                    <form onSubmit={this.submitEntryEdit}>
                                        <input
                                            value={this.state.entryToUpdate.name}
                                            onChange={this.changeEditedEntryName}
                                            onBlur={this.closeEdit} ref={this.inputRef}
                                            type="text"
                                        />
                                    </form>
                                ) : tag.name}
                                <span>{tag.count}</span>
                                <button onClick={this.editClick.bind(this, tag, index)}>
                                    <SVG svg={EditIcon}/>
                                </button>
                                <SVG svg={DeleteIcon}/>
                            </>
                        }
                        elementClassName={styles.dnd_element}
                        list={this.state.tagList}
                        id={styles.draggable_list}
                        onChange={this.handleListOrderChange}
                    />
                </LibraryLayout>
            </>
        );
    }

    private handleListOrderChange(list: Tag[]) {
        this.setState({tagList: list});
        this.closeEdit()
    }

    private editClick(entry: Tag, id: number) {
        this.setState({entryToUpdate: {
            id,
            name: entry.name,
        }})
    }

    private closeEdit() {
        this.setState({entryToUpdate: undefined})
    }

    private submitEntryEdit(e: any) {
        e.preventDefault();
        this.closeEdit();
    }

    private changeEditedEntryName(e: any) {
        const editedEntry = this.state.entryToUpdate;
        editedEntry.name = e.target.value;
        this.setState({entryToUpdate: editedEntry});
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

export default connect(mapStateToProps, mapDispatchToProps)(CatalogEntrySettings);
