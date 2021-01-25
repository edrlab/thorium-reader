import { IInfo } from "readium-desktop/common/pdf/common/pdfReader.type";
import { PDFExtractResult } from "./extract.type";

export const extractPDFData =
    async (pdfPath: string)
        : Promise<[data: IInfo, coverPNG: Buffer]> => {

        throw new Error("not implemented");
    }
