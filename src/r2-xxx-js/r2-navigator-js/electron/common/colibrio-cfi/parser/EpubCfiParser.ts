import {ArrayInputStream} from '../common/input-stream/ArrayInputStream';
import {IInputStream} from '../common/input-stream/IInputStream';
import {clamp, isNumber} from '../common/Utils';
import {EpubCfiLexer} from '../lexer/EpubCfiLexer';
import {EpubCfiTokenType} from '../lexer/EpubCfiTokenType';
import {IEpubCfiTokenTypeMapping} from '../lexer/IEpubCfiTokenTypeMapping';
import {EpubCfiToken} from '../lexer/tokens/EpubCfiToken';
import {IEpubCfiAssertionToken} from '../lexer/tokens/IEpubCfiAssertionToken';
import {IEpubCfiNumberToken} from '../lexer/tokens/IEpubCfiNumberToken';
import {IEpubCfiStringToken} from '../lexer/tokens/IEpubCfiStringToken';
import {IEpubCfiToken} from '../lexer/tokens/IEpubCfiToken';
import {IEpubCfiValueToken} from '../lexer/tokens/IEpubCfiValueToken';
import {IEpubCfiAssertionNode} from '../model/assertion/IEpubCfiAssertionNode';
import {IEpubCfiAssertionParameterNode} from '../model/assertion/IEpubCfiAssertionParameterNode';
import {IEpubCfiLocalPathNode} from '../model/IEpubCfiLocalPathNode';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {IEpubCfiStepNode} from '../model/IEpubCfiStepNode';
import {EpubCfiOffsetNode} from '../model/offset/EpubCfiOffsetNode';
import {EpubCfiOffsetType} from '../model/offset/EpubCfiOffsetType';
import {IEpubCfiCharacterOffsetNode} from '../model/offset/IEpubCfiCharacterOffsetNode';
import {IEpubCfiSpatialOffsetNode} from '../model/offset/IEpubCfiSpatialOffsetNode';
import {IEpubCfiTemporalOffsetNode} from '../model/offset/IEpubCfiTemporalOffsetNode';
import {EpubCfiParserErrorHelper} from './EpubCfiParserErrorHelper';
import {EpubCfiParserErrorType} from './EpubCfiParserErrorType';
import {IEpubCfiParserError} from './IEpubCfiParserError';

const MAX_NUM_VALUES_XML_ID_ASSERTION = 1;
const MAX_NUM_VALUES_TEXT_LOCATION_ASSERTION = 2;

/**
 * A 100% spec. compliant EPUB CFI parser that also performs validation and error reporting.
 * The parser is forgiving, trying to build a valid AST (Abstract Syntax Tree) from an EPUB CFI string, recovering from
 * many types of errors.
 *
 * The string is first processed by EpubCfiLexer which delivers a stream of tokens which is then consumed by this parser.
 *
 * Usage:
 * const epubCfiAst = EpubCfiParser.parse("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/1:3[xx,y])");
 */
export class EpubCfiParser {

    private readonly errors: IEpubCfiParserError[] = [];
    private readonly lexer: EpubCfiLexer;

    /**
     * Creates a new instance using the specified `epubCfiStr` as source string.
     * Note: `epubCfiStr` must not contain a leading '#' character.
     * For example:
     * ```
     * new EpubCfiParser("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/1:3[xx,y])")
     * ```
     */
    constructor(epubCfiStr: string) {
        this.lexer = new EpubCfiLexer(epubCfiStr);
    }

    /**
     * Parses an EPUB CFI string.
     * Example:
     * ```
     * const epubCfiAst = EpubCfiParser.parse("epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/1:3[xx,y])");
     * ```
     */
    static parse(epubCfi: string): IEpubCfiRootNode {
        const parser = new EpubCfiParser(epubCfi);
        return parser.parse();
    }

