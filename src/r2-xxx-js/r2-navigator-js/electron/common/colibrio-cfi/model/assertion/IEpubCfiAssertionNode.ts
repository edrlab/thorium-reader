import {IEpubCfiNode} from '../IEpubCfiNode';
import {IEpubCfiAssertionParameterNode} from './IEpubCfiAssertionParameterNode';

/**
 * The base type used for assertions.
 */
export declare interface IEpubCfiAssertionNode extends IEpubCfiNode {

    /**
     * All parameters in the assertion.
     */
    parameters: IEpubCfiAssertionParameterNode[],

    /**
     * The values associated with the assertion.
     *
     * When the assertion is attached to a step node targeting an Element and this array is non-empty,
     * then this defines an XML ID assertion.
     *
     * When this assertion is attached to a step node targeting Character data and this array is non-empty,
     * then this defines a Text location assertion.
     */
    values: string[],
}
