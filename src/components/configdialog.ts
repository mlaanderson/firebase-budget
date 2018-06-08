import Configuration from "../controllers/config";
import Dialog from "./dialog";

export default class ConfigDialog extends Dialog {
    private config: Configuration;

    constructor(config: Configuration, saveConfig: () => void) {
        super("config_v3", config);
        this.config = config;
    }

    afterOpen() {
        this.m_dialog.find('#btnSave').on('click', async () => {
            this.config.start = this.m_dialog.find('#date').val() as string;
            this.config.length = this.m_dialog.find('#period_length').val() as string;
            await this.config.write();
            this.close();
        });
    }
}