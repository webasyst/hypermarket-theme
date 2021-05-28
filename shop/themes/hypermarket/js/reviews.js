( function($) {

    var ReviewImagesSection = ( function($) {

        ReviewImagesSection = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$file_field = that.$wrapper.find(".js-file-field");
            that.$files_wrapper = that.$wrapper.find(".js-attached-files-section");
            that.$errors_wrapper = that.$wrapper.find(".js-errors-section");

            // CONST
            that.max_post_size = options["max_post_size"];
            that.max_file_size = options["max_file_size"];
            that.max_files = options["max_files"];
            that.templates = options["templates"];
            that.patterns = options["patterns"];
            that.locales = options["locales"];

            // DYNAMIC VARS
            that.post_size = 0;
            that.id_counter = 0;
            that.files_data = {};
            that.images_count = 0;

            // INIT
            that.init();
        };

        ReviewImagesSection.prototype.init = function() {
            var that = this,
                $document = $(document);

            that.$wrapper.data("controller", that);

            that.$file_field.on("change", function() {
                addFiles(this.files);
                that.$file_field.val("");
            });

            that.$wrapper.on("click", ".js-show-textarea", function(event) {
                event.preventDefault();
                $(this).closest(".s-description-wrapper").addClass("is-extended");
            });

            that.$wrapper.on("click", ".js-delete-file", function(event) {
                event.preventDefault();
                var $file = $(this).closest(".s-file-wrapper"),
                    file_id = "" + $file.data("file-id");

                if (file_id && that.files_data[file_id]) {
                    var file_data = that.files_data[file_id];
                    that.post_size -= file_data.file.size;
                    delete that.files_data[file_id];
                    that.images_count -= 1;
                }

                $file.remove();

                that.renderErrors();
            });

            that.$wrapper.on("keyup change", ".js-textarea", function(event) {
                var $textarea = $(this),
                    $file = $textarea.closest(".s-file-wrapper"),
                    file_id = "" + $file.data("file-id");

                if (file_id && that.files_data[file_id]) {
                    var file = that.files_data[file_id];
                    file.desc = $textarea.val();
                }
            });

            var timeout = null,
                is_entered = false;

            $document.on("dragover", dragWatcher);
            function dragWatcher(event) {
                var is_exist = $.contains(document, that.$wrapper[0]);
                if (is_exist) {
                    onDrag(event);
                } else {
                    $document.off("dragover", dragWatcher);
                }
            }

            $document.on("drop", dropWatcher);
            function dropWatcher(event) {
                var is_exist = $.contains(document, that.$wrapper[0]);
                if (is_exist) {
                    onDrop(event)
                } else {
                    $document.off("drop", dropWatcher);
                }
            }

            $document.on("reset clear", resetWatcher);
            function resetWatcher(event) {
                var is_exist = $.contains(document, that.$wrapper[0]);
                if (is_exist) {
                    that.reset();
                } else {
                    $document.off("reset clear", resetWatcher);
                }
            }

            function onDrop(event) {
                event.preventDefault();

                var files = event.originalEvent.dataTransfer.files;

                addFiles(files);
                dropToggle(false);
            }

            function onDrag(event) {
                event.preventDefault();

                if (!timeout)  {
                    if (!is_entered) {
                        is_entered = true;
                        dropToggle(true);
                    }
                } else {
                    clearTimeout(timeout);
                }

                timeout = setTimeout(function () {
                    timeout = null;
                    is_entered = false;
                    dropToggle(false);
                }, 100);
            }

            function dropToggle(show) {
                var active_class = "is-highlighted";

                if (show) {
                    that.$wrapper.addClass(active_class);
                } else {
                    that.$wrapper.removeClass(active_class);
                }
            }

            function addFiles(files) {
                var errors_types = [],
                    errors = [];

                $.each(files, function(i, file) {
                    var response = that.addFile(file);
                    if (response.error) {
                        var error = response.error;

                        if (errors_types.indexOf(error.type) < 0) {
                            errors_types.push(error.type);
                            errors.push(error);
                        }
                    }
                });

                that.renderErrors(errors);
            }
        };

        ReviewImagesSection.prototype.addFile = function(file) {
            var that = this,
                file_size = file.size;

            var image_type = /^image\/(png|jpe?g|gif)$/,
                is_image = (file.type.match(image_type));

            if (!is_image) {
                return {
                    error: {
                        text: that.locales["file_type"],
                        type: "file_type"
                    }
                };

            } else if (that.images_count >= that.max_files) {
                return {
                    error: {
                        text: that.locales["files_limit"],
                        type: "files_limit"
                    }
                };

            } else if (file_size >= that.max_file_size) {
                return {
                    error: {
                        text: that.locales["file_size"],
                        type: "file_size"
                    }
                };

            } else if (that.post_size + file_size >= that.max_file_size) {
                return {
                    error: {
                        text: that.locales["post_size"],
                        type: "post_size"
                    }
                };

            } else {
                that.post_size += file_size;

                var file_id = that.id_counter,
                    file_data = {
                        id: file_id,
                        file: file,
                        desc: ""
                    };

                that.files_data[file_id] = file_data;

                that.id_counter++;
                that.images_count += 1;

                render();

                return file_data;
            }

            function render() {
                var $template = $(that.templates["file"]),
                    $image = $template.find(".s-image-wrapper");

                $template.attr("data-file-id", file_id);

                getImageUri().then( function(image_uri) {
                    $image.css("background-image", "url(" + image_uri + ")");
                });

                that.$files_wrapper.append($template);

                function getImageUri() {
                    var deferred = $.Deferred(),
                        reader = new FileReader();

                    reader.onload = function(event) {
                        deferred.resolve(event.target.result);
                    };

                    reader.readAsDataURL(file);

                    return deferred.promise();
                }
            }
        };

        ReviewImagesSection.prototype.reset = function() {
            var that = this;

            that.post_size = 0;
            that.id_counter = 0;
            that.files_data = {};

            that.$files_wrapper.html("");
            that.$errors_wrapper.html("");
        };

        ReviewImagesSection.prototype.getSerializedArray = function() {
            var that = this,
                result = [];

            var index = 0;

            $.each(that.files_data, function(file_id, file_data) {
                var file_name = that.patterns["file"].replace("%index%", index),
                    desc_name = that.patterns["desc"].replace("%index%", index);

                result.push({
                    name: file_name,
                    value: file_data.file
                });

                result.push({
                    name: desc_name,
                    value: file_data.desc
                });

                index++;
            });

            return result;
        };

        ReviewImagesSection.prototype.renderErrors = function(errors) {
            var that = this,
                result = [];

            that.$errors_wrapper.html("");

            if (errors && errors.length) {
                $.each(errors, function(i, error) {
                    if (error.text) {
                        var $error = $(that.templates["error"].replace("%text%", error.text));
                        $error.appendTo(that.$errors_wrapper);
                        result.push($error);
                    }
                });
            }

            return result;
        };

        return ReviewImagesSection;

    })(jQuery);

    var Reviews = ( function($) {

        Reviews = function(options) {
            var that = this;

            // DOM
            that.$wrapper = options["$wrapper"];
            that.$form_section = that.$wrapper.find(".s-form-section");
            that.$form = that.$form_section.find("form");
            that.$submit_button = that.$form.find(".js-submit-button");

            // VARS

            // DYNAMIC VARS

            // INIT
            that.initClass();
        };

        Reviews.prototype.initClass = function() {
            var that = this;

            that.initSetRating();

            that.initAuthAdapters();

            that.initComments();

            that.initSubmit();
        };

        Reviews.prototype.initSetRating = function() {
            var that = this;

            that.$form.on("click", ".s-rates-wrapper .s-rate-item", function(event) {
                event.preventDefault();
                setRating($(this));
            });

            function setRating($link) {
                var $wrapper = $link.closest(".s-rates-wrapper"),
                    $links = $wrapper.find(".s-rate-item"),
                    $input = $wrapper.find("input[name=\"rate\"]"),
                    rate_count = $link.data("rate-count"),
                    empty_rate_class = "star-empty",
                    full_rate_class = "star";

                if (rate_count && rate_count > 0) {
                    $links
                        .removeClass(full_rate_class)
                        .addClass(empty_rate_class);

                    for ( var i = 0; i < rate_count; i++ ) {
                        $($links[i])
                            .removeClass(empty_rate_class)
                            .addClass(full_rate_class);
                    }

                    // SET FIELD VALUE
                    $input.val(rate_count);
                }
            }
        };

        Reviews.prototype.initAuthAdapters = function() {
            var that = this,
                $form = that.$form,
                $captcha = that.$wrapper.find(".wa-captcha"),
                $provider = that.$wrapper.find("#user-auth-provider"),
                current_provider = $provider.find(".selected").attr('data-provider');

            showCaptcha();

            function showCaptcha() {
                if (current_provider === 'guest' || !current_provider) {
                    $captcha.show();
                } else {
                    $captcha.hide();
                }
            }
        };

        Reviews.prototype.initComments = function() {
            var that = this;

            var $field = that.$form_section.find("[name='parent_id']");

            that.$wrapper.on("click", ".js-comment-review", function(event) {
                event.preventDefault();
                var $review = $(this).closest(".s-review");
                moveForm($review);
            });

            that.$wrapper.on("click", ".js-unset-reply-parent", function(event) {
                event.preventDefault();
                moveForm();
            });

            function moveForm($review) {
                var review_id = 0;

                if ($review) {
                    review_id = $review.data("id");
                    $review.append(that.$form_section);
                } else {
                    that.$wrapper.prepend(that.$form_section);
                }

                $field.val(review_id).trigger("change");
            }
        };

        Reviews.prototype.initSubmit = function() {
            var that = this,
                $form = that.$form,
                $submit_button = that.$submit_button,
                is_locked = false;

            $form.on("submit", function(event) {
                event.preventDefault();
                addReview();
            });

            function addReview() {

                if (!is_locked) {
                    is_locked = true;

                    var $loading = $('<i class="icon16 loading" />');
                    $loading.insertAfter($submit_button);

                    $submit_button
                        .attr("disabled", true)
                        .val( $submit_button.data("active") );

                    request()
                        .always( function() {
                            is_locked = false;
                        })
                        .done( function(response) {
                            if (response.status === "fail") {
                                showErrors(response.errors);
                                $(".wa-captcha-img").trigger("click");

                                $loading.remove();

                                $submit_button
                                    .removeAttr("disabled")
                                    .val( $submit_button.data("inactive") );

                            } else {
                                // Refresh without hash
                                location.href = location.pathname;
                            }
                        });
                }

                function request() {
                    var href = location.pathname + 'add/',
                        form_data = getData($form);

                    return $.ajax({
                        url: href,
                        data: form_data,
                        cache: false,
                        contentType: false,
                        processData: false,
                        type: 'POST',
                        error: function(jqXHR, errorText) {
                            if (console) {
                                console.error("Error", errorText);
                            }
                        }
                    });

                    function getData($form) {
                        var fields_data = $form.serializeArray(),
                            form_data = new FormData();

                        $.each(fields_data, function () {
                            var field = $(this)[0];
                            form_data.append(field.name, field.value);
                        });

                        var $image_section = $form.find("#js-review-images-section");
                        if ($image_section.length) {
                            var controller = $image_section.data("controller"),
                                data = controller.getSerializedArray();

                            $.each(data, function(i, file_data) {
                                form_data.append(file_data.name, file_data.value);
                            });
                        }

                        return form_data;
                    }
                }
            }

            function showErrors(errors) {
                var $wrapper = $form.find(".s-errors-wrapper");

                // Clear old errors
                $wrapper.addClass("is-shown").html("");

                $.each(errors, function(name, text) {
                    $("<div class=\"error\" />").text(text).appendTo($wrapper);
                });
            }
        };

        return Reviews;

    })(jQuery);

    window.waTheme.init.shop.ReviewImagesSection = ReviewImagesSection;
    window.waTheme.init.shop.Reviews = Reviews;

})(jQuery);