    /**
     * The "entry point" for starting parsing an epubcfi from the lexer.
     * Expects the lexer to start with an 'epucfi(' token followed by a non-empty main path.
     * The main path can optionally be followed by a rangeStart and a rangeEnd path.
     */
    parse(): IEpubCfiRootNode {
        let parentPath: IEpubCfiPathNode | null = null;
        let rangeStartPath: IEpubCfiPathNode | null = null;
        let rangeEndPath: IEpubCfiPathNode | null = null;
        let nextToken: IEpubCfiToken | undefined = this.consumeExpectedToken(EpubCfiTokenType.EPUBCFI_START, EpubCfiParserErrorType.INVALID_EPUBCFI_START);

        if (nextToken) {
            parentPath = this.consumePath();

            // Don't even consider ranges if there are errors in steps of the parent path
            const peekedToken = this.lexer.peek();
            if (peekedToken && peekedToken.type === EpubCfiTokenType.COMMA) {

                // We are starting a range!
                this.lexer.next();
                rangeStartPath = this.consumePath();

                if (this.consumeExpectedToken(EpubCfiTokenType.COMMA, EpubCfiParserErrorType.MISSING_END_RANGE)) {
                    rangeEndPath = this.consumePath();
                }
            }

            this.consumeExpectedToken(EpubCfiTokenType.EPUBCFI_END, EpubCfiParserErrorType.INVALID_EPUBCFI_END);
        }

        return {
            srcOffset: 0,
            src: this.lexer.src,
            srcModified: this.lexer.isSrcModified(),
            parentPath: parentPath,
            rangeStartPath: rangeStartPath,
            rangeEndPath: rangeEndPath,
            errors: this.errors,
        };
    }

    /**
     * Consumes an assertion. Assumes that the caller already consumed the passed assertion token.
     */
    private consumeAssertion(
        assertionToken: IEpubCfiAssertionToken,
        maxNumValues: number | undefined,
    ): IEpubCfiAssertionNode | null {
        const stream = new ArrayInputStream(assertionToken.value);
        const values: string[] = [];

        let nextToken = stream.peek();

        if (nextToken) {

            if (nextToken.type === EpubCfiTokenType.VALUE) {
                values.push(nextToken.value);
                stream.next();
                nextToken = stream.peek();
            } else if (nextToken.type === EpubCfiTokenType.COMMA) {
                values.push('');
            }

            while (nextToken && nextToken.type !== EpubCfiTokenType.SEMICOLON) {

                if (!this.consumeExpectedToken(EpubCfiTokenType.COMMA, EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken, stream)) {
                    return null;
                }

                const valueToken = this.consumeExpectedToken(EpubCfiTokenType.VALUE, EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken, stream);
                if (!valueToken) {
                    return null;
                }
                values.push(valueToken.value);

                nextToken = stream.peek();
            }
        }
        const parameters = this.consumeParameters(stream);

        if (isNumber(maxNumValues) && values.length > maxNumValues) {
            this.createError(EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken);
            return null;
        }

        if (values.length === 0 && parameters.length === 0) {
            this.createError(EpubCfiParserErrorType.INVALID_ASSERTION, assertionToken);
            return null;
        }

        return createAssertion(values, parameters, assertionToken.srcOffset);
    }

    private consumeCharacterOffset(colonToken: IEpubCfiStringToken): IEpubCfiCharacterOffsetNode | null {
        const offsetToken = this.consumeExpectedToken(EpubCfiTokenType.NUMBER, EpubCfiParserErrorType.INVALID_CHARACTER_OFFSET, colonToken);
        if (!offsetToken) {
            return null;
        }

        let assertion = null;
        const nextToken = this.lexer.peek();
        if (nextToken && nextToken.type === EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            assertion = this.consumeAssertion(nextToken, MAX_NUM_VALUES_TEXT_LOCATION_ASSERTION);
        }

        return {
            type: EpubCfiOffsetType.CHARACTER,
            srcOffset: colonToken.srcOffset,
            characterOffset: offsetToken.value,
            assertion: assertion,
        };
    }

