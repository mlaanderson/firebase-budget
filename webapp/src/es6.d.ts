type ObjectKey = string | number;
interface ObjectConstructor {
    values<T>(obj: {[key: string]:T}): Array<T>;
    values<T>(obj: {[key: number]:T}): Array<T>;
}