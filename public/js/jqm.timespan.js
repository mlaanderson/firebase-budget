
(function($) {
    $.widget("mobile.timespan", $.mobile.widget, {
        options: {
            //TODO: allow the input to be limited to certain timespans
        },

        _create: function() {
            let inputElement = this.element;
            let opts = $.extend(this.options, inputElement.data("options"));

            inputElement.data('mobile.timespan.valid', true);
            inputElement.addClass('ui-timespan-valid');
            $(document).trigger("timespancreate");

            inputElement.on('keyup', function(evt) {
                try {
                    let ts = Date.Timespan.parse(inputElement.val());
                    inputElement.data('mobile.timespan.valid', true);
                    inputElement.removeClass('ui-timespan-invalid').addClass('ui-timespan-valid');

                    let event = jQuery.Event('validity');
                    event.valid = true;

                    inputElement.trigger(event);
                } catch (err) {
                    inputElement.data('mobile.timespan.valid', false);
                    inputElement.removeClass('ui-timespan-valid').addClass('ui-timespan-invalid');

                    let event = jQuery.Event('validity');
                    event.valid = false;

                    inputElement.trigger(event);
                }
            });
        },

        valid: function() {
            return this.element.data('mobile.timespan.valid');
        }
    });

    $(document).bind("pagecreate", function(e) {
        $(document).trigger('timespanbeforecreate');
        return $(":jqmData(role='timespan')", e.target).timespan();
    });
})(jQuery);