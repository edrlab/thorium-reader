import {isDocument, isElement} from '../common/Utils';
import {IEpubCfiLocalPathNode} from '../model/IEpubCfiLocalPathNode';
import {EpubCfiIntendedTargetType} from './EpubCfiIntendedTargetType';
import {EpubCfiResolverErrorType} from './EpubCfiResolverErrorType';
import {EpubCfiVirtualTarget} from './EpubCfiVirtualTarget';
import {IEpubCfiResolverError} from './IEpubCfiResolverError';

export class EpubCfiResolvedLocalPath {

    ast: IEpubCfiLocalPathNode | null;
    /**
     * The parent node that contains the target. This can be a document node if the root element is the target node.
     */
    container: Node;
    documentUrl: URL;
    /**
     * If this path intends to target an element or text
     */
    intendedTargetType: EpubCfiIntendedTargetType;
    isOpfDocument: boolean;
    /**
     * Number of XML ids encountered on elements that were not defined in the AST/epubcfi.
     */
    missingXmlIdAssertions: boolean = false;
    /**
     * The childNode offset into container
     */
    offset: number;
    /**
     * Number of XML id assertions used to get to the intended location.
     */
    repairedWithXmlIdAssertions: boolean = false;
    /**
     * A list of errors that occured while this path was resolved.
     */
    resolverErrors: IEpubCfiResolverError[] = [];
    /**
     * If all steps could be resolved with their step value and offset, or repaired with their assertion.
     */
    stepsResolved: boolean = true;
    /**
     * If this path uses a virtual target, targeting the first or the last child.
     */
    virtualTarget: EpubCfiVirtualTarget | null;

    constructor(
        ast: IEpubCfiLocalPathNode | null,
        documentUrl: URL,
        container: Node,
        offset: number,
        intendedTargetType: EpubCfiIntendedTargetType,
        virtualTarget: EpubCfiVirtualTarget | null,
    ) {
        this.ast = ast;
        this.documentUrl = documentUrl;
        this.container = container;
        this.offset = offset;
        this.isOpfDocument = this.getDocument().documentElement.nodeName === 'package';
        this.intendedTargetType = intendedTargetType;
        this.virtualTarget = virtualTarget;
    }

    createResolverError(type: EpubCfiResolverErrorType, node: Node, errorData: any): void {
        this.resolverErrors.push({
            type: type,
            documentUrl: this.documentUrl,
            node: node,
            errorData: errorData,
        });
    }

    getDocument(): Document {
        return isDocument(this.container) ? this.container : this.container.ownerDocument!;
    }

    /**
     * Get the target Element, if the intended target was en element and it is not the virtual first or virtual last element.
     */
    getTargetElement(): Element | null {
        if (this.intendedTargetType === EpubCfiIntendedTargetType.ELEMENT && this.virtualTarget === null && (isElement(this.container) || isDocument(this.container))) {
            let targetElement: Node = this.container.childNodes[this.offset];
            return isElement(targetElement) ? targetElement : null;
        }
        return null;
    }

    /**
     * Get the target node for this local path, unless the target is a virtual Target in which case the container is returned instead.
     */
    getTargetNode(): Node | null {
        let targetNode: Node | null = null;
        if (this.virtualTarget === null) {
            if (isElement(this.container) || isDocument(this.container)) {
                targetNode = this.container.childNodes[this.offset];
            } else {
                targetNode = this.container;
            }
        }
        return targetNode;
    }
}
