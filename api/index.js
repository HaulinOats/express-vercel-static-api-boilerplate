const app = require("express")();
const retry = require("async-retry");

app.post("/api/test", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  res.json({ msg: "hello" });
});

app.post("/api/payment", async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  const { createError } = require("micro");
  const { validatePaymentPayload } = require("../server/schema");
  const { ApiError, client: square } = require("../server/square");

  //https://developer.squareup.com/docs/web-payments/take-card-payment
  let payload = {
    idempotencyKey: req.body.idempotencyKey,
    locationId: req.body.locationId,
    sourceId: req.body.sourceId,
    verificationToken: req.body.verificationToken,
    amount: req.body.amount
  };

  if (!validatePaymentPayload(payload)) {
    throw createError(400, "Bad Request");
  }

  await retry(async (bail, attempt) => {
    try {
      console.info("Creating payment", { attempt });

      let payment = {
        idempotencyKey: payload.idempotencyKey,
        locationId: payload.locationId,
        sourceId: payload.sourceId,
        amountMoney: {
          amount: payload.amount,
          currency: "USD"
        },
        buyerEmailAddress: req.body.email,
        billingAddress: {
          addressLine1: req.body.addressLine1,
          addressLine2: req.body.addressLine2,
          locality: req.body.locality,
          administrativeDistrictLevel1: req.body.administrativeDistrictLevel1,
          postalCode: req.body.postalCode,
          country: "US",
          firstName: req.body.firstname,
          lastName: req.body.lastname
        }
      };

      if (payload.customerId) {
        payment.customerId = payload.customerId;
      }

      if (payload.verificationToken) {
        payment.verificationToken = payload.verificationToken;
      }

      console.log(payment);

      const { result, statusCode } = await square.paymentsApi.createPayment(payment);

      console.info("Payment succeeded!", { result, statusCode });

      res.json({
        result,
        ok: true
      });
    } catch (ex) {
      if (ex instanceof ApiError) {
        // likely an error in the request. don't retry
        console.error(ex.errors);
        bail(ex);
      } else {
        // IDEA: send to error reporting service
        console.error(`Error creating payment on attempt ${attempt}: ${ex}`);
        throw ex; // to attempt retry
      }
      res.json({ error: "error with payment" });
    }
  });
});

app.post("/api/admin", async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  if (req.body.pin === process.env.content_pin) {
    try {
      const request = await fetch("https://json.extendsclass.com/bin/070e0707707e", {
        method: "PUT",
        headers: {
          "Security-key": process.env.content_pin
        },
        body: JSON.stringify(req.body.contentJSON)
      });
      res.json({ success: true });
    } catch (err) {
      res.json({ error: "Error saving json. Contact administrator." });
    }
  } else {
    res.json({ error: "Wrong pin" });
  }
});

app.post("/api/message", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  const nodemailer = require("nodemailer");

  const userName = req.body.name;
  const userEmail = req.body.email;
  const userMessage = req.body.message;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email_name,
      pass: process.env.email_password
    }
  });

  const mailOptions = {
    from: userEmail,
    to: process.env.email_name,
    subject: "CodingWithSandy - Inquiry",
    text: `
      From: ${userName}

      ${userMessage}
    `
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
      res.json({ error: "There was an error sending your email. Contact site administrator." });
    } else {
      res.json({ success: "Thank you for contacting me. I will respond as soon as possible!" });
    }
  });
});

BigInt.prototype.toJSON = function () {
  return this.toString();
};

module.exports = app;
