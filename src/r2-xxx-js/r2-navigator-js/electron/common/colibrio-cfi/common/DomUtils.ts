

export class DomUtils {

    /**
     * Get the offset of the node inside its parent.
     *
     * @param node
     */
    static getNodeIndex(node: Node): number {
        let index = 0;

        let currentNode: Node | null = node;

        while (currentNode = currentNode.previousSibling) {
            index++;
        }
        return index;
    }

    static getElementIndex(element: Element): number {
        let index = 0;

        while (element = element.previousElementSibling!) {
            index++;
        }
        return index;
    }

}
