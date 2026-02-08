import {isArray, isObject, isString} from '../common/Utils';
import {EpubCfiToken} from '../lexer/tokens/EpubCfiToken';
import {EpubCfiParserErrorType} from './EpubCfiParserErrorType';
import {IEpubCfiParserError} from './IEpubCfiParserError';

export class EpubCfiParserErrorHelper {
    static createError(errorType: EpubCfiParserErrorType, token?: EpubCfiToken | number): IEpubCfiParserError {
        let value: string | undefined;
        let srcOffset: number | undefined;

        if (isObject(token)) {
            srcOffset = token.srcOffset;
            if (isString(token.value)) {
                value = token.value;
            } else if (isArray(token.value)) {
                value = '[' + token.value.map(val => val.value).join('') + ']';
            } else {
                value = '' + token.value;
            }
        } else {
            srcOffset = token;
        }

        return {
            type: errorType,
            srcOffset: srcOffset,
            value: value || '',
        };
    }
}
