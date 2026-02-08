// import {describe, expect, it} from 'vitest';
// import {isTextNode} from '../common/Utils';
// import {EpubCfiIntendedTargetType} from './EpubCfiIntendedTargetType';
// import {EpubCfiResolvedTarget} from './EpubCfiResolvedTarget';
// import {EpubCfiResolver} from './EpubCfiResolver';
// import {EpubCfiSideBias} from './EpubCfiSideBias';
// import {EpubCfiVirtualTarget} from './EpubCfiVirtualTarget';
// // @ts-ignore
// import testOpf from './test-data/testBookOpf.xml?raw';
// // @ts-ignore
// import testChapter1 from './test-data/testChapter1.xhtml?raw';
// // @ts-ignore
// import testChapter2 from './test-data/testChapter2.xhtml?raw';

// describe('EpubCfiResolver', () => {

//     function resolveEpubCfi(epubcfi: string): EpubCfiResolvedTarget {
//         let resolver = new EpubCfiResolver(epubcfi);

//         let domParser = new DOMParser();
//         let currentDocument = domParser.parseFromString(testOpf, 'application/xml');
//         let currentDocUrl = new URL('com.colibrio://something/testBookOpf.xml');

//         let indirectionResult = resolver.continueResolving(currentDocument, currentDocUrl);

//         expect(indirectionResult).not.toBeNull();

//         expect(indirectionResult?.documentUrl.toString()).toBe('com.colibrio://something/testBookOpf.xml');
//         expect(indirectionResult?.element.localName).toBe('itemref');
//         expect(indirectionResult?.element.getAttribute('idref')).toBe('chapter-001');

//         let chapterDoc = domParser.parseFromString(testChapter1, 'application/xhtml+xml');

//         indirectionResult = resolver.continueResolving(chapterDoc, new URL('com.colibrio://something/testChapter1.xhtml'));

//         expect(indirectionResult).toBeNull();
//         return resolver.getResolvedTarget();
//     }

//     it('should resolve to a text location within the example EPUB', () => {
//         // let resolver = new EpubCfiResolver(xmlDocument, 'testBookOpf.xml');
//         let resolvedTarget = resolveEpubCfi('epubcfi(/6/8!/4/2[chapter-i]/2/2/1[;s=b])');

//         expect(resolvedTarget.hasErrors()).toBeFalsy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeFalsy();
//         expect(resolvedTarget.isDomRange()).toBeFalsy();
//         expect(resolvedTarget.hasRangePaths()).toBeFalsy();
//         expect(resolvedTarget.getSideBias()).toBe(EpubCfiSideBias.BEFORE);
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.getTargetElement()).toBeNull();

//         let parentPath = resolvedTarget.parentPath!;

//         expect(parentPath.intendedTargetType).toBe(EpubCfiIntendedTargetType.TEXT);
//         expect(parentPath.documentUrl.toString()).toBe('com.colibrio://something/testChapter1.xhtml');
//         expect(isTextNode(parentPath.container)).toBeTruthy();
//         expect(isTextNode(parentPath.getTargetNode())).toBeTruthy();
//         expect(parentPath.offset).toBe(0);
//         expect(parentPath.container.parentNode!.nodeName).toBe('h2');
//         expect((parentPath.container as Text).data).toBe('CHAPTER I');

//         expect(parentPath.isMissingXmlIdAssertions()).toBeFalsy();

//         let range = resolvedTarget.createDomRange()!;
//         expect(range.collapsed).toBeTruthy();
//         expect(range.startContainer).toBe(parentPath.container);
//         expect(range.startOffset).toBe(parentPath.offset);
//         range.detach();
//     });

//     it('should resolve to a text location within the example EPUB using the async api', () => {
//         // let resolver = new EpubCfiResolver(xmlDocument, 'testBookOpf.xml');
//         let resolvedTarget = resolveEpubCfi('epubcfi(/6/8!/4/2/2/2/1[;s=b])');

//         expect(resolvedTarget.hasErrors()).toBeFalsy();
//         expect(resolvedTarget.hasWarnings()).toBeTruthy();
//         expect(resolvedTarget.isMissingXmlIdAssertions()).toBeTruthy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeFalsy();
//         expect(resolvedTarget.isDomRange()).toBeFalsy();
//         expect(resolvedTarget.hasRangePaths()).toBeFalsy();
//         expect(resolvedTarget.getSideBias()).toBe(EpubCfiSideBias.BEFORE);
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.getTargetElement()).toBeNull();

//         let parentPath = resolvedTarget.parentPath!;

//         expect(parentPath.intendedTargetType).toBe(EpubCfiIntendedTargetType.TEXT);
//         expect(parentPath.documentUrl.toString()).toBe('com.colibrio://something/testChapter1.xhtml');
//         expect(isTextNode(parentPath.container)).toBeTruthy();
//         expect(isTextNode(parentPath.getTargetNode())).toBeTruthy();
//         expect(parentPath.offset).toBe(0);
//         expect(parentPath.container.parentNode!.nodeName).toBe('h2');
//         expect((parentPath.container as Text).data).toBe('CHAPTER I');

