"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const report_1 = require("./report");
const events_1 = require("../controllers/events");
class CanvasSizeInt extends events_1.default {
    constructor(size) {
        super();
        this.m_width = size ? size.width : 0;
        this.m_height = size ? size.height : 0;
    }
    /**
     * If the value is less than or equal to zero width is fixed
     * If the value is from 0.0 to 1.0 it is treated as a percent of window.innerWidth
     * If the value is greater than 1.0 it is an absolute
     */
    get width() {
        return this.m_width;
    }
    set width(value) {
        this.m_width = value;
        this.emit('changed', this);
    }
    /**
     * If the value is less than or equal to zero height is not adjusted by the control.
     * If the value is from 0.0 to 1.0 it is treated as a percent of window.innerHeight.
     * If the value is greater than 1.0 it is an absolute.
     */
    get height() {
        return this.m_height;
    }
    set height(value) {
        this.m_height = value;
        this.emit('changed', this);
    }
    /** Gets the calculated width to be used for the control or 0 if disabled */
    get calculatedWidth() {
        if (!this.valid)
            return 0;
        if (this.width <= 1) {
            return $(window).innerWidth() * this.width;
        }
        return this.width;
    }
    /** Gets the calculated height to be used for the control or 0 if disabled */
    get calculatedHeight() {
        if (!this.valid)
            return 0;
        if (this.height <= 1) {
            return $(window).innerHeight() * this.height;
        }
        return this.height;
    }
    /** Indicates if the width or height settings will be used for the control */
    get valid() {
        return !(this.height <= 0 || this.width <= 0);
    }
}
class CanvasReport extends report_1.default {
    constructor(filename, resizeTarget = { width: 0, height: 0 }, data) {
        super(filename, data);
        this.m_resizeTarget = new CanvasSizeInt(resizeTarget);
    }
    /**
     * Be sure to call super.onResize() if you override this
     */
    onResize() {
        if (this.m_resizeTarget.valid) {
            this.m_dialog.width(this.m_resizeTarget.calculatedWidth);
            this.m_dialog.height(this.m_resizeTarget.calculatedHeight);
            this.canvas[0].width = this.m_dialog.innerWidth();
            this.canvas[0].height = this.m_dialog.innerHeight();
            this.onPaint(this.context);
        }
        this.position();
    }
    /**
     * Be sure to call super.afterRender() if you override this
     */
    afterRender() {
        // attach to the canvas
        this.canvas = this.m_dialog.find('canvas');
        this.context = this.canvas[0].getContext('2d');
    }
    /**
     * Be sure to call super.afterOpen() if you override this
     */
    afterOpen() {
        // resize if needed
        if (this.m_resizeTarget.valid) {
            this.onResize();
        }
        else {
            this.onPaint(this.context);
        }
        $(window).on('resize', this.onResize.bind(this));
        this.m_resizeTarget.on('changed', this.onResize.bind(this));
    }
    /**
     * Be sure to call super.afterClose if you override this
     */
    afterClose() {
        $(window).off('resize', this.onResize.bind(this));
        this.m_resizeTarget.off('changed');
    }
    onPaint(context) { }
    get Size() {
        return this.m_resizeTarget;
    }
}
exports.default = CanvasReport;
