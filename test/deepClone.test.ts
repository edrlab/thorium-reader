
import { deepClone } from "readium-desktop/utils/deepClone";

const isADeeplyClone = (origin: any, clone: any): boolean =>
    typeof origin === "object" && typeof clone === "object" && origin !== clone
    ? Object.entries(origin).reduce<boolean>(
        (pv, [_key, _value]) =>
            typeof _value === "object"
            ? pv && isADeeplyClone(_value, clone[_key])
            : pv && _value === clone[_key]
        , true)
    : origin === clone;

const isCloned = (o: any, c: any) => isADeeplyClone(c, o) && isADeeplyClone(o, c);

test("should clone object with `null` value", () => {

    // @ts-ignore
    const object = { key: null };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `undefined` value", () => {

    // @ts-ignore
    const object = { key: undefined };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `boolean` value", () => {

    // @ts-ignore
    const object = { key: Boolean };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `string` value", () => {

    // @ts-ignore
    const object = { key: "hello world" };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `symbol` value", () => {

    // @ts-ignore
    const object = { key: Symbol("a") };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `func` value", () => {

    // @ts-ignore
    const object = { key() { console.log("hello"); } };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `array` value", () => {

    // @ts-ignore
    const object = { key: [[1], [2], [3], [4]] };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `object1` value", () => {

    // @ts-ignore
    const object = { key: { a: 1, b: 2, c: 3 } };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `object2` value", () => {

    // @ts-ignore
    const object = { key: { a: { a1: 1 }, b: { b1: 1 }, c: { a1: 1 }, d: ["hello", "world", ["!!"]] } };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `date` value", () => {

    // @ts-ignore
    const object: any = { key: new Date() };

    const expected = object;
    const actual = deepClone(object);
    const clone = JSON.parse(JSON.stringify(object));
    const test = isCloned(expected, actual);

    console.log(actual.key, typeof actual.key, actual.key instanceof Date);
    console.log(object.key, typeof object.key, object.key instanceof Date);
    console.log(clone.key, typeof clone.key, clone.key instanceof Date);

    expect(expected).toStrictEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `all` value", () => {

    const object: any = {
        zbool: true,
        zstring: "str1",
        znumber: -1,
        zarray: [true, "str3", 111, { foo: "bar", deep: ["another array"] }, [1, 2, 3, { n: 4 }]],
        zobj: {
            zbool: false,
            zstring: "str2",
            znumber: 999,
            zarray: [false, "str5", 333, { num: 555, nest: [{ nul: "null", und: undefined }] }, [1, 2, 3, { n: 4 }]],
        },
    };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});

test("should clone object with `all` value", () => {

    const object: any = {
        a: null,
        b: undefined,
        c: true,
        d: 12,
        e: "hi",
        f: [1, 2, { b: 4 }],
        g: [1, 2, { b: 4 }],
        [Symbol("abc")]: 3,
        m: new Map([[1, 2]]),
        nm: new Map([[1, new Map([[2, 3]])]]),
        s: new Set([1, 2]),
        ns: new Set([{ a: 1 }, 2]),
        [123]: { [123]: ["k", false] },
        $: new Date(),
        // @ts-ignore
        [new Map([["@", "#"]])]: () => 3,
        go(where = "house") {
          return `where: ${where}`;
        },
        any: {
          f1: {
            f2: {
              f3: {
                f4: Symbol("abc"),
              },
            },
          },
        },
      };

    const expected = object;
    const actual = deepClone(object);
    const test = isCloned(expected, actual);

    console.log((object.nm as Map<number, Map<number, number>>).get(1));
    console.log(
        (actual.nm as Map<number, Map<number, number>>).get(1)
        === (object.nm as Map<number, Map<number, number>>).get(1));

    expect(expected).toEqual(actual);
    expect(test).toBe(true);
});
