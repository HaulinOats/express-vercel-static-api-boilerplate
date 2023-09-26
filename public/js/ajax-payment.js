(async ($) => {
  "use strict";
  //load packages into select
  let form = ".ajax-payment";
  let invalidCls = "is-invalid";
  let $email = '[name="email"]';
  let $validation = '[name="name"],[name="email"],[name="message"]'; // Must be use (,) without any space
  let formMessages = $(".form-messages");
  let selectedPackage;

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
    selectedPackage = packages[packageIndex];
    let tableEl = document.createElement("table");
    tableEl.classList.add(["table", "table-responsive-lg"]);
    tableEl.append(`<tr>
      <th>Due Time</th>
      <th>Description</th>
      <th>Cost</th>
    </tr>`);
    let rowHTML = "";
    selectedPackage.rowItems.forEach((row) => {
      rowHTML += `<tr>
        <td>${row.due}</td>
        <td>${row.description}</td>
        <td>$${row.cost.toFixed(2)}</td>
      </tr>`;
    });
    rowHTML += `<tr>
      <td></td>
      <td class="fw-bold">Total</td>
      <td class="fw-bold">$${selectedPackage.total.toFixed(2)}</td>
    </tr>`;
    tableEl.innerHTML = rowHTML;
    $("#packageDetails").html("").append(tableEl).show();
    $("#payment-total").html(`Total: $${selectedPackage.total.toFixed(2)}`);
    $("#payment-form").show();
  });

  //validates form data
  function validateContact() {
    let valid = true;
    let formInput;

    function unvalid($validation) {
      $validation = $validation.split(",");
      for (let i = 0; i < $validation.length; i++) {
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

  //Square Payments
  let payments;
  let card;
  $(form).on("submit", (event, element) => {
    event.preventDefault();
    // if (validateContact()) {
    handlePaymentMethodSubmission(event);
    // }
  });

  const appId = "sandbox-sq0idb-g25xE6Dc5GhJCNI2e4Rlpw";
  const locationId = "LB41ZFX0DKFE9";

  if (!window.Square) {
    throw new Error("Square.js failed to load properly");
  }

  try {
    payments = window.Square.payments(appId, locationId);
  } catch {
    const statusContainer = document.getElementById("payment-status-container");
    statusContainer.className = "missing-credentials";
    statusContainer.style.visibility = "visible";
    return;
  }

  try {
    card = await initializeCard(payments);
  } catch (e) {
    console.error("Initializing Card failed", e);
    return;
  }

  async function initializeCard(payments) {
    const card = await payments.card();
    await card.attach("#card-container");

    return card;
  }

  async function createPayment(token) {
    if (!selectedPackage) return;

    let formData = new FormData($(form)[0]);
    console.log(formData);
    const body = JSON.stringify({
      locationId,
      sourceId: token,
      idempotencyKey: window.crypto.randomUUID(),
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      email: formData.get("email"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2"),
      locality: formData.get("city"),
      administrativeDistrictLevel1: formData.get("state"),
      postalCode: formData.get("postalCode"),
      message: formData.get("message"),
      // amount: selectedPackage.total * 100
      amount: 100
    });
    console.log({ body });

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

  async function verifyBuyer(token) {
    let formData = new FormData($(form)[0]);
    const verificationDetails = {
      amount: 100,
      billingContact: {
        addressLines: [formData.get("addressLine1"), formData.get("addressLine2")],
        familyName: formData.get("lastname"),
        givenName: formData.get("firstname"),
        email: formData.get("email"),
        country: "US",
        phone: formData.get("phone"),
        region: formData.get("city"),
        city: formData.get("locality")
      },
      currencyCode: "USD",
      intent: "CHARGE"
    };

    const verificationResults = await payments.verifyBuyer(token, verificationDetails);
    return verificationResults.token;
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

  async function handlePaymentMethodSubmission(event) {
    event.preventDefault();

    try {
      // disable the submit button as we await tokenization and make a payment request.
      const token = await tokenize(card);
      console.log({ token });
      const verificationToken = await verifyBuyer(token);
      console.log({ verificationToken });
      const paymentResults = await createPayment(token, verificationToken);
      console.log({ paymentResults });
      displayPaymentResults("SUCCESS");

      console.debug("Payment Success", paymentResults);
    } catch (e) {
      displayPaymentResults("FAILURE");
      console.error(e.message);
    }
  }
})(jQuery);
