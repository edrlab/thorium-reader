// import {describe, expect, it} from 'vitest';
// import {ArrayUtils} from '../common/ArrayUtils';
// import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
// import {EpubCfiOffsetType} from '../model/offset/EpubCfiOffsetType';
// import {IEpubCfiCharacterOffsetNode} from '../model/offset/IEpubCfiCharacterOffsetNode';
// import {IEpubCfiSpatialOffsetNode} from '../model/offset/IEpubCfiSpatialOffsetNode';
// import {IEpubCfiTemporalOffsetNode} from '../model/offset/IEpubCfiTemporalOffsetNode';
// import {EpubCfiParser} from './EpubCfiParser';
// import {EpubCfiParserErrorType} from './EpubCfiParserErrorType';

// describe('EpubCfiParser', () => {

//     it('should parse "epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[yyy])" without errors', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[yyy])');
//         expect(epubCfiAst.errors).toEqual([]);
//         expect(epubCfiAst.parentPath!.localPaths.length).toBe(2);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(4);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.rangeStartPath).toBeNull();
//         expect(epubCfiAst.rangeEndPath).toBeNull();

//         let path0 = epubCfiAst.parentPath!.localPaths[0];
//         expect(path0.indirection).toBeFalsy();

//         let steps0 = path0.steps;
//         expect(steps0.length).toBe(2);
//         expect(steps0[0].stepValue).toBe(6);
//         expect(steps0[1].stepValue).toBe(4);

//         let step01Assertion = steps0[1].assertion!;
//         expect(step01Assertion.parameters.length).toBe(0);
//         expect(step01Assertion.values).toEqual(['chap01ref']);

//         let path1 = epubCfiAst.parentPath!.localPaths[1];
//         expect(path1.indirection).toBeTruthy();

//         let steps1 = path1.steps;
//         expect(steps1[0].stepValue).toBe(4);
//         let step10Assertion = steps1[0].assertion!;
//         expect(step10Assertion.parameters.length).toBe(0);
//         expect(step10Assertion.values).toEqual(['body01']);

//         expect(steps1[1].stepValue).toBe(10);
//         expect(steps1[2].stepValue).toBe(2);
//         expect(steps1[3].stepValue).toBe(1);
//         expect(steps1[3].assertion).toBeNull();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiCharacterOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.CHARACTER);
//         expect(offset.characterOffset).toBe(3);

//         let textAssertion = offset.assertion!;
//         expect(textAssertion.parameters.length).toBe(0);
//         expect(textAssertion.values).toEqual(['yyy']);
//     });

//     it('should parse escaped text assertions correctly "epubcfi(/6/4!/4/10/2/1:3[^,Ф-"spa   ce"-99%-aa^[bb^]^^^,])"', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4!/4/10/2/1:3[^,Ф-"spa   ce"-99%-aa^[bb^]^^^,])');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths.length).toBe(2);
//         expect(epubCfiAst.parentPath!.localPaths[0].steps.length).toBe(2);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(4);
//         expect(epubCfiAst.parentPath!.localPaths[0].indirection).toBeFalsy();
//         expect(epubCfiAst.parentPath!.localPaths[1].indirection).toBeTruthy();

//         expect(epubCfiAst.rangeStartPath).toBeNull();
//         expect(epubCfiAst.rangeEndPath).toBeNull();
//         let lastStep = ArrayUtils.last(epubCfiAst.parentPath!.localPaths[1].steps)!;

//         expect(lastStep.stepValue).toBe(1);
//         expect(lastStep.assertion).toBeNull();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiCharacterOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.CHARACTER);
//         expect(offset.characterOffset).toBe(3);

//         let assertion = offset.assertion!;
//         expect(assertion.values).toEqual([',Ф-"spa   ce"-99%-aa[bb]^,']);
//         expect(assertion.parameters.length).toBe(0);

//     });

//     it('should parse text assertions [xx^,,y]', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[xx^,,y])');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths.length).toBe(2);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(4);

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiCharacterOffsetNode;
//         let assertion = offset.assertion!;
//         expect(assertion.values).toEqual(['xx,', 'y']);
//         expect(assertion.parameters.length).toBe(0);
//     });

//     it('should parse text assertions [,hej]', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[,hej])');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(4);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiCharacterOffsetNode;
//         let assertion = offset.assertion!;
//         expect(assertion.values).toEqual(['', 'hej']);
//         expect(assertion.parameters.length).toBe(0);
//     });

