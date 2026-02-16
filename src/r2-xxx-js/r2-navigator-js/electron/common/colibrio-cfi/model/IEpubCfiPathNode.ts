import {IEpubCfiLocalPathNode} from './IEpubCfiLocalPathNode';
import {IEpubCfiNode} from './IEpubCfiNode';
import {EpubCfiOffsetNode} from './offset/EpubCfiOffsetNode';

/**
 * Describes a full parent path, range start, or range end path.
 *
 **/
export declare interface IEpubCfiPathNode extends IEpubCfiNode {
    /**
     * If this path was completely parsed to the end.
     * Can be false if an unexpected token was found while parsing the path.
     */
    complete: boolean;

    /**
     * The local paths that are part of this path.
     */
    localPaths: IEpubCfiLocalPathNode[];

    /**
     * The terminal offset of this path.
     */
    offset: EpubCfiOffsetNode | null;
}
