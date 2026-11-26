import { TSESTree } from '@typescript-eslint/utils';
import type { Rule } from "eslint";
import type { CallExpression, Expression, Super } from "estree";
const effectKeys = Object.keys(require('typed-redux-saga'));
const MESSAGE = 'You should use yield* for all typed-redux-saga effects';

type TFunctionDeclaration = Exclude<Rule.RuleListener["FunctionDeclaration"], undefined>;
type TFunctionExpression = Exclude<Rule.RuleListener["FunctionExpression"], undefined>;

export default {
    meta: {
        type: 'problem',

        docs: {
            description: 'Enforce yield* (delegate) on effects',
            recommended: true,
            url: 'https://github.com/jambit/eslint-plugin-typed-redux-saga/',
        },
        fixable: 'code',
        schema: [], // no options
    },
    create(context) {
        let yieldDepth = 0;
        let generatorDepth = 0;

        function enterFunctionExpression(...args: Parameters<TFunctionExpression>): ReturnType<TFunctionExpression> {
            if (args[0].generator) generatorDepth++;
        }
        function enterFunctionDeclaration(...args: Parameters<TFunctionDeclaration>): ReturnType<TFunctionDeclaration> {
            if (args[0].generator) generatorDepth++;
        }
        function exitFunctionExpression(...args: Parameters<TFunctionExpression>): ReturnType<TFunctionExpression> {
            if (args[0].generator) generatorDepth--;
        }
        function exitFunctionDeclaration(...args: Parameters<TFunctionDeclaration>): ReturnType<TFunctionDeclaration> {
            if (args[0].generator) generatorDepth--;
        }
        const typedNames: Record<string, string> = {};
        function getCalleeKey(callee: Expression | Super) {
            return callee ? (callee.type === 'MemberExpression'
                ? `${(callee.object as TSESTree.Identifier).name}.${(callee.property as TSESTree.Identifier).name}`
                : (callee as TSESTree.Identifier).name) : undefined;
        }
        return {
            ImportDefaultSpecifier(node) {
                if ((node as TSESTree.ImportDefaultSpecifier).parent?.source.value === 'typed-redux-saga/macro' || (node as TSESTree.ImportDefaultSpecifier).parent?.source.value === 'typed-redux-saga') {
                    for (const key of effectKeys) typedNames[`${node.local.name}.${key}`] = key;
                }
            },
            ImportSpecifier(node) {
                if ((node.parent as TSESTree.ImportDeclaration).source?.value === 'typed-redux-saga/macro' || (node.parent as TSESTree.ImportDeclaration).source?.value === 'typed-redux-saga')
                    typedNames[node.local.name] = (node.imported as TSESTree.Identifier).name;
            },
            YieldExpression(node) {
                yieldDepth += 1;
                if (node.argument?.type !== 'CallExpression') return;
                if (!node.delegate && typedNames[getCalleeKey(((node as TSESTree.YieldExpression).argument as CallExpression)?.callee) || "___"]) {
                    context.report({
                        node,
                        message: MESSAGE,
                        fix(fixer) {
                            const sourceCode = context.sourceCode;
                            const fixed = sourceCode.getText(node as Rule.Node).replace('yield', 'yield*');
                            return fixer.replaceText(node, fixed);
                        },
                    });
                }
            },
            'YieldExpression:exit'() {
                yieldDepth -= 1;
            },
            FunctionDeclaration: enterFunctionDeclaration,
            'FunctionDeclaration:exit': exitFunctionDeclaration,
            FunctionExpression: enterFunctionExpression,
            'FunctionExpression:exit': exitFunctionExpression,
            CallExpression(node) {
                if (
                    node.parent.type === 'YieldExpression' &&
                    typedNames[getCalleeKey(node.callee) || "___"]
                ) {
                    if (yieldDepth === 0 && generatorDepth) {
                        context.report({
                            node: node,
                            message: MESSAGE,
                            fix(fixer) {
                                return fixer.insertTextBefore(node, 'yield* ');
                            },
                        });
                    }
                }
            },
        };
    },
} satisfies Rule.RuleModule;
