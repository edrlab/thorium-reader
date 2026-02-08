import {EpubCfiOffsetType} from './EpubCfiOffsetType.js';
import {IEpubCfiOffsetNode} from './IEpubCfiOffsetNode.js';

/**
 * Describes a character offset within a EPUB CFI text step.
 *
 **/
export declare interface IEpubCfiCharacterOffsetNode extends IEpubCfiOffsetNode {

    /**
     * The character offset within the text node.
     */
    characterOffset: number;

    type: EpubCfiOffsetType.CHARACTER;
}
