import {EpubCfiParserErrorType} from './EpubCfiParserErrorType';

/**
 * Describes an EPUB CFI parser error.
 */
export interface IEpubCfiParserError {
    /**
     * Where in the EPUB CFI string the error occurred.
     */
    srcOffset: number | undefined;

    /**
     * The type of error
     */
    type: EpubCfiParserErrorType;

    /**
     * The invalid character(s) in the EPUB CFI string that triggered the parser error.
     */
    value: string;
}
