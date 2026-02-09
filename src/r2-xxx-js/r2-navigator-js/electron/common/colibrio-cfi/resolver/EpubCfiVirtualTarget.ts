/**
 * EPUB CFIs can point to non-existing virtual elements at the very beginning of an element container and at the very end of an element container.
 * See http://www.idpf.org/epub/linking/cfi/epub-cfi.html#sec-path-child-ref for a more in-depth explanation.
 */
export enum EpubCfiVirtualTarget {
    'FIRST_CHILD' = 'FIRST_CHILD',
    'LAST_CHILD' = 'LAST_CHILD'
}
