"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
function sanitizePage(page) {
    page.backDisabled = page.backDisabled || false;
    page.nextDisabled = page.nextDisabled || false;
    page.backText = page.backText || 'Back';
    page.nextText = page.nextText || 'Next';
    for (let n = 0; n < page.contents.length; n++) {
        if (typeof page.contents[n] === "string") {
            let block = {
                type: 'text',
                data: page.contents[n]
            };
            page.contents[n] = block;
        }
    }
    return page;
}
class Wizard extends dialog_1.default {
    constructor(data) {
        if (data.length <= 0)
            throw "No pages passed";
        super('wizard', sanitizePage(data[0]));
        this.pages = data;
        this.pageIndex = 0;
    }
    gotoPage(n) {
        n = Math.min(this.pages.length - 1, Math.max(0, n));
        let page = sanitizePage(this.pages[n]);
        this.pageIndex = n;
        this.title.text(page.title);
        this.content.empty();
        this.content.append(page.contents.map(block => block.type == "image" ? $(`<img src="${block.data}" style="max-width: 100%;">`) : $(`<p>`).html(block.data)));
        this.backButton.attr('disabled', page.backDisabled);
        this.nextButton.attr('disabled', page.nextDisabled);
        this.backButton.text(page.backText);
        this.nextButton.text(page.nextText);
        this.fixDateFields();
        this.content.css('max-height', 0.8 * $(window).innerHeight() - this.m_dialog.find('[data-role=header]').height() - this.backButton.height());
        this.m_dialog.trigger('create');
        this.position();
        this.emitAsync('page', page.id || page.title, this.pageIndex);
    }
    afterRender() {
        this.title = this.m_dialog.find('.wizardTitle');
        this.content = this.m_dialog.find('.wizardContent');
        this.backButton = this.m_dialog.find('.wizardBackButton');
        this.nextButton = this.m_dialog.find('.wizardNextButton');
        this.backButton.on('click', () => {
            this.gotoPage(this.pageIndex - 1);
        });
        this.nextButton.on('click', () => {
            this.emit('beforepage', this.pages[this.pageIndex].id || this.pages[this.pageIndex].title, this.pageIndex);
            if (this.pageIndex + 1 >= this.pages.length) {
                this.close();
                this.emit('done');
            }
            else {
                this.gotoPage(this.pageIndex + 1);
            }
        });
    }
    afterOpen() {
        this.emitAsync('page', this.pages[0].id || this.pages[0].title, 0);
    }
}
exports.default = Wizard;
Object.defineProperty(window, 'Wizard', {
    get: () => { return Wizard; }
});
