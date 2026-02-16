import {CharCode} from '../common/definitions/CharCode';
import {isString} from '../common/Utils';
import {EpubCfiTokenType} from './EpubCfiTokenType';
import {EpubCfiToken} from './tokens/EpubCfiToken';
import {IEpubCfiAssertionToken} from './tokens/IEpubCfiAssertionToken';
import {EpubCfiNumberTokenType, IEpubCfiNumberToken} from './tokens/IEpubCfiNumberToken';
import {EpubCfiStringTokenType, IEpubCfiStringToken} from './tokens/IEpubCfiStringToken';
import {IEpubCfiValueToken} from './tokens/IEpubCfiValueToken';

/**
 * A lexer implementation for Epub CFI strings.
 * Generates EpubCfiTokens from a string containing an epubcfi(...).
 */
export class EpubCfiLexer {

    readonly src: string;
    private endReached: boolean = false;
    private nextOffset: number;
    private nextToken: EpubCfiToken | undefined;
    private srcModified: boolean;

    /**
     * Constructs a new EpubCfiLexer from a source string.
     * The input string is expected to be a valid Unicode string.
     * As strings in Javascript are UTF-16, it means that the string can have surrogate pairs for Unicode values between #x10000-#x10FFFF.
     *
     * The lexer is forgiving and will search for the first occurence of "epubcfi(" and use that as the starting point.
     *
     * @param src - The src string containing: epubcfi(...)
     */
    constructor(src: string) {
        // As we are working in UTF-16 we will have surrogate pairs for all Unicode characters between code points #x10000-#x10FFFF
        // Reference: https://w3c.github.io/epub-specs/epub33/epubcfi/#unicode-chars
        this.src = isString(src) ? src.replace(/[^\x09\x0A\x0D\u0020-\uFFFD]/g, '') : '';

        const epubCfiStart = this.src.indexOf('epubcfi(');
        if (epubCfiStart > 0) {
            this.src = this.src.substring(epubCfiStart);
        }

        if (epubCfiStart === -1) {
            this.nextOffset = 0;
            this.endReached = true;
            this.nextToken = {
                type: EpubCfiTokenType.BAD_TOKEN,
                value: this.src,
                srcOffset: 0,
            };
        } else {
            this.nextOffset = 8;
            this.nextToken = {
                type: EpubCfiTokenType.EPUBCFI_START,
                value: 'epubcfi(',
                srcOffset: 0,
            };
        }

        this.srcModified = this.src !== src;
    }

    getNextOffset(): number {
        return this.nextOffset;
    }

    isSrcModified(): boolean {
        return this.srcModified;
    }

    next(): EpubCfiToken | undefined {
        if (this.nextToken) {
            const nextToken = this.nextToken;
            this.nextToken = undefined;
            return nextToken;
        }
        return this.getNextToken();
    }

    peek(): EpubCfiToken | undefined {
        if (!this.nextToken) {
            this.nextToken = this.getNextToken();
        }
        return this.nextToken;
    }

    /**
     * Consumes an assertion token, adding tokens until an unescaped ] is found
     */
    private consumeAssertionToken(assertionOffset: number): IEpubCfiAssertionToken {

        let consuming = true;
        const tokens: (IEpubCfiValueToken | IEpubCfiStringToken)[] = [];

        while (consuming) {
            let token: IEpubCfiStringToken | IEpubCfiValueToken | undefined;
            const offset = this.nextOffset++;
            const charCode = this.src.charCodeAt(offset);

            if (charCode === CharCode.COMMA) {
                token = createStringToken(EpubCfiTokenType.COMMA, ',', offset);

            } else if (charCode === CharCode.SEMICOLON) {
                token = createStringToken(EpubCfiTokenType.SEMICOLON, ';', offset);

            } else if (charCode === CharCode.EQUAL_SIGN) {
                token = createStringToken(EpubCfiTokenType.EQUAL_SIGN, '=', offset);

            } else if (charCode === CharCode.RIGHT_SQUARE_BRACKET) {
                consuming = false;
            } else if (isNaN(charCode)) {
                token = createStringToken(EpubCfiTokenType.INVALID_END, '', offset);
                consuming = false;

            } else if (charCode === CharCode.LEFT_SQUARE_BRACKET || charCode === CharCode.LEFT_PARENTHESIS || charCode === CharCode.RIGHT_PARENTHESIS) {
                token = createStringToken(EpubCfiTokenType.BAD_TOKEN, String.fromCharCode(charCode), offset);

            } else {
                token = this.consumeValue(offset);
            }

            if (token) {
                tokens.push(token);
            }
        }

        return createAssertionToken(tokens, assertionOffset);
    }

