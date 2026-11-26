import type { Rule } from "eslint";

const MESSAGE = 'You should use typed-redux-saga effects';

export default {
    meta: {
        type: 'suggestion',

        docs: {
            description: 'Use typed-redux-saga for effects',
            recommended: true,
            url: 'https://github.com/jambit/eslint-plugin-typed-redux-saga/',
        },
        fixable: 'code',
        schema: [], // no options
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (node.source.value === 'redux-saga/effects') {
                    context.report({
                        node,
                        message: MESSAGE,
                        fix(fixer) {
                            const sourceCode = context.sourceCode;
                            const fixed = sourceCode
                                .getText(node)
                                .replace('redux-saga/effects', 'typed-redux-saga/macro');
                            return fixer.replaceText(node, fixed);
                        },
                    });
                }
            },
        };
    },
} satisfies Rule.RuleModule;
