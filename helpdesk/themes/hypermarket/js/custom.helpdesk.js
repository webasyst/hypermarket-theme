( function($, waTheme) {

    var RequestPage = ( function($) {

        RequestPage = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$request = that.$wrapper.find(".h-request-block");

            // VARS
            that.form_url = options["form_url"];

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        RequestPage.prototype.initClass = function() {
            var that = this;
            //
            that.initParams();
            //
            that.initActions();
            //
            that.initDeleteButton();
        };

        RequestPage.prototype.initParams = function() {
            var that = this;

            that.$request.on("click", ".request-params-changed-link", function(event) {
                event.preventDefault();
                that.$request.find(".request-changed-params").toggle();
            });
        };

        RequestPage.prototype.initActions = function() {
            var that = this,
                $section = that.$wrapper.find(".h-actions-section"),
                $actions = $section.find(".js-actions"),
                $actionContent = $section.find(".js-action-content");

            // events
            $actions.on("click", "input", function(event) {
                event.preventDefault();
                onActionClick( $(this) );
            });

            function onActionClick($input) {
                var $loading = $('<i class="icon16 loading default"></i>'),
                    href = that.form_url.replace("%ACTION_ID%", $input.attr('name') );

                $input.after($loading);

                $.get(href, function(html) {
                    toggleContent(html);

                }).always( function() {
                    $loading.remove();
                });
            }

            function toggleContent(content) {
                if (content) {
                    $actions.hide();
                    $actionContent.html(content).show();

                } else {
                    $actions.show();
                    $actionContent.hide().html("");
                }
            }
        };

        RequestPage.prototype.initDeleteButton = function() {
            var that = this,
                $button = that.$wrapper.find("input[name=\"delete\"]");

            if ($button.length) {
                var $link = $('<a class="s-delete-link js-delete-link" href="javascript:void(0);">' + $button.val() + '</a>');
                $button.hide();
                $link.insertAfter($button);

                $link.on("click", function(event) {
                    event.preventDefault();
                    $button.trigger("click");
                });
            }
        };

        return RequestPage;

    })(jQuery);

    waTheme.init.helpdesk.RequestPage = RequestPage;

})(jQuery, window.waTheme);