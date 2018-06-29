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
    afterOpen() {
        this.m_dialog.find('#btnSave').on('click', () => __awaiter(this, void 0, void 0, function* () {
            this.config.start = this.m_dialog.find('#date').val();
            this.config.length = this.m_dialog.find('#period_length').val();
            this.config.theme = this.m_dialog.find('#theme').val();
            this.saveConfig();
            this.close();
        }));
        this.m_dialog.find('#theme').on('change', () => {
            console.log(this.m_dialog.find('#theme').val());
            this.setTheme(this.m_dialog.find('#theme').val());
        });
    }
    afterClose() {
        super.afterClose();
        this.setTheme(this.config.theme);
    }
}
exports.default = ConfigDialog;
