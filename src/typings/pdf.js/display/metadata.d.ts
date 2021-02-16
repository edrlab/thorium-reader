export class Metadata {
    constructor(data: any);
    _metadataMap: Map<any, any>;
    _data: any;
    _repair(data: any): any;
    _getSequence(entry: any): any;
    _getCreators(entry: any): boolean;
    _parse(xmlDocument: any): void;
    getRaw(): any;
    get(name: any): any;
    getAll(): any;
    has(name: any): boolean;
}
