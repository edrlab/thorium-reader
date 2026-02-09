// import {describe, expect, it} from 'vitest';
// import {isArray} from '../common/Utils';
// import {EpubCfiLexer} from './EpubCfiLexer';
// import {EpubCfiTokenType} from './EpubCfiTokenType';
// import {IEpubCfiAssertionToken} from './tokens/IEpubCfiAssertionToken';
// import {IEpubCfiToken} from './tokens/IEpubCfiToken';

// describe('EpubCfiLexer', () => {

//     it('should lex example epubcfi', () => {
//         let epubCfiStr = 'epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/3:10)';
//         let lexer = new EpubCfiLexer(epubCfiStr);

//         let tokens: IEpubCfiToken[] = [];
//         let token;
//         while ((token = lexer.next())) {
//             tokens.push(token);
//         }

//         expect(tokens.length).toBe(13);

//         expect(tokens[0].type).toBe(EpubCfiTokenType.EPUBCFI_START);
//         expect(tokens[0].value).toBe('epubcfi(');
//         expect(tokens[1].type).toBe(EpubCfiTokenType.STEP);
//         expect(tokens[1].value).toBe(6);

//         expect(tokens[3].type).toBe(EpubCfiTokenType.ASSERTION);
//         let assertionToken = tokens[3] as IEpubCfiAssertionToken;
//         expect(isArray(assertionToken.value)).toBeTruthy();
//         expect(assertionToken.value[0].type).toBe(EpubCfiTokenType.VALUE);
//         expect(assertionToken.value[0].value).toBe('chap01ref');

//         expect(tokens[4].type).toBe(EpubCfiTokenType.EXCLAMATION_MARK);
//         expect(tokens[4].value).toBe('!');

//         let lastToken = tokens[tokens.length - 2];
//         expect(lastToken.type).toBe(EpubCfiTokenType.NUMBER);
//         expect(lastToken.value).toBe(10);

//         let previousToken = tokens[tokens.length - 3];
//         expect(previousToken.type).toBe(EpubCfiTokenType.COLON);
//         expect(previousToken.value).toBe(':');

//         expect(tokens[tokens.length - 1].type).toBe(EpubCfiTokenType.EPUBCFI_END);
//     });

//     it('should lex epubcfi with escapes', () => {
//         let epubCfiStr = 'epubcfi(/6/4!/4/10/2/1:3[Ф-"spa ce"-99%-aa^[bb^]^^])';
//         let lexer = new EpubCfiLexer(epubCfiStr);

//         let tokens: IEpubCfiToken[] = [];
//         let token;
//         while ((token = lexer.next())) {
//             tokens.push(token);
//         }

//         expect(tokens.length).toBe(12);

//         for (let i = 0; i < tokens.length; i++) {
//             let token = tokens[i];
//             expect(token.type).not.toBe(EpubCfiTokenType.BAD_TOKEN);
//         }

//         let lastToken = tokens[tokens.length - 2] as IEpubCfiAssertionToken;
//         expect(lastToken.type).toBe(EpubCfiTokenType.ASSERTION);
//         expect(lastToken.value.length).toBe(1);
//         expect(lastToken.value[0].type).toBe(EpubCfiTokenType.VALUE);
//         expect(lastToken.value[0].value).toBe('Ф-"spa ce"-99%-aa[bb]^');

//         expect(tokens[tokens.length - 1].type).toBe(EpubCfiTokenType.EPUBCFI_END);
//     });

//     it('should emit INVALID END if epubcfi does not end with )', () => {
//         let epubCfiStr = 'epubcfi(/6/4!/4/10';
//         let lexer = new EpubCfiLexer(epubCfiStr);

//         let tokens: IEpubCfiToken[] = [];
//         let token;
//         while ((token = lexer.next())) {
//             tokens.push(token);
//         }

//         expect(tokens.length).toBe(7);
//         expect(tokens[tokens.length - 1].type).toBe(EpubCfiTokenType.INVALID_END);
//     });
// });
