
export class ArrayUtils {


    static first<T>(arr: T[] | ArrayLike<T>): T | undefined {
        return arr.length > 0 ? arr[0] : undefined;
    }


    static last<T>(arr: T[] | ArrayLike<T>): T | undefined {
        return arr.length > 0 ? arr[arr.length - 1] : undefined;
    }

}