    /**
     * Consumes and returns the next token, if and only if its type matches the expected type.
     * If it does not match the expected type, the token is not consumed and is instead added to this.errorTokens.
     *
     * @param expectedType - The expected token type to consume.
     * @param errorType - The error type if expected token not found.
     * @param previousToken - The previous token from the stream. This is used to add a meaningful srcOffset in case of unexpected end of stream.
     * @param stream - The stream to consume from. Defaults to this.lexer.
     */
    private consumeExpectedToken<TTokenType extends keyof IEpubCfiTokenTypeMapping>(
        expectedType: TTokenType,
        errorType: EpubCfiParserErrorType,
        previousToken?: IEpubCfiToken,
        stream?: IInputStream<EpubCfiToken>,
    ): IEpubCfiTokenTypeMapping[TTokenType] | undefined {
        stream = stream || this.lexer;
        const nextToken = stream.peek();
        if (!nextToken || nextToken.type !== expectedType) {
            this.createError(errorType, nextToken || createInvalidEndToken(previousToken ?
                previousToken.srcOffset :
                this.lexer.getNextOffset()));
            return undefined;
        }
        return stream.next() as IEpubCfiTokenTypeMapping[TTokenType];
    }

    private consumeLocalPaths(): IEpubCfiLocalPathNode[] {
        const localPaths: IEpubCfiLocalPathNode[] = [];
        let pathFinished = false;
        let peekedToken: EpubCfiToken | undefined;
        let indirection = false;

        while (!pathFinished && (peekedToken = this.lexer.peek())) {
            if (peekedToken.type === EpubCfiTokenType.STEP) {
                const steps = this.consumeSteps();
                localPaths.push({
                    steps: steps,
                    indirection: indirection,
                    srcOffset: peekedToken.srcOffset,
                });
                indirection = false;
            } else if (peekedToken.type === EpubCfiTokenType.EXCLAMATION_MARK) {
                if (indirection) {
                    this.createError(EpubCfiParserErrorType.INVALID_INDIRECTION, peekedToken);
                }
                indirection = true;
                this.lexer.next();
            } else {
                pathFinished = true;
            }
        }

        if (indirection && peekedToken) {
            localPaths.push({
                steps: [],
                indirection: true,
                srcOffset: peekedToken.srcOffset,
            });
        }

        return localPaths;
    }

    /**
     * Consumes an offset. Caller should make sure that the next character is starting an offset.
     * Only returns "valid" assertions depending on the value of previousStep and previousOffset
     *
     */
    private consumeOffset(): EpubCfiOffsetNode | null {
        let offset: EpubCfiOffsetNode | null = null;
        const nextToken = this.lexer.peek();
        if (nextToken) {
            if (nextToken.type === EpubCfiTokenType.TILDE) {
                this.lexer.next();
                offset = this.consumeTemporalOffset(nextToken);
            } else if (nextToken.type === EpubCfiTokenType.COMMERCIAL_AT) {
                this.lexer.next();
                offset = this.consumeSpatialOffset(nextToken);
            } else if (nextToken.type === EpubCfiTokenType.COLON) {
                this.lexer.next();
                offset = this.consumeCharacterOffset(nextToken);
            }
        }

        return offset;
    }

