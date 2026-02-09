import {ArrayUtils} from '../common/ArrayUtils';
import {DomUtils} from '../common/DomUtils';
import {isDocument, isDocumentFragment, isElement, isString} from '../common/Utils';
import {IEpubCfiAssertionNode} from '../model/assertion/IEpubCfiAssertionNode';
import {IEpubCfiLocalPathNode} from '../model/IEpubCfiLocalPathNode';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {EpubCfiParser} from '../parser/EpubCfiParser';
import {EpubCfiIntendedTargetType} from './EpubCfiIntendedTargetType';
import {EpubCfiLocalPathResolver} from './EpubCfiLocalPathResolver';
import {EpubCfiPathType} from './EpubCfiPathType';
import {EpubCfiResolvedLocalPath} from './EpubCfiResolvedLocalPath';
import {EpubCfiResolvedPath} from './EpubCfiResolvedPath';
import {EpubCfiResolvedTarget} from './EpubCfiResolvedTarget';
import {EpubCfiResolverErrorType} from './EpubCfiResolverErrorType';
import {EpubCfiSideBias} from './EpubCfiSideBias';
import {IEpubCfiIndirectionResult} from './indirection/IEpubCfiIndirectionResult';
import {EpubCfiOffsetProcessor} from './offset/EpubCfiOffsetProcessor';

/**
 * Used for resolving an EPUB CFI against XML-based documents.
 */
export class EpubCfiResolver {
    private _lastIndirectionElement: Element | null = null;
    private _offsetProcessor = new EpubCfiOffsetProcessor();
    private _parentLocalPathIndex = 0;
    private _parentOffsetHandled = false;
    private _parentPathNode: IEpubCfiPathNode | null;
    private _rangeEndLocalPathIndex = 0;
    private _rangeEndOffsetHandled = false;
    private _rangeEndPathNode: IEpubCfiPathNode | null;
    private _rangeStartLocalPathIndex = 0;
    private _rangeStartOffsetHandled = false;
    private _rangeStartPathNode: IEpubCfiPathNode | null;
    private _resolvedTarget: EpubCfiResolvedTarget;
    private _rootNode: IEpubCfiRootNode;

    constructor(epubCfi: string | IEpubCfiRootNode) {
        let rootNode = isString(epubCfi) ? EpubCfiParser.parse(epubCfi) : epubCfi;

        this._rootNode = rootNode;
        this._parentPathNode = rootNode.parentPath;
        this._rangeStartPathNode = rootNode.rangeStartPath;
        this._rangeEndPathNode = rootNode.rangeEndPath;
        this._resolvedTarget = new EpubCfiResolvedTarget(rootNode);
    }

    continueResolving(targetNode: Element | Document, documentUrl: URL): IEpubCfiIndirectionResult | null {
        let targetElement: Element | null = null;

        if (isDocument(targetNode)) {
            targetElement = targetNode.documentElement;
        } else if (isDocumentFragment(targetNode) && isElement(targetNode.firstChild)) {
            targetElement = targetNode.firstChild;
        } else if (isElement(targetNode) && targetNode.parentNode) {
            targetElement = targetNode;
        }

        if (!targetElement) {
            this._resolvedTarget.indirectionErrors.push({
                from: this._lastIndirectionElement,
                fromPath: this.getNextIndirectionResult()?.documentUrl || null,
                target: targetElement,
                targetPath: documentUrl,
            });
            return null;
        }

        if (this._parentPathNode) {
            const resolvedPath = this.resolveNextLocalPathFromStartElement(EpubCfiPathType.PARENT, targetElement, documentUrl);
            this.continueResolvingFromParentPath(resolvedPath, documentUrl);

        } else if (this._rangeStartPathNode) {
            const resolvedPath = this.resolveNextLocalPathFromStartElement(EpubCfiPathType.RANGE_START, targetElement, documentUrl);
            this.continueResolvingRangeStartPath(resolvedPath, documentUrl);

        } else if (this._rangeEndPathNode) {
            const resolvedPath = this.resolveNextLocalPathFromStartElement(EpubCfiPathType.RANGE_END, targetElement, documentUrl);
            this.continueResolvingRangeEndPath(resolvedPath, documentUrl);
        }

        const indirectionResult = this.getNextIndirectionResult();
        this.maybeProcessOffsetsAndSideBias();
        return indirectionResult;
    }

