import Dialog from "./dialog";

export interface WizardBlock {
    type: 'image' | 'text',
    data: string;
}

export interface WizardPage {
    id?: string;
    title: string;
    contents: Array<WizardBlock | string>
    backDisabled?: boolean;
    nextDisabled?: boolean;
    backText?: string;
    nextText?: string;
    dismissible?: boolean;
}

declare global {
    interface Window {
        mobile: () => boolean;
    }
}

window.mobile = function() : boolean {
    return $("#footer_info").css("display") == "none";
}

function sanitizePage(page: WizardPage, dismissible: boolean = false) : WizardPage {
    page.backDisabled = page.backDisabled || false;
    page.nextDisabled = page.nextDisabled || false;
    page.backText = page.backText || 'Back';
    page.nextText = page.nextText || 'Next';
    page.dismissible = dismissible;

    for (let n = 0; n < page.contents.length; n++) {
        if (typeof page.contents[n] === "string") {
            let block: WizardBlock = {
                type: 'text',
                data: page.contents[n] as string
            };
            page.contents[n] = block;
        }
    }

    return page;
}

export default class Wizard extends Dialog {
    private pages : Array<WizardPage>;
    private title : JQuery<HTMLElement>;
    private backButton: JQuery<HTMLElement>;
    private nextButton: JQuery<HTMLElement>;
    private scrollUp: JQuery<HTMLElement>;
    private scrollDown: JQuery<HTMLElement>;
    private pageIndex: number;
    private dismissible: boolean;

    content: JQuery<HTMLElement>;

    constructor(data: Array<WizardPage>, dismissible: boolean = false) {
        if (data.length <= 0) throw "No pages passed"; 
        
        super('wizard', sanitizePage(data[0], dismissible));
        this.pages = data;
        this.pageIndex = 0;
        this.dismissible = dismissible;
    }

    get NextEnabled() : boolean {
        return !this.nextButton.attr('disabled');
    }

    set NextEnabled(value: boolean) {
        this.nextButton.attr('disabled', !value);
    }

    get BackEnabled() : boolean {
        return !this.backButton.attr('disabled');
    }

    set BackEnabled(value: boolean) {
        this.backButton.attr('disabled', !value);
    }

    gotoPage(n: number) {
        n = Math.min(this.pages.length - 1, Math.max(0, n));
        let page = sanitizePage(this.pages[n], this.dismissible);
        this.pageIndex = n;

        this.title.text(page.title);
        this.content.empty();
        this.content.append(page.contents.map((block) => {
            if ((block as WizardBlock).type == "image") {
                return $(`<img src="${ejs.render((block as WizardBlock).data, {})}" style="max-width: 100%; display: block; margin: 0 auto; max-height: 350px;">`);
             } else {
                 return $(`<p>`).html(ejs.render((block as WizardBlock).data, {}));
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
            bgColor = `rgba(${parseInt(groups[1],16)}, ${parseInt(groups[2],16)}, ${parseInt(groups[3],16)}, 0.5)`
        } else if (reHex3.test(color)) {
            let groups = reHex3.exec(color);
            bgColor = `rgba(${parseInt(groups[1] + groups[1],16)}, ${parseInt(groups[2] + groups[2],16)}, ${parseInt(groups[3] + groups[3],16)}, 0.5)`
        } else if (reRgb.test(color)) {
            let groups = reRgb.exec(color);
            bgColor = `rgba(${groups[1]}, ${groups[2]}, ${groups[3]}, 0.5)`
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
            } else {
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
        } else {
            this.scrollUp.css('display', 'none');
        }

        if ((this.content.scrollTop() + this.content.outerHeight(true)) < (this.content[0].scrollHeight - 5)) {
            this.scrollDown.css('display', 'block');
        } else {
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

Object.defineProperty(window, 'Wizard', {
    get: () => { return Wizard; }
});
