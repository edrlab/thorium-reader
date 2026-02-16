export declare interface IInputStream<T> {

    /**
     * Return the next item from this input stream
     */
    next(): T | undefined;

    /**
     *
     */
    peek(): T | undefined;

}
