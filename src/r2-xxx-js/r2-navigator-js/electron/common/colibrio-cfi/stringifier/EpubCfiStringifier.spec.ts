// import {describe, expect, it} from 'vitest';
// import {EpubCfiParser} from '../parser/EpubCfiParser';
// import {EpubCfiStringifier} from './EpubCfiStringifier';

// describe('EpubCfiStringifier', () => {
//     it('should stringify back to same string: epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[yyy])', () => {
//         let epubCfi = 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3[yyy])';
//         let rootNode = EpubCfiParser.parse(epubCfi);

//         let stringifiedEpubCfi = EpubCfiStringifier.stringifyRootNode(rootNode);
//         expect(stringifiedEpubCfi).toBe(epubCfi);

//     });

//     it('should stringify back escaped text correctly: epubcfi(/6/4!/4/10/2/1:3[^,Ф-"spa   ce"-99%-aa^[bb^]^^^,])', () => {
//         let epubCfi = 'epubcfi(/6/4!/4/10/2/1:3[^,Ф-"spa   ce"-99%-aa^[bb^]^^^,])';
//         let rootNode = EpubCfiParser.parse(epubCfi);

//         let stringifiedEpubCfi = EpubCfiStringifier.stringifyRootNode(rootNode);
//         expect(stringifiedEpubCfi).toBe(epubCfi);
//     });

//     it('should stringify back ranges correctly: epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1~1,/3~4)', () => {
//         let epubCfi = 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1~1,/3~4)';
//         let rootNode = EpubCfiParser.parse(epubCfi);

//         let stringifiedEpubCfi = EpubCfiStringifier.stringifyRootNode(rootNode);
//         expect(stringifiedEpubCfi).toBe(epubCfi);
//     });

//     it('should stringify back ranges correctly: epubcfi(/6/4[chap01ref]!,~23.45,~56.5@40:40)', () => {
//         let epubCfi = 'epubcfi(/6/4[chap01ref]!,~23.45,~56.5@40:40)';
//         let rootNode = EpubCfiParser.parse(epubCfi);

//         let stringifiedEpubCfi = EpubCfiStringifier.stringifyRootNode(rootNode);
//         expect(stringifiedEpubCfi).toBe(epubCfi);
//     });

//     it('should stringify parameters correctly: epubcfi(/6/4[chap01ref;custom=val]!/4)', () => {
//         let epubCfi = 'epubcfi(/6/4[chap01ref;custom=val]!/4)';
//         let rootNode = EpubCfiParser.parse(epubCfi);

//         let stringifiedEpubCfi = EpubCfiStringifier.stringifyRootNode(rootNode);
//         expect(stringifiedEpubCfi).toBe(epubCfi);
//     });

//     it('should stringify back spatial offsets correctly: epubcfi(/6/4[chap01ref]!/4/10@20:40)', () => {
//         let epubCfi = 'epubcfi(/6/4[chap01ref]!/4/10@20:40)';
//         let rootNode = EpubCfiParser.parse(epubCfi);

//         let stringifiedEpubCfi = EpubCfiStringifier.stringifyRootNode(rootNode);
//         expect(stringifiedEpubCfi).toBe(epubCfi);
//     });
// });