    /**
     * Consumes a Parameter, starting with ';'.
     * Returns null if parameter syntax is invalid.
     */
    private consumeParameter(stream: IInputStream<IEpubCfiStringToken | IEpubCfiValueToken>): IEpubCfiAssertionParameterNode | null {
        const semiColonToken = stream.next();
        const errorType = EpubCfiParserErrorType.INVALID_PARAMETER;
        if (!semiColonToken) {
            return null;
        }
        if (semiColonToken.type !== EpubCfiTokenType.SEMICOLON) {
            this.createError(errorType, semiColonToken);
            return null;
        }

        const nameToken = this.consumeExpectedToken(EpubCfiTokenType.VALUE, errorType, semiColonToken, stream);
        if (!nameToken) {
            return null;
        }
        if (nameToken.hasSpaces) {
            this.createError(errorType, nameToken);
            return null;
        }

        const equalSignToken = this.consumeExpectedToken(EpubCfiTokenType.EQUAL_SIGN, errorType, nameToken, stream);
        if (!equalSignToken) {
            return null;
        }

        let valueToken = this.consumeExpectedToken(EpubCfiTokenType.VALUE, errorType, semiColonToken, stream);
        if (!valueToken) {
            return null;
        }

        const values: string[] = [valueToken.value];
        let nextToken: IEpubCfiStringToken | IEpubCfiValueToken | undefined;

        while ((nextToken = stream.peek()) && nextToken.type !== EpubCfiTokenType.SEMICOLON) {
            stream.next();

            if (nextToken.type !== EpubCfiTokenType.COMMA) {
                this.createError(errorType, nextToken);
            } else {
                valueToken = this.consumeExpectedToken(EpubCfiTokenType.VALUE, errorType, nextToken, stream);
                if (valueToken) {
                    values.push(valueToken.value);
                }
            }
        }

        return {
            srcOffset: semiColonToken.srcOffset,
            name: nameToken.value,
            values: values,
        };
    }

    /**
     * Consumes a list of parameters. Expects the next token to be a ';' token. Parses the given stream until its end.
     */
    private consumeParameters(stream: IInputStream<IEpubCfiStringToken | IEpubCfiValueToken>): IEpubCfiAssertionParameterNode[] {
        const parameters: IEpubCfiAssertionParameterNode[] = [];
        while (stream.peek()) {
            const parameter = this.consumeParameter(stream);
            if (parameter) {
                parameters.push(parameter);
            }
        }
        return parameters;
    }

    private consumePath(): IEpubCfiPathNode | null {
        const srcOffset = this.lexer.getNextOffset();
        let localPaths: IEpubCfiLocalPathNode[] = [];
        let offset: EpubCfiOffsetNode | null = null;
        let peekedToken: IEpubCfiToken | undefined = this.lexer.peek();

        if (peekedToken && (peekedToken.type === EpubCfiTokenType.STEP || peekedToken.type === EpubCfiTokenType.EXCLAMATION_MARK)) {
            localPaths = this.consumeLocalPaths();
            peekedToken = this.lexer.peek();
        }

        if (peekedToken && isOffsetTokenType(peekedToken.type)) {
            offset = this.consumeOffset();
            peekedToken = this.lexer.peek();
        }

        return {
            offset: offset,
            localPaths: localPaths,
            srcOffset: srcOffset,
            complete: !!peekedToken && (peekedToken.type === EpubCfiTokenType.COMMA || peekedToken.type === EpubCfiTokenType.EPUBCFI_END),
        };
    }

    private consumeSpatialOffset(atToken: IEpubCfiStringToken): IEpubCfiSpatialOffsetNode | null {
        const errorType = EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET;
        const xToken = this.consumeExpectedToken(EpubCfiTokenType.NUMBER, errorType, atToken);
        if (!xToken) {
            return null;
        }

        let x = xToken.value;
        if (x < 0 || x > 100) {
            this.createError(EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET_VALUE, xToken);
            x = clamp(x, 0, 100);
        }

        const colonToken = this.consumeExpectedToken(EpubCfiTokenType.COLON, errorType, xToken);
        if (!colonToken) {
            return null;
        }

        const yToken = this.consumeExpectedToken(EpubCfiTokenType.NUMBER, errorType, colonToken);
        if (!yToken) {
            return null;
        }

        let y = yToken.value;
        if (y < 0 || y > 100) {
            this.createError(EpubCfiParserErrorType.INVALID_SPATIAL_OFFSET_VALUE, yToken);
            y = clamp(y, 0, 100);
        }

        const nextToken = this.lexer.peek();
        let assertion: IEpubCfiAssertionNode | null = null;
        if (nextToken && nextToken.type === EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            assertion = this.consumeAssertion(nextToken, 0);
        }

        return {
            type: EpubCfiOffsetType.SPATIAL,
            srcOffset: atToken.srcOffset,
            assertion: assertion,
            x: x,
            y: y,
        };
    }