//         let range = resolvedTarget.createDomRange()!;
//         expect(range.collapsed).toBeTruthy();
//         expect(range.startContainer).toBe(parentPath.container);
//         expect(range.startOffset).toBe(parentPath.offset);
//         range.detach();
//     });

//     it('should resolve to an element range within the example EPUB', () => {
//         let resolvedTarget = resolveEpubCfi('epubcfi(/6/8!/4/2[chapter-i]/2,/0,/4)');

//         expect(resolvedTarget.hasErrors()).toBeFalsy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeFalsy();
//         expect(resolvedTarget.isDomRange()).toBeTruthy();
//         expect(resolvedTarget.hasRangePaths()).toBeTruthy();
//         expect(resolvedTarget.getSideBias()).toBeNull();
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.rangeStartPath!.virtualTarget).toBe(EpubCfiVirtualTarget.FIRST_CHILD);
//         expect(resolvedTarget.rangeEndPath!.virtualTarget).toBe(EpubCfiVirtualTarget.LAST_CHILD);

//         let range = resolvedTarget.createDomRange()!;
//         expect(range).not.toBeNull();
//         expect(range.collapsed).toBeFalsy();

//         let startContainer = range.startContainer as Element;
//         let endContainer = range.endContainer as Element;
//         expect(startContainer.nodeName).toBe('div');
//         expect(endContainer.nodeName).toBe('div');
//         expect(startContainer.getAttribute('class')).toBe('chapter-title-wrap');
//         expect(endContainer.getAttribute('class')).toBe('chapter-title-wrap');
//         expect(range.startOffset).toBe(0);
//         expect(range.endOffset).toBe(endContainer.childNodes.length);
//         range.detach();
//     });

//     it('should resolve to a text range in the example EPUB', () => {
//         let resolvedTarget = resolveEpubCfi('epubcfi(/6/8!/4/2[chapter-i]/4/2/1,:6,:11)');
//         expect(resolvedTarget.hasErrors()).toBeFalsy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeFalsy();
//         expect(resolvedTarget.isDomRange()).toBeTruthy();
//         expect(resolvedTarget.hasRangePaths()).toBeTruthy();
//         expect(resolvedTarget.getSideBias()).toBeNull();
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.hasElementOffsets()).toBeFalsy();
//         expect(resolvedTarget.rangeStartPath!.virtualTarget).toBeNull();
//         expect(resolvedTarget.rangeEndPath!.virtualTarget).toBeNull();
//         expect(resolvedTarget.rangeStartPath!.intendedTargetType).toBe(EpubCfiIntendedTargetType.TEXT);
//         expect(resolvedTarget.rangeEndPath!.intendedTargetType).toBe(EpubCfiIntendedTargetType.TEXT);

//         let range = resolvedTarget.createDomRange()!;
//         expect(range.toString()).toBe('ipsum');
//         range.detach();
//     });

//     it('should give an invalid target if not redirected from OPF', () => {
//         let resolver = new EpubCfiResolver('epubcfi(/6/8)');

//         let parser = new DOMParser();
//         let currentDocument = parser.parseFromString(testOpf, 'application/xml');
//         let currentDocUrl = new URL('com.colibrio://something/testBookOpf.xml');

//         let indirectionResult = resolver.continueResolving(currentDocument, currentDocUrl);
//         expect(indirectionResult).toBeNull();

//         let resolvedTarget = resolver.getResolvedTarget();

//         expect(resolvedTarget.hasErrors()).toBeTruthy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeTruthy();
//         expect(resolvedTarget.isDomRange()).toBeFalsy();
//         expect(resolvedTarget.createDomRange()).toBeNull();
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.hasElementOffsets()).toBeFalsy();

//         let targetElement = resolvedTarget.getTargetElement()!;
//         expect(targetElement.nodeName).toBe('itemref');
//     });

//     it('should resolve epubcfi(/6/8!) and epubcfi(/6/8!/0) to content document', () => {

//         let resolvedTarget = resolveEpubCfi('epubcfi(/6/8!)');

//         expect(resolvedTarget.hasErrors()).toBeFalsy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeFalsy();
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.hasElementOffsets()).toBeFalsy();
//         let range = resolvedTarget.createDomRange()!;
//         expect((range.startContainer.childNodes[range.startOffset] as Element).localName).toBe('html');

//         resolvedTarget = resolveEpubCfi('epubcfi(/6/8!/0)');
//         expect(resolvedTarget.hasErrors()).toBeFalsy();
//         expect(resolvedTarget.isTargetingOpfDocument()).toBeFalsy();
//         expect(resolvedTarget.isOwnedBySingleDocument()).toBeTruthy();
//         expect(resolvedTarget.hasElementOffsets()).toBeFalsy();
//         range = resolvedTarget.createDomRange()!;
//         expect((range.startContainer as Element).localName).toBe('html');
//     });

