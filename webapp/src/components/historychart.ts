/// <reference path="../../node_modules/@types/jquery/index.d.ts" />

import {AmChart, AmChartObject, AmChartConfig } from "../amchart/amchart";
import TransactionViewer from "./transactionviewer";
import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import Transactions from "../controllers/transactions";

export default class HistoryChart implements TransactionViewer {
    private static chart_config: AmChartConfig = {
        "type": "serial",
        "balloonDateFormat": "MMM DD",
        "categoryField": "date",
        "dataDateFormat": "YYYY-MM-DD",
        "maxSelectedSeries": 0,
        "mouseWheelScrollEnabled": true,
        "zoomOutOnDataUpdate": false,
        "maxZoomFactor": 19,
        "zoomOutButtonTabIndex": -2,
        "sequencedAnimation": false,
        "startEffect": "bounce",
        "accessible": false,
        "autoDisplay": true,
        "hideBalloonTime": 2000,
        "theme": "dark",
        "categoryAxis": {
            "position": "top",
            "parseDates": true
        },
        "chartCursor": {
            "enabled": true,
            "animationDuration": 0.25,
            "bulletsEnabled": false,
            "categoryBalloonEnabled": false,
            "categoryBalloonAlpha": 0,
            "fullWidth": false,
            "leaveAfterTouch": false,
            "oneBalloonOnly": true,
            "selectionAlpha": 1
        },
        "chartScrollbar": {
            "enabled": true,
            "dragIcon": "dragIconRoundSmall",
            "graph": "AmGraph-1",
            "gridAlpha": 0,
            "maximum": 5000,
            "minimum": -500,
            "oppositeAxis": true,
            "selectedBackgroundAlpha": 0,
            "updateOnReleaseOnly": true
        },
        "trendLines": [],
        "graphs": [
            {
                "balloonColor": "#FFFFFF",
                "balloonText": "[[description]]",
                "bullet": "square",
                "bulletAxis": "ValueAxis-1",
                "bulletBorderAlpha": 1,
                "bulletField": "amount",
                "bulletHitAreaSize": 2,
                "color": "#000000",
                "colorField": "color",
                "columnWidth": 0,
                "descriptionField": "description",
                "fillAlphas": 0.18,
                "fillColorsField": "color",
                "id": "AmGraph-1",
                "lineAlpha": 1,
                "lineColorField": "color",
                "lineThickness": 2,
                "minDistance": 19,
                "switchable": false,
                "title": "graph 1",
                "type": "step",
                "valueAxis": "ValueAxis-1",
                "valueField": "amount"
            }
        ],
        "guides": [],
        "valueAxes": [
            {
                "id": "ValueAxis-1",
                "title": ""
            }
        ],
        "allLabels": [],
        "balloon": {
            "animationDuration": 0,
            "borderAlpha": 0.96,
            "disableMouseEvents": false,
            "fixedPosition": false,
            "horizontalPadding": 7
        },
        "titles": [],
        "dataProvider": []
    };

    private m_chart: AmChartObject;
    private m_transactions: RecordMap<Transaction>;
    private m_left: string;
    private m_right: string;

    constructor(element: JQuery<HTMLElement> | string) {
        $(() => {
            if (typeof element !== "string") {
                if (element.attr('id') === undefined) {
                    let id: string = 'history_chart_' + Date.now().toString();
                    element.attr('id', id);
                    element = id;
                } else {
                    element = element.attr('id');
                }
            }
    
            this.m_chart = AmChart.makeChart(element, HistoryChart.chart_config);
        });
    }

    display(transactions: RecordMap<Transaction>, left?: string, right?: string) {
        let list: Array<Transaction> = [];
        this.m_transactions = transactions;

        for (let id in transactions) {
            list.push(transactions[id]);
        }

        list.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return 0;
        });

        this.displayList(list, left, right);
    }

    displayList(transactions: Array<Transaction>, left?: string, right?: string) {
        let sums: { [date: string] : number } = {}
        let total = 0;

        left = left || (Date.today().subtract('2 weeks') as Date).toFbString();
        right = right || (Date.today().add('3 months') as Date).toDateString();

        this.m_left = left;
        this.m_right = right;

        for (let transaction of transactions) {
            total += transaction.amount;
            sums[transaction.date] = total;
        }

        this.draw(sums, left, right);
    }

    update(transaction: Transaction) {
        if (!this.m_transactions) this.m_transactions = {};
        this.m_transactions[transaction.id] = transaction;
        this.display(this.m_transactions, this.m_left, this.m_right);
    }

    remove(transaction: Transaction) {
        if (!this.m_transactions) this.m_transactions = {};
        delete this.m_transactions[transaction.id];
        this.display(this.m_transactions, this.m_left, this.m_right);
    }

    draw(sums: { [date : string] : number }, left: string, right: string) {
        $(() => {
            if ($('#footer_info').css('display') !== 'none') {
                this.m_chart.dataProvider = [];

                for (let date in sums) {
                    this.m_chart.dataProvider.push({
                        date: date,
                        amount: Math.roundTo(sums[date], 2),
                        description: Date.parseFb(date).format("MMM dd") + ": " + sums[date].toCurrency(),
                        color: (sums[date] < 0 ? "#ff0000" : "#008800")
                    });
                }

                let chLeft = Date.parseFb(left);
                let chRight = Date.parseFb(right);

                this.m_chart.validateData();
                this.m_chart.zoomToDates(chLeft, chRight);
            }
        });
    }

    clear() {
        console.log("TODO: clear the chart");
    }

    listenToTransactions(transactions: Transactions) {
        transactions.on('added', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('changed', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('removed', async (transaction: Transaction) => {
            this.remove(transaction);
        });

        transactions.on('periodloaded', async (transactionList: Array<Transaction>) => {
            let left = (Date.parseFb(transactions.Start).subtract("3 weeks") as Date).toFbString();
            let right = Date.parseFb(transactions.End).add('3 months').toFbString();
            let allTransactions = await transactions.loadRecords();
            this.display(allTransactions, left, right);
        });
    }
}