//     it('should parse side bias [;s=b]', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[;s=b])');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(4);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiCharacterOffsetNode;
//         let assertion = offset.assertion!;
//         expect(assertion.values.length).toBe(0);
//         expect(assertion.parameters.length).toBe(1);
//         let parameters = assertion.parameters;
//         expect(parameters[0].name).toBe('s');
//         expect(parameters[0].values).toEqual(['b']);
//     });

//     it('should parse custom assertion parameters [yyy,xx^;;someParam=value 1,value 2;s=f]', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[yyy,xx^;;someParam=value 1,value 2;s=f])');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(4);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiCharacterOffsetNode;
//         let assertion = offset.assertion!;
//         expect(assertion.values).toEqual(['yyy', 'xx;']);
//         expect(assertion.parameters.length).toBe(2);
//         let parameters = assertion.parameters;
//         expect(parameters[0].name).toBe('someParam');
//         expect(parameters[0].values).toEqual(['value 1', 'value 2']);
//         expect(parameters[1].name).toBe('s');
//         expect(parameters[1].values).toEqual(['f']);
//     });

//     it('should allow terminating with element step ../16[svgimg]', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/16[svgimg])');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(2);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         let lastStep = ArrayUtils.last(epubCfiAst.parentPath!.localPaths[1].steps)!;
//         let assertion = lastStep.assertion!;
//         expect(assertion.values).toEqual(['svgimg']);
//     });

//     it('should show one error given: "epubcfi(/6/4"', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4');
//         expect(epubCfiAst.errors.length).toBe(1);
//         expect(epubCfiAst.errors[0].type).toBe(EpubCfiParserErrorType.INVALID_EPUBCFI_END);
//         expect(epubCfiAst.parentPath!.complete).toBeFalsy();
//         expect(epubCfiAst.parentPath!.localPaths[0].steps.length).toBe(2);
//         expect(epubCfiAst.errors[0].value).toBe('');
//     });

//     it('should show one error given: "epubcfi(/6/4!)"', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4!)');
//         expect(epubCfiAst.parentPath!.localPaths.length).toBe(2);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths[0].steps.length).toBe(2);
//         expect(epubCfiAst.parentPath!.localPaths[0].steps[0].stepValue).toBe(6);
//         expect(epubCfiAst.parentPath!.localPaths[0].steps[1].stepValue).toBe(4);
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(0);
//         expect(epubCfiAst.parentPath!.localPaths[1].indirection).toBeTruthy();
//     });

//     it('should not report error by default given: "epubcfi(/6/3/4)"', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/3/4)');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths.length).toBe(1);
//         expect(epubCfiAst.parentPath!.localPaths[0].steps.length).toBe(3);
//     });

//     it('should parse ranges: "epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)"', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(2);
//         expect(epubCfiAst.rangeStartPath).not.toBeNull();
//         expect(epubCfiAst.rangeEndPath).not.toBeNull();

//         let rangeStart = epubCfiAst.rangeStartPath as IEpubCfiPathNode;
//         expect(rangeStart.localPaths.length).toBe(1);
//         expect(rangeStart.complete).toBeTruthy();

//         let startSteps = rangeStart.localPaths[0].steps;
//         expect(startSteps.length).toBe(2);
//         expect(startSteps[0].stepValue).toBe(2);
//         expect(startSteps[0].assertion).toBeNull();
//         expect(startSteps[1].stepValue).toBe(1);
//         expect(startSteps[1].assertion).toBeNull();
//         let offset = rangeStart.offset as IEpubCfiCharacterOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.CHARACTER);
//         expect(offset.characterOffset).toBe(1);

//         let rangeEnd = epubCfiAst.rangeEndPath as IEpubCfiPathNode;
//         expect(rangeEnd.localPaths.length).toBe(1);
//         expect(rangeEnd.complete).toBeTruthy();
//         let endSteps = rangeEnd.localPaths[0].steps;

//         expect(endSteps.length).toBe(1);
//         expect(endSteps[0].stepValue).toBe(3);
//         expect(endSteps[0].assertion).toBeNull();
//         offset = rangeEnd.offset as IEpubCfiCharacterOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.CHARACTER);
//         expect(offset.characterOffset).toBe(4);
//     });

//     it('should parse range where range components only has offsets', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4[chap01ref]!/3,:1,:4)');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(1);
//         expect(epubCfiAst.parentPath!.offset).toBeNull();

//         let rangeStart = epubCfiAst.rangeStartPath!;
//         expect(rangeStart!.localPaths.length).toBe(0);
//         expect(rangeStart!.complete).toBeTruthy();
//         let startOffset = rangeStart.offset as IEpubCfiCharacterOffsetNode;
//         expect(startOffset.type).toBe(EpubCfiOffsetType.CHARACTER);
//         expect(startOffset.characterOffset).toBe(1);

