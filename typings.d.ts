declare module "*.json" {
    const value: any;
    export default value;
}

declare module "ping";
declare module "redux-electron-store";
declare module "electron-redux";

declare module "react-dropzone/dist";

declare module "react-card-flip";

declare module "pouchdb-adapter-leveldb";
declare module "readium-desktop/pouchdb/jsondown-adapter";

declare module "*.css" {
    interface IClassNames {
        [className: string]: string
    }
    const classNames: IClassNames;
    export = classNames;
}
