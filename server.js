require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const retry = require("async-retry");
const { createError, send } = require("micro");

const { ApiError, client: square } = require("./server/square");
const logger = require("./server/logger");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const { validatePaymentPayload } = require("./server/schema");

app.post("/payment", async (req, res) => {
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
app.use("/admin", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/admin.html"));
});
app.post("/message", (req, res) => {
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
      res.send("Thank you for contacting me. I will respond as soon as possible!");
    }
  });
});
app.use("/signup", (_req, res) => {
  res.sendFile(path.join(__dirname + "/public/signup.html"));
});
//homepage
app.use("/", (_req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});
const port = 3000;
app.listen(port);
console.debug("Server listening on port " + port);

//prevents type error for number being Big Int
BigInt.prototype.toJSON = function () {
  return this.toString();
};
