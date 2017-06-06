import * as React from "react";

import FlatButton   from "material-ui/FlatButton";

interface IReaderNYPLProps {
    manifestURL: string;
    handleRead: Function;
}

export default class ReaderNYPL extends React.Component<IReaderNYPLProps, null> {

    public render(): React.ReactElement<{}>  {
        let url = "../reader-NYPL/index.html?url=" + this.props.manifestURL;

        return (
            <div >
                <div>
                    <FlatButton label="Retour" onClick={() => {this.props.handleRead(); }}/>
                </div>
                <div>
                    <iframe src={url} height="900" width="100%"></iframe>
                </div>
            </div>
        );
    }
}
