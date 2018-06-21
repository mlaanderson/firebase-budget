// weed out old browsers
try {
    eval("() => { let a = class {} }");
    $('#oldBrowserWarning').remove();
} catch (err) {
    console.log('This browser does not support the budget');
    $(function() {
        $('[data-role=footer]').empty();
        $('.ui-btn').remove();
        $('#main').empty();
        $('#menu_panel').remove();
        $('#oldBrowserWarning').popup({
            history: false,
            overlayTheme: 'b'
        });
        
        if (/Windows/.test(navigator.userAgent) === true) {
            if (/Windows NT 1\d+\.\d+/.test(navigator.userAgent) === false) {
                $('#edge').remove();
            }
        }

        if (/Mac OS X 1\d_[1-9]{2}/.test(navigator.userAgent) === false) {
            $('#safari').remove();
        }

        $('#oldBrowserWarning').trigger('create').popup('open');
    });
}