    private consumeBadStringToken(startOffset: number): IEpubCfiStringToken {
        let offset = this.nextOffset;
        while (isAsciiLetterOrNonAscii(this.src.charCodeAt(offset))) {
            // Will also catch surrogate pairs
            offset++;
        }
        this.nextOffset = offset;
        return createStringToken(EpubCfiTokenType.BAD_TOKEN, this.src.substring(startOffset, offset), startOffset);
    }

    /**
     * Consumes a NUMBER token. A number in epubcfi can only be a sequence of integers and optionally a full stop (.) followed by at least one integer
     */
    private consumeNumber(offset: number): IEpubCfiNumberToken {
        let nextOffset = this.nextOffset;
        let charCode: number;

        while (isDigit(charCode = this.src.charCodeAt(nextOffset))) {
            nextOffset++;
        }

        if (charCode === CharCode.FULL_STOP && isDigit(this.src.charCodeAt(nextOffset + 1))) {
            nextOffset += 2;

            while (isDigit(charCode = this.src.charCodeAt(nextOffset))) {
                nextOffset++;
            }
        }

        this.nextOffset = nextOffset;
        return createNumberToken(EpubCfiTokenType.NUMBER, Number(this.src.substring(offset, nextOffset)), offset);
    }

    private consumeStepReference(offset: number): IEpubCfiNumberToken | IEpubCfiStringToken {
        let nextOffset = this.nextOffset;
        const numberStartOffset = nextOffset;

        while (isDigit(this.src.charCodeAt(nextOffset))) {
            nextOffset++;
        }

        this.nextOffset = nextOffset;

        return numberStartOffset === nextOffset ?
            createStringToken(EpubCfiTokenType.BAD_TOKEN, '/', offset) :
            createNumberToken(EpubCfiTokenType.STEP, Number(this.src.substring(numberStartOffset, nextOffset)), numberStartOffset);

    }

    private consumeValue(startOffset: number): IEpubCfiValueToken {
        let offset = startOffset;
        let valueStartOffset = startOffset;
        let hasSpaces = false;
        let value = '';
        let consuming = true;

        while (consuming) {
            let charCode = this.src.charCodeAt(offset);

            // A circumflex accent is a "^" sign
            if (charCode === CharCode.CIRCUMFLEX_ACCENT) {
                charCode = this.src.charCodeAt(offset + 1);

                if (isNaN(charCode)) {
                    consuming = false;
                } else {
                    value += this.src.substring(valueStartOffset, offset);

                    if (isHighSurrogateCharCode(charCode)) {
                        value += String.fromCharCode(charCode, this.src.charCodeAt(offset + 2));
                        offset += 3;
                    } else {
                        value += String.fromCharCode(charCode);
                        offset += 2;
                    }

                    valueStartOffset = offset;
                }
            } else if (isInvalidValueChar(charCode) || isNaN(charCode)) {
                consuming = false;
            } else {
                if (charCode === CharCode.SPACE) {
                    hasSpaces = true;
                }

                offset++;
            }
        }

        this.nextOffset = offset;
        return createValueToken(value + this.src.substring(valueStartOffset, offset), startOffset, hasSpaces);
    }

