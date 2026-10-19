import * as React from 'react';
import { install, __, publication, note, locator, record, AuditCase } from './fixture-base';
import { rootReducer } from 'readium-desktop/renderer/reader/redux/reducers';
import { BookmarkLocatorInfo } from 'readium-desktop/renderer/reader/components/BookmarkLocatorInfo';
import { ImageClickManagerImgViewerOnly } from 'readium-desktop/renderer/reader/components/ImageClickManagerViewerOnly';
import { AnnotationCard } from 'readium-desktop/renderer/reader/components/ReaderMenu/AnnotationCard';
import { BookmarkCard } from 'readium-desktop/renderer/reader/components/ReaderMenu/BookmarkCard';
import { DivinaSetReadingMode } from 'readium-desktop/renderer/reader/components/ReaderSettings/DivinaSetReadingMode';
import { PublicationInfoReaderWithRAC, PublicationInfoReaderWithRACTrigger, PublicationInfoReaderWithRACContent } from 'readium-desktop/renderer/reader/components/dialog/publicationInfos/PublicationInfo';
import LoaderSearch from 'readium-desktop/renderer/reader/components/picker/LoaderSearch';
import { FontSize } from 'readium-desktop/renderer/reader/components/ReaderSettings/FontSize';
import { ReadingSpacing } from 'readium-desktop/renderer/reader/components/ReaderSettings/ReadingSpacing';
import { ReadingAudio } from 'readium-desktop/renderer/reader/components/ReadingAudio';
import Description from 'readium-desktop/renderer/common/components/dialog/publicationInfos/PublicationInfoDescription';
import ToastManager from 'readium-desktop/renderer/common/components/toast/ToastManager';
import * as Dialog from 'readium-desktop/renderer/common/components/Dialog';
import FilterPopover from 'readium-desktop/renderer/reader/components/ReaderMenu/FilterPopover';
import * as FilterIcon from 'readium-desktop/renderer/assets/icons/filter3-icon.svg';
import type { Selection } from 'react-aria-components';
const reader = (p: string) => 'src/renderer/reader/components/' + p;
const cases: Record<string, AuditCase> = {};
const add = (id: string, files: string[], render: () => React.ReactNode, state?: (s: any) => void) => cases[id] = { files, render, state };
function Filters({ empty = false }) {
    const [open, setOpen] = React.useState(false);
    const [tags, setTags] = React.useState<Selection>('all');
    const [colors, setColors] = React.useState<Selection>('all');
    const [draw, setDraw] = React.useState<Selection>('all');
    const [creators, setCreators] = React.useState<Selection>('all');
    const change = (key: string, setter: (s: Selection) => void) => (s: Selection) => { record('filter', key, s === 'all' ? s : [...s]); setter(s); };
    return <FilterPopover filterOpen={open} setFilterOpen={setOpen} nbOfFilters={0}
        tagArrayFilter={tags} setTagArrayFilter={change('tags', setTags)} selectTagOption={empty ? [] : [{ name: 'Research' }, { name: 'To read' }]}
        colorArrayFilter={colors} setColorArrayFilter={change('colors', setColors)} colorSet={[{ name: 'Yellow', hex: '#ffff00' }, { name: 'Green', hex: '#00ff00' }]}
        drawTypeArrayFilter={draw} setDrawTypeArrayFilter={change('draw', setDraw)} selectDrawtypesOptions={[{ name: 'underline', textValue: 'Underline', svg: FilterIcon }]}
        creatorArrayFilter={creators} setCreatorArrayFilter={change('creators', setCreators)} selectCreatorOptions={empty ? [] : [{ name: 'Audit creator' }]} />;
}
function Panel({ initialMode }: { initialMode: string }) {
    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState(initialMode);
    const content = <><Dialog.Title>Audit panel</Dialog.Title><button onClick={() => setMode('left')}>Dock left</button><button onClick={() => setMode('right')}>Dock right</button><button onClick={() => setMode('modal')}>Show modal</button><Dialog.Close>Close panel</Dialog.Close></>;
    return <Dialog.Root modal={mode === 'modal'} isOpen={open} onOpenChange={setOpen}>
        <Dialog.Trigger>Open audit panel</Dialog.Trigger>
        <Dialog.Portal>{mode === 'modal' ? <Dialog.Content>{content}</Dialog.Content> : <Dialog.DockedContent style={{ border: '2px solid blue', padding: 20, width: 350, marginLeft: mode === 'right' ? 'auto' : 0 }}>{content}</Dialog.DockedContent>}</Dialog.Portal>
    </Dialog.Root>;
}
add('filter-controls', [reader('ReaderMenu/FilterPopover.tsx')], () => <Filters />);
add('filter-controls-empty', [reader('ReaderMenu/FilterPopover.tsx')], () => <Filters empty />);
for (const mode of ['left', 'right', 'modal']) add('panel-' + mode, ['src/renderer/common/components/Dialog.tsx'], () => <Panel initialMode={mode} />);
add('toast', ['src/renderer/common/components/toast/Toast.tsx', 'src/renderer/common/components/toast/ToastManager.tsx'], () => <ToastManager />);
cases.toast.after = () => (window as any).auditStore.dispatch({ type: 'AUDIT_SET', payload: { toast: { type: 'success', data: 'Audit notification. ' + 'Detailed notification text. '.repeat(14) } } });
add('font-settings', [reader('ReaderSettings/FontSize.tsx')], () => <FontSize />);
add('spacing-settings', [reader('ReaderSettings/Slider.tsx'), reader('ReaderSettings/ReadingSpacing.tsx')], () => <ReadingSpacing />);
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
add('audio-preview', [reader('ReadingAudio.tsx')], () => <ReadingAudio useMO={false} ttsState={0 as any} ttsPause={record} ttsResume={record} />);
add('long-description', ['src/renderer/common/components/dialog/publicationInfos/PublicationInfoDescription.tsx'], () => <Description publicationViewMaybeOpds={publication} __={__} />);
const reducer = rootReducer();
install('reader', (state: any, action: any) => {
    const s = reducer(state, action);
    if (!state) { s.reader.info = { ...s.reader.info, publicationIdentifier: publication.identifier, r2Publication: { Metadata: { Title: 'Audit publication' } } }; s.creator = { ...s.creator, id: 'audit-creator', name: 'Audit creator' }; }
    return s;
}, cases);
