const app = require("express")();
const fs = require("fs");
const retry = require("async-retry");
const { createError } = require("micro");
const { validatePaymentPayload } = require("../server/schema");
const { ApiError, client: square } = require("../server/square");
const logger = require("../server/logger");

app.post("/api/payment", async (req, res) => {
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
      logger.debug("Creating payment", { attempt });

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

      // console.log(payment);

      const { result, statusCode } = await square.paymentsApi.createPayment(payment);

      logger.info("Payment succeeded!", { result, statusCode });

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
    }
  });
});

// updating/rewriting content.json file
// app.post("/api/admin", (req, res) => {
//   if (req.body.pin === process.env.content_pin) {
//     try {
//       console.log(`../public/content.json`);
//       fs.writeFileSync(`../public/content.json`, JSON.stringify(req.body.contentJSON));
//       res.json({ ok: true });
//     } catch (err) {
//       res.json({ error: "Error saving json. Contact administrator." });
//     }
//   } else {
//     res.json({ error: "Wrong pin" });
//   }
// });

app.post("/api/message", (req, res) => {
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

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.debug(error);
    } else {
      logger.debug("Email sent: " + info.response);
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
      res.send("Thank you for contacting me. I will respond as soon as possible!");
    }
  });
});

module.exports = app;
