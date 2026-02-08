import {IEpubCfiParserError} from '../parser/IEpubCfiParserError';
import {IEpubCfiNode} from './IEpubCfiNode';
import {IEpubCfiPathNode} from './IEpubCfiPathNode';

/**
 * The root node of the EPUB CFI AST (Abstract Syntax Tree).
 *
 **/
export declare interface IEpubCfiRootNode extends IEpubCfiNode {
    /**
     * A list of errors that was encountered while parsing the EPUB CFI.
     * An empty list means no errors were encountered.
     */
    errors: IEpubCfiParserError[];

    /**
     * If the EPUB CFI selects a position, it contains the full path from the OCF document to the target node and offset.
     * If the EPUB CFI is a range, it contains the path common for the start and end positions.
     */
    parentPath: IEpubCfiPathNode | null;

    /**
     * If set, it is the path that selects the end point of the range, starting from the end of parentPath.
     */
    rangeEndPath: IEpubCfiPathNode | null;

    /**
     * If set, it is the path that selects the start point of the range, starting from the end of parentPath.
     */
    rangeStartPath: IEpubCfiPathNode | null;

    /**
     * The source EPUB CFI string.
     */
    src: string;

    /**
     * If src was modified due to invalid syntax.
     */
    srcModified: boolean;
}
