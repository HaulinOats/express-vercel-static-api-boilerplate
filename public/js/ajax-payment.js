(async function ($) {
  "use strict";
  //load packages into select
  var form = ".ajax-payment";
  var invalidCls = "is-invalid";
  var $email = '[name="email"]';
  var $validation = '[name="name"],[name="email"],[name="message"]'; // Must be use (,) without any space
  var formMessages = $(".form-messages");

  //get package info from JSON file and populate dropdown for selecting packages on signup.html page
  let packages = await fetch("./packages.json")
    .then((data) => data.json())
    .catch((err) => console.log(`error getting package data: ${err}`));
  console.log(packages);
  let packageSelectHTML = "";
  packages.forEach((pkg, i) => {
    packageSelectHTML += `<option value="${i}">${pkg.name} - $${pkg.total.toFixed(2)}</option>`;
  });
  $("#packageSelect").append(packageSelectHTML);

  //when selecting a package from dropdown, display table breakdown
  $("#packageSelect").on("change", (e) => {
    let packageIndex = parseInt(e.currentTarget.value);
    let currentPackage = packages[packageIndex];
    let tableEl = document.createElement("table");
    tableEl.classList.add(["table", "table-responsive-lg"]);
    tableEl.append(`<tr>
      <th>Due Time</th>
      <th>Description</th>
      <th>Cost</th>
    </tr>`);
    let rowHTML = "";
    currentPackage.rowItems.forEach((row) => {
      rowHTML += `<tr>
        <td>${row.due}</td>
        <td>${row.description}</td>
        <td>$${row.cost.toFixed(2)}</td>
      </tr>`;
    });
    rowHTML += `<tr>
      <td></td>
      <td class="fw-bold">Total</td>
      <td class="fw-bold">$${currentPackage.total.toFixed(2)}</td>
    </tr>`;
    tableEl.innerHTML = rowHTML;
    $("#packageDetails").html("").append(tableEl).show();
    $("#payment-total").html(`Total: $${currentPackage.total.toFixed(2)}`);
    $("#payment-form").show();
  });

  function sendPayment() {
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
          formMessages.removeClass("error");
          formMessages.addClass("success");
          // Set the message text.
          formMessages.text(response);
          // Clear the form.
          $(form + ' input:not([type="submit"]),' + form + " textarea").val("");
        })
        .fail(function (data) {
          // Make sure that the formMessages div has the 'error' class.
          formMessages.removeClass("success");
          formMessages.addClass("error");
          // Set the message text.
          if (data.responseText !== "") {
            formMessages.html(data.responseText);
          } else {
            formMessages.html("Oops! An error occured and your message could not be sent.");
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
    sendPayment();
  });

  //Square Payments
  const appId = "sandbox-sq0idb-g25xE6Dc5GhJCNI2e4Rlpw";
  const locationId = "LB41ZFX0DKFE9";

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token, verificationToken) {
    const body = JSON.stringify({
      locationId,
      sourceId: token,
      verificationToken,
      idempotencyKey: window.crypto.randomUUID()
    });

    const paymentResponse = await fetch("/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    });

    if (paymentResponse.ok) {
      return paymentResponse.json();
    }

    const errorBody = await paymentResponse.text();
    throw new Error(errorBody);
  }

  async function tokenize(paymentMethod) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === "OK") {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }

      throw new Error(errorMessage);
    }
  }

  // status is either SUCCESS or FAILURE;
  function displayPaymentResults(status) {
    const statusContainer = document.getElementById("payment-status-container");
    if (status === "SUCCESS") {
      statusContainer.classList.remove("is-failure");
      statusContainer.classList.add("is-success");
    } else {
      statusContainer.classList.remove("is-success");
      statusContainer.classList.add("is-failure");
    }

    statusContainer.style.visibility = "visible";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    let payments;
    try {
      payments = window.Square.payments(appId, locationId);
    } catch {
      const statusContainer = document.getElementById("payment-status-container");
      statusContainer.className = "missing-credentials";
      statusContainer.style.visibility = "visible";
      return;
    }

    let card;
    try {
      card = await initializeCard(payments);
    } catch (e) {
      console.error("Initializing Card failed", e);
      return;
    }

    async function handlePaymentMethodSubmission(event, card) {
      event.preventDefault();

      try {
        // disable the submit button as we await tokenization and make a payment request.
        cardButton.disabled = true;
        const token = await tokenize(card);
        const paymentResults = await createPayment(token);
        displayPaymentResults("SUCCESS");

        console.debug("Payment Success", paymentResults);
      } catch (e) {
        cardButton.disabled = false;
        displayPaymentResults("FAILURE");
        console.error(e.message);
      }
    }

    const cardButton = document.getElementById("card-button");
    cardButton.addEventListener("click", async function (event) {
      console.log("btn clicked");
      await handlePaymentMethodSubmission(event, card);
    });
  });
})(jQuery);