    /**
     * Consumes a step including related assertion if any. Assumes that the step token itself if any, has already been consumed.
     *
     * @param stepToken - The consumed step token. Can be null if consuming an offset token (which can only happen at the start/end of a range)
     */
    private consumeStep(stepToken: IEpubCfiNumberToken): IEpubCfiStepNode {
        const isElementStep = stepToken.value % 2 === 0;
        const srcOffset = stepToken ? stepToken.srcOffset : this.lexer.getNextOffset();
        let assertion: IEpubCfiAssertionNode | null = null;

        const nextToken = this.lexer.peek();
        if (nextToken && nextToken.type === EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            if (isElementStep) {
                assertion = this.consumeAssertion(nextToken, MAX_NUM_VALUES_XML_ID_ASSERTION);
            } else {
                assertion = this.consumeAssertion(nextToken, 0);
            }
        }

        return {
            srcOffset: srcOffset,
            stepValue: stepToken.value,
            assertion: assertion,
        };
    }

    private consumeSteps(): IEpubCfiStepNode[] {
        let peekedToken: EpubCfiToken | undefined;
        const steps: IEpubCfiStepNode[] = [];
        while ((peekedToken = this.lexer.peek()) && peekedToken.type === EpubCfiTokenType.STEP) {
            this.lexer.next();
            const step = this.consumeStep(peekedToken);
            steps.push(step);
        }
        return steps;
    }

    /**
     * Consumes a temporal assertion. Assumes that caller already consumed the TILDE token.
     */
    private consumeTemporalOffset(tildeToken: IEpubCfiStringToken): IEpubCfiTemporalOffsetNode | null {
        const secondsToken = this.consumeExpectedToken(EpubCfiTokenType.NUMBER, EpubCfiParserErrorType.INVALID_TEMPORAL_OFFSET, tildeToken);
        if (!secondsToken) {
            return null;
        }

        let nextToken = this.lexer.peek();
        let spatialOffset: IEpubCfiSpatialOffsetNode | null = null;
        let assertion = null;
        if (nextToken && nextToken.type === EpubCfiTokenType.COMMERCIAL_AT) {
            this.lexer.next();
            spatialOffset = this.consumeSpatialOffset(nextToken);
            if (spatialOffset) {
                assertion = spatialOffset.assertion;
            }
            nextToken = this.lexer.peek();
        }

        if (!assertion && nextToken && nextToken.type === EpubCfiTokenType.ASSERTION) {
            this.lexer.next();
            assertion = this.consumeAssertion(nextToken, 0);
        }

        return {
            type: EpubCfiOffsetType.TEMPORAL,
            srcOffset: tildeToken.srcOffset,
            assertion: assertion,
            seconds: secondsToken.value,
            x: spatialOffset ? spatialOffset.x : null,
            y: spatialOffset ? spatialOffset.y : null,
        };
    }

    private createError(errorType: EpubCfiParserErrorType, token?: EpubCfiToken | number): void {
        this.errors.push(EpubCfiParserErrorHelper.createError(errorType, token));
    }

}

function createInvalidEndToken(srcOffset: number): EpubCfiToken {
    return {
        type: EpubCfiTokenType.INVALID_END,
        value: '',
        srcOffset: srcOffset,
    };
}

function isOffsetTokenType(tokenType: EpubCfiTokenType): boolean {
    return tokenType === EpubCfiTokenType.TILDE ||
        tokenType === EpubCfiTokenType.COMMERCIAL_AT ||
        tokenType === EpubCfiTokenType.COLON;
}

function createAssertion(
    values: string[],
    parameters: IEpubCfiAssertionParameterNode[],
    srcOffset?: number,
): IEpubCfiAssertionNode {

    return {
        values: values,
        parameters: parameters,
        srcOffset: srcOffset,
    };
}
