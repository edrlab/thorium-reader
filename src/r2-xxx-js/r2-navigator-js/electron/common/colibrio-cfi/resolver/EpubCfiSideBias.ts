/**
 * Describes if the desired position is just before or after the EPUB CFI target location.
 * For example, when resolving a location in a dynamically paginated environment,
 * it would make a difference if a location is attached to the content before or after it
 * (e.g., to determine whether to display the verso or recto side at a page break).
 *
 * See http://idpf.org/epub/linking/cfi/epub-cfi.html#sec-path-side-bias
 */
export enum EpubCfiSideBias {
    'BEFORE' = 'BEFORE',
    'AFTER' = 'AFTER'
}
