( function($, waTheme) {

    var Dialog = ( function($) { "use strict";

        function getDialog(html) {
            return $('<div class="s-dialog-wrapper" id="s-dialog-wrapper"><div class="s-dialog-block" id="s-dialog-block">' + html + '<span class="s-close-icon js-close-dialog">&times;</span></div></div>');
        }

        //

        Dialog = function(options) {
            var that = this;
            //
            that.html = ( options['html'] || false );
            //
            that.$body = $("body");
            that.$window = $(window);
            that.$dialog = getDialog(that.html);
            that.$content = that.$dialog.find("#s-dialog-block");

            // VARS
            that.body_class = "dialog-is-show";

            //
            that.onClose = ( options['onClose'] || false );
            that.onCancel = ( options['onClose'] || false );

            // DYNAMIC VARS

            // INIT
            that.initDialog();

            return that;
        };

        Dialog.prototype.initDialog = function() {
            var that = this;

            that.$dialog.data("dialog", that);

            that.showDialog();

            that.bindEvents();
        };

        Dialog.prototype.bindEvents = function() {
            var that = this,
                $dialog = that.$dialog,
                $content = that.$content;

            $dialog.on("click", function() {
                $dialog.trigger("close");
                $dialog.trigger("onCancel");
            });

            $content.on("click", function(event) {
                event.stopPropagation();
            });

            $content.on("click", ".js-close-dialog", function(event) {
                event.stopPropagation();
                $dialog.trigger("close");
            });

            $(document).on("keyup", watcher);

            // Custom events

            $dialog.on("close", function() {
                that.close();
            });

            $dialog.on("onClose", function() {
                if (that.onClose && (typeof that.onClose === "function") ) {
                    that.onClose();
                }
            });

            $dialog.on("onCancel", function() {
                if (that.onCancel && (typeof that.onCancel === "function") ) {
                    that.onCancel();
                }
            });

            $(window).on("resize", onResize);

            //

            function watcher(event) {
                var is_exist = $.contains(document, $dialog[0]);
                if (is_exist) {
                    var escape_code = 27;
                    if (event.keyCode === escape_code) {
                        that.close();
                    }
                } else {
                    $(document).off("keyup", watcher);
                }
            }

            function onResize() {
                var is_exist = $.contains(document, that.$dialog[0]);
                if (is_exist) {
                    that.resize();
                } else {
                    $(window).off("resize", onResize);
                }
            }
        };

        Dialog.prototype.showDialog = function() {
            var that = this;

            that.$body
                .addClass(that.body_class)
                .append( that.$dialog );

            var $window = that.$window,
                window_h = $window.height(),
                content_h = that.$content.outerHeight(),
                min_pad = 50,
                top = min_pad;

            if (window_h > ( min_pad * 2 + content_h ) ) {
                top = parseInt( (window_h - content_h)/2 );
            }

            that.$content.css({
                top: top
            });
        };

        Dialog.prototype.resize = function() {
            var that = this,
                $window = that.$window,
                window_w = $window.width(),
                window_h = $window.height(),
                $block = that.$content,
                wrapper_w = $block.outerWidth(),
                wrapper_h = $block.outerHeight(),
                pad = 20;

            var css = getDefaultPosition({
                width: wrapper_w,
                height: wrapper_h
            });

            if (css.top > 0) {
                if (css.top + wrapper_h > window_h) {
                    css.top = window_h - wrapper_h - pad;
                }
            } else {
                css.top = pad;

                var $content = $block.find(".s-dialog-content");

                $content.hide();

                var block_h = $block.outerHeight(),
                    content_h = window_h - block_h - pad * 2;

                $content
                    .height(content_h)
                    .addClass("is-long-content")
                    .show();
            }

            $block.css(css);

            function getDefaultPosition(area) {
                return {
                    left: 0,
                    top: parseInt((window_h - area.height)/2)
                };
            }
        };

        Dialog.prototype.close = function() {
            var that = this;

            that.$dialog.trigger("onClose");

            that.$dialog.remove();

            that.$body.removeClass(that.body_class);
        };

        return Dialog;

    })($);

    var ProductsFilter = ( function($) {

        ProductsFilter = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$form = that.$wrapper.find("form");

            // VARS

            // DYNAMIC VARS
            that.is_locked = false;

            // INIT
            that.initClass();
        };

        ProductsFilter.prototype.initClass = function() {
            var that = this;
            //
            if (!waTheme.is_touch_enabled) {
                that.initRangeSlider();
            }
            //
            that.bindEvents();

            window.addEventListener('popstate', function(event) {
                location.reload();
            });
        };

        ProductsFilter.prototype.initRangeSlider = function() {
            var that = this,
                $ranges = that.$wrapper.find(".s-range-item");

            var RangeSlider = ( function($) {

                var template =
                    '<div class="s-range-slider">' +
                    '<div class="r-bar-wrapper">' +
                    '<span class="r-bar"></span>' +
                    '<span class="r-point left"></span>' +
                    '<span class="r-point right"></span>' +
                    '</div>' +
                    '</div>';

                RangeSlider = function(options) {
                    var that = this;

                    // DOM
                    that.$wrapper = options["$wrapper"];
                    that.$inputMin = options["$inputMin"];
                    that.$inputMax = options["$inputMax"];

                    // VARS
                    that.min = options["min"];
                    that.max = options["max"];
                    that.left_value = options["left_value"];
                    that.right_value = options["right_value"];
                    that.move_class = "is-move";
                    that.active_class = "is-active";

                    // DYNAMIC DOM
                    that.$rangeWrapper = false;
                    that.$leftPoint = false;
                    that.$rightPoint = false;
                    that.$bar = false;
                    that.$activePoint = false;

                    // DYNAMIC VARS
                    that.left = 0;
                    that.right = 100;
                    that.range_left = false;
                    that.range_width = false;

                    // INIT
                    that.initClass();
                };

                RangeSlider.prototype.initClass = function() {
                    var that = this;

                    that.$rangeWrapper = $(template);
                    that.$leftPoint = that.$rangeWrapper.find(".r-point.left");
                    that.$rightPoint = that.$rangeWrapper.find(".r-point.right");
                    that.$barWrapper = that.$rangeWrapper.find(".r-bar-wrapper");
                    that.$bar = that.$rangeWrapper.find(".r-bar");
                    that.$wrapper.after( that.$rangeWrapper );

                    that.changeRange();

                    that.bindEvents();
                };

                RangeSlider.prototype.bindEvents = function() {
                    var that = this,
                        move_class = that.move_class,
                        $document = $(document),
                        $body = $("body"),
                        no_select = "no-user-select";

                    that.$rangeWrapper.on("mousedown", ".r-point", function() {
                        that.$activePoint = $(this);
                        that.range_left = that.$barWrapper.offset().left;
                        that.range_width = that.$barWrapper.outerWidth();

                        // No selection then moving
                        $body.addClass(no_select);

                        // Add sub events
                        $document.on("mousemove", onMouseMove);
                        $document.on("mouseup", onMouseUp);
                    });

                    that.$inputMin.on("keyup", function() {
                        var $input = $(this),
                            val = parseInt( $input.val() );

                        if ( !(val >= 0) ) {
                            val = 0;
                        }

                        if (val < that.min) {
                            val = that.min;
                        }

                        if (val >= that.max) {
                            val = that.max * .99;
                        }

                        that.left_value = val;
                        that.changeRange();
                    });

                    that.$inputMax.on("keyup", function() {
                        var $input = $(this),
                            val = parseInt( $input.val() );

                        if ( !(val >= 0) ) {
                            val = that.max;
                        }

                        if (val > that.max) {
                            val = that.max;
                        }

                        if (val <= that.left_value) {
                            val = that.left_value * 1.01;
                        }

                        that.right_value = val;
                        that.changeRange();
                    });

                    that.$wrapper.closest("form").on("reset", function(event) {
                        that.setRange(0, 100, true);
                    });

                    function onMouseMove(event) {
                        var $point = that.$activePoint;
                        if (that.$activePoint) {
                            // Add move Class
                            var is_move = $point.hasClass(that.move_class);
                            if (!is_move) {
                                $point.addClass(that.move_class);
                            }
                            // Do moving
                            that.prepareSetRange(event, $point);
                        }
                    }

                    function onMouseUp() {
                        $document.off("mousemove", onMouseMove);
                        $document.off("mouseup", onMouseUp);
                        $body.removeClass(no_select);
                        if (that.$activePoint) {
                            that.$activePoint.removeClass(move_class);
                            that.$activePoint = false;
                        }
                    }
                };

                RangeSlider.prototype.prepareSetRange = function(event, $point) {
                    var that = this,
                        is_left = ( $point[0] == that.$leftPoint[0] ),
                        delta, percent, min, max;
                    //
                    delta = ( event.pageX || event.clientX ) - that.range_left;
                    if (delta < 0) {
                        delta = 0;
                    } else if (delta > that.range_width) {
                        delta = that.range_width;
                    }
                    //
                    percent = (delta/that.range_width) * 100;

                    // Min Max
                    var min_points_place = 7; // 7%
                    if (is_left) {
                        min = 0;
                        max = that.right - min_points_place;
                    } else {
                        min = that.left + min_points_place;
                        max = 100;
                    }
                    if (percent < min) {
                        percent = min;
                    } else if (percent > max) {
                        percent = max;
                    }

                    // Set Range
                    if (is_left) {
                        that.setRange(percent, that.right);
                    } else {
                        that.setRange(that.left, percent);
                    }
                };

                RangeSlider.prototype.setRange = function( left, right, not_change_input ) {
                    var that = this,
                        result_left = 0,
                        result_right = 100;

                    if ( left && left >= 0 && left < result_right ) {
                        result_left = left;
                    }

                    if ( right && right > 0 && right <= result_right && right > result_left ) {
                        result_right = right;
                    }

                    // Set data
                    that.left = result_left;
                    that.right = result_right;

                    // Render
                    that.$leftPoint.css("left", result_left + "%");
                    that.$rightPoint.css("left", result_right + "%");

                    if (!not_change_input) {
                        var delta_value = that.max - that.min,
                            min_val = that.min + that.left * delta_value / 100,
                            max_val = that.min + that.right * delta_value / 100;

                        that.$inputMin.val( parseInt(min_val * 10)/10 );
                        that.$inputMax.val( parseInt(max_val * 10)/10 );
                    }

                    // Bar
                    that.setBar();

                };

                RangeSlider.prototype.setBar = function() {
                    var that = this;
                    that.$bar.css({
                        width: Math.floor(that.right - that.left) + "%",
                        left: that.left + "%"
                    });
                };

                RangeSlider.prototype.changeRange = function() {
                    var that = this;

                    // Set Range at Start
                    var left_value = that.left,
                        right_value = that.right,
                        delta_value = that.max - that.min;

                    if (that.left_value && that.left_value >= that.min && that.left_value < that.max) {
                        left_value = ( (that.left_value - that.min)/delta_value) * 100;
                    }

                    if (that.right_value && that.right_value > left_value && that.right_value <= that.max) {
                        right_value = ( (that.right_value - that.min)/delta_value) * 100;
                    }

                    that.setRange(left_value,right_value, true);
                };

                return RangeSlider;

            })(jQuery);

            $ranges.each( function() {
                var $range = $(this),
                    $inputMin = $range.find(".min"),
                    $inputMax = $range.find(".max"),
                    min = +$range.data("min"),
                    max = +$range.data("max"),
                    left = +$inputMin.val(),
                    right = +$inputMax.val();

                if ($inputMin.length && $inputMax.length && min >= 0 && max > 0) {
                    var range_slider = new RangeSlider({
                        min: min,
                        max: max,
                        left_value: left,
                        right_value: right,
                        $wrapper: $range,
                        $inputMin: $inputMin,
                        $inputMax: $inputMax
                    });

                    $range.data("range_slider", range_slider);
                }
            });
        };

        ProductsFilter.prototype.bindEvents = function() {
            var that = this;

            that.$wrapper.on("click", ".js-filter-toggle", function(event) {
                event.preventDefault();
                that.showFilter( $(this).closest(".s-filter-group") );
            });

            // On submit form
            that.$form.on("submit", function(event) {
                event.preventDefault();
                if (!that.is_locked) {
                    that.onSubmit( $(this) );
                }
                return false;
            });

            that.$form.on("reset", function(event) {
                setTimeout(function() {
                    if (!that.is_locked) {
                        that.onSubmit( $(this) );
                    }
                }, 100);
            });

            that.is_locked = false;
        };

        ProductsFilter.prototype.onSubmit = function( $form ) {
            var that = this,
                href = $form.attr("action"),
                data = $form.serializeArray(),
                $category = $("#s-category-wrapper");

            data = performData(data);

            // Lock
            that.is_locked = true;

            // Animation
            $category.addClass("is-loading");

            $.get(href, data)
                .always( function () {
                    that.is_locked = false;
                })
                .done( function(html) {
                    // Insert new html
                    if ($category.length) {
                        $category.replaceWith(html);
                    }

                    // Scroll to Top
                    $("html, body").animate({
                        scrollTop: 0
                    }, 200);

                    // history change
                    if ("pushState" in window.history) {
                        history.pushState({
                            reload: true
                        }, "", location.origin + location.pathname + "?" + data);
                    }
                });

            function performData( data ) {
                var result = [];

                data = formatData(data);

                $.each(data, function(index, item) {
                    if (item.value) {
                        result.push(item.name + "=" + item.value);
                    }
                });

                return result.join("&");

                function formatData(form_array) {
                    var result = [];

                    $.each(form_array, function(i, field) {
                        var full_name = field.name,
                            search_string = "[unit]";

                        var is_unit = (full_name.substr(-(search_string.length)) === search_string);
                        if (is_unit) {
                            var param_name = full_name.substr(0, full_name.length - search_string.length);
                            var is_param_set = checkParam(param_name);
                            if (is_param_set) {
                                result.push(field);
                            }

                        } else {
                            result.push(field);
                        }
                    });

                    return result;

                    function checkParam(param_name) {
                        var result = false;

                        $.each(form_array, function(i, field) {
                            if (field.name === param_name +"[min]" || field.name === param_name +"[max]") {
                                if (field.value.length) {
                                    result = true;
                                    return true;
                                }
                            }
                        });

                        return result;
                    }
                }
            }
        };

        ProductsFilter.prototype.showFilter = function( $group ) {
            var that = this,
                active_class = "is-opened",
                is_opened = $group.hasClass(active_class);

            if (is_opened) {
                $group.removeClass(active_class);
            } else {
                $group.addClass(active_class);
            }
        };

        return ProductsFilter;

    })($);

    var CountDown = ( function($) {

        CountDown = function(options) {
            var that = this;

            // DOM
            that.$wrapper = create(options["$wrapper"]);
            that.$day = that.$wrapper.find(".js-day");
            that.$hour = that.$wrapper.find(".js-hour");
            that.$minute = that.$wrapper.find(".js-minute");
            that.$second = that.$wrapper.find(".js-second");

            // VARS
            that.locale = (options["locale"] || "en");
            that.start = options["start"];
            that.end = options["end"];

            // DYNAMIC VARS
            that.period = that.getPeriod();
            that.time_period = null;
            that.timer = 0;

            // INIT
            that.run();

            that.$wrapper.data("countdown", that);
        };

        CountDown.prototype.getPeriod = function() {
            var that = this,
                start_date = new Date( that.start ),
                end_date = new Date( that.end );

            return (end_date > start_date) ? (end_date - start_date) : 0;
        };

        CountDown.prototype.getData = function() {
            var that = this,
                period = that.period;

            var second = 1000,
                minute = second * 60,
                hour = minute * 60,
                day = hour * 24,
                residue;

            var days = Math.floor(period/day);
            residue = ( period - days * day );

            var hours = Math.floor(residue/hour);
            residue = ( residue - hours * hour );

            var minutes = Math.floor(residue/minute);
            residue = ( residue - minutes * minute );

            var seconds = Math.floor(residue/second);

            return {
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: seconds
            }
        };

        CountDown.prototype.render = function(data) {
            var that = this,
                delta = 0;

            var locales = {
                en: {
                    day: ["day", "days", "days"],
                    hour: ["hour", "hours", "hours"],
                    minute: ["minute", "minutes", "minutes"],
                    second: ["second", "seconds", "seconds"]
                },
                ru: {
                    day: ["день", "дня", "дней"],
                    hour: ["час", "часа", "часов"],
                    minute: ["минута", "минуты", "минут"],
                    second: ["секунда", "секунды", "секунд"]
                }
            };

            var locale = ( that.locale in locales ? locales[that.locale] : locales["en"] );

            // Day
            var day = data.days,
                day_label;

            if (day === 1) {
                day_label = locale.day[0];
            } else if (day > 1 && day < 5) {
                day_label = locale.day[1];
            } else {
                day_label = locale.day[2];
            }

            that.$day.find(".s-count").text(day);
            that.$day.find(".s-label").text(day_label);

            // Hour
            var hour = data.hours,
                hour_label;

            if ( (hour === 1) || hour === 21) {
                hour_label = locale.hour[0];
            } else if ( (hour > 1 && hour < 5) || hour > 20) {
                hour_label = locale.hour[1];
            } else {
                hour_label = locale.hour[2];
            }

            if (hour < 10) {
                hour = "0" + hour;
            }

            that.$hour.find(".s-count").text(hour);
            that.$hour.find(".s-label").text(hour_label);

            // Minute
            var minute = data.minutes,
                minute_label;

            if (minute === 1) {
                minute_label = locale.minute[0];
            } else if (minute > 1 && minute < 5) {
                minute_label = locale.minute[1];
            } else {
                minute_label = locale.minute[2];
            }

            if (minute > 20) {
                delta = minute % 10;
                if ( delta === 1) {
                    minute_label = locale.minute[0];
                } else if ( delta > 1 && delta < 5) {
                    minute_label = locale.minute[1];
                } else {
                    minute_label = locale.minute[2];
                }
            }

            if (minute < 10) {
                minute = "0" + minute;
            }

            that.$minute.find(".s-count").text(minute);
            that.$minute.find(".s-label").text(minute_label);

            // Second
            var second = data.seconds,
                second_label;

            if (second === 1) {
                second_label = locale.second[0];
            } else if (second > 1 && second < 5) {
                second_label = locale.second[1];
            } else {
                second_label = locale.second[2];
            }

            if (second > 20) {
                delta = second % 10;

                if ( delta === 1) {
                    second_label = locale.second[0];
                } else if ( delta > 1 && delta < 5) {
                    second_label = locale.second[1];
                } else {
                    second_label = locale.second[2];
                }
            }

            if (second < 10) {
                second = "0" + second;
            }

            that.$second.find(".s-count").text(second);
            that.$second.find(".s-label").text(second_label);
        };

        CountDown.prototype.run = function() {
            var that = this,
                timer = 1000;

            if (that.period > 0) {

                var data = that.getData();

                that.render(data);

                that.period -= timer;

                if (that.period > 0) {
                    that.timer = setTimeout( function () {
                        that.run();
                    }, timer);
                }

            } else {
                that.destroy();
            }
        };

        CountDown.prototype.destroy = function() {
            var that = this;

            that.$wrapper.remove();
        };

        return CountDown;

        function create($wrapper) {
            var html = "<span class=\"s-count-item js-day\"><span class=\"s-count\"></span><span class=\"s-label\"></span></span>" +
                "<span class=\"s-count-item js-hour\"><span class=\"s-count\"></span><span class=\"s-label\"></span></span>" +
                "<span class=\"s-count-item js-minute\"><span class=\"s-count\"></span><span class=\"s-label\"></span></span>" +
                "<span class=\"s-count-item js-second last\"><span class=\"s-count\"></span><span class=\"s-label\"></span></span>";

            $wrapper.html(html);

            return $wrapper;
        }

    })($);

    var ProductPhotos = ( function($) {

        function getImageArray( $links ) {
            var imageArray = [];

            $links.each( function() {
                var image_src = $(this).attr("href");
                if (image_src) {
                    imageArray.push(image_src);
                }
            });

            return imageArray;
        }

        ProductPhotos = function(options) {
            var that = this;

            that.$wrapper = options["$wrapper"];
            that.$mainLink = that.$wrapper.find("#s-photo-main");
            that.$video = that.$wrapper.find(".s-video-wrapper");
            that.$thumbs = that.$wrapper.find(".s-photos-list");
            that.$thumbsLinks = that.$thumbs.find("a");

            // VARS
            that.active_class = "is-selected";
            that.hidden_class = "is-hidden";
            that.imageArray = getImageArray( that.$thumbsLinks.length ? that.$thumbsLinks : that.$mainLink );

            // DYNAMIC VARS
            that.active_index = 0;
            that.$activeLink = ( that.$thumbs.find("a." + that.active_class) || false );

            // INIT
            that.bindEvents();
        };

        ProductPhotos.prototype.bindEvents = function() {
            var that = this;

            // EVENTS
            that.$thumbs.on("click", "a", function(event) {
                event.preventDefault();
                that.setPhoto($(this));
            });

            that.$mainLink.on("click", function(event) {
                event.preventDefault();
                that.showSwipeBox();
            });
        };

        ProductPhotos.prototype.setPhoto = function( $link ) {
            var that = this,
                is_video = $link.hasClass("is-video"),
                big_photo_src = $link.attr("href"),
                index = $link.data("index"),
                active_class = that.active_class;

            // Marking
            if (that.$activeLink) {
                that.$activeLink.removeClass(active_class)
            }
            $link.addClass(active_class);

            if (is_video) {

                that.$mainLink.addClass(that.hidden_class);
                that.$video.removeClass(that.hidden_class);

            } else {

                that.$mainLink.removeClass(that.hidden_class);
                that.$video.addClass(that.hidden_class);

                // Change main photo
                that.$mainLink.attr("href", big_photo_src)
                    .find("img")
                        .attr("src", big_photo_src)
                        .attr("title", $link.find("img").attr("title"))
                        .attr("alt", $link.find("img").attr("alt"));
            }

            // Save data
            that.active_index = index;
            that.$activeLink = $link;
        };

        ProductPhotos.prototype.showSwipeBox = function() {
            var that = this,
                before = [],
                after = [],
                images;
            if ($.swipebox.isOpen) {
                return;
            }
            $.each(that.imageArray, function(index, image_src) {
                var image = {
                    href: image_src,
                    index: index
                };

                if (index >= that.active_index) {
                    before.push(image);
                } else {
                    after.push(image);
                }
            });

            images = before.concat(after);

            $.swipebox( images, {
                useSVG : false,
                hideBarsDelay: false
            });

            // Close on scroll
            setTimeout( function() {
                $(window).one("scroll", function() {
                    var $swipebox = $.swipebox;
                    if ($swipebox && $swipebox.isOpen) {
                        $swipebox.close();
                    }
                });
            }, 100);
        };

        return ProductPhotos;

    })($);

    var ComparePage = ( function($) {

        ComparePage = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$table = that.$wrapper.find(".s-compare-table");

            // VARS
            that.locales = options["locales"];

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        ComparePage.prototype.initClass = function() {
            var that = this;
            //
            that.initToggle();
            //
            that.initReset();
            //
            that.initAddProduct();
            //
            that.initRemove();
        };

        ComparePage.prototype.initToggle = function() {
            var that = this,
                $filter = that.$wrapper.find(".js-compare-filter"),
                $sameFields = that.$table.find("tr.same");

            $filter.on("change", ".s-toggle", function(event) {
                var $toggle = $(this),
                    value = $toggle.val(),
                    is_active = ($toggle.attr("checked") === "checked");

                if (is_active) {
                    if (value === "all") {
                        $sameFields.show();
                    } else {
                        $sameFields.hide();
                    }
                }
            });
        };

        ComparePage.prototype.initReset = function() {
            var that = this;

            that.$wrapper.on("click", ".js-reset-compare", function(event) {
                event.preventDefault();
                $.cookie('shop_compare', null, {path: '/'});
                location.href = location.href.replace(/compare\/.*/, 'compare/');
            });
        };

        ComparePage.prototype.initAddProduct = function() {
            var that = this;

            that.$wrapper.on("submit", "form.s-product-form", function(event) {
                event.preventDefault();
                onSubmit($(this));
            });

            function onSubmit($form) {
                var $product = $form.closest(".s-product-wrapper"),
                    $button = $form.find(".js-add-button"),
                    $loading = $("<i class=\"icon16 loading\"></i>"),
                    product_href = $form.data("url"),
                    added_class = "is-added",
                    timer = 0,
                    time = 3000;

                if (product_href) {
                    $button.attr("disabled", true);
                    $loading.insertAfter($button);

                    $.post(product_href, function( html ) {
                        $loading.remove();
                        $button.attr("disabled", false);

                        var dialog = new window.waTheme.init.shop.Dialog({
                            html: html
                        });

                        var $dialog = dialog.$dialog;

                        $dialog.on("addedToCart", function() {
                            $button
                                .attr("disabled", true)
                                .addClass(added_class)
                                .val(that.locales.added);

                            clearTimeout(timer);
                            timer = setTimeout( function() {
                                var is_exist = $.contains(document, $button[0]);
                                if (is_exist) {
                                    $button
                                        .attr("disabled", false)
                                        .removeClass(added_class)
                                        .val(that.locales.buy);
                                }
                            }, time);
                        });
                    });

                } else {

                    $button.attr("disabled", true);
                    $loading.insertAfter($button);

                    $.post($form.attr('action') + '?html=1', $form.serialize(), function (response) {
                        $loading.remove();
                        $button
                            .addClass(added_class)
                            .val(that.locales.added);

                        // Update Cart at Header
                        if (response["data"]) {
                            var count = response["data"]["count"],
                                text = response["data"]["total"];

                            if (text && count >= 0) {
                                waTheme.apps["shop"].cart.update({
                                    text: text,
                                    count: count
                                });
                            }
                        }

                        clearTimeout(timer);
                        timer = setTimeout( function() {
                            var is_exist = $.contains(document, $button[0]);
                            if (is_exist) {
                                $button
                                    .attr("disabled", false)
                                    .removeClass(added_class)
                                    .val(that.locales.buy);
                            }
                        }, time);

                    }, "json");
                }
            }
        };

        ComparePage.prototype.initRemove = function() {
            var that = this;

            that.$wrapper.on("click", ".js-remove-button", function(event) {
                event.preventDefault();
                var $link = $(this),
                    $product = $link.closest(".s-product-wrapper"),
                    id = $product.data("id");

                if (id) { remove(id); }

                location.href = $link.attr("href");
            });

            function remove(id) {
                var compare = $.cookie('shop_compare');
                compare = (compare) ? compare.split(',') : [];

                var index = $.inArray(id + '', compare);
                if (index != -1) {
                    compare.splice(index, 1)
                }
                if (compare.length > 0) {
                    $.cookie('shop_compare', compare.join(','), { expires: 30, path: '/'});
                } else {
                    $.cookie('shop_compare', null, {path: '/'});
                }

                waTheme.apps["shop"].compare.update();
            }
        };

        return ComparePage;

    })(jQuery);

    waTheme.init.shop.Dialog = Dialog;
    waTheme.init.shop.CountDown = CountDown;
    waTheme.init.shop.ProductPhotos = ProductPhotos;
    waTheme.init.shop.ProductsFilter = ProductsFilter;
    waTheme.init.shop.ComparePage = ComparePage;

})(jQuery, window.waTheme);