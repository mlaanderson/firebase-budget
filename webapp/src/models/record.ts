interface Record {
    id?: string;
}

interface RecordMap<T> {
    [key: string]: T;
}

export {Record, RecordMap};