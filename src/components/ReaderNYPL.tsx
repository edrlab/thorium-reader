import * as React from "react";

interface IDownload {
    link: string;
    progress: number;
}

export default class ReaderNYPL extends React.Component<null, null> {

    public render(): React.ReactElement<{}>  {
        let url = "../reader-NYPL/index.html?url=https://readium2.herokuapp.com/pub/L2FwcC9jaGlsZHJlbnMtbGl0ZXJhdHVyZS5lcHVi/manifest.json";

        return (
            <div >
                <iframe src={url} height="900" width="1600"></iframe>
            </div>
        );
    }
}

