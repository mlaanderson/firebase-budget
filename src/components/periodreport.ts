import CanvasReport from "./canvasreport";
import { RecordMap } from "../models/record";
import Transaction from "../models/transaction";
import Transactions from "../controllers/transactions";


export default class PeriodReport extends CanvasReport {
    private m_transactions = Array<Transaction>();
    private m_ready = false;
    private m_drawing = false;

    constructor() {
        super('canvas');

        $(window).on('resize', this.window_OnResize.bind(this));
        this.window_OnResize();
    }

    protected window_OnResize() {
        let size = 0.95 * Math.min($(window).innerHeight(), $(window).innerWidth());
        this.Size.width = size;
        this.Size.height = size;
    }


    protected onPaint(ctx: CanvasRenderingContext2D) {
        this.m_ready = true;
        this.paint(ctx);
    }

    private paint(ctx: CanvasRenderingContext2D) {
        if (this.m_ready == false) return;
        if (!this.m_transactions || this.m_transactions.length <= 0) return;
        
        if (this.m_drawing === false) {
            this.m_drawing = true;
            let total = 0;
            let categories: {[key: string]: number} = {};

            for (let transaction of this.m_transactions) {
                if (transaction.amount >= 0) continue;
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
                ctx.moveTo(0,0);
                ctx.lineTo(diameter,0);
                ctx.arc(0, 0, diameter, 0, angle);
                ctx.rotate(angle);
                ctx.moveTo(0,0);
                ctx.lineTo(diameter,0);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(0, 0, diameter, 0, 360);
            ctx.stroke();

            n = 0;
            ctx.restore();

            ctx.font = Math.round(0.05 * diameter) + 'pt -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
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

    display(transactions: RecordMap<Transaction>) {
        let list = new Array<Transaction>();
        for (let k in transactions) {
            list.push(transactions[k]);
        }
        this.displayList(list);
    }

    displayList(transactions: Array<Transaction>) {
        this.m_transactions = transactions;
        this.paint(this.context);
    }

    update(transaction: Transaction, total?: number) {
        let removes = this.m_transactions.map((tr, idx) => tr.id == transaction.id ? idx : -1).filter(n => n >= 0);
        this.m_transactions = this.m_transactions.filter((el,idx) => removes.indexOf(idx) < 0);
        this.m_transactions.push(transaction);
        // this.displayList(this.m_transactions);
        this.window_OnResize();
    }

    clear() {

    }

    listenToTransactions(transactions: Transactions) {
        transactions.on('addedinperiod', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('changed', async (transaction: Transaction) => {
            this.update(transaction);
        });

        transactions.on('removedinperiod', async (transaction: Transaction) => {
            this.m_transactions = this.m_transactions.filter((tr) => tr.id != transaction.id);
            this.displayList(this.m_transactions);
        });

        this.displayList(transactions.List);
    }
}