    getResolvedTarget(): EpubCfiResolvedTarget {
        return this._resolvedTarget;
    }

    skipNextIndirection(): IEpubCfiIndirectionResult | null {
        this.handleUnresolvableIndirection();
        const result = this.getNextIndirectionResult();
        this.maybeProcessOffsetsAndSideBias();
        return result;
    }

    private addResolvedLocalPath(pathType: EpubCfiPathType, localPath: EpubCfiResolvedLocalPath): EpubCfiResolvedPath {

        let resolvedPath = this.getResolvedPathFromType(pathType);
        if (resolvedPath) {
            resolvedPath.addResolvedLocalPath(localPath);
            resolvedPath.indirectionsResolved = true; // Indirection check performed in continueResolvingXxx() methods
        } else {
            switch (pathType) {
                case EpubCfiPathType.PARENT:
                    resolvedPath = this._resolvedTarget.parentPath = new EpubCfiResolvedPath(this._rootNode.parentPath!, localPath);
                    break;

                case EpubCfiPathType.RANGE_START:
                    resolvedPath = this._resolvedTarget.rangeStartPath = new EpubCfiResolvedPath(this._rootNode.rangeStartPath!, localPath);
                    break;

                case EpubCfiPathType.RANGE_END:
                    resolvedPath = this._resolvedTarget.rangeEndPath = new EpubCfiResolvedPath(this._rootNode.rangeEndPath!, localPath);
                    break;
                default:
                    throw new Error(EpubCfiResolverErrorType.INVALID_PATH_TYPE);
            }
        }

        return resolvedPath;
    }

    private consumeNextLocalPath(pathType: EpubCfiPathType): IEpubCfiLocalPathNode | null {
        let result: IEpubCfiLocalPathNode | null = null;
        switch (pathType) {
            case EpubCfiPathType.PARENT:
                if (this._parentPathNode) {
                    result = this.getLocalPathByIndex(this._parentPathNode, this._parentLocalPathIndex++);
                    if (!this.getLocalPathByIndex(this._parentPathNode, this._parentLocalPathIndex)) {
                        this._parentPathNode = null;
                    }
                }
                break;

            case EpubCfiPathType.RANGE_START:
                if (this._rangeStartPathNode) {
                    result = this.getLocalPathByIndex(this._rangeStartPathNode, this._rangeStartLocalPathIndex++);
                    if (!this.getLocalPathByIndex(this._rangeStartPathNode, this._rangeStartLocalPathIndex)) {
                        this._rangeStartPathNode = null;
                    }
                }
                break;

            case EpubCfiPathType.RANGE_END:
                if (this._rangeEndPathNode) {
                    result = this.getLocalPathByIndex(this._rangeEndPathNode, this._rangeEndLocalPathIndex++);
                    if (!this.getLocalPathByIndex(this._rangeEndPathNode, this._rangeEndLocalPathIndex)) {
                        this._rangeEndPathNode = null;
                    }
                }
                break;
        }
        return result;
    }

    private continueResolvingFromParentPath(resolvedParentPath: EpubCfiResolvedPath, documentUrl: URL): void {
        while (this._parentPathNode) {
            if (this.hasNextLocalPathIndirection(EpubCfiPathType.PARENT)) {
                if (this._resolvedTarget.parentPath) {
                    this._resolvedTarget.parentPath.indirectionsResolved = false;
                }
                return;
            }
            this.resolveNextLocalPathFromResolvedPath(EpubCfiPathType.PARENT, resolvedParentPath, documentUrl);
        }

        // We can now continue resolve start and end paths
        this.continueResolvingRangeStartPath(resolvedParentPath, documentUrl);
        this.continueResolvingRangeEndPath(resolvedParentPath, documentUrl);
    }

    private continueResolvingRangeEndPath(resolvedPath: EpubCfiResolvedPath, documentUrl: URL): void {
        while (this._rangeEndPathNode) {
            if (this.hasNextLocalPathIndirection(EpubCfiPathType.RANGE_END)) {
                if (this._resolvedTarget.rangeEndPath) {
                    this._resolvedTarget.rangeEndPath.indirectionsResolved = false;
                }
                return;
            }
            resolvedPath = this.resolveNextLocalPathFromResolvedPath(EpubCfiPathType.RANGE_END, resolvedPath, documentUrl);
        }
    }

