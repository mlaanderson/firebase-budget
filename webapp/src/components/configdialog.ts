import Configuration, {Themes} from "../controllers/config";
import Dialog from "./dialog";

export default class ConfigDialog extends Dialog {
    private config: Configuration;
    private setTheme: (theme: Themes) => void = () => {};

    constructor(config: Configuration, saveConfig: () => void, setTheme: (theme: Themes) => void) {
        super("config_v3", config);
        this.config = config;
        this.setTheme = setTheme;
    }

    afterOpen() {
        this.m_dialog.find('#btnSave').on('click', async () => {
            this.config.start = this.m_dialog.find('#date').val() as string;
            this.config.length = this.m_dialog.find('#period_length').val() as string;
            this.config.theme = this.m_dialog.find('#theme').val() as Themes;
            await this.config.write();
            this.close();
        });

        this.m_dialog.find('#theme').on('change', () => { console.log(this.m_dialog.find('#theme').val());
            this.setTheme(this.m_dialog.find('#theme').val() as Themes);
        });
    }

    afterClose() {
        super.afterClose();
        this.setTheme(this.config.theme);
    }
}