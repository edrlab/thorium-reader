import * as React from 'react';
import { install, publication, note, locator, record, AuditCase } from './fixture-base';
import { rootReducer } from 'readium-desktop/renderer/reader/redux/reducers';
import { BookmarkLocatorInfo } from 'readium-desktop/renderer/reader/components/BookmarkLocatorInfo';
import { ImageClickManagerImgViewerOnly } from 'readium-desktop/renderer/reader/components/ImageClickManagerViewerOnly';
import { AnnotationCard } from 'readium-desktop/renderer/reader/components/ReaderMenu/AnnotationCard';
import { BookmarkCard } from 'readium-desktop/renderer/reader/components/ReaderMenu/BookmarkCard';
import { DivinaSetReadingMode } from 'readium-desktop/renderer/reader/components/ReaderSettings/DivinaSetReadingMode';
import { PublicationInfoReaderWithRAC, PublicationInfoReaderWithRACTrigger, PublicationInfoReaderWithRACContent } from 'readium-desktop/renderer/reader/components/dialog/publicationInfos/PublicationInfo';
import LoaderSearch from 'readium-desktop/renderer/reader/components/picker/LoaderSearch';
const reader = (p: string) => 'src/renderer/reader/components/' + p;
const cases: Record<string, AuditCase> = {};
const add = (id: string, files: string[], render: () => React.ReactNode, state?: (s: any) => void) => cases[id] = { files, render, state };
function Card({ bookmark = false }) {
    const [edited, setEdited] = React.useState(false);
    const props = { isEdited: edited, triggerEdition: setEdited, isSelected: false, goToLocator: record, goToPdfAnnotation: record, setTagFilter: record, setCreatorFilter: record };
    return bookmark ? <BookmarkCard bookmark={{ ...note, group: 'bookmark' }} {...props} /> : <AnnotationCard annotation={note} {...props} />;
}
function Divina() { const [mode, setMode] = React.useState('single'); return <DivinaSetReadingMode divinaReadingMode="single" {...{ divinaReadingMode: mode, handleDivinaReadingMode: setMode, divinaReadingModeSupported: ['single', 'double', 'scroll'] } as any} />; }
add('bookmark-locator', [reader('BookmarkLocatorInfo.tsx')], () => <BookmarkLocatorInfo locatorExtended={locator} fallback="Audit location" />);
add('image-viewer', [reader('ImageClickManagerViewerOnly.tsx')], () => <ImageClickManagerImgViewerOnly />, s => s.img = { open: true, isSVGFragment: false, HTMLImgSrc_SVGImageHref_SVGFragmentMarkup: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="navy"/><circle cx="200" cy="150" r="80" fill="white"/></svg>'), altAttributeOf_HTMLImg_SVGImage_SVGFragment: 'White circle on a blue rectangle', titleAttributeOf_HTMLImg_SVGImage_SVGFragment: 'Audit illustration', naturalWidthOf_HTMLImg_SVGImage: 400, naturalHeightOf_HTMLImg_SVGImage: 300 });
add('annotation-card', [reader('ReaderMenu/AnnotationCard.tsx')], () => <ul><Card /></ul>);
add('bookmark-card', [reader('ReaderMenu/BookmarkCard.tsx')], () => <ul><Card bookmark /></ul>);
add('divina-modes', [reader('ReaderSettings/DivinaSetReadingMode.tsx')], () => <Divina />);
add('publication-information', [reader('dialog/publicationInfos/PublicationInfo.tsx'), reader('dialog/publicationInfos/TagManager.tsx')], () => <PublicationInfoReaderWithRAC handlePublicationInfo={open => { const store = (window as any).auditStore; record('publication-info-open', open); store.dispatch({ type: 'AUDIT_SET', payload: { dialog: { ...store.getState().dialog, open } } }); }}><PublicationInfoReaderWithRACTrigger asChild><button>Publication information</button></PublicationInfoReaderWithRACTrigger><PublicationInfoReaderWithRACContent /></PublicationInfoReaderWithRAC>, s => s.dialog = { open: true, type: 'publication-info-reader', data: { publication, readerReadingLocation: locator, focusWhereAmI: false } });
add('search-loading', [reader('picker/LoaderSearch.tsx')], () => <LoaderSearch />, s => s.search.state = 'busy');
const reducer = rootReducer();
install('reader', (state: any, action: any) => {
    const s = reducer(state, action);
    if (!state) { s.reader.info = { ...s.reader.info, publicationIdentifier: publication.identifier, r2Publication: { Metadata: { Title: 'Audit publication' } } }; s.creator = { ...s.creator, id: 'audit-creator', name: 'Audit creator' }; }
    return s;
}, cases);
