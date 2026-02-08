import {IInputStream} from './IInputStream';

export class ArrayInputStream<T> implements IInputStream<T> {

    // private _length: number;
    private _nextPos: number = 0;

    constructor(public _arr: T[]) {
        // this._length = _arr.length;
    }

    next(): T | undefined {
        return this._arr[this._nextPos++];
    }

    peek(): T | undefined {
        return this._arr[this._nextPos];
    }

}
