
(function($) {
    $.widget("mobile.fa", $.mobile.widget, {
        options: {
            series: 'fas',
            icon: 'square'
        },

        _create: function() {
            var inputElement = this.element;
            var opts = $.extend(this.options, {
                series: inputElement.jqmData('fa-series') || this.options.series,
                icon: inputElement.jqmData('fa-icon') || this.options.icon
            });

            opts = $.extend(opts, inputElement.data("options"));

            inputElement.data('mobile.fa.options', opts);
            inputElement.addClass('ui-btn-fa');
            inputElement.append($(`<i class="${opts.series} fa-${opts.icon}"></i>`));
            $(document).trigger("facreate");
        },

        icon: function(value) {
            if (!value) {
                return this.element.data('mobile.fa.options').icon;
            }
            var opts = this.element.data('mobile.fa.options')
            opts.icon = value;
            this.element.children('svg .svg-inline--fa').remove()
                .append($('<i>'), { 'class': `${opts.series} fa-${opts.icon}`});
        },

        series: function(value) {
            if (!value) {
                return this.element.data('mobile.fa.options').series;
            }
            var opts = this.element.data('mobile.fa.options')
            opts.series = value;
            this.element.children('svg .svg-inline--fa').remove()
                .append($('<i>'), { 'class': `${opts.series} fa-${opts.icon}`});
        }
    });

    $(document).bind("pagecreate", function(e) {
        $(document).trigger('fabeforecreate');
        return $(":jqmData(fa-icon)", e.target).fa();
    });
})(jQuery);