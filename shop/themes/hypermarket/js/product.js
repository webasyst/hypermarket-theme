( function($, waTheme) {

    var Product = ( function($) {

        Product = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$form = that.$wrapper.find("form:first");
            that.$skus = that.$form.find(".s-skus-wrapper");
            that.$services = that.$form.find(".s-services-wrapper");
            that.$footer = that.$form.find(".s-product-footer");
            that.$button = that.$form.find("input[type=submit]");
            that.$price = that.$form.find(".js-product-price");
            that.$comparePrice = that.$form.find(".js-compare-price");
            that.$base_price = that.$form.find(".js-product-base-price");
            that.$stock_base_ratio = that.$form.find(".js-stock-base-ratio");

            // VARS
            that.is_dialog = ( options["is_dialog"] || false );
            that.dialog = (that.is_dialog ? that.$form.closest(".s-dialog-wrapper").data("dialog") : null);
            that.currency = options["currency"];
            that.currency_info = options["currency_info"];
            that.services = options["services"];
            that.features = options["features"];
            that.locales = options["locales"];
            that.images = options["images"];
            that.product = options["product"];
            that.skus = that.product.skus;

            that.$quantity = that.$form.find(".js-quantity-field");
            that.quantity_controller = that.$quantity.data("controller");
            that.$quantity_section = that.quantity_controller.$wrapper;

            // Игнорировать ограничения складов
            that.ignore_stock_count = options["ignore_stock_count"];

            // Настройки дробных
            that.fractional_config = formatFractionalConfig(options["fractional_config"]);
            // Массив с единицами измерения
            that.units = options["units"];

            // DYNAMIC VARS
            that.sku_id = that.product.sku_id;
            that.sku = that.skus[that.sku_id];

            that.price = parseFloat( that.$price.data("price") );
            that.compare_price = parseFloat( that.$comparePrice.data("compare-price") );

            // INIT
            that.initProduct();

            console.log( that );

            function formatFractionalConfig(config) {
                if (config) {
                    config.frac_enabled = (config.frac_enabled === "1");
                    config.stock_units_enabled = (config.stock_units_enabled === "1");
                    config.base_units_enabled = (config.base_units_enabled === "1");
                } else {
                    config = {};
                }

                return config;
            }
        };

        Product.prototype.initProduct = function() {
            var that = this;
            //
            that.bindEvents();
            //
            that.initSubmit();
            //
            initFirstSku();
            //
            function initFirstSku() {
                var $skuFeature = that.$form.find(".js-sku-feature:first"),
                    is_buttons_view_type = $skuFeature.length;

                // for sku buttons type
                if (is_buttons_view_type) {
                    var $selected = that.$form.find(".s-options-wrapper .selected");
                    if ($selected.length) {
                        $selected.trigger("click");
                    } else {
                        initFirstButton( $skuFeature );
                    }

                // for sku radio type
                } else {
                    var $radio = getRadioInput();
                    if ($radio) {
                        $radio.trigger("change");
                    }
                }

                function getRadioInput() {
                    var $radios = that.$skus.find("input[type=radio]"),
                        result = false;

                    $.each($radios, function() {
                        var $radio = $(this),
                            is_enabled = !( $radio.attr("disabled") && ($radio.attr("disabled") === "disabled") ),
                            is_checked = ( $radio.attr("checked") && ($radio.attr("checked") === "checked") );

                        if ( is_enabled && (!result || is_checked) ) {
                            result = $radio;
                        }
                    });

                    return result;
                }

                function initFirstButton($skuFeature) {
                    var $wrapper = that.$form.find(".s-options-wrapper"),
                        is_select =  $wrapper.find("select").length;

                    if (is_select) {
                        $skuFeature.change();
                    } else {
                        var $groups = $wrapper.find(".inline-select"),
                            groups = getGroupsData( $groups ),
                            availableSku = getAvailableSku( groups );

                        if (availableSku) {
                            $.each(availableSku.$links, function() {
                                $(this).click();
                            });
                        }

                        function getGroupsData( $groups ) {
                            var result = [];

                            $.each($groups, function() {
                                var $group = $(this),
                                    $links = $group.find("a"),
                                    linkArray = [];

                                $.each($links, function() {
                                    var $link = $(this),
                                        id = $link.data("sku-id");

                                    linkArray.push({
                                        id: id,
                                        $link: $link
                                    });
                                });

                                result.push(linkArray);
                            });

                            return result;
                        }

                        function getAvailableSku( groups ) {
                            function selectionIsGood(prefix) {
                                var skuData = getSkuData( prefix ),
                                    sku = checkSku( skuData.id ),
                                    result = false;

                                if (sku) {
                                    result = {
                                        sku: sku,
                                        $links: skuData.$links
                                    }
                                }
                                return result;
                            }

                            function getFirstWorking(groups, prefix) {
                                if (!groups.length) {
                                    return selectionIsGood(prefix);
                                }

                                prefix = prefix || [];

                                var group = groups[0],
                                    other_groups = groups.slice(1);

                                for (var i = 0; i < group.length; i++) {
                                    var new_prefix = prefix.slice();
                                    new_prefix.push(group[i]);
                                    var result = getFirstWorking(other_groups, new_prefix);
                                    if (result) {
                                        return result;
                                    }
                                }

                                return null;
                            }

                            return getFirstWorking(groups);

                            function getSkuData( sku_array ) {
                                var id = [],
                                    $links = [];
                                $.each(sku_array, function(index, item) {
                                    id.push(item.id);
                                    $links.push(item.$link);
                                });

                                return {
                                    id: id.join(""),
                                    $links: $links
                                };
                            }
                        }

                        function checkSku( skus_id ) {
                            var result = false;

                            if (that.features.hasOwnProperty(skus_id)) {
                                var sku = that.features[skus_id];
                                if (sku.available) {
                                    result = sku;
                                }
                            }

                            return result;
                        }
                    }
                }
            }
        };

        Product.prototype.bindEvents = function() {
            var that = this;

            // add to cart block: services
            that.$services.find("input[type=checkbox]").on("click", function () {
                that.onServiceClick( $(this) );
            });

            that.$services.find(".service-variants").on("change", function () {
                that.updatePrice();
            });

            that.$form.find('.inline-select a').on("click", function(event) {
                event.preventDefault();
                that.onSelectClick( $(this) );
            });

            that.$skus.find("input[type=radio]").on("change", function () {
                var $input = $(this),
                    is_active = ($input.attr("checked") === "checked");

                if (is_active) {
                    that.onSkusClick( $(this) );
                }
            });

            that.$form.find(".js-sku-feature").change( function () {
                that.onSkusChange( $(this) );
            });

            that.$form.on("click", ".js-compare-product", function(event) {
                event.preventDefault();
                that.onCompareProduct( $(this) );
            });
        };

        Product.prototype.initSubmit = function() {
            var that = this,
                $form = that.$form,
                is_locked = false,
                timer = 0;

            $form.on("submit", function(event) {
                event.preventDefault();
                onFormSubmit($form);
            });

            function onFormSubmit($form) {
                if (!is_locked) {
                    is_locked = true;

                    var href = $form.attr('action') + '?html=1',
                        dataArray = $form.serialize();

                    var $promise = $.post(href, dataArray, function (response) {

                        if (response.status === 'ok') {
                            if (that.is_dialog) {

                                if (!waTheme.apps["shop"].cart) {
                                    location.reload();
                                    return false;
                                }

                                var $dialog = $("#s-dialog-wrapper"),
                                    dialog = $dialog.data("dialog");

                                $dialog.trigger("addedToCart");

                                var $target = waTheme.apps["shop"].cart.$wrapper,
                                    target_o = $target.offset();

                                var $content = dialog.$content,
                                    dialog_o = $content.offset();

                                $dialog.css({
                                    "overflow": "hidden"
                                });

                                $content
                                    .addClass("pushed-to-cart")
                                    .css({
                                        top: parseInt($content.css("top")) + (target_o.top - dialog_o.top),
                                        left: target_o.left - dialog_o.left
                                    });

                                setTimeout(function() {
                                    dialog.close();
                                }, 750);

                            }

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

                                var $image = $("#s-photo-main img");
                                if (!$image.is(":visible")) {
                                    var $_image = $("#s-photos-list").find(".is-selected img");
                                    if ($_image.length) {
                                        $image = $_image;
                                    }
                                }

                                waTheme.apps["shop"].cart.animateAddToCart($image);
                            }

                            if (response.data.error) {
                                alert(response.data.error);
                            }

                        } else if (response.status === 'fail') {
                            alert(response.errors);
                        }

                    }, "json").always( function() {
                        is_locked = false;
                    });

                    showButtonProgress();
                }

                function showButtonProgress() {
                    var $button = that.$form.find(".js-submit-button"),
                        $loading = $("<i class=\"icon16 loading\"></i>"),
                        time = 3000;

                    var added_class = "is-added";

                    $button.attr("disabled", true);
                    $loading.insertAfter($button);

                    $promise.then( function(response) {
                        $loading.remove();

                        if (response.status === "ok") {
                            $button
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
                        }
                    });
                }
            }
        };

        Product.prototype.onSkusChange = function() {
            var that = this;

            // DOM
            var $form = that.$form;

            var key = getKey(),
                sku = that.features[key];

            var sku_id = null;

            if (sku) {
                var sku_name = false;
                try { sku_name = that.skus[sku.id].sku; } catch(e) {}

                that.sku_id = sku_id = sku.id;
                that.sku = that.skus[that.sku_id];

                that.quantity_controller.update({
                    step: that.sku.order_count_step,
                    min: that.sku.order_count_min,
                    max: (!that.ignore_stock_count && that.sku.count > 0 ? that.sku.count : 0)
                });

                renderSKU(sku_name);
                //
                that.updateSkuServices(sku.id);
                //
                that.changeImage(sku.image_id);
                //
                if (sku.available) {
                    that.toggleAvailable(true, that.sku);

                } else {
                    that.toggleAvailable(false, that.sku);
                }

                //
                sku["compare_price"] = ( sku["compare_price"] ) ? sku["compare_price"] : 0 ;
                //
                that.updatePrice();

            } else {
                //
                that.toggleAvailable(false, that.sku);
                //
                that.$comparePrice.hide();
                //
                that.$price.empty();
            }

            that.$form.trigger("product_sku_changed", [sku_id, sku]);

            function getKey() {
                var result = "";

                $form.find(".js-sku-feature").each( function () {
                    var $input = $(this);

                    result += $input.data("feature-id") + ':' + $input.val() + ';';
                });

                return result;
            }
        };

        Product.prototype.onSkusClick = function( $link ) {
            var that = this,
                sku_id = $link.val(),
                price = $link.data("price"),
                compare_price = $link.data("compare-price"),
                image_id = $link.data('image-id');

            var sku = (that.skus[sku_id] ? that.skus[sku_id] : null);
            if (!sku) { alert("SKU ERROR"); return false; }

            that.sku_id = sku_id;
            that.sku = sku;

            that.quantity_controller.update({
                step: that.sku.order_count_step,
                min: that.sku.order_count_min,
                max: (!that.ignore_stock_count && that.sku.count > 0 ? that.sku.count : 0)
            });

            renderSKU(sku.sku);

            that.changeImage(image_id);

            that.toggleAvailable(!$link.data('disabled'), sku);

            //
            that.updateSkuServices(sku_id);
            //
            that.updatePrice();
            //
            that.$form.trigger("product_sku_changed", [sku_id, sku]);
        };

        Product.prototype.onSelectClick = function( $link ) {
            var $select = $link.closest('.inline-select'),
                data = $link.data("value"),
                active_class = "selected";

            //
            $select.find("a." + active_class).removeClass(active_class);
            //
            $link.addClass(active_class);
            //
            $select.find(".js-sku-feature")
                .val(data)
                .change();
        };

        Product.prototype.onServiceClick = function( $input ) {
            var that = this,
                $select = that.$form.find("select[name=\"service_variant[" + $input.val() + "]\"]");

            if ($select.length) {
                if ( $input.is(":checked") ) {
                    $select.removeAttr("disabled");

                } else {
                    $select.attr("disabled", "disabled");
                }
            }

            that.updatePrice();
        };

        Product.prototype.currencyFormat = function (number, no_html) {
            // Format a number with grouped thousands
            //
            // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +	 bugfix by: Michael White (http://crestidg.com)

            var that = this;
            var i, j, kw, kd, km;
            var currency = that.currency_info;
            var decimals = currency.frac_digits;
            var dec_point = currency.decimal_point;
            var thousands_sep = currency.thousands_sep;

            // input sanitation & defaults
            if( isNaN(decimals = Math.abs(decimals)) ){
                decimals = 2;
            }
            if( dec_point == undefined ){
                dec_point = ",";
            }
            if( thousands_sep == undefined ){
                thousands_sep = ".";
            }

            i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

            if( (j = i.length) > 3 ){
                j = j % 3;
            } else{
                j = 0;
            }

            km = (j ? i.substr(0, j) + thousands_sep : "");
            kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
            //kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).slice(2) : "");
            kd = (decimals && (number - i) ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");

            number = km + kw + kd;
            var s = no_html ? currency.sign : currency.sign_html;
            if (!currency.sign_position) {
                return s + currency.sign_delim + number;
            } else {
                return number + currency.sign_delim + s;
            }
        };

        Product.prototype.serviceVariantHtml= function (id, name, price) {
            var that = this,
                price_string = waTheme.formatPrice(price, { currency: that.currency, html: false });
            return $('<option data-price="' + price + '" value="' + id + '"></option>').text(name + ' (+' + price_string + ')');
        };

        Product.prototype.updateSkuServices = function(sku_id) {
            var that = this,
                $form = that.$form;

            for (var service_id in that.services[sku_id]) {

                var v = that.services[sku_id][service_id];

                if (v === false) {
                    $form.find(".service-" + service_id).hide().find('input,select').attr('disabled', 'disabled').removeAttr('checked');

                } else {
                    $form
                        .find(".service-" + service_id)
                            .show()
                            .find('input')
                                .removeAttr('disabled');

                    if (typeof (v) === 'string' || typeof (v) === 'number') {
                        var $service = $form.find(".service-" + service_id);

                        var price_string = waTheme.formatPrice(v, { currency: that.currency });

                        $service.find(".service-price").html(price_string);
                        $service.find("input").data("price", v);

                    } else {

                        var select = $form.find(".service-" + service_id + ' .service-variants');
                        var selected_variant_id = select.val();

                        for (var variant_id in v) {
                            var obj = select.find('option[value=' + variant_id + ']');

                            if (v[variant_id] === false) {
                                obj.hide();

                                if (obj.attr('value') == selected_variant_id) {
                                    selected_variant_id = false;
                                }

                            } else {

                                if (!selected_variant_id) {
                                    selected_variant_id = variant_id;
                                }

                                obj.replaceWith(that.serviceVariantHtml(variant_id, v[variant_id][0], v[variant_id][1]));
                            }
                        }

                        $form.find(".service-" + service_id + ' .service-variants').val(selected_variant_id);
                    }
                }
            }
        };

        Product.prototype.updatePrice = function() {
            var that = this;

            var hidden_class = "is-hidden";

            // DOM
            var $form = that.$form,
                $price = that.$price,
                $compare = that.$comparePrice;

            var price = that.sku["price"],
                compare_price = that.sku["compare_price"],
                stock_base_ratio = that.sku.stock_base_ratio,
                stock_unit_name,
                base_unit_name;

            price = (parseFloat(price) >= 0 ? parseFloat(price) : 0);
            compare_price = (parseFloat(compare_price) > 0 ? parseFloat(compare_price) : null);
            stock_base_ratio = (parseFloat(stock_base_ratio) > 0 ? parseFloat(stock_base_ratio) : null);

            if (that.fractional_config["stock_units_enabled"]) {
                if (that.product.stock_unit_id && that.units[that.product.stock_unit_id]) {
                    stock_unit_name = that.units[that.product.stock_unit_id].name_short;
                }
            }

            if (that.fractional_config["base_units_enabled"]) {
                if (that.product.base_unit_id && (that.product.stock_unit_id !== that.product.base_unit_id) && that.units[that.product.base_unit_id] && stock_base_ratio) {
                    base_unit_name = that.units[that.product.base_unit_id].name_short;
                }
            }

            //
            var services_price = getServicePrice(),
                price_sum = (price + services_price),
                compare_sum = (compare_price + services_price);

            // Render Price
            var price_string = waTheme.formatPrice(price_sum, { currency: that.currency, unit: stock_unit_name });
            $price.html(price_string);

            // Render Compare
            if (compare_price) {
                var compare_price_string = waTheme.formatPrice(compare_sum, { currency: that.currency, unit: stock_unit_name });
                $compare
                    .html(compare_price_string)
                    .removeClass(hidden_class);

            } else {
                $compare.addClass(hidden_class);
            }

            // Base Price
            if (that.$base_price.length) {
                if (base_unit_name) {
                    var base_sub = (price_sum/stock_base_ratio),
                        base_price_string = waTheme.formatPrice(base_sub, { currency: that.currency, unit: base_unit_name });

                    that.$base_price
                        .html(base_price_string)
                        .show();
                } else {
                    that.$base_price.hide();
                }
            }

            // Stock Base Ratio
            if (that.$stock_base_ratio.length) {
                if (stock_base_ratio) {
                    that.$stock_base_ratio
                        .html(waTheme.localizeNumber(formatNumber(that.sku.stock_base_ratio), { currency: that.currency }))
                        .show();
                } else {
                    that.$stock_base_ratio
                        .hide()
                        .html("");
                }
            }

            //
            if (that.is_dialog) {
                that.dialog.resize();
            }

            //
            function getServicePrice() {
                // DOM
                var $checkedServices = that.$services.find("input:checked");

                // DYNAMIC VARS
                var services_price = 0;

                $checkedServices.each( function () {
                    var $service = $(this),
                        service_value = $service.val(),
                        service_price = 0;

                    var $serviceVariants = $form.find(".service-" + service_value + " .service-variants");

                    if ($serviceVariants.length) {
                        service_price = parseFloat( $serviceVariants.find(":selected").data("price") );
                    } else {
                        service_price = parseFloat( $service.data("price") );
                    }

                    services_price += service_price;
                });

                return services_price;
            }

            function formatNumber(number) {
                var result = number;
                if (typeof number !== "string") { return result; }

                var float_num = parseFloat(number);
                if (float_num < 1) {
                    var split_num = number.split(".");
                    if (split_num.length === 2) {
                        var decimal_part = split_num[1].replace(/^0+/, '');
                        number = roundNumber(float_num, split_num[1].length - decimal_part.length + 3).toFixed(8);
                    }
                } else {
                    number = roundNumber(float_num, 3).toFixed(8);
                }

                var parts = number.split(".");
                if (parts.length === 2) {
                    var tail = parts[1],
                        result2 = [],
                        result3 = [parts[0]];

                    if (tail.length) {
                        for (var i = 0; i < tail.length; i++) {
                            var letter = tail[tail.length - (i+1)];
                            if (letter !== "0" || result2.length) {
                                result2.push(letter);
                            }
                        }
                        if (result2.length) {
                            result3.push(result2.reverse().join(""));
                        }
                    }

                    result = result3.join(".");
                }

                return result;
            }

            function roundNumber(num, scale) {
                if(!String(num).includes("e")) {
                    return +(Math.round(num + "e+" + scale)  + "e-" + scale);
                } else {
                    var parts = String(num).split("e"),
                        sig = "";

                    if(+parts[1] + scale > 0) {
                        sig = "+";
                    }
                    return +(Math.round(+parts[0] + "e" + sig + (+parts[1] + scale)) + "e-" + scale);
                }
            }
        };

        Product.prototype.changeImage = function(image_id) {
            var that = this;

            if (that.is_dialog) {
                var image = that.images["default"];
                if (that.images[image_id]) {
                    image = that.images[image_id];
                }

                $("img#js-product-image").attr("src", image.uri_200);

                that.dialog.resize();

            } else {
                if (image_id) {
                    var $link = $("#s-image-" + image_id);
                    if ($link.length) {
                        $link.trigger("click");
                    }
                }
            }
        };

        Product.prototype.onCompareProduct = function( $button ) {
            var that = this,
                active_class = "active",
                $icon = $button.find(".compare"),
                $image = $("#s-photo-main img"),
                product_id = that.$form.find("input[name=\"product_id\"]").val();

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

        Product.prototype.toggleAvailable = function(available, sku) {
            var that = this;

            // toggle button
            that.$button.attr("disabled", !available);

            // toggle stocks
            that.$form.find(".s-stocks-wrapper > div").each( function() {
                var $stock = $(this),
                    is_target = $stock.hasClass("sku-" + sku.id + "-stock");

                if (available && is_target) {
                    $stock.show();
                } else {
                    $stock.hide();
                }
            });

            that.$form.find(".s-stocks-wrapper > .sku-not-available").css("display", (available ? "none" : ""));

            // quantity
            that.$quantity_section.css("visibility", (available ? "" : "hidden"));
        };

        return Product;

        function renderSKU(sku) {
            var $sku = $(".js-product-sku"),
                $wrapper = $sku.closest(".s-sku-wrapper");

            if (sku) {
                $sku.text(sku);
                $wrapper.show();
            } else {
                $sku.text("");
                $wrapper.hide();
            }
        }

    })($);

    waTheme.init.shop.Product = Product;

})(jQuery, window.waTheme);