/// <reference path="./amcharts.d.ts" />

export default interface AmChartObject {
    dataProvider: Array<AmChartData>;
    end: number;
    endDate: Date;
    start: number;
    startDate: Date;

    validateData: () => void;
    zoomToDates: (left: Date, right: Date) => void;
}

interface AmChartData {
    date: string;
    amount: number;
    description: string;
    color: string;
}

interface AmChartConfig {
    type: string;
    balloonDateFormat: string;
    categoryField: string;
    dataDateFormat: string;
    maxSelectedSeries: number;
    mouseWheelScrollEnabled: boolean;
    zoomOutOnDataUpdate: boolean;
    maxZoomFactor: number;
    zoomOutButtonTabIndex: number;
    sequencedAnimation: boolean;
    startEffect: string;
    accessible: boolean;
    autoDisplay: boolean;
    hideBalloonTime: number;
    theme: string;
    categoryAxis: {
        position: string;
        parseDates: boolean
    };
    chartCursor: {
        enabled: boolean;
        animationDuration: number;
        bulletsEnabled: boolean;
        categoryBalloonEnabled: boolean;
        categoryBalloonAlpha: number;
        fullWidth: boolean;
        leaveAfterTouch: boolean;
        oneBalloonOnly: boolean;
        selectionAlpha: number
    };
    chartScrollbar: {
        enabled: boolean;
        dragIcon: string;
        graph: string;
        gridAlpha: number;
        maximum: number;
        minimum: number;
        oppositeAxis: boolean;
        selectedBackgroundAlpha: number;
        updateOnReleaseOnly: boolean
    };
    trendLines: Array<any>;
    graphs: Array<any>;
    guides: Array<any>;
    valueAxes: Array<any>;
    allLabels: Array<any>;
    balloon: {
        animationDuration: number;
        borderAlpha: number;
        disableMouseEvents: boolean;
        fixedPosition: boolean;
        horizontalPadding: number
    };
    titles: Array<any>;
    dataProvider: Array<any>;
}

class AmChart {
    static makeChart(id: string, config: AmChartConfig) : AmChartObject {
        return AmCharts.makeChart(id, config) as AmChartObject;
    }
}

export { AmChart, AmChartObject, AmChartConfig };