//     it('should resolve epubcfi(/6,/8!/4/2[chapter-i],/10!/4/2[chapter-ii]/4) to a range partially covering 2 documents', () => {
//         let resolver = new EpubCfiResolver('epubcfi(/6,/8!/4/2[chapter-i],/10!/4/2[chapter-ii]/4)');

//         let parser = new DOMParser();
//         let currentDocument = parser.parseFromString(testOpf, 'application/xml');
//         let currentDocUrl = new URL('com.colibrio://something/testBookOpf.xml');

//         let indirectionResult = resolver.continueResolving(currentDocument, currentDocUrl);

//         expect(indirectionResult).not.toBeNull();

//         expect(indirectionResult?.documentUrl.toString()).toBe('com.colibrio://something/testBookOpf.xml');
//         expect(indirectionResult?.element.localName).toBe('itemref');
//         expect(indirectionResult?.element.getAttribute('idref')).toBe('chapter-001');

//         // Check that Both start and end document itemref has been reached
//         const resolvedTarget = resolver.getResolvedTarget();

//         expect(resolvedTarget.parentPath).not.toBeNull();
//         expect(resolvedTarget.rangeStartPath).not.toBeNull();
//         expect(resolvedTarget.rangeEndPath).not.toBeNull();

//         expect(resolvedTarget.parentPath!.indirectionsResolved).toBe(true);
//         expect(resolvedTarget.rangeStartPath!.indirectionsResolved).toBe(false);
//         expect(resolvedTarget.rangeEndPath!.indirectionsResolved).toBe(false);

//         const startPathElement = resolvedTarget.rangeStartPath!.getTargetElement();
//         expect(startPathElement?.localName).toBe('itemref');
//         expect(startPathElement?.getAttribute('idref')).toBe('chapter-001');

//         const endPathElement = resolvedTarget.rangeEndPath!.getTargetElement();
//         expect(endPathElement?.localName).toBe('itemref');
//         expect(endPathElement?.getAttribute('idref')).toBe('chapter-002');

//         const chapterDoc = parser.parseFromString(testChapter1, 'application/xhtml+xml');

//         indirectionResult = resolver.continueResolving(chapterDoc, new URL('com.colibrio://something/testChapter1.xhtml'));

//         expect(resolvedTarget.rangeStartPath!.indirectionsResolved).toBe(true);
//         expect(resolvedTarget.rangeEndPath!.indirectionsResolved).toBe(false);

//         expect(indirectionResult?.documentUrl.toString()).toBe('com.colibrio://something/testBookOpf.xml');
//         expect(indirectionResult?.element.localName).toBe('itemref');
//         expect(indirectionResult?.element.getAttribute('idref')).toBe('chapter-002');

//         const chapter2Doc = parser.parseFromString(testChapter2, 'application/xhtml+xml');

//         indirectionResult = resolver.continueResolving(chapter2Doc, new URL('com.colibrio://something/testChapter2.xhtml'));

//         expect(indirectionResult).toBeNull();

//         expect(resolvedTarget.rangeEndPath!.indirectionsResolved).toBe(true);

//         expect(resolvedTarget.isDomRange()).toBe(false);
//         expect(resolvedTarget.rangeStartPath?.getTargetElement()?.id).toBe('chapter-i');
//         expect(resolvedTarget.rangeEndPath?.getTargetElement()?.parentElement?.id).toBe('chapter-ii');

//     });

//     it('should resolve epubcfi(/6,/8!/4/2[chapter-i],/10) so that endRange is finished first', () => {
//         let resolver = new EpubCfiResolver('epubcfi(/6,/8!/4/2[chapter-i],/10)');

//         let parser = new DOMParser();
//         let currentDocument = parser.parseFromString(testOpf, 'application/xml');
//         let currentDocUrl = new URL('com.colibrio://something/testBookOpf.xml');

//         let indirectionResult = resolver.continueResolving(currentDocument, currentDocUrl);
//         expect(indirectionResult).not.toBeNull();

//         // Check that Both start and end document itemref has been reached
//         const resolvedTarget = resolver.getResolvedTarget();

//         expect(resolvedTarget.parentPath).not.toBeNull();
//         expect(resolvedTarget.rangeStartPath).not.toBeNull();
//         expect(resolvedTarget.rangeEndPath).not.toBeNull();

//         expect(resolvedTarget.parentPath!.indirectionsResolved).toBe(true);
//         expect(resolvedTarget.rangeStartPath!.indirectionsResolved).toBe(false);
//         expect(resolvedTarget.rangeEndPath!.indirectionsResolved).toBe(true);
//     });

// });
