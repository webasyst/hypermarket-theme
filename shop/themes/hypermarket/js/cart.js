( function($, waTheme) {

    var Cart = ( function() {

        Cart = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$products = that.$wrapper.find(".s-cart-product");
            that.$services = that.$products.find(".s-product-services");
            that.$form = that.$wrapper.find("form.s-cart-form");

            that.$bonus = that.$wrapper.find("#s-affiliate-hint-wrapper");
            that.$couponSection = $(".js-coupon-section");

            that.$discount = that.$wrapper.find("#js-cart-discount");
            that.$discountW = that.$discount.closest(".s-discount-wrapper");
            that.$total = that.$wrapper.find("#js-cart-total");

            // VARS
            that.price_pattern = options["price_pattern"];
            that.error_class = "has-error";

            // INIT
            that.bindEvents();
        };

        // Events
        Cart.prototype.bindEvents = function() {
            var that = this,
                $wrapper = that.$wrapper,
                $product = that.$products,
                $productServices = that.$services;

            $product.on("click", ".js-increase", function() {
                var $currentProduct = $(this).closest(".s-cart-product");
                that.changeProductQuantity("positive", $currentProduct);
                return false;
            });

            $product.on("click", ".js-decrease", function() {
                var $currentProduct = $(this).closest(".s-cart-product");
                that.changeProductQuantity("negative", $currentProduct);
                return false;
            });

            $product.on("change", ".s-product-quantity", function() {
                that.onChangeProductQuantity( $(this) );
                return false;
            });

            $product.on("click", ".js-delete-product", function() {
                that.deleteProduct( $(this).closest(".s-cart-product") );
                return false;
            });

            $productServices.on("change", "select", function() {
                that.onServiceChange( $(this) );
                return false;
            });

            $productServices.on("change", "input[type=\"checkbox\"]", function() {
                that.onServiceCheck( $(this) );
                return false;
            });

            $wrapper.on("click", ".js-cancel-affiliate",function(event) {
                event.preventDefault();
                that.useAffiliate(false);
            });

            $wrapper.on("click", ".js-use-affiliate",function(event) {
                event.preventDefault();
                that.useAffiliate(true);
            });

            that.$couponSection.on("click", ".js-show-form", function(event) {
                event.preventDefault();
                that.$couponSection.addClass("is-extended");
            });

            $wrapper.on("click", ".add-to-cart-link", function() {
                that.onAddToCart( $(this) );
                return false;
            });
        };

        Cart.prototype.onAddToCart = function( $target ) {
            var that = this,
                $deferred = $.Deferred(),
                request_href = $target.data("request-href"),
                request_data = {
                    html: 1,
                    product_id: $target.data("product_id")
                };

            $.post(request_href, request_data, function (response) {
                $deferred.resolve(response);
            }, 'json');

            $deferred.done( function(response) {
                if (response.status === 'ok') {
                    location.reload();
                }
            });
        };

        Cart.prototype.onServiceCheck = function($input) {
            var that = this,
                $product = $input.closest(".s-cart-product"),
                $deferred = $.Deferred(),
                product_id = $product.data("id"),
                is_checked = $input.is(":checked"),
                input_val = $input.val(),
                $field = $('[name="service_variant[' + product_id + '][' + input_val + ']"]'),
                $service = $input.closest(".s-service"),
                request_data = {};

            // Toggle service <select>
            if ($field.length) {
                if (is_checked) {
                    $field.removeAttr('disabled');
                } else {
                    $field.attr('disabled', 'disabled');
                }
            }

            if (is_checked) {
                request_data = {
                    html: 1,
                    parent_id: product_id,
                    service_id: input_val
                };

                // If variants exits, adding to request_data
                if ($field.length) {
                    request_data["service_variant_id"] = $field.val();
                }

                $.post('add/', request_data, function(response) {
                    $deferred.resolve(response);
                }, "json");

                $deferred.done( function(response) {
                    // Set ID
                    $service.data("id", response.data.id);

                    // Set Product Total
                    var $productTotal = $product.find(".js-product-total");
                    $productTotal.html(response.data.item_total);

                    // Update Cart Total
                    that.updateCart($product, response.data);
                });

            } else {

                request_data = {
                    html: 1,
                    id: $service.data('id')
                };

                $.post('delete/', request_data, function (response) {
                    $deferred.resolve(response);
                }, "json");

                $deferred.done( function(response) {
                    // Set ID
                    $service.data('id', null);

                    // Set Product Total
                    var $productTotal = $product.find(".js-product-total");
                    $productTotal.html(response.data.item_total);

                    // Update Cart Total
                    that.updateCart($product, response.data);
                });
            }

        };

        Cart.prototype.useAffiliate = function(use) {
            var that = this,
                $form = that.$form;

            var $input = $("<input type=\"hidden\" name=\"use_affiliate\" value=\"\">");

            $input.val( (use ? 1 : 0) );
            $input.appendTo($form);
            $form.submit();
        };

        Cart.prototype.onServiceChange = function($select) {
            var that = this,
                $product = $select.closest(".s-cart-product"),
                $deferred = $.Deferred(),
                $service = $select.closest(".s-service"),
                request_data = {
                    html: 1,
                    id: $service.data("id"),
                    service_variant_id: $select.val()
                };

            $.post("save/", request_data, function (response) {
                $deferred.resolve(response);
            }, "json");

            $deferred.done( function(response) {

                // Render Product Total
                $product.find('.js-product-total').html(response.data.item_total);

                // Render Cart Total
                that.updateCart($product, response.data);
            });
        };

        Cart.prototype.updateCart = function($product, data) {
            var that = this,
                text = data["total"],
                count = data["count"];

            // Render Total
            that.$total.html(text);

            // Update
            if (text && count >= 0) {
                var cart = waTheme.apps["shop"].cart;
                if (cart) {
                    waTheme.apps["shop"].cart.update({
                        text: text,
                        count: count
                    });
                }
            }

            // Render Discount
            if (data.discount) {
                that.$discount.html("-" + data.discount);
            } else {
                that.$discount.html(0);
            }

            // Render Affiliate Bonus
            if (data.add_affiliate_bonus) {
                that.$bonus.html(data.add_affiliate_bonus).show();
            } else {
                that.$bonus.html("").hide();
            }
        };

        Cart.prototype.changeProductQuantity = function(type, $product) {
            var that = this,
                $quantityInput = $product.find(".js-quantity-field"),
                current_val = parseInt( $quantityInput.val() ),
                is_disabled = ( $quantityInput.attr("disabled") === "disabled"),
                disable_time = 800,
                new_val;

            if (type === "positive") {
                new_val = current_val + 1;
            } else if (type === "negative") {
                new_val = current_val - 1;
            }

            // Set new value
            if (!is_disabled) {

                if ( new_val > 0 ) {
                    $quantityInput.attr("disabled","disabled");

                    $quantityInput.val(new_val);

                    // Recalculate Price
                    $quantityInput.change();

                    setTimeout( function() {
                        $quantityInput.attr("disabled", false)
                    }, disable_time);

                    // If volume is zero => remove item from basket
                } else {

                    this.deleteProduct($product );
                }
            }
        };

        Cart.prototype.onChangeProductQuantity = function( $input ) {
            var that = this,
                $product = $input.closest(".s-cart-product"),
                $deferred = $.Deferred(),
                $sum_wrapper = $product.find(".js-product-total"),
                product_quantity = parseInt( $input.val() ),
                request_data;

            // Check for STRING Data at Quantity Field
            if ( isNaN( product_quantity ) ) {
                product_quantity = 1;
            }
            $input.val( product_quantity );

            // Data for Request
            request_data  = {
                html: 1,
                id: $product.data('id'),
                quantity: product_quantity
            };

            // If Quantity 1 or more
            if (product_quantity > 0) {

                $.post("save/", request_data, function (response) {
                    $deferred.resolve(response);
                }, "json");

                $deferred.done( function(response) {
                    $sum_wrapper.html( response.data.item_total );

                    if (response.data.q) {
                        $input.val( response.data.q );
                    }

                    if (response.data.error) {
                        $input.addClass(that.error_class);

                        // at Future make it better ( renderErrors(errors) )
                        alert(response.data.error);

                    } else {

                        $input.removeClass(that.error_class);

                    }

                    that.updateCart($product, response.data);
                });

            // Delete Product
            } else if (product_quantity == 0) {
                that.deleteProduct($product );
            }
        };

        Cart.prototype.deleteProduct = function($product ) {
            var that = this,
                $deferred = $.Deferred(),
                request_data = {
                    html: 1,
                    id: $product.data('id')
                };

            $.post("delete/", request_data, function (response) {
                $deferred.resolve(response);
            }, "json");

            $deferred.done( function(response) {
                if (response.data.count == 0) {
                    location.reload();
                } else {
                    $product.remove();
                    that.updateCart($product, response.data);
                }
            });

        };

        // Initialize
        return Cart;

    })();

    waTheme.init.shop.Cart = Cart;

})(jQuery, window.waTheme);