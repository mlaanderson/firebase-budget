"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialog_1 = require("./dialog");
var MessageBoxIcon;
(function (MessageBoxIcon) {
    MessageBoxIcon["Asterisk"] = "asterisk";
    MessageBoxIcon["Error"] = "exclamation-triangle";
    MessageBoxIcon["Exclamation"] = "exclamation-circle";
    MessageBoxIcon["Hand"] = "ban";
    MessageBoxIcon["Information"] = "info-circle";
    MessageBoxIcon["None"] = "";
    MessageBoxIcon["Question"] = "question-circle";
    MessageBoxIcon["Stop"] = "ban";
    MessageBoxIcon["Warning"] = "exclamation-circle";
})(MessageBoxIcon = exports.MessageBoxIcon || (exports.MessageBoxIcon = {}));
var DialogResult;
(function (DialogResult) {
    DialogResult[DialogResult["None"] = 0] = "None";
    DialogResult[DialogResult["Abort"] = 1] = "Abort";
    DialogResult[DialogResult["Cancel"] = 2] = "Cancel";
    DialogResult[DialogResult["Ignore"] = 3] = "Ignore";
    DialogResult[DialogResult["No"] = 4] = "No";
    DialogResult[DialogResult["OK"] = 5] = "OK";
    DialogResult[DialogResult["Retry"] = 6] = "Retry";
    DialogResult[DialogResult["Yes"] = 7] = "Yes";
})(DialogResult = exports.DialogResult || (exports.DialogResult = {}));
var MessageBoxButtons;
(function (MessageBoxButtons) {
    MessageBoxButtons[MessageBoxButtons["AbortRetryIgnore"] = 0] = "AbortRetryIgnore";
    MessageBoxButtons[MessageBoxButtons["OK"] = 1] = "OK";
    MessageBoxButtons[MessageBoxButtons["OKCancel"] = 2] = "OKCancel";
    MessageBoxButtons[MessageBoxButtons["RetryCancel"] = 3] = "RetryCancel";
    MessageBoxButtons[MessageBoxButtons["YesNo"] = 4] = "YesNo";
    MessageBoxButtons[MessageBoxButtons["YesNoCancel"] = 5] = "YesNoCancel";
})(MessageBoxButtons = exports.MessageBoxButtons || (exports.MessageBoxButtons = {}));
let MessageBoxButtonList = [
    [
        { text: "Abort", result: DialogResult.Abort },
        { text: "Retry", result: DialogResult.Retry },
        { text: "Ignore", result: DialogResult.Ignore }
    ],
    [{ text: "OK", result: DialogResult.OK }],
    [
        { text: "OK", result: DialogResult.OK },
        { text: "Cancel", result: DialogResult.Cancel }
    ],
    [
        { text: "Retry", result: DialogResult.Retry },
        { text: "Cancel", result: DialogResult.Cancel }
    ],
    [
        { text: "Yes", result: DialogResult.Yes },
        { text: "No", result: DialogResult.No }
    ],
    [
        { text: "Yes", result: DialogResult.Yes },
        { text: "No", result: DialogResult.No },
        { text: "Cancel", result: DialogResult.Cancel }
    ]
];
class MessageBox extends dialog_1.default {
    constructor(text, caption, buttons, icon) {
        super('messagebox', {
            text: text,
            caption: caption,
            buttons: buttons,
            icon: icon
        });
    }
    afterOpen() {
        $(() => {
            this.m_dialog.find('button').on('click', (e) => {
                this.close();
                if (this.resolver)
                    this.resolver(parseInt($(e.target).attr('result')));
            });
        });
    }
    static get Buttons() {
        return MessageBoxButtons;
    }
    static get Icon() {
        return MessageBoxIcon;
    }
    static get DialogResult() {
        return DialogResult;
    }
    static show(text, caption, buttons, icon) {
        let dialog = new MessageBox(text, caption, MessageBoxButtonList[buttons], icon);
        dialog.open();
        return new Promise((resolve, reject) => {
            dialog.resolver = resolve;
        });
    }
}
exports.default = MessageBox;
