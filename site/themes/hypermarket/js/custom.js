// Main Class
( function($, waTheme) {

    $.ajaxSetup({ cache: false });

    var FixedBlock = ( function($) {

        FixedBlock = function(options) {
            var that = this;

            // DOM
            that.$window = $(window);
            that.$wrapper = options["$section"];
            that.$wrapperW = options["$wrapper"];

            // VARS
            that.type = (options["type"] || "bottom");
            that.lift = (options["lift"] || 0);

            // DYNAMIC VARS
            that.offset = {};
            that.$clone = false;
            that.is_fixed = false;

            // INIT
            that.initClass();
        };

        FixedBlock.prototype.initClass = function() {
            var that = this,
                $window = that.$window,
                resize_timeout = 0;

            $window.on("resize", function() {
                clearTimeout(resize_timeout);
                resize_timeout = setTimeout( function() {
                    that.resize();
                }, 100);
            });

            $window.on("scroll", watcher);

            that.$wrapper.on("resize", function() {
                that.resize();
            });

            that.init();

            function watcher() {
                var is_exist = $.contains($window[0].document, that.$wrapper[0]);
                if (is_exist) {
                    that.onScroll($window.scrollTop());
                } else {
                    $window.off("scroll", watcher);
                }
            }

            that.$wrapper.data("block", that);
        };

        FixedBlock.prototype.init = function() {
            var that = this;

            if (!that.$clone) {
                var $clone = $("<div />").css("margin", "0");
                that.$wrapper.after($clone);
                that.$clone = $clone;
            }

            that.$clone.hide();

            var offset = that.$wrapper.offset();

            that.offset = {
                left: offset.left,
                top: offset.top,
                width: that.$wrapper.outerWidth(),
                height: that.$wrapper.outerHeight()
            };
        };

        FixedBlock.prototype.resize = function() {
            var that = this;

            switch (that.type) {
                case "top":
                    that.fix2top(false);
                    break;
                case "bottom":
                    that.fix2bottom(false);
                    break;
            }

            var offset = that.$wrapper.offset();
            that.offset = {
                left: offset.left,
                top: offset.top,
                width: that.$wrapper.outerWidth(),
                height: that.$wrapper.outerHeight()
            };

            that.$window.trigger("scroll");
        };

        /**
         * @param {Number} scroll_top
         * */
        FixedBlock.prototype.onScroll = function(scroll_top) {
            var that = this,
                window_w = that.$window.width(),
                window_h = that.$window.height();

            // update top for dynamic content
            that.offset.top = (that.$clone && that.$clone.is(":visible") ? that.$clone.offset().top : that.$wrapper.offset().top);

            switch (that.type) {
                case "top":
                    var bottom_case = (that.$wrapperW ? ((scroll_top + that.offset.height) < that.$wrapperW.height() + that.$wrapperW.offset().top) : true),
                        use_top_fix = (that.offset.top - that.lift < scroll_top && bottom_case);

                    that.fix2top(use_top_fix);
                    break;
                case "bottom":
                    var use_bottom_fix = (that.offset.top && scroll_top + window_h < that.offset.top + that.offset.height);
                    that.fix2bottom(use_bottom_fix);
                    break;
            }

        };

        /**
         * @param {Boolean|Object} set
         * */
        FixedBlock.prototype.fix2top = function(set) {
            var that = this,
                fixed_class = "is-top-fixed";

            if (set) {
                that.$wrapper
                    .css({
                        position: "fixed",
                        top: that.lift,
                        left: that.offset.left,
                        width: that.offset.width
                    })
                    .addClass(fixed_class);

                that.$clone.css({
                    height: that.offset.height
                }).show();

            } else {
                that.$wrapper.removeClass(fixed_class).removeAttr("style");
                that.$clone.removeAttr("style").hide();
            }

            that.is_fixed = !!set;
        };

        /**
         * @param {Boolean|Object} set
         * */
        FixedBlock.prototype.fix2bottom = function(set) {
            var that = this,
                fixed_class = "is-bottom-fixed";

            if (set) {
                that.$wrapper
                    .css({
                        position: "fixed",
                        bottom: 0,
                        left: that.offset.left,
                        width: that.offset.width
                    })
                    .addClass(fixed_class);

                that.$clone.css({
                    height: that.offset.height
                }).show();

            } else {
                that.$wrapper.removeClass(fixed_class).removeAttr("style");
                that.$clone.removeAttr("style").hide();
            }

            that.is_fixed = !!set;
        };

        return FixedBlock;

    })(jQuery);

    // Main class
    var Layout = ( function($) {

        Layout = function(options) {
            var that = this;

            // DOM
            that.$window = $(window);
            that.$wrapper = waTheme.layout.$wrapper;
            that.$block = waTheme.layout.$block;
            that.$content = waTheme.layout.$content;
            that.$sidebar = waTheme.layout.$sidebar;
            that.$footer = ( waTheme.layout.$footer && waTheme.layout.$footer.length ? waTheme.layout.$footer : false);

            // VARS

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        Layout.prototype.initClass = function() {
            var that = this;
            //
            if (that.$footer) {
                that.initMinSpace();
            }
            //
            that.initAuthAdapters();
            //
            that.initCaptcha();
            //
            that.initSidebar();

            $.ajaxSetup({
                cache: false
            });
        };

        // Min space before footer
        Layout.prototype.initMinSpace = function() {
            var that = this;

            var $window = that.$window,
                $content = that.$content,
                $footer = that.$footer.find(".s-footer-block");

            setSpace();

            $window.on("resize", setSpace);

            window.addEventListener("orientationchange", setSpace);

            function setSpace() {
                $content.removeAttr("style");

                var display_height = $window.height(),
                    main_height = $content.closest(".s-content-wrapper").height(),
                    footer_top = $footer.offset().top,
                    footer_height = $footer.outerHeight(true);

                var delta = ( display_height - (footer_top + footer_height) );

                if (delta > 0) {
                    $content.css({
                        "min-height": main_height + delta + "px"
                    });
                }
            }

        };

        Layout.prototype.initAuthAdapters = function() {
            var that = this;

            $(".s-adapters-section").on("click", "a", function(event) {
                event.preventDefault();
                onProviderClick( $(this) );
            });

            function onProviderClick( $link ) {
                var $li = $link.closest("li"),
                    provider = $li.data("provider");

                if (provider !== 'guest' && provider !== 'signup') {
                    var width = $link.data('width') || 600,
                        height = $link.data('height') || 500,
                        left = (screen.width-width)/ 2,
                        top = (screen.height-height)/ 2,
                        href = $link.attr("href");

                    if ( ( typeof require_authorization !== "undefined" ) && !require_authorization) {
                        href = href + "&guest=1";
                    }

                    window.open(href, "oauth", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top +
                        ",status=no,toolbar=no,menubar=no");
                }
            }
        };

        Layout.prototype.initCaptcha = function() {
            var that = this;

            // Click on refresh button or image
            $(".wa-captcha").on("click", ".wa-captcha-refresh, .wa-captcha-img", function(event) {
                event.preventDefault();
                refreshCaptcha( $(this) );
            });

            // Refresh Captcha
            function refreshCaptcha($target) {
                var $wrapper = $target.closest(".wa-captcha"),
                    captcha = $wrapper.find(".wa-captcha-img");

                if (captcha.length) {
                    var newCaptchaHref = captcha.attr("src").replace( /\?.*$/,'?rid='+Math.random() );

                    captcha.attr("src", newCaptchaHref);

                    captcha.one("load", function() {
                        $wrapper.find('.wa-captcha-input').focus();
                    });
                }

                $wrapper.find("input").val("");
            }
        };

        Layout.prototype.initSidebar = function() {
            var that = this;

            if (!that.$sidebar || !that.$sidebar.length) {
                return false;
            }

            var Sidebar = ( function($) {

                Sidebar = function (options) {
                    var that = this;

                    // DOM
                    that.$wrapper = options["$wrapper"];

                    // VARS

                    // DYNAMIC VARS

                    // INIT
                    that.initClass();
                };

                Sidebar.prototype.initClass = function() {
                    var that = this;

                    that.initDeepLists();
                };

                Sidebar.prototype.initDeepLists = function() {
                    var that = this,
                        $lists = that.$wrapper.find(".js-deep-list");

                    $lists.each( function() {
                        var $list = $(this);

                        $list.on("click", ".js-toggle", function(event) {
                            event.preventDefault();

                            var $li = $(this).closest("li"),
                                open_class = "is-opened";

                            $li.toggleClass(open_class);
                        });
                    });
                };

                return Sidebar;

            })($);

            new Sidebar({
                $wrapper: that.$sidebar
            });
        };

        return Layout;

    })($);

    // Pane :: bottom panel with store buttons
    var Pane = (function($) {

        Pane = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];

            // VARS

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        Pane.prototype.initClass = function() {
            var that = this;

            that.initSticky();
        };

        Pane.prototype.initSticky = function() {
            var that = this,
                $wrapper = that.$wrapper.find(".js-pane-wrapper");

            var FixedBlock = ( function($) {

                FixedBlock = function(options) {
                    var that = this;

                    // DOM
                    that.$window = $(window);
                    that.$wrapper = options["$wrapper"];
                    that.$section = options["$section"];
                    that.$wrapperContainer = that.$wrapper.parent();

                    // VARS
                    that.type = (options["type"] || "bottom");

                    // DYNAMIC VARS
                    that.offset = {};
                    that.$clone = false;
                    that.is_fixed = false;

                    // INIT
                    that.initClass();
                };

                FixedBlock.prototype.initClass = function() {
                    var that = this,
                        $window = that.$window,
                        resize_timeout = 0;

                    $window.on("resize", function() {
                        clearTimeout(resize_timeout);
                        resize_timeout = setTimeout( function() {
                            that.resize();
                        }, 100);
                    });

                    $window.on("scroll", watcher);

                    that.$wrapper.on("resize", function() {
                        that.resize();
                    });

                    that.init();

                    watcher();

                    function watcher() {
                        var is_exist = $.contains($window[0].document, that.$wrapper[0]);
                        if (is_exist) {
                            that.onScroll($window.scrollTop());
                        } else {
                            $window.off("scroll", watcher);
                        }
                    }

                    that.$wrapper.data("block", that);
                };

                FixedBlock.prototype.init = function() {
                    var that = this;

                    if (!that.$clone) {
                        var $clone = $("<div />");
                        that.$wrapperContainer.append($clone);
                        that.$clone = $clone;
                    }

                    that.$clone.hide();

                    var offset = that.$wrapper.offset();
                    that.offset = {
                        left: offset.left,
                        top: offset.top,
                        width: that.$wrapper.outerWidth(),
                        height: that.$wrapper.outerHeight()
                    };
                };

                FixedBlock.prototype.resize = function() {
                    var that = this;

                    switch (that.type) {
                        case "top":
                            that.fix2top(false);
                            break;
                        case "bottom":
                            that.fix2bottom(false);
                            break;
                    }

                    var offset = that.$wrapper.offset();
                    that.offset = {
                        left: offset.left,
                        top: offset.top,
                        width: that.$wrapper.outerWidth(),
                        height: that.$wrapper.outerHeight()
                    };

                    that.$window.trigger("scroll");
                };

                /**
                 * @param {Number} scroll_top
                 * */
                FixedBlock.prototype.onScroll = function(scroll_top) {
                    var that = this,
                        window_w = that.$window.width(),
                        window_h = that.$window.height();

                    // update top for dynamic content
                    that.offset.top = that.$wrapperContainer.offset().top;

                    switch (that.type) {
                        case "top":
                            var bottom_case = (that.$section ? ((scroll_top + that.offset.height) < that.$section.height() + that.$section.offset().top) : true),
                                use_top_fix = (that.offset.top < scroll_top && bottom_case);

                            that.fix2top(use_top_fix);
                            break;
                        case "bottom":
                            var use_bottom_fix = (that.offset.top && scroll_top + window_h < that.offset.top + that.offset.height);
                            that.fix2bottom(use_bottom_fix);
                            break;
                    }

                };

                /**
                 * @param {Boolean|Object} set
                 * */
                FixedBlock.prototype.fix2top = function(set) {
                    var that = this,
                        fixed_class = "is-top-fixed";

                    if (set) {
                        that.$wrapper
                            .css({
                                left: that.offset.left,
                                width: that.offset.width
                            })
                            .addClass(fixed_class);

                        that.$clone.css({
                            height: that.offset.height
                        }).show();

                    } else {
                        that.$wrapper.removeClass(fixed_class).removeAttr("style");
                        that.$clone.removeAttr("style").hide();
                    }

                    that.is_fixed = !!set;
                };

                /**
                 * @param {Boolean|Object} set
                 * */
                FixedBlock.prototype.fix2bottom = function(set) {
                    var that = this,
                        fixed_class = "is-bottom-fixed";

                    if (set) {
                        that.$wrapper
                            .css({
                                left: that.offset.left,
                                width: that.offset.width
                            })
                            .addClass(fixed_class);

                        that.$clone.css({
                            height: that.offset.height
                        }).show();

                    } else {
                        that.$wrapper.removeClass(fixed_class).removeAttr("style");
                        that.$clone.removeAttr("style").hide();
                    }

                    that.is_fixed = !!set;
                };

                return FixedBlock;

            })(jQuery);

            new FixedBlock({
                $wrapper: $wrapper,
                type: "bottom"
            });

        };

        return Pane;
    })($);

    // Pane :: Compare
    var Compare = ( function($) {

        var change_functions = [];

        Compare = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$count = that.$wrapper.find(".js-count");
            that.$compareIcon = that.$wrapper.find(".js-compare-icon");
            that.onChange = options["onChange"];

            // VARS

            // DYNAMIC VARS
            that.count = null;

            // INIT
            that.initClass();
        };

        Compare.prototype.initClass = function() {
            var that = this,
                is_frame = waTheme.is_frame;

            if (that.onChange && (typeof that.onChange === "function") ) {
                change_functions.push(that.onChange);
            }

            if (!is_frame) {
                that.update();
            }
        };

        Compare.prototype.update = function() {
            var that = this,
                compare = $.cookie("shop_compare"),
                count;

            compare = (compare) ? compare.split(',') : [];
            count = compare.length;

            if ( count > 0 ) {
                that.$count.text(count);
                that.toggle(true);
            } else {
                that.$count.text(0);
                that.toggle();
            }

            that.count = count;

            $.each(change_functions, function(index, func) {
                try {
                    func(that);
                } catch(e) {
                    console.log(e.message);
                }
            });
        };

        Compare.prototype.toggle = function(show) {
            var that = this,
                empty_class = "is-empty",
                active_class = "active";

            if (show) {
                that.$wrapper.removeClass(empty_class);
                that.$compareIcon.addClass(active_class);
            } else {
                that.$wrapper.addClass(empty_class);
                that.$compareIcon.removeClass(active_class);
            }
        };

        /**
         * @param {String|Number} product_id
         * @param {Object?} $image
         * @return {Boolean}
         * */
        Compare.prototype.addToCompare = function(product_id, $image) {
            var that = this;

            product_id = product_id + "";

            var cookie_name = "shop_compare",
                cookie_compare = $.cookie(cookie_name),
                compare_ids = (cookie_compare) ? cookie_compare.split(',') : [],
                index = compare_ids.indexOf(product_id),
                is_added = (index >= 0);

            if (is_added) {
                remove(product_id);
                that.update();

            } else {
                add(product_id);

                if ($image && $image.length) {
                    animate($image).then( function() {
                        that.update();
                    });
                }
            }

            return !is_added;

            /**
             * @param {Object} $image
             * */
            function animate($image) {
                var deferred = $.Deferred();

                // DOM
                var $clone = $image.clone();

                // VARS
                var offset = $image.offset(),
                    image_w = $image.width(),
                    image_h = $image.height(),
                    cart_offset = that.$wrapper.offset(),
                    time = 666;

                var clone_class = "s-clone-wrapper",
                    animate_to_class = "is-animated";

                $clone
                    .hide()
                    .addClass(clone_class);

                $clone.css({
                    top: offset.top,
                    left: offset.left,
                    width: image_w,
                    height: image_h
                });

                $clone.appendTo($("body")).show();

                $clone.css({
                    top: cart_offset.top,
                    left: cart_offset.left,
                    width: 0,
                    height: 0,
                    opacity: 0
                }).addClass(animate_to_class);

                setTimeout( function() {
                    $clone.remove();
                    deferred.resolve();
                }, time);

                return deferred.promise();
            }

            /**
             * @param {String} product_id
             * */
            function add(product_id) {
                compare_ids.push(product_id);
                $.cookie(cookie_name, compare_ids.join(','), {expires: 30, path: '/'});
            }

            /**
             * @param {String} product_id
             * */
            function remove(product_id) {
                compare_ids.splice(index, 1);

                if (compare_ids.length > 0) {
                    $.cookie(cookie_name, compare_ids.join(','), { expires: 30, path: '/'});
                } else {
                    $.cookie(cookie_name, null, {path: '/'});
                }
            }
        };

        /**
         * @param {Function} func
         * */
        Compare.prototype.onChange = function(func) {
            if (typeof func === "function") {
                change_functions.push(func);
            }
        };

        return Compare;
    })($);

    // Pane :: Cart
    var Cart = (function($) {

        var change_functions = [];

        Cart = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$count = that.$wrapper.find(".js-cart-count");
            that.$text = that.$wrapper.find(".js-cart-price");

            // VARS

            // DYNAMIC VARS
            that.count = options["count"];

            // INIT
            that.initClass();
        };

        Cart.prototype.initClass = function() {
            var that = this;

            $(document).on("cartIsChanged", function(event, data) {
                that.update(data);
            });


        };

        /**
         * @param {Object} data
         * */
        Cart.prototype.update = function(data) {
            var that = this;

            if (data.count > 0) {
                that.$count.text(data.count);
                that.$text.html(data.text);
                that.count = (data.count);
                toggle(true);
            } else {
                that.$count.text(0);
                that.$text.html(data.text);
                that.count = 0;
                toggle();
            }

            function toggle(show) {
                var empty_class = "is-empty";

                if (show) {
                    that.$wrapper.removeClass(empty_class);
                } else {
                    that.$wrapper.addClass(empty_class);
                }
            }

            $.each(change_functions, function(index, func) {
                try {
                    func(that);
                } catch(e) {
                    console.log(e.message);
                }
            });
        };

        /**
         * @param {Function} func
         * */
        Cart.prototype.onChange = function(func) {
            if (typeof func === "function") {
                change_functions.push(func);
            }
        };

        /**
         * @param {Object} $image
         * */
        Cart.prototype.animateAddToCart = function($image) {
            var that = this;

            if ($image && $image.length) {
                animate($image);
            }

            /**
             * @param {Object} $image
             * */
            function animate($image) {
                var deferred = $.Deferred();

                // DOM
                var $clone = $image.clone();

                // VARS
                var offset = $image.offset(),
                    image_w = $image.width(),
                    image_h = $image.height(),
                    cart_offset = that.$wrapper.offset(),
                    time = 666;

                var clone_class = "s-clone-wrapper",
                    animate_to_class = "is-animated";

                $clone
                    .hide()
                    .addClass(clone_class);

                $clone.css({
                    top: offset.top,
                    left: offset.left,
                    width: image_w,
                    height: image_h
                });

                $clone.appendTo($("body")).show();

                $clone.css({
                    top: cart_offset.top,
                    left: cart_offset.left,
                    width: 0,
                    height: 0,
                    opacity: 0
                }).addClass(animate_to_class);

                setTimeout( function() {
                    $clone.remove();
                    deferred.resolve();
                }, time);

                return deferred.promise();
            }
        };

        return Cart;

    })($);

    // Header :: Catalog
    var Catalog = ( function($) {

        Catalog = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$button = that.$wrapper.find(".s-catalog-button");
            that.$list = that.$wrapper.find(".s-catalog-list");

            // VARS
            that.open_class = "is-opened";
            that.hover_class = "is-hover";
            that.is_locked = options["is_locked"];

            // DYNAMIC VARS
            that.is_opened = false;
            that.is_touch_enabled = waTheme.is_touch_enabled;
            that.$activeMenu = false;

            // TIMERS
            that.timer_1 = 0;
            that.timer_2 = 0;
            that.timer_3 = 0;
            that.open_timer = 0;
            that.show_time = 666;
            that.hide_time = 666;

            // INIT
            $(document).ready( function() {
                that.initClass();
            });
        };

        Catalog.prototype.initClass = function() {
            var that = this;

            that.$block = waTheme.layout.$block;
            that.$sidebar = waTheme.layout.$sidebar;

            // Set sidebar lift
            if (that.is_locked) {
                that.$sidebar.css("padding-top", that.$list.outerHeight());
            }
            //
            that.bindEvents();
        };

        Catalog.prototype.bindEvents = function() {
            var that = this;

            // Show/hide main menu
            if (that.is_touch_enabled) {
                that.$button[0].addEventListener("touchstart", function () {
                    that.toggleView();
                });

                var $openedLi = false;

                that.$wrapper.on("click", "a", function(event) {
                    event.preventDefault();

                    var $link = $(this),
                        $li = $link.closest("li"),
                        has_menu = !!$li.find("> .s-sub-wrapper").length;

                    var active_class = "is-opened";

                    if ($openedLi) {
                        $openedLi.removeClass(active_class);
                        $openedLi = false;
                    }

                    if (has_menu) {
                        $openedLi = $li.addClass(active_class);

                    } else {
                        location.href = $link[0].href;
                    }
                });

            } else {
                that.$button.on("mouseenter", function() {
                    that.open_timer = setTimeout( function() {
                        that.toggleView("show");
                    }, that.show_time);

                });

                that.$button.on("click", function() {
                    if (!that.is_locked) {
                        clearTimeout(that.open_timer);
                        if (that.is_opened) {
                            that.toggleView("hide");
                        } else {
                            that.toggleView("show");
                        }
                    }
                });

                that.$button.on("mouseleave", function() {
                    clearTimeout(that.open_timer);
                });

                that.$wrapper.on("mouseenter", function() {
                    clearTimeout(that.timer_1);
                });

                that.$wrapper.on("mouseleave", function() {
                    that.timer_1 = setTimeout( function() {
                        that.hideSubmenu();
                        that.toggleView("hide");
                    }, that.hide_time);
                });
            }

            // Show/hide submenu
            if (!that.is_touch_enabled) {
                that.$list.on("mouseenter", "> li", function() {
                    var $li = $(this);
                    clearTimeout(that.timer_2);
                    clearTimeout(that.timer_3);
                    that.timer_3 = setTimeout( function() {
                        that.hideSubmenu();
                        that.showSubmenu($li);
                    }, that.show_time);
                });
                that.$list.on("mouseleave", "> li", function() {
                    that.timer_2 = setTimeout( function() {
                        that.hideSubmenu();
                    }, that.hide_time);
                });
            }
        };

        Catalog.prototype.toggleView = function(show) {
            var that = this,
                show_list;

            clearTimeout(that.timer_1);

            if (!that.is_locked) {
                if (show) {
                    if (show === "show") {
                        show_list = true;
                    } else if (show === "hide") {
                        show_list = false;
                    }
                } else {
                    show_list = !that.is_opened;
                }

                if (show_list) {
                    that.$wrapper.addClass(that.open_class);
                    that.is_opened = true;
                } else {
                    that.$wrapper.removeClass(that.open_class);
                    that.is_opened = false;
                    that.hideSubmenu();
                }
            }
        };

        Catalog.prototype.showSubmenu = function($li) {
            var that = this,
                is_active = $li.hasClass(that.hover_class);

            clearTimeout(that.timer_2);

            if (!is_active) {
                that.hideSubmenu();
                //
                setSubmenuWidth($li);
                //
                that.$activeMenu = $li.addClass(that.hover_class);
            }

            function setSubmenuWidth( $li ) {
                var $sub_list = $li.find(".s-sub-wrapper");
                if ($sub_list.length) {
                    var width = that.$block.outerWidth() - that.$list.outerWidth() - 32 + 8;
                    $sub_list.css("width", width + "px");
                }
            }
        };

        Catalog.prototype.hideSubmenu = function() {
            var that = this;

            clearTimeout(that.timer_2);

            if (that.$activeMenu) {
                that.$activeMenu.removeClass(that.hover_class);
                that.$activeMenu = false;
            }
        };

        return Catalog;

    })($);

    // MAILER app email subscribe form
    var SubscribeSection = ( function($) {

        SubscribeSection = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$form = that.$wrapper.find("form");
            that.$emailField = that.$wrapper.find(".js-email-field");
            that.$submitButton = that.$wrapper.find(".js-submit-button");

            // VARS
            that.request_uri = options["request_uri"];
            that.locales = options["locales"];

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        SubscribeSection.prototype.initClass = function() {
            var that = this;

            if (that.request_uri.substr(0,4) === "http") {
                that.request_uri = that.request_uri.replace("http:", "").replace("https:", "");
            }

            var $invisible_captcha = that.$form.find(".wa-invisible-recaptcha");
            if (!$invisible_captcha.length) {
                that.initView();
            }

            that.initSubmit();
        };

        SubscribeSection.prototype.initView = function() {
            var that = this;

            that.$emailField.on("focus", function() {
                toggleView(true);
            });

            $(document).on("click", watcher);

            function watcher(event) {
                var is_exist = $.contains(document, that.$wrapper[0]);
                if (is_exist) {
                    var is_target = $.contains(that.$wrapper[0], event.target);
                    if (!is_target) {
                        toggleView(false);
                    }
                } else {
                    $(document).off("click", watcher);
                }
            }

            function toggleView(show) {
                var active_class = "is-extended";
                if (show) {
                    that.$wrapper.addClass(active_class);
                } else {
                    var email_value = that.$emailField.val();
                    if (!email_value.length) {
                        that.$wrapper.removeClass(active_class);
                    } else {

                    }
                }
            }
        };

        SubscribeSection.prototype.initSubmit = function() {
            var that = this,
                $form = that.$form,
                $errorsPlace = that.$wrapper.find(".js-errors-place"),
                is_locked = false;

            $form.on("submit", onSubmit);

            function onSubmit(event) {
                event.preventDefault();

                var formData = getData();

                if (formData.errors.length) {
                    renderErrors(formData.errors);
                } else {
                    request(formData.data);
                }
            }

            /**
             * @return {Object}
             * */
            function getData() {
                var result = {
                        data: [],
                        errors: []
                    },
                    data = $form.serializeArray();

                $.each(data, function(index, item) {
                    if (item.value) {
                        result.data.push(item);
                    } else {
                        result.errors.push({
                            name: item.name
                        });
                    }
                });

                return result;
            }

            /**
             * @param {Array} data
             * */
            function request(data) {
                if (!is_locked) {
                    is_locked = true;

                    var href = that.request_uri;

                    $.post(href, data, "jsonp")
                        .always( function() {
                            is_locked = false;
                        })
                        .done( function(response) {
                            if (response.status === "ok") {
                                renderSuccess();

                            } else if (response.errors) {
                                var errors = formatErrors(response.errors);
                                renderErrors(errors);
                            }
                        });
                }

                /**
                 * @param {Object} errors
                 * @result {Array}
                 * */
                function formatErrors(errors) {
                    var result = [];

                    $.each(errors, function(text, item) {
                        var name = item[0];

                        if (name === "subscriber[email]") { name = "email"; }

                        result.push({
                            name: name,
                            value: text
                        });
                    });

                    return result;
                }
            }

            /**
             * @param {Array} errors
             * */
            function renderErrors(errors) {
                var error_class = "error";

                if (!errors || !errors[0]) {
                    errors = [];
                }

                $.each(errors, function(index, item) {
                    var name = item.name,
                        text = item.value;

                    var $field = that.$wrapper.find("[name=\"" + name + "\"]"),
                        $text = $("<span class='c-error' />").addClass("error");

                    if ($field.length && !$field.hasClass(error_class)) {
                        if (text) {
                            $field.parent().append($text.text(text));
                        }

                        $field
                            .addClass(error_class)
                            .one("focus click change", function() {
                                $field.removeClass(error_class);
                                $text.remove();
                            });
                    } else {
                        $errorsPlace.append($text);

                        $form.one("submit", function() {
                            $text.remove();
                        });
                    }
                });
            }

            function renderSuccess() {
                var $text = that.$wrapper.find(".js-success-message");
                $form.hide();
                $text.show();
            }
        };

        return SubscribeSection;

    })(jQuery);

    var ScheduleSection = ( function($) {

        ScheduleSection = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];

            // VARS

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        ScheduleSection.prototype.initClass = function() {
            var that = this,
                $wrapper = that.$wrapper;

            var open_class = "is-open";

            $wrapper.on("click", ".js-show-schedule", function(event) {
                event.preventDefault();
                $wrapper.toggleClass(open_class);
            });

            $wrapper.on("click", ".js-close-schedule", function(event) {
                event.preventDefault();
                $wrapper.removeClass(open_class);
            });

            $(document).on("click", clickWatcher);
            function clickWatcher(event) {
                var is_exist = $.contains(document, $wrapper[0]);
                if (is_exist) {
                    var is_target = $.contains($wrapper[0], event.target);
                    if (!is_target) {
                        if ($wrapper.hasClass(open_class)) {
                            $wrapper.removeClass(open_class);
                        }
                    }
                } else {
                    $(document).off("click", clickWatcher);
                }
            }

            $(document).on("keyup", keyWatcher);
            function keyWatcher(event) {
                var is_exist = $.contains(document, $wrapper[0]);
                if (is_exist) {
                    var is_escape = (event.keyCode === 27);
                    if (is_escape) {
                        if ($wrapper.hasClass(open_class)) {
                            $wrapper.removeClass(open_class);
                        }
                    }
                } else {
                    $(document).off("click", keyWatcher);
                }
            }
        };

        return ScheduleSection;

    })(jQuery);

    // PAGES

    var ProfilePage = ( function($) {

        ProfilePage = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.locales = options["locales"];

            // VARS

            // DYNAMIC VARS
            that.is_locked = false;
            that.xhr = false;

            // INIT
            that.initClass();
        };

        ProfilePage.prototype.initClass = function() {
            var that = this;

            that.initEditProfile();
        };

        ProfilePage.prototype.initEditProfile = function() {
            var that = this,
                $wrapper = that.$wrapper.find(".js-form-wrapper");

            if (!$wrapper.length) { return false; }

            var ProfileSection = ( function($) {

                ProfileSection = function(options) {
                    var that = this;

                    // DOM
                    that.$wrapper = options["$wrapper"];
                    that.$editBlock = that.$wrapper.find(".js-edit-block");
                    that.$viewBlock = that.$wrapper.find(".js-view-block");
                    that.$passwordField = that.$editBlock.find(".wa-field-password");
                    that.$photoField = that.$editBlock.find(".wa-field-photo");

                    // VARS
                    that.locales = options["locales"];

                    // DYNAMIC VARS

                    // INIT
                    that.initClass();
                };

                ProfileSection.prototype.initClass = function() {
                    var that = this;
                    //
                    that.initBlockToggle();
                    //
                    if (that.$passwordField.length) {
                        that.initChangePassword();
                    }
                    //
                    if (that.$photoField.length) {
                        that.initPhotoSection();
                    }
                };

                ProfileSection.prototype.initBlockToggle = function() {
                    var that = this;

                    // show Edit Form
                    that.$wrapper.on("click", ".js-show-edit-form", function(event) {
                        event.preventDefault();
                        toggle(true);
                    });

                    // hide edit Form
                    that.$wrapper.on("click", ".js-reset-form", function(event) {
                        event.preventDefault();
                        that.$wrapper.trigger("onReset");
                        toggle(false);
                    });

                    /**
                     * @param {Boolean} show
                     * */
                    function toggle(show) {
                        if (show) {
                            that.$viewBlock.hide();
                            that.$editBlock.show();

                        } else {
                            that.$editBlock.hide();
                            that.$viewBlock.show();
                        }
                    }
                };

                ProfileSection.prototype.initChangePassword = function() {
                    var that = this,
                        $password = that.$passwordField,
                        $passwordBlock = $password.find("p"),
                        $changeLink = $("<a class=\"s-button s-change-password-button js-change-password\" href=\"javascript:void(0);\">" + that.locales["changePasswordText"] + "</a>").hide(),
                        hidden_class = "is-hidden",
                        is_changed = false;

                    // Render
                    $password.find('.wa-value').prepend($changeLink);

                    $changeLink.on("click", function(event) {
                        event.preventDefault();
                        toggle(true);
                    });

                    var $viewChangePassword = that.$viewBlock.find(".js-change-password-force").show();
                    $viewChangePassword.on("click", function(event) {
                        event.preventDefault();

                        that.$wrapper.find(".js-show-edit-form").trigger("click");
                        toggle(true);
                        setTimeout(function() {
                            $(window).scrollTop($password.offset().top);
                        }, 100)
                    });

                    toggle(false);

                    that.$wrapper.on("onReset", function() {
                        if (is_changed) {
                            toggle(false);
                        }
                    });

                    /**
                     * @param {Boolean} show
                     * */
                    function toggle(show) {
                        if (show) {
                            $changeLink.hide();
                            $passwordBlock.removeClass(hidden_class);

                        } else {
                            $changeLink.show();
                            $passwordBlock.addClass(hidden_class);
                        }

                        is_changed = show;
                    }
                };

                ProfileSection.prototype.initPhotoSection = function() {
                    var that = this,
                        $photo = that.$photoField,
                        $delete_photo_link = $("<a class=\"js-delete-photo\" href=\"javascript:void(0);\">" + that.locales["deletePhotoText"] + "</a>"),
                        $delete_link_wrapper = $("<p />").append($delete_photo_link),
                        $photo_input = $photo.find('[name="profile[photo]"]'),
                        $user_photo = $photo.find('img:first'),
                        $default_photo = $photo.find('img:last'),
                        photo_input_val = $photo_input.val(),
                        is_changed = false;

                    if ($user_photo[0] !== $default_photo[0]) {
                        $default_photo.hide()
                            .after($delete_link_wrapper);

                        $delete_photo_link.on("click", function(event) {
                            event.preventDefault();
                            toggle(true);
                        });

                    } else {
                        $default_photo.show();
                    }

                    that.$wrapper.on("onReset", function() {
                        if (is_changed) {
                            toggle(false);
                        }
                    });

                    /**
                     * @param {Boolean} show
                     * */
                    function toggle(show) {
                        if (show) {
                            $user_photo.hide();
                            $default_photo.show();
                            $delete_photo_link.hide();
                            $photo_input.val('');
                        } else {
                            $user_photo.show();
                            $default_photo.hide();
                            $delete_photo_link.show();
                            $photo_input.val(photo_input_val);
                        }

                        is_changed = show;
                    }
                };

                return ProfileSection;

            })($);

            new ProfileSection({
                $wrapper: $wrapper,
                locales: that.locales
            });
        };

        return ProfilePage;

    })($);

    //

    var Dropdown = ( function($) {

        Dropdown = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$button = that.$wrapper.find("> .dropdown-toggle");
            that.$menu = that.$wrapper.find("> .dropdown-body");
            that.$filter = that.$menu.find("> .dropdown-filter");

            // VARS
            that.on = {
                change: (typeof options["change"] === "function" ? options["change"] : function() {}),
                ready: (typeof options["ready"] === "function" ? options["ready"] : function() {}),
                open: (typeof options["open"] === "function" ? options["open"] : function() {}),
                close: (typeof options["close"] === "function" ? options["close"] : function() {})
            };
            that.options = {
                items       : (options["items"] ? options["items"] : null),
                hover       : (typeof options["hover"] === "boolean" ? options["hover"] : false),
                hide        : (typeof options["hide"] === "boolean" ? options["hide"] : true),
                disabled    : (typeof options["disabled"] === "boolean" ? options["disabled"] : false),
                active_class: (options["active_class"] ? options["active_class"] : "selected"),
                update_title: (typeof options["update_title"] === "boolean" ? options["update_title"] : true),
                protect: {
                    use_protect: (typeof options["protect"] === "boolean" ? options["protect"] : true),
                    right: (typeof options["protect"] === "object" && typeof options["protect"]["right"] === "number" ? options["protect"]["right"] : 20),
                    bottom: (typeof options["protect"] === "object" && typeof options["protect"]["bottom"] === "number" ? options["protect"]["bottom"] : 70)
                }
            };

            // DYNAMIC VARS
            that.is_opened = false;
            that.$before = null;
            that.$active = null;

            // INIT
            if (!that.options.disabled) {
                that.init();
            }
        };

        Dropdown.prototype.init = function() {
            var that = this,
                $document = $(document),
                $body = $("body");

            if (that.options.hover) {
                that.$button.on("mouseenter", function() {
                    that.toggleMenu(true);
                });

                that.$wrapper.on("mouseleave", function() {
                    that.toggleMenu(false);
                });
            }

            that.$button.on("click", function(event) {
                event.preventDefault();
                that.toggleMenu(!that.is_opened);
            });

            if (that.options.items) {
                if (that.$filter.length) { that.initFilter(); }
                that.initChange(that.options.items);
            }

            $body.on("keyup", keyWatcher);
            function keyWatcher(event) {
                var is_exist = $.contains(document, that.$wrapper[0]);
                if (is_exist) {
                    var is_escape = (event.keyCode === 27);
                    if (that.is_opened && is_escape) {
                        event.stopPropagation();
                        that.hide();
                    }
                } else {
                    $body.off("keyup", keyWatcher);
                }
            }

            $document.on("click", clickWatcher);
            function clickWatcher(event) {
                var wrapper = that.$wrapper[0],
                    is_exist = $.contains(document, wrapper);

                if (is_exist) {
                    var is_target = (event.target === wrapper || $.contains(wrapper, event.target));
                    if (that.is_opened && !is_target) {
                        that.hide();
                    }
                } else {
                    $document.off("click", clickWatcher);
                }
            }

            that.$wrapper.data("dropdown", that);
            that.on.ready(that);
        };

        Dropdown.prototype.toggleMenu = function(open) {
            var that = this,
                active_class = "is-opened";

            that.is_opened = open;

            if (open) {
                that.$wrapper.addClass(active_class);

                // Защита от всплывания окна за правой/нижней границей экрана
                if (that.options.protect.use_protect) { protect(); }

                that.on.open(that);

                if (that.$filter.length) { that.$filter.find(".js-field").trigger("focus"); }

            } else {
                that.$wrapper.removeClass(active_class);
                that.on.close(that);

                if (that.$filter.length) { that.$filter.find(".js-field").val("").trigger("input"); }
            }

            function protect() {
                var top_class = "top",
                    right_class = "right";

                // clear
                that.$menu
                    .removeClass(top_class)
                    .removeClass(right_class);

                var $window = $(window),
                    rect = that.$wrapper[0].getBoundingClientRect(),
                    menu_rect = that.$menu[0].getBoundingClientRect();

                // BOTTOM PROTECTION
                var top_space = rect.y,
                    bottom_space = $window.height() - rect.y - rect.height;

                // Если места снизу под меню не хватает
                if (bottom_space < menu_rect.height + that.options.protect.bottom) {
                    // Если места сверху хватает под меню ЛИБО места сверху больше чем снизу
                    if (top_space > menu_rect.height || top_space > bottom_space) {
                        that.$menu.addClass(top_class);
                    }
                }

                // RIGHT PROTECTION
                var right_space = $window.width() - rect.x - that.$menu.outerWidth(),
                    use_right = ($window.width() - menu_rect.right < that.options.protect.right);

                if (use_right) {
                    that.$menu.addClass(right_class);
                }
            }
        };

        Dropdown.prototype.initChange = function(selector) {
            var that = this,
                active_class = that.options.active_class;

            that.$active = that.$menu.find(selector + "." + active_class);

            that.$wrapper.on("click", selector, onChange);

            function onChange(event) {
                event.preventDefault();

                var $target = $(this);

                if (that.$active.length) {
                    that.$before = that.$active.removeClass(active_class);
                }

                that.$active = $target.addClass(active_class);

                if (that.options.update_title) {
                    that.setTitle($target.html());
                }

                if (that.options.hide) {
                    that.hide();
                }

                that.$wrapper.trigger("change", [$target[0], that]);
                that.on.change(event, this, that);
            }
        };

        Dropdown.prototype.open = function() {
            var that = this;

            that.toggleMenu(true);
        };

        Dropdown.prototype.hide = function() {
            var that = this;

            that.toggleMenu(false);
        };

        Dropdown.prototype.setTitle = function(html) {
            var that = this;

            that.$button.html( html );
        };

        /**
         * @param {String} name
         * @param {String} value
         * @return {Boolean} result
         * */
        Dropdown.prototype.setValue = function(name, value) {
            var that = this,
                result = false;

            if (that.options.items) {
                that.$menu.find(that.options.items).each( function() {
                    var $target = $(this),
                        target_value = "" + $target.data(name);

                    if (target_value) {
                        if (target_value === value) {
                            $target.trigger("click");
                            result = true;
                            return false;
                        }
                    }
                });
            }

            return result;
        };

        Dropdown.prototype.initFilter = function() {
            var that = this;

            var $wrapper = that.$filter,
                $field = $wrapper.find(".js-field");

            $field.on("input", function() {
                filter($.trim($field.val()));
            });

            function filter(value) {
                value = (typeof value === "string" ? value.toLowerCase() : "");

                var $items = that.$menu.find(that.options.items);

                if (value.length) {
                    $items.each( function() {
                        var $item = $(this),
                            name = $item.text().toLowerCase();

                        if (name.indexOf(value) >= 0) {
                            $item.show();
                        } else {
                            $item.hide();
                        }
                    });
                } else {
                    $items.show();
                }
            }
        };

        return Dropdown;

    })($);

    var Toggle = ( function($) {

        Toggle = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];

            // VARS
            that.on = {
                ready: (typeof options["ready"] === "function" ? options["ready"] : function() {}),
                change: (typeof options["change"] === "function" ? options["change"] : function() {})
            };
            that.active_class = (options["active_class"] || "selected");
            that.use_animation = ( typeof options["use_animation"] === "boolean" ? options["use_animation"] : true);
            that.type = (typeof options["type"] === "string" ? options["type"] : "default");

            // DYNAMIC VARS
            that.$before = null;
            that.$active = that.$wrapper.find("> *." + that.active_class);

            // INIT
            that.init();
        };

        Toggle.prototype.init = function() {
            var that = this,
                active_class = that.active_class;

            switch (that.type) {
                case "tabs":
                    that.$wrapper.addClass("tabs-mode");
                    break;
                case "default":
                    that.$wrapper.addClass("default");
                    break;
                default:
                    break;
            }

            that.$wrapper.on("click", "> *", onClick);

            that.$wrapper.trigger("ready", that);

            that.on.ready(that);

            if (that.use_animation) {
                that.initAnimation();
            }

            //

            function onClick(event) {
                event.preventDefault();

                var $target = $(this),
                    is_active = $target.hasClass(active_class);

                if (is_active) { return false; }

                if (that.$active.length) {
                    that.$before = that.$active.removeClass(active_class);
                }

                that.$active = $target.addClass(active_class);

                that.$wrapper.trigger("toggle.change", [this, that]);
                that.on.change(event, this, that);
            }
        };

        Toggle.prototype.initAnimation = function() {
            var that = this;

            var is_ready = false;

            var observer = new MutationObserver(refresh);
            observer.observe(that.$wrapper[0],{
                childList: true,
                subtree: true
            });

            that.$wrapper.addClass("animate");
            that.$wrapper.on("toggle.change", refresh);

            var $wrapper = $("<div class=\"animation-block\" />");

            if (that.$active.length) { refresh(); }

            function refresh() {
                if (!that.$active.length) { return false; }

                var area = getArea(that.$active);

                $wrapper.css(area);

                if (!is_ready) {
                    $wrapper.prependTo(that.$wrapper);
                    is_ready = true;
                }
            }

            function getArea() {
                var offset = that.$active.offset(),
                    wrapper_offset = that.$wrapper.offset();

                return {
                    top: offset.top - wrapper_offset.top,
                    left: offset.left - wrapper_offset.left,
                    width: that.$active.width(),
                    height: that.$active.height()
                };
            }
        };

        return Toggle;

    })($);

    waTheme.init.site.Layout = Layout;
    waTheme.init.site.Pane = Pane;
    waTheme.init.site.ProfilePage = ProfilePage;
    waTheme.init.site.FixedBlock = FixedBlock;
    waTheme.init.site.SubscribeSection = SubscribeSection;
    waTheme.init.site.ScheduleSection = ScheduleSection;
    waTheme.init.site.Dropdown = Dropdown;
    waTheme.init.site.Toggle = Toggle;

    waTheme.init.shop.Compare = Compare;
    waTheme.init.shop.Cart = Cart;
    waTheme.init.shop.Catalog = Catalog;

})(jQuery, window.waTheme);
