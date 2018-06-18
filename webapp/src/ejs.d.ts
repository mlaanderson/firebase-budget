declare module 'ejs' {
    export = ejs;
}

declare const ejs : EjsStatic;

interface EjsStatic {
    renderFile(path: string, data: Object, onComplete?: (template: string) => void) : void;
}