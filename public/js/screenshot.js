async function screenShot(element, filename) {

    if (!filename) {
        if (typeof element == "string" && /\.png$/i.test(element)) {
            filename = element.toLowerCase();
            element = undefined;
        } else {
            filename = 'download.png';
        }
    }

    if (!element) {
        element = $.mobile.activePage;
    }
    
    element = $(element);

    let canvas = await html2canvas(element[0]);

    if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(canvas.msToBlob(), filename);
    } else {
        let uri = canvas.toDataURL();
        let link = document.createElement('a');
        link.href = uri;
        link.style.display = 'none';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}