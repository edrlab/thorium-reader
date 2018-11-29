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

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

interface Props {
    entries?: CatalogEntryView[];
    updateEntries?: (data: any) => void;
}

interface States {
    entryList: CatalogEntryView[],
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
            entryList: undefined,
            entryToUpdate: undefined,
        };

        this.inputRef = React.createRef();

        this.handleListOrderChange = this.handleListOrderChange.bind(this);
        this.closeEdit = this.closeEdit.bind(this);
        this.submitEntryEdit = this.submitEntryEdit.bind(this);
        this.changeEditedEntryName = this.changeEditedEntryName.bind(this);
    }

    public componentDidUpdate() {
        if (!this.state.entryList && this.props.entries) {
            this.setState({entryList: this.props.entries});
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
                        elementContent={(entry: CatalogEntryView, index: number) =>
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
                                ) : entry.title}
                                <span>{entry.totalCount}</span>
                                <button onClick={this.editClick.bind(this, entry, index)}>
                                    <SVG svg={EditIcon}/>
                                </button>
                                <SVG svg={DeleteIcon}/>
                            </>
                        }
                        elementClassName={styles.dnd_element}
                        list={this.state.entryList}
                        id={styles.draggable_list}
                        onChange={this.handleListOrderChange}
                    />
                </LibraryLayout>
            </>
        );
    }

    private handleListOrderChange(list: CatalogEntryView[]) {
        this.setState({entryList: list});
        this.closeEdit()
    }

    private editClick(entry: CatalogEntryView, id: number) {
        this.setState({entryToUpdate: {
            id,
            name: entry.title,
        }})
    }

    private closeEdit() {
        this.setState({entryToUpdate: undefined})
    }

    private submitEntryEdit(e: any) {
        e.preventDefault();
        this.closeEdit();
        this.props.updateEntries(this.state.entryList);
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
      updateEntries: (data: any) => dispatch(editTagRequest("", "")),
    };
};

export default withApi(
    CatalogEntrySettings,
    {
        moduleId: "catalog",
        methodId: "getEntries",
        dstProp: "entries",
        mapDispatchToProps,
        mapStateToProps,
    }
);
