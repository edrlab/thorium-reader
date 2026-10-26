"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

exports.isNullOrUndefined = isNullOrUndefined;
exports.sortObject = sortObject;
exports.traverseJsonObjects = traverseJsonObjects;

function isNullOrUndefined(val) {
    return val === undefined || val === null;
}

const pluralCategories = ["zero", "one", "two", "few", "many", "other"];

function compareKeys(left, right) {
    const leftPlural = /^(.*)_(zero|one|two|few|many|other)$/.exec(left);
    const rightPlural = /^(.*)_(zero|one|two|few|many|other)$/.exec(right);
    const leftBase = leftPlural ? leftPlural[1] : left;
    const rightBase = rightPlural ? rightPlural[1] : right;
    if (leftBase !== rightBase) {
        return leftBase < rightBase ? -1 : 1;
    }
    const leftOrder = leftPlural ? pluralCategories.indexOf(leftPlural[2]) : -1;
    const rightOrder = rightPlural ? pluralCategories.indexOf(rightPlural[2]) : -1;
    return leftOrder - rightOrder;
}

function sortObject(obj) {
    if (obj === null) {
        return null;
    }
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sortObject(obj[i]);
        }
        return obj;
    }
    else if (typeof obj !== "object") {
        return obj;
    }
    const newObj = {};
    Object.keys(obj).sort(compareKeys).forEach((key) => {
        newObj[key] = sortObject(obj[key]);
    });
    return newObj;
}
function traverseJsonObjects_(parent, keyInParent, obj, func) {
    func(obj, parent, keyInParent);
    if (obj instanceof Array) {
        for (let index = 0; index < obj.length; index++) {
            const item = obj[index];
            if (!isNullOrUndefined(item)) {
                traverseJsonObjects_(obj, index, item, func);
            }
        }
    }
    else if (typeof obj === "object" && obj !== null) {
        Object.keys(obj).forEach((key) => {
            if (obj.hasOwnProperty(key)) {
                const item = obj[key];
                if (!isNullOrUndefined(item)) {
                    traverseJsonObjects_(obj, key, item, func);
                }
            }
        });
    }
}
function traverseJsonObjects(obj, func) {
    traverseJsonObjects_(undefined, undefined, obj, func);
}
