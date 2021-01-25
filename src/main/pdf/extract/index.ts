import { PDFExtractResult } from "./extract.type";

export const extractPDFData =
    async (pdfPath: string)
        : Promise<[data: PDFExtractResult, coverPNG: Buffer]> => {

        throw new Error("not implemented");
    }
