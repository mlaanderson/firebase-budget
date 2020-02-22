import Dialog from "./dialog";

export enum MessageBoxIcon {
    Asterisk = 'asterisk',
    Error = 'exclamation-triangle',
    Exclamation = 'exclamation-circle',
    Hand = 'ban',
    Information = 'info-circle',
    None = '',
    Question = 'question-circle',
    Stop = 'ban',
    Warning = 'exclamation-circle'
}

export enum DialogResult {
    None = 0,
    Abort,
    Cancel,
    Ignore, 
    No,
    OK,
    Retry,
    Yes
}

interface ButtonStruct {
    text: string;
    result: DialogResult;
}

export enum MessageBoxButtons {
    AbortRetryIgnore = 0,
    OK = 1,
    OKCancel = 2,
    RetryCancel = 3,
    YesNo = 4,
    YesNoCancel = 5
}

let MessageBoxButtonList: Array<Array<ButtonStruct>> = [
    [
        { text: "Abort", result: DialogResult.Abort },
        { text: "Retry", result: DialogResult.Retry },
        { text: "Ignore", result: DialogResult.Ignore }
    ],
    [ { text: "OK", result: DialogResult.OK }],
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

export default class MessageBox extends Dialog {
    private buttons: Array<ButtonStruct>;
    private icon: string;
    private resolver: (result: DialogResult) => void;

    constructor(text: string, caption: string, buttons: Array<ButtonStruct>, icon: string) {
        super('messagebox', {
            text: text,
            caption: caption,
            buttons: buttons,
            icon: icon
        });
    }

    protected afterOpen() {
        $(() => {
            this.m_dialog.find('button').on('click', (e) => {
                this.close();
                if (this.resolver) this.resolver(parseInt($(e.target).attr('result')) as DialogResult);
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

    static show(text: string, caption: string, buttons: MessageBoxButtons, icon: MessageBoxIcon) {
        let dialog = new MessageBox(text, caption, MessageBoxButtonList[buttons], icon);
        dialog.open();
        return new Promise<DialogResult>((resolve, reject) => {
            dialog.resolver = resolve;
        });
    }
}