    private continueResolvingRangeStartPath(resolvedPath: EpubCfiResolvedPath, documentUrl: URL): void {
        while (this._rangeStartPathNode) {
            if (this.hasNextLocalPathIndirection(EpubCfiPathType.RANGE_START)) {
                if (this._resolvedTarget.rangeStartPath) {
                    this._resolvedTarget.rangeStartPath.indirectionsResolved = false;
                }
                return;
            }
            resolvedPath = this.resolveNextLocalPathFromResolvedPath(EpubCfiPathType.RANGE_START, resolvedPath, documentUrl);
        }
    }

    private getLocalPathByIndex(pathNode: IEpubCfiPathNode, index: number): IEpubCfiLocalPathNode | null {
        return index < pathNode.localPaths.length ? pathNode.localPaths[index] : null;
    }

    private getNextIndirectionResult(): IEpubCfiIndirectionResult | null {

        let resolvedPath: EpubCfiResolvedPath | null = null;
        let result: IEpubCfiIndirectionResult | null = null;

        if (this.hasNextLocalPathIndirection(EpubCfiPathType.PARENT)) {
            resolvedPath = this._resolvedTarget.parentPath;
        } else if (this.hasNextLocalPathIndirection(EpubCfiPathType.RANGE_START)) {
            resolvedPath = this._resolvedTarget.rangeStartPath || this._resolvedTarget.parentPath;
        } else if (this.hasNextLocalPathIndirection(EpubCfiPathType.RANGE_END)) {
            resolvedPath = this._resolvedTarget.rangeEndPath || this._resolvedTarget.parentPath;
        }

        if (resolvedPath) {
            const targetElement = resolvedPath.getTargetElement();
            if (targetElement) {
                result = {
                    documentUrl: resolvedPath.documentUrl,
                    element: targetElement,
                };
            } else {
                this._resolvedTarget.indirectionErrors.push({
                    from: resolvedPath.getTargetNode(),
                    fromPath: resolvedPath.documentUrl,
                    target: null,
                    targetPath: null,
                });
                this.handleUnresolvableIndirection();

                result = this.getNextIndirectionResult();
            }
        }

        return result;
    }

    private getResolvedPathFromType(type: EpubCfiPathType): EpubCfiResolvedPath | null {
        switch (type) {
            case EpubCfiPathType.PARENT:
                return this._resolvedTarget.parentPath;
            case EpubCfiPathType.RANGE_END:
                return this._resolvedTarget.rangeEndPath;
            case EpubCfiPathType.RANGE_START:
                return this._resolvedTarget.rangeStartPath;
        }
    }

    /**
     * Get the side bias, according to the spec. it must be in the last assertion
     */
    private handleSideBiasParameter(path: EpubCfiResolvedPath): void {
        let terminalAssertion: IEpubCfiAssertionNode | null = null;

        if (path.ast.offset && path.ast.offset.assertion) {
            terminalAssertion = path.ast.offset.assertion;
        } else {
            let terminalLocalPath = path.getTerminalLocalPath();
            if (terminalLocalPath.ast) {
                let lastStep = ArrayUtils.last(terminalLocalPath.ast.steps);
                if (lastStep) {
                    terminalAssertion = lastStep.assertion;
                }
            }
        }

        if (terminalAssertion) {
            let sideBiasParameter = terminalAssertion.parameters.find(param => param.name === 's' && param.values.length > 0);
            if (sideBiasParameter) {
                path.sideBias = sideBiasParameter.values[0] === 'b' ? EpubCfiSideBias.BEFORE : EpubCfiSideBias.AFTER;
            }
        }
    }

    private handleUnresolvableIndirection(): void {
        if (this._parentPathNode) {
            this._parentPathNode = null;
            this._rangeStartPathNode = null;
            this._rangeEndPathNode = null;
            if (this._resolvedTarget.parentPath) {
                this._resolvedTarget.parentPath.indirectionsResolved = false;
                this._resolvedTarget.parentPath.stepsResolved = false;
            }
        } else if (this._rangeStartPathNode) {
            this._rangeStartPathNode = null;
            if (this._resolvedTarget.rangeStartPath) {
                this._resolvedTarget.rangeStartPath.indirectionsResolved = false;
                this._resolvedTarget.rangeStartPath.stepsResolved = false;
            }
        } else if (this._rangeEndPathNode) {
            this._rangeEndPathNode = null;
            if (this._resolvedTarget.rangeEndPath) {
                this._resolvedTarget.rangeEndPath.indirectionsResolved = false;
                this._resolvedTarget.rangeEndPath.stepsResolved = false;
            }
        }
    }

