( function($, waTheme) {

    var LazyLoading = ( function($) {

        LazyLoading = function(options) {
            var that = this;

            // VARS
            that.list_name = options["names"]["list"];
            that.items_name = options["names"]["items"];
            that.pagind_name = options["names"]["paging"];
            that.load_class = "is-loading";

            // DOM
            that.$wrapper = ( options["$wrapper"] || false );
            that.$list = that.$wrapper.find(that.list_name);
            that.$window = $(window);

            // DYNAMIC VARS
            that.$paging = that.$wrapper.find(that.pagind_name);
            that.scrollWatcher = null;

            // INIT
            that.init();
        };

        LazyLoading.prototype.init = function() {
            var that = this;

            that.addWatcher();
        };

        LazyLoading.prototype.addWatcher = function() {
            var that = this;

            that.$window.on("scroll", scrollWatcher);
            function scrollWatcher() {
                var is_exist = $.contains(document, that.$wrapper[0]);
                if (is_exist) {
                    that.onScroll();
                } else {
                    that.$window.off("scroll", scrollWatcher);
                }
            }

            that.scrollWatcher = scrollWatcher;
        };

        LazyLoading.prototype.stopWatcher = function() {
            var that = this;

            if (that.scrollWatcher) {
                var scrollWatcher = that.scrollWatcher;
                that.$window.off("scroll", scrollWatcher);
            }
        };

        LazyLoading.prototype.onScroll = function() {
            var that = this,
                is_paging_exist = ( $.contains(document, that.$paging[0]) );

            if (is_paging_exist) {

                var $window = that.$window,
                    scroll_top = $window.scrollTop(),
                    display_height = $window.height(),
                    paging_top = that.$paging.offset().top;

                // If we see paging, stop watcher and run load
                if (scroll_top + display_height >= paging_top) {
                    that.stopWatcher();
                    that.loadNextPage();
                }

            } else {
                that.stopWatcher();
            }

        };

        LazyLoading.prototype.loadNextPage = function() {
            var that = this,
                next_page_url = getNextUrl(),
                $paging = that.$paging;

            function getNextUrl() {
                var $nextPage = that.$paging.find(".selected").next(),
                    result = false;

                if ($nextPage.length) {
                    result = $nextPage.find("a").attr("href");
                }

                return result;
            }

            function showLoad() {
                var $loading = '<div class="s-loading-wrapper"><i class="icon16 loading"></i>&nbsp;' + $paging.data("loading-text") + '</div>';

                $paging
                    .addClass(that.load_class)
                    .append($loading);
            }

            if (next_page_url) {

                showLoad();

                $.get(next_page_url, function(response) {
                    var $category = $(response),
                        $newItems = $category.find(that.list_name + " " + that.items_name),
                        $newPaging = $category.find(that.pagind_name);

                    that.$list.append($newItems);

                    $paging.after($newPaging);

                    $paging.remove();

                    that.$paging = $newPaging;

                    that.addWatcher();
                });
            }
        };

        return LazyLoading;

    })($);

    var Products = ( function($) {

        Products = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$products = that.$wrapper.find(".s-product-wrapper");
            that.$sorting = that.$wrapper.find(".s-sorting-wrapper");
            that.$productList = that.$wrapper.find(".s-products-list");

            // VARS
            that.locales = ( options["locales"] || false );
            that.use_lazy = ( options["use_lazy"] || false );
            that.use_slider = ( options['use_slider'] || false );

            // DYNAMIC VARS

            // INIT
            that.init();
        };

        Products.prototype.init = function() {
            var that = this;
            //
            if (that.use_slider) {
                that.initSlider();
            }
            //
            if (that.use_lazy) {
                that.initLazy();
            }
            //
            that.bindEvents();
            //
            that.initViewToggle();
        };

        Products.prototype.bindEvents = function() {
            var that = this,
                $wrapper = that.$wrapper;

            $wrapper.on("submit", "form.add-to-cart", function(event) {
                event.preventDefault();
                that.onSubmitProduct( $(this) );
            });

            $wrapper.on("click", ".s-compare-button", function(event) {
                event.preventDefault();
                that.onCompareProduct( $(this) );
            });

            $wrapper.on("click", ".increase-volume", function () {
                that.increaseQuantity( true, $(this) );
            });

            $wrapper.on("click", ".decrease-volume", function() {
                that.increaseQuantity( false, $(this) );
            });

            $wrapper.find(".s-quantity-field").on("change", function() {
                that.changeQuantity( $(this) );
            });
        };

        //

        Products.prototype.initLazy = function() {
            var that = this;

            new LazyLoading({
                $wrapper: that.$wrapper,
                names: {
                    list: ".s-products-list",
                    items: ".s-product-wrapper",
                    paging: ".s-paging-wrapper"
                }
            });
        };

        // ADD PRODUCT

        Products.prototype.onSubmitProduct = function($form) {
            var that = this,
                $product = $form.closest(".s-product-wrapper"),
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

                $.post($form.attr('action') + '?html=1', $form.serialize(), function(response) {
                    if (response.status === "ok") {

                        if (!waTheme.apps["shop"].cart) {
                            location.reload();
                            return false;
                        }

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

                                var $image = $product.find(".s-image-wrapper img");
                                waTheme.apps["shop"].cart.animateAddToCart($image);
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

                    } else if (response.status === "fail") {
                        alert(response.errors);
                    }

                }, "json").always( function() {
                    $loading.remove();
                });
            }
        };

        Products.prototype.increaseQuantity = function( increase, $button ) {
            var that = this,
                $wrapper = $button.closest(".s-quantity-wrapper"),
                $quantity = $wrapper.find(".s-quantity-field"),
                value = parseInt( $quantity.val() ),
                new_value = 1;

            if (value && value > 0) {
                new_value = (increase) ? value + 1 : value - 1;
            }

            $quantity
                .val(new_value)
                .trigger("change");

        };

        Products.prototype.changeQuantity = function( $quantity ) {
            var that = this,
                input_max_data = parseInt( $quantity.data("max-quantity")),
                max_val = ( isNaN(input_max_data) || input_max_data === 0 ) ? Infinity : input_max_data,
                value = parseInt( $quantity.val() ),
                new_value = 1;

            if (value && value > 0) {
                new_value = (value >= max_val) ? max_val : value;
            }

            $quantity.val(new_value);
        };

        // COMPARE

        Products.prototype.onCompareProduct = function( $button ) {
            var that = this,
                active_class = "active",
                $icon = $button.find(".compare"),
                $product = $button.closest(".s-product-wrapper"),
                $image = $product.find(".s-image-wrapper img"),
                product_id = $product.data("product-id");

            var active_link_class = "is-active";
            if ($button.hasClass(active_link_class)) {
                return false;
            }

            var is_added = waTheme.apps["shop"].compare.addToCompare(product_id, $image);

            if (is_added) {
                $button
                    .addClass(active_link_class)
                    .attr("title", that.locales["in_compare"])
                    .find(".s-name").text(that.locales["in_compare"]);

                $icon.removeClass(active_class);

            } else {
                $button
                    .removeClass(active_link_class)
                    .attr("title", that.locales["to_compare"])
                    .find(".s-name").text(that.locales["to_compare"]);

                $icon.addClass(active_class);
            }
        };

        Products.prototype.initViewToggle = function() {
            var that = this,
                $viewFilters = that.$sorting.find(".js-view-filters"),
                is_api_enabled = isLocalStorageEnabled();

            $viewFilters.on("click", ".js-set-table-view", function(event) {
                event.preventDefault();
                onChangeView($(this), true);
            });

            $viewFilters.on("click", ".js-set-thumbs-view", function(event) {
                event.preventDefault();
                onChangeView($(this), false);
            });

            // INIT

            setTypeOnStart();

            // FUNCTIONS

            function setTypeOnStart() {
                var type = storage();

                switch (type) {
                    case "thumbs":
                        $viewFilters.find(".js-set-thumbs-view").trigger("click");
                        break;
                    case "table":
                        break;
                    default:
                        break;
                }
            }

            /**
             * @param {Object} $link
             * @param {Boolean?} is_table)
             * */
            function onChangeView($link, is_table) {
                // DOM
                var $list = that.$productList;

                // VARS
                var active_class = "is-active",
                    table_class = "table-view",
                    thumbs_class = "thumbs-view";

                // DYNAMIC VARS
                var is_active = $link.hasClass(active_class);

                if (!is_active) {
                    if (is_table) {
                        $list
                            .removeClass(thumbs_class)
                            .addClass(table_class);

                        storage("table");

                    } else {
                        $list
                            .removeClass(table_class)
                            .addClass(thumbs_class);

                        storage("thumbs");
                    }

                    $viewFilters.find("." + active_class).removeClass(active_class);
                    $link.addClass(active_class);
                }
            }

            /**
             * @param {String?} type
             * */
            function storage(type) {
                var storage_name = "product_list_view_type",
                    result = "thumbs";

                if (is_api_enabled) {
                    if (type) {
                        localStorage.setItem(storage_name, type);
                        result = type;

                    } else {
                        result = localStorage.getItem(storage_name);
                    }
                }

                return result;
            }

            /**
             * @return {Boolean}
             * */
            function isLocalStorageEnabled(){
                var test = "test";

                try {
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;

                } catch(e) {
                    return false;
                }
            }
        };

        // SLIDER

        Products.prototype.initSlider = function() {
            var that = this,
                $slider = that.$wrapper.find(".js-slider-wrapper");

            if ($slider.length) {

                var Slider = ( function($) {

                    Slider = function(options) {
                        var that = this;

                        // DOM
                        that.$wrapper = options["$wrapper"];
                        that.$slider = that.$wrapper.find(".s-slider-block");
                        that.$list = that.$slider.find(".s-products-list");
                        that.$items = that.$list.find(".s-product-wrapper");

                        // VARS
                        that.items_count = that.$items.length;

                        // DYNAMIC VARS
                        that.type_class = false;
                        that.left = 0;
                        that.items_left = 0;
                        that.visible_items = 0;
                        that.wrapper_w = false;
                        that.slider_w = false;
                        that.item_w = false;

                        // INIT
                        that.initClass();
                    };

                    Slider.prototype.initClass = function() {
                        var that = this;
                        //
                        that.detectSliderWidth();
                        //
                        that.showArrows();

                        $(window).on("resize", onResize);

                        that.$wrapper.on("click", ".js-arrow", function () {
                            var $link = $(this);
                            if ($link.hasClass("left")) {
                                that.moveSlider( false );
                            }
                            if ($link.hasClass("right")) {
                                that.moveSlider( true );
                            }
                        });

                        function onResize() {
                            var is_exist = $.contains(document, that.$wrapper[0]);
                            if (is_exist) {
                                that.reset();
                            } else {
                                $(window).off("resize", onResize);
                            }
                        }
                    };

                    Slider.prototype.detectSliderWidth = function() {
                        var that = this;

                        that.wrapper_w = that.$wrapper.outerWidth();
                        that.visible_items = Math.round( that.wrapper_w/that.$items.first().outerWidth() );
                        that.item_w = that.wrapper_w/that.visible_items;
                        that.slider_w = that.item_w * that.item_count;
                    };

                    Slider.prototype.showArrows = function() {
                        var that = this;

                        if (that.left >= 0) {
                            if (that.items_count > that.visible_items) {
                                setType("type-1");
                            } else {
                                setType();
                            }
                        } else {
                            if (that.items_left + that.visible_items < that.items_count) {
                                setType("type-2");
                            } else {
                                setType("type-3");
                            }
                        }

                        function setType( type_class ) {
                            if (that.type_class) {
                                that.$wrapper.removeClass(that.type_class);
                            }

                            if (type_class) {
                                that.$wrapper.addClass(type_class);
                                that.type_class = type_class;
                            }
                        }
                    };

                    Slider.prototype.setLeft = function( left ) {
                        var that = this;

                        that.$list.css({
                            "-webkit-transform": "translate(" + left + "px,0)",
                            "transform": "translate(" + left + "px,0)"
                        });

                        that.left = left;
                    };

                    Slider.prototype.moveSlider = function( right ) {
                        var that = this,
                            step = 1,
                            items_left = that.items_left,
                            new_items_left, new_left;

                        if (right) {
                            new_items_left = items_left + step;
                        } else {
                            new_items_left = items_left - step;
                            if (new_items_left < 0) {
                                new_items_left = 0;
                            }
                        }

                        new_left = new_items_left * that.item_w;

                        if ( new_left > -(that.wrapper_w - that.slider_w) ) {
                            new_left = -(that.wrapper_w - that.slider_w)
                        }

                        that.items_left = new_items_left;
                        that.setLeft(-new_left);
                        that.showArrows();
                    };

                    Slider.prototype.reset = function() {
                        var that = this;

                        that.items_left = 0;
                        that.setLeft(0);
                        that.detectSliderWidth();
                        that.showArrows();
                    };

                    return Slider;

                })($);

                new Slider({
                    $wrapper: $slider
                });
            }
        };

        return Products;

    })($);

    waTheme.init.shop.Products = Products;

})(jQuery, window.waTheme);