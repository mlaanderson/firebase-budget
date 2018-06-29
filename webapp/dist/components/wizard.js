"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
window.mobile = function () {
    return $("#footer_info").css("display") == "none";
};
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
        this.content.append(page.contents.map((block) => {
            if (block.type == "image") {
                return $(`<img src="${ejs.render(block.data, {})}" style="max-width: 100%; display: block; margin: 0 auto; max-height: 350px;">`);
            }
            else {
                return $(`<p>`).html(ejs.render(block.data, {}));
            }
        }));
        this.backButton.attr('disabled', page.backDisabled);
        this.nextButton.attr('disabled', page.nextDisabled);
        this.backButton.text(page.backText);
        this.nextButton.text(page.nextText);
        this.fixDateFields();
        this.content.css('max-height', '');
        this.content.find('*').ready(() => {
            this.m_dialog.trigger('create');
            this.content.scrollTop(0);
            this.content_OnScroll();
            this.emitAsync('page', page.id || page.title, this.pageIndex);
        });
    }
    afterRender() {
        this.title = this.m_dialog.find('.wizardTitle');
        this.content = this.m_dialog.find('.wizardContent');
        this.backButton = this.m_dialog.find('.wizardBackButton');
        this.nextButton = this.m_dialog.find('.wizardNextButton');
        this.scrollUp = this.m_dialog.find('.wizardScrollUp');
        this.scrollDown = this.m_dialog.find('.wizardScrollDown');
        // set the scroll background colors
        let color = this.m_dialog.css('background-color');
        let reHex6 = /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/i;
        let reHex3 = /^#([a-f0-9])([a-f0-9])([a-f0-9])/i;
        let reRgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i;
        let bgColor = color;
        if (reHex6.test(color)) {
            let groups = reHex6.exec(color);
            bgColor = `rgba(${parseInt(groups[1], 16)}, ${parseInt(groups[2], 16)}, ${parseInt(groups[3], 16)}, 0.5)`;
        }
        else if (reHex3.test(color)) {
            let groups = reHex3.exec(color);
            bgColor = `rgba(${parseInt(groups[1] + groups[1], 16)}, ${parseInt(groups[2] + groups[2], 16)}, ${parseInt(groups[3] + groups[3], 16)}, 0.5)`;
        }
        else if (reRgb.test(color)) {
            let groups = reRgb.exec(color);
            bgColor = `rgba(${groups[1]}, ${groups[2]}, ${groups[3]}, 0.5)`;
        }
        this.scrollDown.css('background-color', bgColor);
        this.scrollUp.css('background-color', bgColor);
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
        this.scrollDown.on('click', () => {
            this.content.scrollTop(this.content.scrollTop() + this.content.height() / 2);
        });
        this.scrollUp.on('click', () => {
            this.content.scrollTop(this.content.scrollTop() - this.content.height() / 2);
        });
    }
    content_OnScroll() {
        if (this.content.scrollTop() > 5) {
            this.scrollUp.css('display', 'block');
        }
        else {
            this.scrollUp.css('display', 'none');
        }
        if ((this.content.scrollTop() + this.content.outerHeight(true)) < (this.content[0].scrollHeight - 5)) {
            this.scrollDown.css('display', 'block');
        }
        else {
            this.scrollDown.css('display', 'none');
        }
    }
    window_OnResize() {
        let dialogHeight = 0.9 * $(window).innerHeight();
        let mainPadding = this.m_dialog.find("[role=main]").outerHeight(true) - this.m_dialog.find("[role=main]").height();
        this.m_dialog.css('height', dialogHeight);
        this.m_dialog.css('width', Math.min(0.9 * $(window).innerWidth(), 600));
        this.content.css('height', dialogHeight - this.m_dialog.find('[data-role=header]').outerHeight(true) - this.backButton.outerHeight(true) - mainPadding);
        this.scrollUp.css('width', this.content.css('width'));
        this.scrollDown.css('width', this.content.css('width'));
        this.scrollUp.css('left', this.content.position().left);
        this.scrollDown.css('left', this.content.position().left);
        this.scrollDown.css('top', this.content.innerHeight() - this.scrollDown.outerHeight(true) + this.content.position().top);
    }
    afterOpen() {
        $(window).on('resize', this.window_OnResize.bind(this));
        this.content.on('scroll', this.content_OnScroll.bind(this));
        this.window_OnResize();
        this.m_dialog.trigger('create');
        this.position();
        this.gotoPage(0);
        // this.emitAsync('page', this.pages[0].id || this.pages[0].title, 0);
    }
}
exports.default = Wizard;
Object.defineProperty(window, 'Wizard', {
    get: () => { return Wizard; }
});
