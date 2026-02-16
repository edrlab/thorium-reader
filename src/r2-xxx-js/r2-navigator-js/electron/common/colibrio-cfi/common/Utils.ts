import {NodeType} from './definitions/NodeType';

export function isDocument(node: any): node is Document {
    return node && node.nodeType === NodeType.DOCUMENT_NODE;
}

export function isDocumentFragment(node: any): node is DocumentFragment {
    return node && node.nodeType === NodeType.DOCUMENT_FRAGMENT_NODE;
}

export function isElement(node: any): node is Element {
    return node && node.nodeType === NodeType.ELEMENT_NODE;
}

export function isNonEmptyString(val: any): val is string {
    return isString(val) && /\S/.test(val);
}

export function isTextNode(node: any): node is Text {
    return node && node.nodeType === NodeType.TEXT_NODE;
}


/**
 * Clamps a value between a min and max value
 *
 * @param value
 * @param min
 * @param max
 */
export function clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
}

/**
 * Performs a deep copy of an object or array
 */
export function copy<T extends object>(src: T): T {
    const dest: T = Array.isArray(src) ? [] as T : {} as T;

    if (typeof src === 'object' && src !== null) {
        const keys = Object.keys(src) as (keyof T)[];
        for (const key of keys) {
            const srcValue = src[key];
            if (srcValue !== null && typeof srcValue === 'object') {
                dest[key] = copy(srcValue);
            } else {
                dest[key] = srcValue;
            }
        }
    }

    return dest;
}

export let isArray: (val: any) => val is Array<any> = Array.isArray;

export function isBoolean(val: any): val is boolean {
    return typeof val === 'boolean';
}

export function isFunction(val: any): val is Function {
    return typeof val === 'function';
}

export function isNumber(val: any): val is number {
    return typeof val === 'number' && !isNaN(val);
}

export function isObject(value: any): value is object {
    return value && !isArray(value) && typeof value === 'object';
}

export function isString(val: any): val is string {
    return typeof val === 'string';
}
