import {DomUtils} from '../common/DomUtils';
import {isElement, isTextNode} from '../common/Utils';
import {EpubCfiUtils} from '../EpubCfiUtils';
import {IEpubCfiLocalPathNode} from '../model/IEpubCfiLocalPathNode';
import {IEpubCfiStepNode} from '../model/IEpubCfiStepNode';
import {EpubCfiIntendedTargetType} from './EpubCfiIntendedTargetType';
import {EpubCfiResolvedLocalPath} from './EpubCfiResolvedLocalPath';
import {EpubCfiResolvedPath} from './EpubCfiResolvedPath';
import {EpubCfiResolverErrorType} from './EpubCfiResolverErrorType';
import {EpubCfiVirtualTarget} from './EpubCfiVirtualTarget';

/**
 * Resolves all element steps and text steps in an IEpubCfiLocalPathNode.
 * Does not process offsets.
 *
 * Use one of the static methods createParentPathResolver() or createRangePathResolver() to create a new instance.
 */
export class EpubCfiLocalPathResolver {

    /**
     * The current element we have resolved into.
     */
    protected currentTargetNode: Node;

    protected constructor(
        protected localPathNode: IEpubCfiLocalPathNode,
        protected localPath: EpubCfiResolvedLocalPath,
        startNode: Node,
    ) {
        this.currentTargetNode = startNode;
    }

    /**
     * Creates a new instance to be used for resolving a local path of an EPUB CFI, starting from the specified element.
     *
     * @param pathNode - The path AST node
     * @param startElement - The start element where the resolver should start. Must be the root <package> element from an OPF.
     * @param documentUrl - The path to the OPF document. Will be passed to the indirection resolver.
     */
    static createResolverFromElement(
        pathNode: IEpubCfiLocalPathNode,
        startElement: Element,
        documentUrl: URL,
    ): EpubCfiLocalPathResolver {
        const parentPath = new EpubCfiResolvedLocalPath(
            pathNode,
            documentUrl,
            startElement.parentNode!,
            DomUtils.getNodeIndex(startElement),
            EpubCfiIntendedTargetType.ELEMENT,
            null,
        );
        return new EpubCfiLocalPathResolver(pathNode, parentPath, startElement);
    }

    /**
     * Creates a new instance to be used for resolving a local path, continuing from a range component of an EPUB CFI.
     *
     * @param pathNode - The path AST node
     * @param parentPath - The resolved EpubCfiPath for the parentPath.
     */
    static createResolverFromExistingPath(
        pathNode: IEpubCfiLocalPathNode,
        parentPath: EpubCfiResolvedPath,
    ): EpubCfiLocalPathResolver {
        const path = new EpubCfiResolvedLocalPath(
            pathNode,
            parentPath.documentUrl,
            parentPath.container,
            parentPath.offset,
            parentPath.intendedTargetType,
            parentPath.virtualTarget,
        );

        return new EpubCfiLocalPathResolver(pathNode, path, path.getTargetNode() || path.container);
    }

    /**
     * Resolves this path
     */
    resolve(): EpubCfiResolvedLocalPath {

        const steps = this.localPathNode.steps;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (EpubCfiUtils.isElementStepNode(step)) {
                this.resolveElementStep(step);
            } else {
                this.resolveTextStep(step);
            }
        }

        if (this.localPath.virtualTarget) {
            this.localPath.container = this.currentTargetNode;
            if (this.localPath.virtualTarget === EpubCfiVirtualTarget.FIRST_CHILD) {
                this.localPath.offset = 0;
            } else {
                this.localPath.offset = this.currentTargetNode.childNodes.length;
            }
        } else {
            this.localPath.container = this.currentTargetNode.parentNode!;
            this.localPath.offset = DomUtils.getNodeIndex(this.currentTargetNode);
        }

