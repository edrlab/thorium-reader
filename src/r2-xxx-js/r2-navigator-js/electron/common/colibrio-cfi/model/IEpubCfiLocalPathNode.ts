import {IEpubCfiNode} from './IEpubCfiNode.js';
import {IEpubCfiStepNode} from './IEpubCfiStepNode.js';

/**
 * Describes the path to a target node within a document.
 *
 **/
export declare interface IEpubCfiLocalPathNode extends IEpubCfiNode {

    /**
     * If this local path continues after an indirection
     */
    indirection: boolean;

    /**
     * The steps in the order as they are defined in the EPUB CFI string.
     */
    steps: IEpubCfiStepNode[];

}
