// import {describe, expect, it} from 'vitest';
// import {NodeType} from '../common/definitions/NodeType';
// import {DomUtils} from '../common/DomUtils';
// import {EpubCfiOffsetType} from '../model/offset/EpubCfiOffsetType';
// import {IEpubCfiCharacterOffsetNode} from '../model/offset/IEpubCfiCharacterOffsetNode';
// import {EpubCfiBuilderHelper} from './EpubCfiBuilderHelper';
// // @ts-ignore
// import testXhtml from './test-data/example-doc.xhtml?raw';

// describe('EpubCfiBuilderHelper', () => {
//     describe('buildLocalPathToElement', () => {
//         it('should report the path from HTML root down to element', () => {
//             const domParser = new DOMParser();
//             const doc = domParser.parseFromString(testXhtml, 'application/xhtml+xml');

//             let localPath = EpubCfiBuilderHelper.buildLocalPathToElement(doc.getElementById('title')!, false);

//             expect(localPath.indirection).toBeFalsy();
//             expect(localPath.steps.length).toBe(6);

//             let steps = localPath.steps;
//             expect(steps[0].stepValue).toBe(4);
//             expect(steps[1].stepValue).toBe(2);
//             expect(steps[2].stepValue).toBe(2);
//             expect(steps[3].stepValue).toBe(2);
//             expect(steps[4].stepValue).toBe(2);
//             expect(steps[5].stepValue).toBe(2);

//             expect(steps[0].assertion).toBeNull();
//             expect(steps[1].assertion).toBeNull();
//             expect(steps[2].assertion).toBeNull();
//             expect(steps[3].assertion).toBeNull();
//             expect(steps[4].assertion).toBeNull();
//             expect(steps[5].assertion).toEqual({
//                 values: ['title'],
//                 parameters: [],
//             });
//         });
//     });

//     describe('appendTerminalLocalPath', () => {
//         it('should create local path to elements', () => {
//             const domParser = new DOMParser();
//             const doc = domParser.parseFromString(testXhtml, 'application/xhtml+xml');
//             let paragraphElement = doc.getElementById('paragraph-1')!;

//             let pathNode = EpubCfiBuilderHelper.appendTerminalLocalPath(paragraphElement.parentNode!, DomUtils.getNodeIndex(paragraphElement));
//             let localPathNode = pathNode.localPaths[0];

//             let steps = localPathNode.steps;
//             expect(steps.length).toBe(3);
//             expect(steps[0].stepValue).toBe(4);
//             expect(steps[1].stepValue).toBe(2);
//             expect(steps[2].stepValue).toBe(4);

//             expect(steps[0].assertion).toBeNull();
//             expect(steps[1].assertion).toBeNull();
//             expect(steps[2].assertion).toEqual({
//                 values: ['paragraph-1'],
//                 parameters: [],
//             });
//             expect(pathNode.offset).toBeNull();
//         });

//         it('should create local path to text and set offset', () => {
//             const domParser = new DOMParser();
//             const doc = domParser.parseFromString(testXhtml, 'application/xhtml+xml');
//             let paragraphElement = doc.getElementById('paragraph-1')!;
//             expect(paragraphElement.childNodes[2].nodeType).toBe(NodeType.TEXT_NODE);

//             let pathNode = EpubCfiBuilderHelper.appendTerminalLocalPath(paragraphElement, 2);
//             let localPathNode = pathNode.localPaths[0];

//             let steps = localPathNode.steps;
//             expect(steps.length).toBe(4);
//             expect(steps[0].stepValue).toBe(4);
//             expect(steps[1].stepValue).toBe(2);
//             expect(steps[2].stepValue).toBe(4);
//             expect(steps[3].stepValue).toBe(3);

//             let offset = pathNode.offset as IEpubCfiCharacterOffsetNode;
//             expect(offset.type).toBe(EpubCfiOffsetType.CHARACTER);
//             expect(offset.characterOffset).toBe(0);
//         });

//         it('should create local path to text and set offset', () => {
//             const domParser = new DOMParser();
//             const doc = domParser.parseFromString(testXhtml, 'application/xhtml+xml');
//             let paragraphElement = doc.getElementById('paragraph-1')!;
//             let textNode = paragraphElement.childNodes[2];
//             expect(textNode.nodeType).toBe(NodeType.TEXT_NODE);

