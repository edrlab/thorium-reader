// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { propertyConverters } from "./../converters/converter";

// import { PropertyDefinition } from "../classes/property-definition";

// import { FunctionType, IDynamicObject, XmlValue } from "../types";

// import { getInheritanceChain, getTypedInheritanceChain, objectDefinitions, ObjectDefinition }
// from "../classes/object-definition";

// export function serialize(value: IDynamicObject | IDynamicObject[], objectType?: FunctionType): XmlValue {
//     if (value.constructor === Array) {
//         return (value as IDynamicObject[]).map((o) => serializeRootObject(o, objectType));
//     }

//     return serializeRootObject(value as IDynamicObject, objectType);
// }

// function serializeRootObject(
//     objectInstance: IDynamicObject,
//     objectType: FunctionType = Object.getPrototypeOf(objectInstance).constructor): XmlValue {
//     const inheritanceChain = getTypedInheritanceChain(objectType);

//     if (inheritanceChain.length === 0) {
//         return objectInstance;
//     }

//     const definitions = inheritanceChain.map((t) => objectDefinitions.get(t))
// .filter((t) => !!t) as ObjectDefinition[];

//     const output: IDynamicObject = {};

//     definitions.forEach((d) => {
//         if (!d) {
//             return;
//         }

//         d.properties.forEach((p, key) => {
//             if (!p.objectType) {
//                 throw new Error(`Cannot serialize property "${key}" without type!`);
//             }

//             const value = objectInstance[key];

//             if ((value === null || value === undefined) || p.writeonly) {
//                 return;
//             }

//             if (p.set) {
//                 output[p.xpathSelector] = serializeArray(Array.from(value || []), p);
//                 return;
//             }

//             if (p.array) {
//                 output[p.xpathSelector] = serializeArray(value, p);
//                 return;
//             }

//             output[p.xpathSelector] = serializeObject(value, p);
//         });
//     });

//     return output;
// }

// function serializeArray(array: IDynamicObject[], definition: PropertyDefinition): XmlValue[] {
//     return array.map((v) => serializeObject(v, definition));
// }

// function serializeObject(objectInstance: IDynamicObject, definition: PropertyDefinition): XmlValue {
//     const primitive = definition.objectType === String
//         || definition.objectType === Boolean
//         || definition.objectType === Number;
//     const value: any = objectInstance;

//     const converter = definition.converter || propertyConverters.get(definition.objectType);
//     if (converter) {
//         return converter.serialize(value);
//     }

//     if (!primitive) {
//         const objDefinition = objectDefinitions.get(definition.objectType);

//         if (objDefinition) {
//             if (value instanceof definition.objectType) {
//                 return serialize(value);
//             }
//             return serialize(value, definition.objectType);
//         }
//     }

//     return value;
// }
