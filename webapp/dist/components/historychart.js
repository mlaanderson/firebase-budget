"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const amchart_1 = require("../amchart/amchart");
class HistoryChart {
    constructor(element) {
        this.m_update = true;
        $(() => {
            if (typeof element !== "string") {
                if (element.attr('id') === undefined) {
                    let id = 'history_chart_' + Date.now().toString();
                    element.attr('id', id);
                    element = id;
                }
                else {
                    element = element.attr('id');
                }
            }
            this.m_chart = amchart_1.AmChart.makeChart(element, HistoryChart.chart_config);
        });
    }
    display(transactions, left, right) {
        let list = [];
        this.m_transactions = transactions;
        for (let id in transactions) {
            list.push(transactions[id]);
        }
        list.sort((a, b) => {
            if (a.date < b.date)
                return -1;
            if (a.date > b.date)
                return 1;
            return 0;
        });
        this.displayList(list, left, right);
    }
    displayList(transactions, left, right) {
        let sums = {};
        let total = 0;
        left = left || Date.today().subtract('2 weeks').toFbString();
        right = right || Date.today().add('3 months').toDateString();
        this.m_left = left;
        this.m_right = right;
        for (let transaction of transactions) {
            total += transaction.amount;
            sums[transaction.date] = total;
        }
        this.draw(sums, left, right);
    }
    update(transaction) {
        if (!this.m_transactions)
            this.m_transactions = {};
        if (this.m_right > transaction.date) {
            this.m_transactions[transaction.id] = transaction;
            clearTimeout(this.m_waiter);
            this.m_waiter = setTimeout(() => {
                this.display(this.m_transactions, this.m_left, this.m_right);
            }, 500);
        }
    }
    remove(transaction) {
        if (!this.m_transactions)
            this.m_transactions = {};
        if (transaction.id in this.m_transactions) {
            delete this.m_transactions[transaction.id];
            clearTimeout(this.m_waiter);
            this.m_waiter = setTimeout(() => {
                this.display(this.m_transactions, this.m_left, this.m_right);
            }, 500);
        }
    }
    draw(sums, left, right) {
        $(() => {
            if (($('#footer_info').css('display') !== 'none') && (Object.keys(sums).length > 0)) {
                this.m_chart.dataProvider = [];
                let initialValue = 0;
                if (left in sums) {
                    initialValue = sums[left];
                }
                else {
                    for (let date = Date.parseFb(Object.keys(sums)[0]); date.le(left); date = date.add('1 day')) {
                        if (date.toFbString() in sums)
                            initialValue = sums[date.toFbString()];
                    }
                }
                for (let date = Date.parseFb(left); date.le(right); date = date.add('1 day')) {
                    if (date.toFbString() in sums === false) {
                        sums[date.toFbString()] = initialValue;
                    }
                    else {
                        initialValue = sums[date.toFbString()];
                    }
                }
                for (let date in sums) {
                    if (left <= date && date <= right) {
                        this.m_chart.dataProvider.push({
                            date: date,
                            amount: Math.roundTo(sums[date], 2),
                            description: Date.parseFb(date).format("MMM dd") + ": " + sums[date].toCurrency(),
                            color: (sums[date] < 0 ? "#ff0000" : "#008800")
                        });
                    }
                }
                this.m_chart.dataProvider.sort((a, b) => {
                    if (a.date < b.date)
                        return -1;
                    if (a.date > b.date)
                        return 1;
                    return 0;
                });
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
    listenToTransactions(transactions) {
        transactions.on('added', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            this.update(transaction);
        }));
        transactions.on('changed', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            this.update(transaction);
        }));
        transactions.on('removed', (transaction) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            this.remove(transaction);
        }));
        transactions.on('periodloaded', (transactionList) => __awaiter(this, void 0, void 0, function* () {
            if (this.m_update == false)
                return;
            let left = Date.parseFb(transactions.Start).subtract("3 weeks").toFbString();
            let right = Date.parseFb(transactions.End).add('3 months').toFbString();
            let allTransactions = yield transactions.loadRecords();
            this.display(allTransactions, left, right);
        }));
    }
    turnOffUpdates() {
        this.m_update = false;
    }
    turnOnUpdates() {
        this.m_update = true;
    }
}
HistoryChart.chart_config = {
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
exports.default = HistoryChart;
