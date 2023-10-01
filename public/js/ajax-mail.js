(function ($) {
  "use strict";

  $("#testBtn").on("click", () => {
    try {
      fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Brett" })
      })
        .then((resp) => resp.json())
        .then((json) => {
          console.log(json);
        });
    } catch (err) {
      console.log(err);
    }
  });

  var form = ".ajax-contact";
  var formEl = document.querySelector(".ajax-contact");
  var invalidCls = "is-invalid";
  var $email = '[name="email"]';
  var $validation = '[name="name"],[name="email"],[name="message"]'; // Must be use (,) without any space
  var formMessages = $(".form-messages");

  async function sendContact() {
    var valid;
    valid = validateContact();
    if (valid) {
      try {
        let formData = new FormData(document.querySelector(form));
        const response = await fetch("/api/message", {
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST",
          body: JSON.stringify({
            name: formData.get("name"),
            email: formData.get("email"),
            message: formData.get("message")
          })
        });
        const result = await response.json();
        if (result.success) {
          formMessages.removeClass("error");
          formMessages.addClass("success");
          // Clear the form.
          formEl.querySelectorAll(`input:not([type="submit"]), textarea`).forEach((el) => {
            el.value = "";
          });
        } else if (result.error) {
          // Make sure that the formMessages div has the 'error' class.
          formMessages.removeClass("success");
          formMessages.addClass("error");
        }
        formMessages.text(result.success);
      } catch (err) {
        console.log(err);
        formMessages.removeClass("success");
        formMessages.addClass("error");
        formMessages.html("Oops! An error occurred and your message could not be sent.");
      }
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
