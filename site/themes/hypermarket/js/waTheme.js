( function($) {

    var waTheme = {
        // VARS
        site_url: "",
        app_id: "",
        app_url: "",
        locale: "",
        is_touch_enabled: ("ontouchstart" in window),
        is_frame: isFrame(),

        //
        apps: {},

        // DOM
        layout: {},

        // FUNCTIONS
        init: {}, // constructor storage

        addFonts: function(fonts) {
            var content = [];

            $.each(fonts, function(i, font) {  addFont(font); });

            function addFont(font) {
                var name = font.name,
                    font_uri = font.uri;

                content.push("@import url('" + font_uri + "');");
            }

            render( content.join("\n") );

            function render(content) {
                var style = document.createElement("style");
                style.rel = "stylesheet";
                document.head.appendChild(style);
                style.textContent = content;
            }
        }
    };

    addApp(["site", "shop", "hub", "blog", "photos", "helpdesk"]);

    window.waTheme = (window.waTheme ? $.extend(waTheme, window.waTheme) : waTheme);

    /**
     * @return {Boolean}
     * */
    function isFrame() {
        var result = false;

        try {
            result = (window.self !== window.top);
        } catch(e) {}

        return result;
    }

    /**
     * @param {Array|String} app
     * */
    function addApp(app) {
        var that = waTheme,
            type = typeof app;

        switch (type) {
            case "object":
                $.each(app, function(index, app_name) {
                    addApp(app_name);
                });
                break;
            case "string":
                add(app);
                break;
            default:
                break;
        }

        /**
         * @param {String} app_name
         * */
        function add(app_name) {
            if (!app_name.length) {return false;}

            that.apps[app_name] = {};
            that.init[app_name] = {};
        }
    }

})(jQuery);