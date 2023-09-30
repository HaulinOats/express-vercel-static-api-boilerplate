"use strict";
//https://developer.squareup.com/docs/web-payments/take-card-payment

const appId = "sandbox-sq0idb-g25xE6Dc5GhJCNI2e4Rlpw";
const locationId = "LB41ZFX0DKFE9";

async function initializeCard(payments) {
  const card = await payments.card();
  await card.attach("#card-container");

  return card;
}

async function createPayment(token, verificationToken, packages) {
  const formData = new FormData(document.querySelector(".ajax-payment"));
  const packageSelect = document.querySelector("#packageSelect");
  const packageIndex = parseInt(packageSelect.value);
  const amount = packages[packageIndex].total * 100;
  const body = JSON.stringify({
    locationId,
    sourceId: token,
    verificationToken,
    idempotencyKey: window.crypto.randomUUID(),
    firstname: formData.get("firstname"),
    lastname: formData.get("lastname"),
    email: formData.get("email"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    locality: formData.get("locality"),
    administrativeDistrictLevel1: formData.get("state"),
    postalCode: formData.get("postalCode"),
    message: formData.get("message"),
    amount
  });

  const paymentResponse = await fetch("/api/payment", {
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

// Required in SCA Mandated Regions: Learn more at https://developer.squareup.com/docs/sca-overview
async function verifyBuyer(payments, token, packages) {
  let formData = new FormData(document.querySelector(".ajax-payment"));
  const packageSelect = document.querySelector("#packageSelect");
  const packageIndex = parseInt(packageSelect.value);
  const amount = String(packages[packageIndex].total.toFixed(2));
  const verificationDetails = {
    amount,
    billingContact: {
      addressLines: [formData.get("addressLine1"), formData.get("addressLine2")],
      familyName: formData.get("lastname"),
      givenName: formData.get("firstname"),
      email: formData.get("email"),
      country: "US",
      phone: formData.get("phone"),
      region: formData.get("state"),
      city: formData.get("locality")
    },
    currencyCode: "USD",
    intent: "CHARGE"
  };
  //console.log({ verificationDetails });
  const verificationResults = await payments.verifyBuyer(token, verificationDetails);
  return verificationResults.token;
}

document.addEventListener("DOMContentLoaded", async function () {
  const response = await fetch("https://json.extendsclass.com/bin/070e0707707e")
    .then((data) => data.json())
    .catch((err) => console.log(`error getting package data: ${err}`));
  const packages = response.packages;

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

  async function handlePaymentMethodSubmission(event, paymentMethod, shouldVerify = false) {
    event.preventDefault();

    try {
      // disable the submit button as we await tokenization and make a payment
      // request.
      paymentButton.disabled = true;
      const token = await tokenize(paymentMethod);
      let verificationToken;

      if (shouldVerify) {
        verificationToken = await verifyBuyer(payments, token, packages);
      }

      const paymentResults = await createPayment(token, verificationToken, packages);
      document.querySelector("#payment-status-container").innerHTML = `
        <h4 class="mt-15">Payment Successful!</h4>
        <p class="text-theme fs-6">Order ID: <i class="text-uppsercase">${paymentResults.result.payment.orderId}</i></p>
        <a class="text-theme fs-6" href="${paymentResults.result.payment.receiptUrl}" target="_blank"><u>Receipt Number: ${paymentResults.result.payment.receiptNumber}</u></a>
      `;
      console.log(paymentResults);

      console.debug("Payment Success", paymentResults);
    } catch (e) {
      paymentButton.disabled = false;
      document.querySelector("#payment-status-container").innerHTML = `
        <h4 class="text-danger mt-15">Payment Failed</h4>
        <p class="text-danger fs-6">There was an error processing your payment. Please <u><a href="./index.html#contact">contact me</a></u> if problem persists.</p>
      `;
      console.error(e.message);
    }
  }

  const paymentButton = document.querySelector(".send-payment");
  paymentButton.addEventListener("click", async function (event) {
    event.preventDefault();
    if (!formValidated()) return;
    await handlePaymentMethodSubmission(event, card, true);
  });
});

//revalidate when unfocusing element
let validated = true;
const formElements = document.querySelectorAll(".ajax-payment [name]");
formElements.forEach((el) => {
  el.addEventListener("blur", (e) => {
    validateFormElement(e.currentTarget);
  });
});

function formValidated() {
  validated = true;
  formElements.forEach((el) => {
    validateFormElement(el);
  });

  return validated;
}

function validateFormElement(element) {
  const isRequired = parseInt(element.dataset.isRequired);
  if (!isRequired) return;

  const value = element.value;

  if (!value.length) {
    validated = false;
    element.classList.add("is-invalid");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    element.classList.remove("is-invalid");
  }
}
