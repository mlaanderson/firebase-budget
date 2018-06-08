import "ejs";

export default class Renderer {
    render(filename: string, data?: Object) : Promise<string> {
        return new Promise((resolve, reject) => {
            data = data || {};
            ejs.renderFile(filename, data, (template) => {
                resolve(template);
            });
        });
    }
}