//             let pathNode = EpubCfiBuilderHelper.appendTerminalLocalPath(textNode, 4);
//             let localPathNode = pathNode.localPaths[0];

//             let steps = localPathNode.steps;
//             expect(steps.length).toBe(4);
//             expect(steps[0].stepValue).toBe(4);
//             expect(steps[1].stepValue).toBe(2);
//             expect(steps[2].stepValue).toBe(4);
//             expect(steps[3].stepValue).toBe(3);

//             let offset = pathNode.offset as IEpubCfiCharacterOffsetNode;
//             expect(offset.type).toBe(EpubCfiOffsetType.CHARACTER);
//             expect(offset.characterOffset).toBe(4);
//         });
//     });

//     describe('appendTerminalDomRange', () => {
//         it('should create range path to a container element', () => {
//             const domParser = new DOMParser();
//             const doc = domParser.parseFromString(testXhtml, 'application/xhtml+xml');
//             let paragraphElement = doc.getElementById('paragraph-2')!;

//             let range = doc.createRange();
//             range.selectNode(paragraphElement);

//             let rootNode = EpubCfiBuilderHelper.appendTerminalDomRange(range);

//             let parentLocalPath = rootNode.parentPath!.localPaths[0];
//             expect(parentLocalPath.steps.length).toBe(2);
//             expect(parentLocalPath.steps[0].stepValue).toBe(4);
//             expect(parentLocalPath.steps[1].stepValue).toBe(2);
//             expect(parentLocalPath.indirection).toBeFalsy();
//             expect(rootNode.parentPath!.offset).toBeNull();

//             let rangeStartLocalPath = rootNode.rangeStartPath!.localPaths[0];
//             expect(rangeStartLocalPath.steps.length).toBe(1);
//             expect(rangeStartLocalPath.steps[0].stepValue).toBe(6);
//             expect(rangeStartLocalPath.steps[0].assertion).toEqual({
//                 values: ['paragraph-2'],
//                 parameters: [],
//             });

//             let rangeEndLocalPath = rootNode.rangeEndPath!.localPaths[0];
//             expect(rangeEndLocalPath.steps.length).toBe(1);
//             expect(rangeEndLocalPath.steps[0].stepValue).toBe(7);
//             expect(rootNode.rangeEndPath!.offset).toEqual({
//                 type: EpubCfiOffsetType.CHARACTER,
//                 characterOffset: 0,
//                 assertion: null,
//             } as IEpubCfiCharacterOffsetNode);
//         });

//         it('should create range path to a character range within Text', () => {
//             const domParser = new DOMParser();
//             const doc = domParser.parseFromString(testXhtml, 'application/xhtml+xml');
//             let paragraphElement = doc.getElementById('paragraph-2')!;

//             let textNode = paragraphElement.childNodes[0];
//             expect(textNode.nodeType).toBe(NodeType.TEXT_NODE);

//             let range = doc.createRange();
//             range.setStart(textNode, 4);
//             range.setEnd(textNode, 9);

//             expect(range.toString()).toBe('graph');

//             let rootNode = EpubCfiBuilderHelper.appendTerminalDomRange(range);

//             let parentLocalPath = rootNode.parentPath!.localPaths[0];
//             expect(parentLocalPath.steps.length).toBe(4);
//             expect(parentLocalPath.steps[0].stepValue).toBe(4);
//             expect(parentLocalPath.steps[1].stepValue).toBe(2);
//             expect(parentLocalPath.steps[2].stepValue).toBe(6);
//             expect(parentLocalPath.steps[3].stepValue).toBe(1);
//             expect(parentLocalPath.indirection).toBeFalsy();
//             expect(rootNode.parentPath!.offset).toBeNull();

//             expect(rootNode.rangeStartPath!.localPaths.length).toBe(0);
//             expect(rootNode.rangeStartPath!.offset).toEqual({
//                 type: EpubCfiOffsetType.CHARACTER,
//                 characterOffset: 4,
//                 assertion: null,
//             } as IEpubCfiCharacterOffsetNode);

//             expect(rootNode.rangeEndPath!.localPaths.length).toBe(0);
//             expect(rootNode.rangeEndPath!.offset).toEqual({
//                 type: EpubCfiOffsetType.CHARACTER,
//                 characterOffset: 9,
//                 assertion: null,
//             } as IEpubCfiCharacterOffsetNode);
//         });
//     });
// });
