import * as React from "react";

import * as windowActions from "readium-desktop/renderer/actions/window";

import { lazyInject } from "readium-desktop/renderer/di";
import { RendererState } from "readium-desktop/renderer/reducers";
import { Store } from "redux";

import FlatButton   from "material-ui/FlatButton";

interface IReaderNYPLProps {
    manifestURL: string;
    handleClose: Function;
}

export default class ReaderNYPL extends React.Component<IReaderNYPLProps, null> {

    @lazyInject("store")
    private store: Store<RendererState>;

    public componentDidMount() {
        this.store.dispatch(windowActions.showReader());
    }

    public render(): React.ReactElement<{}>  {
        let url = "../reader-NYPL/index.html?url=" + this.props.manifestURL;

        return (
            <div >
                <div>
                    <FlatButton label="Retour" onClick={() => {this.props.handleClose(); }}/>
                </div>
                <div>
                    <iframe src={url} height="900" width="100%"></iframe>
                </div>
            </div>
        );
    }
}