    private hasNextLocalPathIndirection(pathType: EpubCfiPathType): boolean {
        let result = false;
        switch (pathType) {
            case EpubCfiPathType.PARENT:
                if (this._parentPathNode) {
                    const nextLocalPath = this.getLocalPathByIndex(this._parentPathNode, this._parentLocalPathIndex);
                    result = nextLocalPath !== null && nextLocalPath.indirection;
                }
                break;

            case EpubCfiPathType.RANGE_START:
                if (this._rangeStartPathNode) {
                    const nextLocalPath = this.getLocalPathByIndex(this._rangeStartPathNode, this._rangeStartLocalPathIndex);
                    result = nextLocalPath !== null && nextLocalPath.indirection;
                }
                break;

            case EpubCfiPathType.RANGE_END:
                if (this._rangeEndPathNode) {
                    const nextLocalPath = this.getLocalPathByIndex(this._rangeEndPathNode, this._rangeEndLocalPathIndex);
                    result = nextLocalPath !== null && nextLocalPath.indirection;
                }
                break;
        }
        return result;
    }

    private maybeProcessOffsetsAndSideBias(): void {
        if (this._resolvedTarget.parentPath && !this._parentPathNode && !this._parentOffsetHandled) {
            this._offsetProcessor.processOffset(this._resolvedTarget.parentPath);
            this.handleSideBiasParameter(this._resolvedTarget.parentPath);
            this._parentOffsetHandled = true;
        }
        if (this._resolvedTarget.rangeStartPath && !this._rangeStartPathNode && !this._rangeStartOffsetHandled) {
            this._offsetProcessor.processOffset(this._resolvedTarget.rangeStartPath);
            this.handleSideBiasParameter(this._resolvedTarget.rangeStartPath);
            this._rangeStartOffsetHandled = true;
        }
        if (this._resolvedTarget.rangeEndPath && !this._rangeEndPathNode && !this._rangeEndOffsetHandled) {
            this._offsetProcessor.processOffset(this._resolvedTarget.rangeEndPath);
            this.handleSideBiasParameter(this._resolvedTarget.rangeEndPath);
            this._rangeStartOffsetHandled = true;
        }
    }

    /**
     * Continue resolving next local path from an exsting resolved path's target node.
     *
     * @param pathType - The path to continue resolving.
     * @param existingResolvedPath - The existing resolved path containing the target node from where to continue resolving.
     * @param documentUrl - The URL to the document we are currently processing.
     */
    private resolveNextLocalPathFromResolvedPath(
        pathType: EpubCfiPathType,
        existingResolvedPath: EpubCfiResolvedPath,
        documentUrl: URL,
    ): EpubCfiResolvedPath {
        const nextLocalPath = this.consumeNextLocalPath(pathType);

        let resolvedLocalPath: EpubCfiResolvedLocalPath;
        if (nextLocalPath) {
            resolvedLocalPath = EpubCfiLocalPathResolver.createResolverFromExistingPath(nextLocalPath, existingResolvedPath).resolve();
        } else {
            resolvedLocalPath = new EpubCfiResolvedLocalPath(
                null,
                documentUrl,
                existingResolvedPath.container,
                existingResolvedPath.offset,
                existingResolvedPath.intendedTargetType,
                existingResolvedPath.virtualTarget,
            );
        }
        return this.addResolvedLocalPath(pathType, resolvedLocalPath);
    }

    private resolveNextLocalPathFromStartElement(
        pathType: EpubCfiPathType,
        startElement: Element,
        documentUrl: URL,
    ): EpubCfiResolvedPath {
        const nextLocalPath = this.consumeNextLocalPath(pathType);

        let resolvedLocalPath: EpubCfiResolvedLocalPath;
        if (nextLocalPath) {
            resolvedLocalPath = EpubCfiLocalPathResolver.createResolverFromElement(nextLocalPath, startElement, documentUrl).resolve();
        } else {
            resolvedLocalPath = new EpubCfiResolvedLocalPath(
                null,
                documentUrl,
                startElement.parentNode!,
                DomUtils.getNodeIndex(startElement),
                EpubCfiIntendedTargetType.ELEMENT,
                null,
            );
        }

        return this.addResolvedLocalPath(pathType, resolvedLocalPath);
    }
}
