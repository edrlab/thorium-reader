import {IEpubCfiAssertionNode} from './assertion/IEpubCfiAssertionNode';
import {IEpubCfiNode} from './IEpubCfiNode';

/**
 * Describes a step in an EPUB CFI path.
 * A step normally contains a stepValue identifying a target childNode relative the result of previous step.
 *
 * An assertion can optionally be set on the step, with the purpose of further validating the target element/text for this step.
 *
 */
export declare interface IEpubCfiStepNode extends IEpubCfiNode {

    /**
     * The assertion related with this step.
     */
    assertion: IEpubCfiAssertionNode | null;

    /**
     * The step value describes which child node to select.
     * This number is an even number if it targets an Element. An odd number is used if this step targets a Text node.
     *
     * For more information, see: http://www.idpf.org/epub/linking/cfi/epub-cfi.html#sec-path-child-ref
     */
    stepValue: number;

}
