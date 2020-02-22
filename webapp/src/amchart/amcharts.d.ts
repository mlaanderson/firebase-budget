declare module 'AmCharts' {
    export = AmCharts;
}

declare const AmCharts : AmChartsStatic;

interface AmChartsStatic {
    makeChart: (id: string, config: any) => any;
}