    private getNextToken(): EpubCfiToken | undefined {
        if (this.endReached) {
            return undefined;
        }

        const offset = this.nextOffset++;

        const charCode = this.src.charCodeAt(offset);
        let token: EpubCfiToken | undefined;

        if (charCode === CharCode.EXCLAMATION_MARK) {
            token = createStringToken(EpubCfiTokenType.EXCLAMATION_MARK, '!', offset);

        } else if (charCode === CharCode.COMMA) {
            token = createStringToken(EpubCfiTokenType.COMMA, ',', offset);

        } else if (charCode === CharCode.SOLIDUS) {
            token = this.consumeStepReference(offset);

        } else if (charCode === CharCode.COLON) {
            token = createStringToken(EpubCfiTokenType.COLON, ':', offset);

        } else if (charCode === CharCode.COMMERCIAL_AT) {
            token = createStringToken(EpubCfiTokenType.COMMERCIAL_AT, '@', offset);

        } else if (charCode === CharCode.TILDE) {
            token = createStringToken(EpubCfiTokenType.TILDE, '~', offset);

        } else if (charCode === CharCode.LEFT_SQUARE_BRACKET) {
            token = this.consumeAssertionToken(offset);

        } else if (charCode === CharCode.RIGHT_PARENTHESIS) {
            token = createStringToken(EpubCfiTokenType.EPUBCFI_END, ')', offset);
            this.endReached = true;

        } else if (isNaN(charCode)) {
            token = createStringToken(EpubCfiTokenType.INVALID_END, '', offset);
            this.endReached = true;

        } else if (isDigit(charCode)) {
            token = this.consumeNumber(offset);

        } else {
            token = this.consumeBadStringToken(offset);
        }

        return token;
    }

}

function createAssertionToken(
    tokens: (IEpubCfiStringToken | IEpubCfiValueToken)[],
    offset: number,
): IEpubCfiAssertionToken {
    return {
        type: EpubCfiTokenType.ASSERTION,
        value: tokens,
        srcOffset: offset,
    };
}

function createNumberToken(type: EpubCfiNumberTokenType, value: number, offset: number): IEpubCfiNumberToken {
    return {
        type: type,
        value: value,
        srcOffset: offset,
    };
}

function createStringToken(type: EpubCfiStringTokenType, value: string, offset: number): IEpubCfiStringToken {
    return {
        type: type,
        value: value,
        srcOffset: offset,
    };
}

function createValueToken(value: string, offset: number, hasSpaces: boolean): IEpubCfiValueToken {
    return {
        type: EpubCfiTokenType.VALUE,
        value: value,
        srcOffset: offset,
        hasSpaces: hasSpaces,
    };
}

/**
 * If the charCode is an Ascii letter code (a-z or A-Z) or if it larger than 0x80 (non-ascii code)
 */
function isAsciiLetterOrNonAscii(charCode: number): boolean {
    return charCode > CharCode.NON_ASCII_CODE_POINT_START ||
        (charCode >= CharCode.LOWERCASE_LETTER_A && charCode <= CharCode.LOWERCASE_LETTER_Z) ||
        (charCode >= CharCode.UPPERCASE_LETTER_A && charCode <= CharCode.LOWERCASE_LETTER_A);
}

function isDigit(charCode: number): boolean {
    return charCode >= CharCode.DIGIT_0 && charCode <= CharCode.DIGIT_9;
}

function isHighSurrogateCharCode(charCode: number): boolean {
    return charCode >= CharCode.HIGH_SURROGATE_CODE_POINT_START && charCode <= CharCode.HIGH_SURROGATE_CODE_POINT_END;
}

function isInvalidValueChar(charCode: number): boolean {
    return charCode === CharCode.LEFT_SQUARE_BRACKET ||
        charCode === CharCode.RIGHT_SQUARE_BRACKET ||
        charCode === CharCode.LEFT_PARENTHESIS ||
        charCode === CharCode.RIGHT_PARENTHESIS ||
        charCode === CharCode.COMMA ||
        charCode === CharCode.SEMICOLON ||
        charCode === CharCode.EQUAL_SIGN;
}
