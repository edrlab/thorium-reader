
/**
 * Base interface used for all nodes in an EPUB CFI AST (Abstract syntax tree)
 *
 **/
export declare interface IEpubCfiNode {
    /**
     * The character offset within the source EPUB CFI string corresponding to this node.
     */
    srcOffset?: number | undefined;
}
