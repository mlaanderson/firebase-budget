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
const dialog_1 = require("./dialog");
class ConfigDialog extends dialog_1.default {
    constructor(config, saveConfig, setTheme) {
        super("config_v3", config);
        this.setTheme = () => { };
        this.config = config;
        this.setTheme = setTheme;
        this.saveConfig = saveConfig;
    }
    updateButtons() {
        this.m_dialog.find('.category-moveup').removeClass('ui-disabled').first().addClass('ui-disabled');
        this.m_dialog.find('.category-movedown').removeClass('ui-disabled').last().addClass('ui-disabled');
    }
    findListItem(e) {
        if ($(e.target).is('li'))
            return $(e.target);
        return $(e.target).parents('li');
    }
    categoryUp(e) {
        let target = this.findListItem(e);
        target.insertBefore(target.prev('li'));
        this.updateButtons();
    }
    categoryDown(e) {
        let target = this.findListItem(e);
        target.insertAfter(target.next('li'));
        this.updateButtons();
    }
    categoryDelete(e) {
        let target = this.findListItem(e);
        target.remove();
        this.updateButtons();
    }
    categoryAdd(e) {
        let category = $('#newCategory').val().toString();
        if (category && this.categories.indexOf(category) < 0) {
            this.m_dialog.find('[data-role=listview]').append($('<li>', { 'class': 'ui-li-static ui-body-inherit' }).text(category).attr('category', category).append($('<div>', { 'class': 'split-custom-wrapper' }).append($('<a href="#" data-role="button" data-mini="true" class="category-delete split-custom-button ui-link ui-btn ui-icon-delete ui-btn-icon-notext ui-shadow ui-corner-all ui-mini" data-icon="delete" data-iconpos="notext" role="button"></a>').on('click', this.categoryDelete.bind(this)), $('<a href="#" data-role="button" data-mini="true" class="category-movedown split-custom-button ui-link ui-btn ui-icon-carat-d ui-btn-icon-notext ui-shadow ui-corner-all ui-mini" data-icon="delete" data-iconpos="notext" role="button"></a>').on('click', this.categoryDown.bind(this)), $('<a href="#" data-role="button" data-mini="true" class="category-moveup split-custom-button ui-link ui-btn ui-icon-carat-u ui-btn-icon-notext ui-shadow ui-corner-all ui-mini" data-icon="carat-u" data-iconpos="notext" role="button"></a>').on('click', this.categoryUp.bind(this)))));
            this.m_dialog.trigger('create');
            this.updateButtons();
            $('#newCategory').val("");
            this.m_dialog.find('[data-role=listview]').scrollTop(this.m_dialog.find('[data-role=listview]').children('li').last().offset().top);
        }
    }
    get categories() {
        return this.m_dialog.find('[data-role=listview]').children('li').toArray().map(li => $(li).attr('category'));
    }
    afterRender() {
        super.afterRender();
        this.m_dialog.find('#btnSave').on('click', () => __awaiter(this, void 0, void 0, function* () {
            this.config.start = this.m_dialog.find('#date').val();
            this.config.length = this.m_dialog.find('#period_length').val();
            this.config.theme = this.m_dialog.find('#theme').val();
            this.config.categories = this.categories;
            this.saveConfig();
            this.close();
        }));
        this.m_dialog.find('[data-role=tabs]').on('tabsactivate', () => {
            if (this.m_dialog.outerHeight(true) > $(window).innerHeight() * 0.95) {
                let height = parseInt(this.m_dialog.find('[data-role=listview]').parent().css('max-height'));
                height = height - this.m_dialog.outerHeight(true) + $(window).innerHeight() * 0.95;
                this.m_dialog.find('[data-role=listview]').parent().css('max-height', height);
            }
            this.m_dialog.popup('reposition', { positionTo: 'window' });
        });
        this.m_dialog.find('#theme').on('change', () => {
            this.setTheme(this.m_dialog.find('#theme').val());
        });
        this.m_dialog.find('#btnAddCategory').on('click', this.categoryAdd.bind(this));
        this.m_dialog.find('.category-moveup').on('click', this.categoryUp.bind(this));
        this.m_dialog.find('.category-movedown').on('click', this.categoryDown.bind(this));
        this.m_dialog.find('.category-delete').on('click', this.categoryDelete.bind(this));
        this.updateButtons();
    }
    afterClose() {
        super.afterClose();
        this.setTheme(this.config.theme);
    }
}
exports.default = ConfigDialog;
