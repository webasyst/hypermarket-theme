( function($, waTheme) {

    var Product = ( function($) {

        Product = function(options) {
            var that = this;

            // DOM
            that.$form = options["$form"];
            that.$skus = that.$form.find(".s-skus-wrapper");
            that.$services = that.$form.find(".s-services-wrapper");
            that.$quantity = that.$form.find(".js-quantity-field");
            that.$footer = that.$form.find(".s-product-footer");
            that.$button = that.$form.find("input[type=submit]");
            that.$price = that.$form.find(".js-product-price");
            that.$comparePrice = that.$form.find(".js-compare-price");

            // VARS
            that.is_dialog = ( options["is_dialog"] || false );
            that.dialog = (that.is_dialog ? that.$form.closest(".s-dialog-wrapper").data("dialog") : false);
            that.currency = options["currency"];
            that.services = options["services"];
            that.features = options["features"];
            that.locales = options["locales"];
            that.images = options["images"];
            that.skus = options["skus"];
            that.added_class = "is-added";

            // DYNAMIC VARS
            that.volume = 1;
            that.price = parseFloat( that.$price.data("price") );
            that.compare_price = parseFloat( that.$comparePrice.data("compare-price") );

            // INIT
            that.initProduct();
        };

        Product.prototype.initProduct = function() {
            var that = this;
            //
            that.initQuantityToggle();
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
                        $radio.click();
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

            that.$form.find('.inline-select a').on("click", function () {
                that.onSelectClick( $(this) );
                return false;
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

        Product.prototype.initQuantityToggle = function() {
            var that = this,
                $wrapper = that.$form.find(".s-quantity-wrapper"),
                $quantity = that.$quantity;

            $wrapper.on("click", ".js-increase", function(event) {
                event.preventDefault();
                increaseVolume( true );
            });

            $wrapper.on("click", ".js-decrease", function(event) {
                event.preventDefault();
                increaseVolume( false );
            });

            $quantity.on("change", function() {
                prepareChangeVolume( $(this) );
                return false;
            });

            // Preparing to change volume
            function prepareChangeVolume( $input ) {
                var new_volume = parseFloat( $input.val() );

                // AntiWord at Field
                if (new_volume) {
                    $input.val( new_volume );
                    changeVolume( new_volume );

                } else {
                    $input.val( that.volume );
                }
            }

            // Change Volume
            function changeVolume( type ) {
                var current_val = parseInt( $quantity.val() ),
                    input_max_data = parseInt( $quantity.data("max-quantity")),
                    max_val = ( isNaN(input_max_data) || input_max_data === 0 ) ? Infinity : input_max_data,
                    new_val;

                if ( type > 0 && type !== that.volume ) {
                    if (current_val <= 0) {
                        if ( that.volume > 1 ) {
                            new_val = 1;
                        }

                    } else if (current_val >= max_val) {
                        new_val = max_val;

                    } else {
                        new_val = current_val;
                    }
                }

                // Set product data
                if (new_val) {
                    that.volume = new_val;

                    // Set new value
                    $quantity.val(new_val);

                    // Update Price
                    that.updatePrice();
                }
            }

            function increaseVolume( type ) {
                var new_val;

                // If click "+" button
                if ( type ) {
                    new_val = that.volume + 1;

                } else {
                    new_val = that.volume - 1;
                }

                $quantity
                    .val(new_val)
                    .trigger("change");

            }
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

                    $button.attr("disabled", true);
                    $loading.insertAfter($button);

                    $promise.then( function(response) {
                        $loading.remove();

                        if (response.status === "ok") {
                            $button
                                .addClass(that.added_class)
                                .val(that.locales.added);

                            clearTimeout(timer);
                            timer = setTimeout( function() {
                                var is_exist = $.contains(document, $button[0]);
                                if (is_exist) {
                                    $button
                                        .attr("disabled", false)
                                        .removeClass(that.added_class)
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
            var $form = that.$form,
                $button = that.$button;

            var key = getKey(),
                sku = that.features[key];

            var sku_id = null;

            if (sku) {
                var sku_name = false;
                try { sku_name = that.skus[sku.id].sku; } catch(e) {}

                sku_id = sku.id;

                renderSKU(sku_name);
                //
                that.updateSkuServices(sku.id);
                //
                that.changeImage(sku.image_id);
                //
                if (sku.available) {
                    $button.removeAttr('disabled');

                } else {
                    $form.find(".s-stocks-wrapper > div").hide();
                    $form.find(".sku-no-stock").show();
                    $button.attr("disabled", "disabled");
                }

                //
                sku["compare_price"] = ( sku["compare_price"] ) ? sku["compare_price"] : 0 ;
                //
                that.updatePrice(sku["price"], sku["compare_price"]);

            } else {
                //
                $form.find(".s-stocks-wrapper > div").hide();
                //
                $form.find(".sku-no-stock").show();
                //
                $button.attr('disabled', 'disabled');
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

            // DOM
            var $button = that.$button;

            var sku = (that.skus[sku_id] ? that.skus[sku_id] : null);
            if (!sku) { alert("SKU ERROR"); return false; }

            renderSKU(sku.sku);

            that.changeImage(image_id);

            if ($link.data('disabled')) {
                $button.attr('disabled', 'disabled');
            } else {
                $button.removeAttr('disabled');
            }

            //
            that.updateSkuServices(sku_id);
            //
            that.updatePrice(price, compare_price);
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
            var decimals = that.currency.frac_digits;
            var dec_point = that.currency.decimal_point;
            var thousands_sep = that.currency.thousands_sep;

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
            var s = no_html ? that.currency.sign : that.currency.sign_html;
            if (!that.currency.sign_position) {
                return s + that.currency.sign_delim + number;
            } else {
                return number + that.currency.sign_delim + s;
            }
        };

        Product.prototype.serviceVariantHtml= function (id, name, price) {
            var that = this;
            return $('<option data-price="' + price + '" value="' + id + '"></option>').text(name + ' (+' + that.currencyFormat(price, 1) + ')');
        };

        Product.prototype.updateSkuServices = function(sku_id) {
            var that = this,
                $form = that.$form,
                $skuStock = $form.find(".sku-" + sku_id + "-stock"),
                sku_count = $skuStock.data("sku-count");

            if ( !(sku_count && sku_count > 0) ) {
                sku_count = null;
            }

            // Hide others
            $form.find(".s-stocks-wrapper > div").hide();

            // Show
            $skuStock.show();

            that.volume = 1;

            that.$quantity
                .val(that.volume)
                .data("max-quantity", sku_count)
                .trigger("change");

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
                        $form.find(".service-" + service_id + ' .service-price').html( that.currencyFormat(v) );
                        $form.find(".service-" + service_id + ' input').data('price', v);

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

        Product.prototype.updatePrice = function(price, compare_price) {
            var that = this;

            var hidden_class = "is-hidden";

            // DOM
            var $form = that.$form,
                $price = that.$price,
                $compare = that.$comparePrice;

            // VARS
            var services_price = getServicePrice(),
                volume = that.volume,
                price_sum,
                compare_sum;

            //
            if (price) {
                that.price = price;
                $price.data("price", price);
            } else {
                price = that.price;
            }

            //
            if (compare_price >= 0) {
                that.compare_price = compare_price;
                $compare.data("price", compare_price);
            } else {
                compare_price = that.compare_price;
            }

            //
            price_sum = (price + services_price) * volume;
            compare_sum = (compare_price + services_price) * volume;

            // Render Price
            $price.html( that.currencyFormat(price_sum) );
            $compare.html( that.currencyFormat(compare_sum) );

            // Render Compare
            if (compare_price > 0) {
                $compare.removeClass(hidden_class);
            } else {
                $compare.addClass(hidden_class);
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