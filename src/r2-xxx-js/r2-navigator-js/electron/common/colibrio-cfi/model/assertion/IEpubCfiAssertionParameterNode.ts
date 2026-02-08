import {IEpubCfiNode} from '../IEpubCfiNode';

/**
 * Describes a parameter name/value pair inside an assertion.
 */
export declare interface IEpubCfiAssertionParameterNode extends IEpubCfiNode {
    /**
     * The name of the parameter.
     */
    name: string;

    /**
     * The values for the parameter.
     */
    values: string[];
}
