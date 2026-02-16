import {isNumber} from '../common/Utils';
import {IEpubCfiAssertionNode} from '../model/assertion/IEpubCfiAssertionNode';
import {IEpubCfiLocalPathNode} from '../model/IEpubCfiLocalPathNode';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {IEpubCfiStepNode} from '../model/IEpubCfiStepNode';
import {EpubCfiOffsetNode} from '../model/offset/EpubCfiOffsetNode';
import {EpubCfiOffsetType} from '../model/offset/EpubCfiOffsetType';
import {IEpubCfiCharacterOffsetNode} from '../model/offset/IEpubCfiCharacterOffsetNode';
import {IEpubCfiSpatialOffsetNode} from '../model/offset/IEpubCfiSpatialOffsetNode';
import {IEpubCfiTemporalOffsetNode} from '../model/offset/IEpubCfiTemporalOffsetNode';

/**
 * Used for serializing parsed EPUB CFI object trees into fragment selector strings.
 */
export class EpubCfiStringifier {

    /**
     * Serializes a IEpubCfiRootNode into a fragment selector string.
     */
    static stringifyRootNode(rootNode: IEpubCfiRootNode): string {
        let output: (string | number)[] = ['epubcfi('];
        if (rootNode.parentPath) {
            EpubCfiStringifier.processPath(rootNode.parentPath, output);
        }
        if (rootNode.rangeStartPath || rootNode.rangeEndPath) {
            output.push(',');
            if (rootNode.rangeStartPath) {
                EpubCfiStringifier.processPath(rootNode.rangeStartPath, output);
            }
            if (rootNode.rangeEndPath) {
                output.push(',');
                EpubCfiStringifier.processPath(rootNode.rangeEndPath, output);
            }

        }
        output.push(')');

        return output.join('');
    }

    private static processAssertion(assertionNode: IEpubCfiAssertionNode, output: (string | number)[]): void {
        output.push('[');
        const escapedValues = assertionNode.values.map(escape);
        output.push(escapedValues.join(','));

        for (const parameter of assertionNode.parameters) {
            output.push(';', escape(parameter.name), '=');
            const escapedParameterValues = parameter.values.map(escape);
            output.push(escapedParameterValues.join(','));
        }

        output.push(']');
    }

    private static processLocalPath(localPathNode: IEpubCfiLocalPathNode, output: (string | number)[]): void {
        if (localPathNode.indirection) {
            output.push('!');
        }
        for (const stepNode of localPathNode.steps) {
            EpubCfiStringifier.processStep(stepNode, output);
        }
    }

    private static processOffset(offsetNode: EpubCfiOffsetNode, output: (string | number)[]): void {
        switch (offsetNode.type) {
            case EpubCfiOffsetType.CHARACTER:
                EpubCfiStringifier.processOffsetCharacter(offsetNode, output);
                break;
            case EpubCfiOffsetType.SPATIAL:
                EpubCfiStringifier.processOffsetSpatial(offsetNode, output);
                break;
            case EpubCfiOffsetType.TEMPORAL:
                EpubCfiStringifier.processOffsetTemporal(offsetNode, output);
                break;
        }

        if (offsetNode.assertion) {
            EpubCfiStringifier.processAssertion(offsetNode.assertion, output);
        }
    }

    private static processOffsetCharacter(offsetNode: IEpubCfiCharacterOffsetNode, output: (string | number)[]): void {
        output.push(':', offsetNode.characterOffset);
    }

    private static processOffsetSpatial(offsetNode: IEpubCfiSpatialOffsetNode, output: (string | number)[]): void {
        output.push('@', offsetNode.x, ':', offsetNode.y);
    }

    private static processOffsetTemporal(offsetNode: IEpubCfiTemporalOffsetNode, output: (string | number)[]): void {
        output.push('~', offsetNode.seconds);
        if (isNumber(offsetNode.x) && isNumber(offsetNode.y)) {
            output.push('@', offsetNode.x, ':', offsetNode.y);
        }
    }

    private static processPath(pathNode: IEpubCfiPathNode, output: (string | number)[]): void {
        for (let i = 0; i < pathNode.localPaths.length; i++) {
            let localPath = pathNode.localPaths[i];
            EpubCfiStringifier.processLocalPath(localPath, output);
        }
        if (pathNode.offset) {
            EpubCfiStringifier.processOffset(pathNode.offset, output);
        }
    }

    private static processStep(stepNode: IEpubCfiStepNode, output: (string | number)[]): void {
        output.push('/', stepNode.stepValue);
        if (stepNode.assertion) {
            EpubCfiStringifier.processAssertion(stepNode.assertion, output);
        }
    }

}

function escape(value: string): string {
    return value.replace(/[\^\[\](),;=]/g, match => '^' + match);
}