        return this.localPath;
    }

    protected processElementStepValue(currentTargetElement: Element, step: IEpubCfiStepNode): void {
        const elementIndex = (step.stepValue / 2) - 1;
        const children = currentTargetElement.children;
        const childElementCount = children.length;

        if (elementIndex >= 0 && elementIndex < childElementCount) {
            this.currentTargetNode = children[elementIndex];
        } else {
            if (elementIndex < 0) {
                this.localPath.virtualTarget = EpubCfiVirtualTarget.FIRST_CHILD;
            } else {
                this.localPath.virtualTarget = EpubCfiVirtualTarget.LAST_CHILD;
                if (elementIndex !== childElementCount) {
                    this.localPath.createResolverError(EpubCfiResolverErrorType.STEP_VALUE_OUT_OF_BOUNDS, currentTargetElement, step);
                    this.localPath.stepsResolved = false;
                }
            }
        }
    }

    protected processTextStepValue(currentTargetElement: Element, step: IEpubCfiStepNode): void {
        const elementBeforeIndex = (step.stepValue >> 1) - 1;

        if (elementBeforeIndex < currentTargetElement.childElementCount) {

            let childNodeIndex;

            if (elementBeforeIndex === -1) {
                childNodeIndex = 0;
            } else {
                let elementBefore = currentTargetElement.children[elementBeforeIndex];
                childNodeIndex = DomUtils.getNodeIndex(elementBefore) + 1;
            }

            if (childNodeIndex < currentTargetElement.childNodes.length) {

                const targetNode: Node | null = currentTargetElement.childNodes[childNodeIndex];
                let currentNode: Node | null = targetNode;
                let textNode: Node | undefined;
                while (!textNode && currentNode && !isElement(currentNode)) {
                    if (isTextNode(currentNode)) {
                        textNode = currentNode;
                    }
                    currentNode = currentNode.nextSibling;
                }
                this.currentTargetNode = textNode || targetNode;

            } else {
                this.localPath.virtualTarget = elementBeforeIndex === -1 ?
                    EpubCfiVirtualTarget.FIRST_CHILD :
                    EpubCfiVirtualTarget.LAST_CHILD;
            }

        } else {
            this.localPath.virtualTarget = EpubCfiVirtualTarget.LAST_CHILD;
            this.localPath.createResolverError(EpubCfiResolverErrorType.STEP_VALUE_OUT_OF_BOUNDS, currentTargetElement, step);
            this.localPath.stepsResolved = false;
        }
    }

    /**
     * Processes the step's assertion if any.
     *
     * @return true if the currentElement was changed because of the assertion, false otherwise
     */
    protected processXmlIdAssertion(step: IEpubCfiStepNode): boolean {
        // Check Element assertion
        let result = false;
        const currentElement = this.currentTargetNode;
        const assertion = step.assertion;

        if (assertion && assertion.values.length === 1) {
            if (this.localPath.virtualTarget !== null || !isElement(currentElement) || currentElement.id !== assertion.values[0]) {
                // Uh-oh, we need to find the element by id!
                let resolvedElement = currentElement.ownerDocument!.getElementById(assertion.values[0]);
                if (resolvedElement && (currentElement.nodeName !== 'itemref' || resolvedElement.nodeName === 'itemref')) {
                    this.currentTargetNode = resolvedElement;
                    this.localPath.repairedWithXmlIdAssertions = true;
                    this.localPath.virtualTarget = null;
                    result = true;
                } else {
                    this.localPath.createResolverError(EpubCfiResolverErrorType.XML_ID_ASSERTION_FAILED, currentElement, assertion);
                }
            }
        } else if (this.localPath.virtualTarget === null && isElement(currentElement) && currentElement.id) {
            this.localPath.missingXmlIdAssertions = true;
        }

        return result;
    }

    protected resolveElementStep(step: IEpubCfiStepNode): void {
        this.localPath.intendedTargetType = EpubCfiIntendedTargetType.ELEMENT;
        if (this.localPath.virtualTarget) {
            if (this.processXmlIdAssertion(step)) {
                // We have recovered!
                this.localPath.stepsResolved = true;
                this.localPath.virtualTarget = null;
            }
        } else if (isElement(this.currentTargetNode)) {
            this.processElementStepValue(this.currentTargetNode, step);
            this.processXmlIdAssertion(step);
        }
    }

    protected resolveTextStep(step: IEpubCfiStepNode): void {
        this.localPath.intendedTargetType = EpubCfiIntendedTargetType.TEXT;
        if (!this.localPath.virtualTarget && isElement(this.currentTargetNode)) {
            this.processTextStepValue(this.currentTargetNode, step);
        }
    }

}
