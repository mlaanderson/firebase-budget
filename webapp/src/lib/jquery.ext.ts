interface JQuery {
    timespan() : JQuery;
    timespan(command: "valid") : boolean;
    jqmData(key?: string) : string;
}

interface JQuery<TElement extends Node = HTMLElement> extends Iterable<TElement> {
    /**
     * Set one or more attributes for the set of matched elements.
     *
     * @param attributeName The name of the attribute to set.
     * @param value A value to set for the attribute. If null, the specified attribute will be removed (as in .removeAttr()).
     *              A function returning the value to set. this is the current element. Receives the index position of
     *              the element in the set and the old attribute value as arguments.
     * @see {@link https://api.jquery.com/attr/}
     * @since 1.0
     * @since 1.1
     */
    attr(attributeName: string,
        value: string | number | boolean | null | ((this: TElement, index: number, attr: string) => string | number | void | undefined)): this;

}