//         let rangeEnd = epubCfiAst.rangeEndPath!;
//         expect(rangeEnd!.localPaths.length).toBe(0);
//         expect(rangeEnd!.complete).toBeTruthy();
//         let endOffset = rangeEnd.offset as IEpubCfiCharacterOffsetNode;
//         expect(endOffset.type).toBe(EpubCfiOffsetType.CHARACTER);
//         expect(endOffset.characterOffset).toBe(4);
//     });

//     it('should parse temporal offsets: ~23.5', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4!/4~23.5)');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(1);

//         let steps = epubCfiAst.parentPath!.localPaths[1].steps;
//         expect(steps[0].stepValue).toBe(4);
//         expect(steps[0].assertion).toBeNull();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiTemporalOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.TEMPORAL);
//         expect(offset.seconds).toBe(23.5);
//         expect(offset.x).toBeNull();
//         expect(offset.y).toBeNull();
//     });

//     it('should parse spatial offsets: @40.2:110', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4!/4@30.2:110)');
//         expect(epubCfiAst.errors.length).toBe(1);
//         expect(epubCfiAst.errors[0].type).toBe(EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET_VALUE);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(1);

//         let steps = epubCfiAst.parentPath!.localPaths[1].steps;
//         expect(steps[0].stepValue).toBe(4);
//         expect(steps[0].assertion).toBeNull();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiSpatialOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.SPATIAL);
//         expect(offset.x).toBe(30.2);
//         expect(offset.y).toBe(100); // It will cap between 0 and 100
//     });

//     it('should parse temporal-spatial offsets: ~3579.256@40:83.5', () => {
//         let epubCfiAst = EpubCfiParser.parse('epubcfi(/6/4!/4~3579.256@40:83.5)');
//         expect(epubCfiAst.errors.length).toBe(0);
//         expect(epubCfiAst.parentPath!.complete).toBeTruthy();
//         expect(epubCfiAst.parentPath!.localPaths[1].steps.length).toBe(1);

//         let steps = epubCfiAst.parentPath!.localPaths[1].steps;
//         expect(steps[0].stepValue).toBe(4);
//         expect(steps[0].assertion).toBeNull();

//         let offset = epubCfiAst.parentPath!.offset as IEpubCfiTemporalOffsetNode;
//         expect(offset.type).toBe(EpubCfiOffsetType.TEMPORAL);
//         expect(offset.seconds).toBe(3579.256);
//         expect(offset.x).toBe(40);
//         expect(offset.y).toBe(83.5); // It will cap between 0 and 100
//     });

//     it('should give an error if passing an empty string, or nonempty bogus string', () => {
//         let epubCfiAst = EpubCfiParser.parse('');
//         expect(epubCfiAst.errors.length).toBe(1);
//         expect(epubCfiAst.errors[0].type).toBe(EpubCfiParserErrorType.INVALID_EPUBCFI_START);
//         expect(epubCfiAst.parentPath).toBeNull();
//         expect(epubCfiAst.rangeStartPath).toBeNull();
//         expect(epubCfiAst.rangeEndPath).toBeNull();

//         epubCfiAst = EpubCfiParser.parse('/2/3');
//         expect(epubCfiAst.errors.length).toBe(1);
//         expect(epubCfiAst.errors[0].type).toBe(EpubCfiParserErrorType.INVALID_EPUBCFI_START);
//         expect(epubCfiAst.parentPath).toBeNull();
//         expect(epubCfiAst.rangeStartPath).toBeNull();
//         expect(epubCfiAst.rangeEndPath).toBeNull();
//     });

//     it('should by default allow spatial or temporal offsets for any step type', () => {
//         let temporalAst = EpubCfiParser.parse('epubcfi(/6/4!/1~1)');
//         expect(temporalAst.errors.length).toBe(0);
//         expect((temporalAst.parentPath!.offset as IEpubCfiTemporalOffsetNode).type).toBe(EpubCfiOffsetType.TEMPORAL);
//         expect((temporalAst.parentPath!.offset as IEpubCfiTemporalOffsetNode).seconds).toBe(1);

//         let spatialAst = EpubCfiParser.parse('epubcfi(/6/4!/1@30:40)');
//         expect(spatialAst.errors.length).toBe(0);
//         expect((spatialAst.parentPath!.offset as IEpubCfiSpatialOffsetNode).type).toBe(EpubCfiOffsetType.SPATIAL);
//         expect((spatialAst.parentPath!.offset as IEpubCfiSpatialOffsetNode).x).toBe(30);
//         expect((spatialAst.parentPath!.offset as IEpubCfiSpatialOffsetNode).y).toBe(40);

//     });

// });
