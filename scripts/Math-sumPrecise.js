// https://github.com/edrlab/thorium-reader/issues/3810#issuecomment-5486070873
// TODO: remove this when migrating from Electron 41 to 44

if (typeof Math.sumPrecise !== "function") {
Math.sumPrecise = function (numbers) {
// return numbers.reduce((a, b) => a + b, 0);

// https://github.com/es-shims/Math.sumPrecise/blob/main/sum.js

// adapted from https://github.com/tc39/proposal-math-sum/blob/f4286d0a9d8525bda61be486df964bf2527c8789/polyfill/polyfill.mjs

// https://www-2.cs.cmu.edu/afs/cs/project/quake/public/papers/robust-arithmetic.ps
// Shewchuk's algorithm for exactly floating point addition
// as implemented in Python's fsum: https://github.com/python/cpython/blob/48dfd74a9db9d4aa9c6f23b4a67b461e5d977173/Modules/mathmodule.c#L1359-L1474
// adapted to handle overflow via an additional "biased" partial, representing 2**1024 times its actual value

// var MAX_SAFE_INTEGER = 9007199254740992; // Number.MAX_SAFE_INTEGER, 2**53

// exponent 11111111110, significand all 1s
var MAX_DOUBLE = 1.79769313486231570815e+308; // i.e. (2**1024 - 2**(1023 - 52))

// exponent 11111111110, significand all 1s except final 0
var PENULTIMATE_DOUBLE = 1.79769313486231550856e+308; // i.e. (2**1024 - 2 * 2**(1023 - 52))

var TWO_1023 = 8.98846567431158e+307; // 2 ** 1023

// exponent 11111001010, significand all 0s
var MAX_ULP = MAX_DOUBLE - PENULTIMATE_DOUBLE; // 1.99584030953471981166e+292, i.e. 2**(1023 - 52)

var $abs = Math.abs;

var INF = Infinity;

// prerequisite: $abs(x) >= $abs(y)
function twosum(x, y) {
var hi = x + y;
var lo = y - (hi - x);
return { hi: hi, lo: lo };
}

/* eslint max-lines-per-function: 0, complexity: 0, no-plusplus: 0, no-implicit-coercion: 0 */

// preconditions:
//  - array only contains numbers
//  - none of them are -0, NaN, or ±Infinity
//  - all of them are finite
function arraysum(array) {
var partials = [];

var overflow = 0; // conceptually 2**1024 times this value; the final partial is biased by this amount

var index = -1;

// main loop
while ((index + 1) < array.length) {
var x = +array[++index];

// we're updating partials in place, but it is maybe easier to understand if you think of it as making a new copy
var actuallyUsedPartials = 0;
// var newPartials = [];
for (var j = 0; j < partials.length; j += 1) {
var y = partials[j];

if ($abs(x) < $abs(y)) {
var tmp = x;
x = y;
y = tmp;
}
var s = twosum(x, y);
var hi = s.hi;
var lo = s.lo;
if ($abs(hi) === INF) {
var sign = hi === INF ? 1 : -1;
overflow += sign;

x = (x - (sign * TWO_1023)) - (sign * TWO_1023);
if ($abs(x) < $abs(y)) {
var tmp2 = x;
x = y;
y = tmp2;
}
var s2 = twosum(x, y);
hi = s2.hi;
lo = s2.lo;
}
if (lo !== 0) {
partials[actuallyUsedPartials] = lo;
actuallyUsedPartials += 1;
// newPartials.push(lo);
}
x = hi;
}
partials.length = actuallyUsedPartials;
// assert.deepStrictEqual(partials, newPartials)
// partials = newPartials

if (x !== 0) {
partials[partials.length] = x;
}
}

// compute the exact sum of partials, stopping once we lose precision
var n = partials.length - 1;
hi = 0;
lo = 0;

if (overflow !== 0) {
var next = n >= 0 ? partials[n] : 0;
n -= 1;
if (
$abs(overflow) > 1
|| (overflow > 0 && next > 0)
|| (overflow < 0 && next < 0)
) {
return overflow > 0 ? INF : -INF;
}
// here we actually have to do the arithmetic
// drop a factor of 2 so we can do it without overflow
// assert($abs(overflow) === 1)
s = twosum(overflow * TWO_1023, next / 2);
hi = s.hi;
lo = s.lo;
lo *= 2;
if ($abs(2 * hi) === INF) {
// stupid edge case: rounding to the maximum value
// MAX_DOUBLE has a 1 in the last place of its significand, so if we subtract exactly half a ULP from 2**1024, the result rounds away from it (i.e. to infinity) under ties-to-even
// but if the next partial has the opposite sign of the current value, we need to round towards MAX_DOUBLE instead
// this is the same as the "handle rounding" case below, but there's only one potentially-finite case we need to worry about, so we just hardcode that one
if (hi > 0) {
if (hi === TWO_1023 && lo === -(MAX_ULP / 2) && n >= 0 && partials[n] < 0) {
return MAX_DOUBLE;
}
return INF;
}
if (hi === -TWO_1023 && lo === (MAX_ULP / 2) && n >= 0 && partials[n] > 0) {

return -MAX_DOUBLE;
}
return -INF;
}

if (lo !== 0) {
partials[n + 1] = lo;
n += 1;
lo = 0;
}
hi *= 2;
}

while (n >= 0) {
var x1 = hi;
var y1 = partials[n];
n -= 1;
// assert: $abs(x1) > $abs(y1)
var s3 = twosum(x1, y1);
hi = s3.hi;
lo = s3.lo;
if (lo !== 0) {
break; // eslint-disable-line no-restricted-syntax
}
}

// handle rounding
// when the roundoff error is exactly half of the ULP for the result, we need to check one more partial to know which way to round
if (
n >= 0
&& (
(lo < 0.0 && partials[n] < 0.0)
|| (lo > 0.0 && partials[n] > 0.0)
)
) {
var y2 = lo * 2.0;
var x2 = hi + y2;
var yr = x2 - hi;
if (y2 === yr) {
hi = x2;
}
}

return hi;
}

const toAdd = [];

let state = 'MINUS-ZERO';
for (const number of numbers) {
    if (typeof number !== 'number') { // step 7.b.iv
        throw new Error("typeof number !== 'number'");
    }

    if (state !== 'NOT-A-NUMBER') {
        if (isNaN(number)) {
            state = 'NOT-A-NUMBER';
        } else if (number === Infinity) {
            state = state === 'MINUS-INFINITY' ? 'NOT-A-NUMBER' : 'PLUS-INFINITY';
        } else if (number === -Infinity) {
            state = state === 'PLUS-INFINITY' ? 'NOT-A-NUMBER' : 'MINUS-INFINITY';
        } else if (!(number === 0 && (1 / number) === -Infinity) // isNegativeZero
            && (state === 'MINUS-ZERO' || state === 'FINITE')) {
            state = 'FINITE';
            toAdd[toAdd.length] = number;
        }
    }
}

if (state === 'NOT-A-NUMBER') {
    return NaN;
}
if (state === 'PLUS-INFINITY') {
    return Infinity;
}
if (state === 'MINUS-INFINITY') {
    return -Infinity;
}
if (state === 'MINUS-ZERO') {
    return -0;
}

return arraysum(toAdd);
};
}
