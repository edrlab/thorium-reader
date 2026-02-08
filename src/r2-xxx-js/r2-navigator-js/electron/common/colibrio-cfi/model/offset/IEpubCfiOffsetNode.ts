import {IEpubCfiAssertionNode} from '../assertion/IEpubCfiAssertionNode.js';
import {IEpubCfiNode} from '../IEpubCfiNode.js';
import {EpubCfiOffsetType} from './EpubCfiOffsetType.js';

/**
 * The base type for all various EPUB CFI offset types.
 *
 **/
export declare interface IEpubCfiOffsetNode extends IEpubCfiNode {

    /**
     * The assertions associated with the offset if any.
     */
    assertion: IEpubCfiAssertionNode | null;

    /**
     * The type of offset node. Use this value to deduce the correct subtype of this instance.
     */
    type: EpubCfiOffsetType;

}
