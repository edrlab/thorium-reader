'use strict';

const effectKeys = Object.keys(require('typed-redux-saga'));
const MESSAGE = 'You should use yield* for all typed-redux-saga effects';

module.exports = {
    meta: {
        type: 'problem',

        docs: {
            description: 'Enforce yield* (delegate) on effects',
            category: 'Possible Errors',
            recommended: true,
            url: 'https://github.com/jambit/eslint-plugin-typed-redux-saga/',
        },
        fixable: 'code',
        schema: [], // no options
    },
    create(context) {
        let yieldDepth = 0;
        let generatorDepth = 0;

        function enterFunction(node) {
            if (node.generator) generatorDepth++;
        }
        function exitFunction(node) {
            if (node.generator) generatorDepth--;
        }
        const typedNames = {};
        function getCalleeKey(callee) {
            return callee ? (callee.type === 'MemberExpression'
                ? `${callee.object.name}.${callee.property.name}`
                : callee.name) : undefined;
        }
        return {
            ImportDefaultSpecifier(node) {
                if (node.parent.source.value === 'typed-redux-saga/macro') {
                    for (const key of effectKeys) typedNames[`${node.local.name}.${key}`] = key;
                }
            },
            ImportSpecifier(node) {
                if (node.parent.source.value === 'typed-redux-saga/macro')
                    typedNames[node.local.name] = node.imported.name;
            },
            YieldExpression(node) {
                yieldDepth += 1;
                if (!node.argument.type === 'CallExpression') return;
                if (!node.delegate && typedNames[getCalleeKey(node.argument.callee)]) {
                    context.report({
                        node,
                        message: MESSAGE,
                        fix(fixer) {
                            const sourceCode = context.getSourceCode();
                            const fixed = sourceCode.getText(node).replace('yield', 'yield*');
                            return fixer.replaceText(node, fixed);
                        },
                    });
                }
            },
            'YieldExpression:exit'() {
                yieldDepth -= 1;
            },
            FunctionDeclaration: enterFunction,
            'FunctionDeclaration:exit': exitFunction,
            FunctionExpression: enterFunction,
            'FunctionExpression:exit': exitFunction,
            CallExpression(node) {
                if (
                    node.parent.type === 'YieldExpression' &&
                    typedNames[getCalleeKey(node.callee)]
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
};
