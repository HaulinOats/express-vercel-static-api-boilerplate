(function ($) {
  "use strict";

  $("#testBtn").on("click", () => {
    $.ajax({
      url: "/api/test",
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ name: "Brett" })
    })
      .done((response) => {
        console.log("success: ", response);
      })
      .fail((data) => {
        console.log("fail: ", data);
      });
  });

  var form = ".ajax-contact";
  var invalidCls = "is-invalid";
  var $email = '[name="email"]';
  var $validation = '[name="name"],[name="email"],[name="message"]'; // Must be use (,) without any space
  var formMessages = $(".form-messages");

  function sendContact() {
    var formData = $(form).serialize();
    var valid;
    valid = validateContact();
    if (valid) {
      console.log({
        url: $(form).attr("action"),
        data: formData,
        type: "POST"
      });
      jQuery
        .ajax({
          url: $(form).attr("action"),
          data: formData,
          type: "POST"
        })
        .done(function (response) {
          // Make sure that the formMessages div has the 'success' class.
          if (response.success) {
            formMessages.removeClass("error");
            formMessages.addClass("success");
            formMessages.text(response.msg);
            // Clear the form.
            $(form + ' input:not([type="submit"]),' + form + " textarea").val("");
          } else if (response.error) {
            // Make sure that the formMessages div has the 'error' class.
            formMessages.removeClass("success");
            formMessages.addClass("error");
            formMessages.html(response.error);
          }
        })
        .fail(function (data) {
          // Make sure that the formMessages div has the 'error' class.
          formMessages.removeClass("success");
          formMessages.addClass("error");
          // Set the message text.
          if (data.responseText !== "") {
            formMessages.html(data.responseText);
          } else {
            formMessages.html("Oops! An error occurred and your message could not be sent.");
          }
        });
    }
  }

  function validateContact() {
    var valid = true;
    var formInput;

    function unvalid($validation) {
      $validation = $validation.split(",");
      for (var i = 0; i < $validation.length; i++) {
        formInput = form + " " + $validation[i];
        if (!$(formInput).val()) {
          $(formInput).addClass(invalidCls);
          valid = false;
        } else {
          $(formInput).removeClass(invalidCls);
          valid = true;
        }
      }
    }
    unvalid($validation);

    if (
      !$($email).val() ||
      !$($email)
        .val()
        .match(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/)
    ) {
      $($email).addClass(invalidCls);
      valid = false;
    } else {
      $($email).removeClass(invalidCls);
      valid = true;
    }

    return valid;
  }

  $(form).on("submit", function (element) {
    element.preventDefault();
    sendContact();
  });
})(jQuery);
