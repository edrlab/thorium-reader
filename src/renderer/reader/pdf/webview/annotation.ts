
export const createAnnotationDiv = (rootElement: HTMLElement) => {

    const annotationDiv = document.createElement("div");
    annotationDiv.setAttribute("id", "annotation-layer");
    rootElement.appendChild(annotationDiv);

    return annotationDiv;
};
