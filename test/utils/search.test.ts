import { hashString, rabinKarp, rollingHash } from "readium-desktop/utils/search";

test("hashString", () => {
    expect(hashString("abr")).toBe(4);
});

test("hashString", () => {
    expect(hashString("a", hashString("abr"))).toBe(hashString("abra"));
});

test("rollingHash", () => {
    expect(rollingHash(hashString("abr"), "abr", "a")).toBe(hashString("bra"));
});

test("rollingHash", () => {
    expect(rollingHash(hashString("abr"), "abr", "k")).toBe(hashString("brk"));
});

test("rollingHash", () => {
    expect(rollingHash(hashString("abr"), "abr", "ku")).toBe(hashString("rku"));
});

test("rollingHash", () => {
    expect(rollingHash(hashString("abr"), "abr", "bku")).toBe(hashString("bku"));
});

test("rabinKarp", () => {
    expect(rabinKarp("Hello world qwerty", "Hello")).toEqual([0]);
});

test("rabinKarp", () => {
    expect(rabinKarp("Hello world qwerty", "qwer")).toEqual([12]);
});

test("rabinKarp", () => {
    expect(rabinKarp("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac magna quis tellus lobortis feugiat. Nam lobortis volutpat vestibulum. Vivamus enim felis, dapibus ullamcorper odio in, tristique viverra erat. Nam volutpat volutpat risus vitae tristique. Nunc quis orci tristique, vestibulum lorem a, bibendum libero. Morbi venenatis, nibh bibendum vulputate porttitor, nisi nisi bibendum nisi, sit amet malesuada turpis tellus a sem. Pellentesque fringilla ante erat, id aliquam elit condimentum a. Nunc imperdiet bibendum erat, nec viverra lorem tristique sit amet. Ut auctor lobortis mauris, vel facilisis erat varius facilisis. In diam orci, consectetur ut lorem eget, porttitor rhoncus diam. Nam eleifend, ipsum ut imperdiet ultricies, nibh neque dignissim dui, et pharetra risus nisi et est. Cras dapibus mauris nec urna vulputate, non viverra metus pulvinar. Quisque viverra nec quam in fringilla. Proin rhoncus, ex non feugiat ultrices, ipsum elit tempus quam, non mollis diam tellus efficitur nulla. Integer consequat diam ac lacus faucibus, ac iaculis nibh elementum. Fusce consequat ex non egestas porta.", "sequat")).toEqual([1020, 1087]);
});

test("rabinKarp", () => {
    expect(rabinKarp("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac magna quis tellus lobortis feugiat. Nam lobortis volutpat vestibulum. Vivamus enim felis, dapibus ullamcorper odio in, tristique viverra erat. Nam volutpat volutpat risus vitae tristique. Nunc quis orci tristique, vestibulum lorem a, bibendum libero. Morbi venenatis, nibh bibendum vulputate porttitor, nisi nisi bibendum nisi, sit amet malesuada turpis tellus a sem. Pellentesque fringilla ante erat, id aliquam elit condimentum a. Nunc imperdiet bibendum erat, nec viverra lorem tristique sit amet. Ut auctor lobortis mauris, vel facilisis erat varius facilisis. In diam orci, consectetur ut lorem eget, porttitor rhoncus diam. Nam eleifend, ipsum ut imperdiet ultricies, nibh neque dignissim dui, et pharetra risus nisi et est. Cras dapibus mauris nec urna vulputate, non viverra metus pulvinar. Quisque viverra nec quam in fringilla. Proin rhoncus, ex non feugiat ultrices, ipsum elit tempus quam, non mollis diam tellus efficitur nulla. Integer consequat diam ac lacus faucibus, ac iaculis nibh elementum. Fusce consequat ex non egestas porta.", "porta")).toEqual([1109]);
});

test("rabinKarp", () => {
    expect(rabinKarp("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac magna quis tellus lobortis feugiat. Nam lobortis volutpat vestibulum. Vivamus enim felis, dapibus ullamcorper odio in, tristique viverra erat. Nam volutpat volutpat risus vitae tristique. Nunc quis orci tristique, vestibulum lorem a, bibendum libero. Morbi venenatis, nibh bibendum vulputate porttitor, nisi nisi bibendum nisi, sit amet malesuada turpis tellus a sem. Pellentesque fringilla ante erat, id aliquam elit condimentum a. Nunc imperdiet bibendum erat, nec viverra lorem tristique sit amet. Ut auctor lobortis mauris, vel facilisis erat varius facilisis. In diam orci, consectetur ut lorem eget, porttitor rhoncus diam. Nam eleifend, ipsum ut imperdiet ultricies, nibh neque dignissim dui, et pharetra risus nisi et est. Cras dapibus mauris nec urna vulputate, non viverra metus pulvinar. Quisque viverra nec quam in fringilla. Proin rhoncus, ex non feugiat ultrices, ipsum elit tempus quam, non mollis diam tellus efficitur nulla. Integer consequat diam ac lacus faucibus, ac iaculis nibh elementum. Fusce consequat ex non egestas porta.", "a")).toEqual([
        22,
        40,
        61,
        64,
        68,
        71,
        99,
        104,
        122,
        140,
        158,
        168,
        202,
        206,
        211,
        220,
        229,
        241,
        298,
        329,
        355,
        399,
        405,
        410,
        412,
        428,
        456,
        458,
        465,
        472,
        477,
        497,
        526,
        540,
        562,
        571,
        588,
        600,
        611,
        615,
        622,
        637,
        693,
        698,
        772,
        777,
        800,
        804,
        812,
        825,
        833,
        848,
        862,
        880,
        888,
        902,
        932,
        965,
        982,
        1006,
        1024,
        1029,
        1032,
        1036,
        1042,
        1051,
        1055,
        1091,
        1106,
        1113,
    ]);
});
