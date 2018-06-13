"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const canvasreport_1 = require("./canvasreport");
class PeriodReport extends canvasreport_1.default {
    constructor() {
        super('canvas');
        this.m_transactions = Array();
        this.m_ready = false;
        this.m_drawing = false;
        $(window).on('resize', this.window_OnResize.bind(this));
        this.window_OnResize();
    }
    window_OnResize() {
        let size = 0.95 * Math.min($(window).innerHeight(), $(window).innerWidth());
        this.Size.width = size;
        this.Size.height = size;
    }
    onPaint(ctx) {
        this.m_ready = true;
        this.paint(ctx);
    }
    paint(ctx) {
        if (this.m_ready == false)
            return;
        if (!this.m_transactions || this.m_transactions.length <= 0)
            return;
        if (this.m_drawing === false) {
            this.m_drawing = true;
            let total = 0;
            let categories = {};
            for (let transaction of this.m_transactions) {
                if (transaction.amount >= 0)
                    continue;
                if (transaction.category in categories === false) {
                    categories[transaction.category] = 0;
                }
                categories[transaction.category] -= transaction.amount;
                total -= transaction.amount;
            }
            ctx.save();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            let diameter = 0.7 * Math.min(ctx.canvas.width, ctx.canvas.height) / 2;
            ctx.translate(ctx.canvas.width / 2, 0.8 * (ctx.canvas.height / 2));
            ctx.rotate(-Math.PI / 2);
            let n = 0;
            let colors = ["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47", "#264478", "#9e480e", "#636363", "#997300", "#255e91", "#43682b", "#698ed0", "#f1975a", "#b7b7b7"];
            for (let k in categories) {
                let sum = categories[k];
                let angle = 2 * Math.PI * sum / total;
                ctx.fillStyle = colors[n++ % colors.length];
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(diameter, 0);
                ctx.arc(0, 0, diameter, 0, angle);
                ctx.rotate(angle);
                ctx.moveTo(0, 0);
                ctx.lineTo(diameter, 0);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(0, 0, diameter, 0, 360);
            ctx.stroke();
            n = 0;
            ctx.restore();
            ctx.font = Math.round(0.05 * diameter) + 'pt -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            let width = 0;
            for (let k in categories) {
                width = Math.max(width, ctx.measureText(k).width);
            }
            let itemWidth = width + 25;
            let itemsPerRow = Math.floor((ctx.canvas.width - 40) / itemWidth);
            let leftStart = (ctx.canvas.width - itemsPerRow * itemWidth) / 2;
            let x = leftStart;
            ctx.translate(leftStart, 0.8 * (ctx.canvas.height) + 5);
            for (let k in categories) {
                ctx.fillStyle = 'black';
                ctx.fillText(k, 15, -Math.round(0.0625 * diameter), width);
                ctx.fillText(categories[k].toCurrency(), 15, 0, width);
                ctx.fillStyle = colors[n++];
                ctx.fillRect(2.5, -12.5, 10, 10);
                x += itemWidth;
                ctx.translate(itemWidth, 0);
                if (n > 0 && (n % itemsPerRow) == 0) {
                    ctx.translate(leftStart - x, Math.round(0.15 * diameter));
                    x = leftStart;
                }
            }
            ctx.restore();
            this.m_drawing = false;
        }
    }
    display(transactions) {
        let list = new Array();
        for (let k in transactions) {
            list.push(transactions[k]);
        }
        this.displayList(list);
    }
    displayList(transactions) {
        this.m_transactions = transactions;
        this.paint(this.context);
    }
    update(transaction, total) {
        let removes = this.m_transactions.map((tr, idx) => tr.id == transaction.id ? idx : -1).filter(n => n >= 0);
        this.m_transactions = this.m_transactions.filter((el, idx) => removes.indexOf(idx) < 0);
        this.m_transactions.push(transaction);
        // this.displayList(this.m_transactions);
        this.window_OnResize();
    }
    clear() {
    }
    listenToTransactions(transactions) {
        transactions.on('addedinperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            this.update(transaction);
        }));
        transactions.on('changed', (transaction) => __awaiter(this, void 0, void 0, function* () {
            this.update(transaction);
        }));
        transactions.on('removedinperiod', (transaction) => __awaiter(this, void 0, void 0, function* () {
            this.m_transactions = this.m_transactions.filter((tr) => tr.id != transaction.id);
            this.displayList(this.m_transactions);
        }));
        this.displayList(transactions.List);
    }
}
exports.default = PeriodReport;
