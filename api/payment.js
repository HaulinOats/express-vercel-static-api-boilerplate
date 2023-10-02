export default async function handler(request, response) {
  const { createError } = require("micro");
  const { validatePaymentPayload } = require("../server/schema");
  const { ApiError, client: square } = require("../server/square");

  //https://developer.squareup.com/docs/web-payments/take-card-payment
  let payload = {
    idempotencyKey: request.body.idempotencyKey,
    locationId: request.body.locationId,
    sourceId: request.body.sourceId,
    verificationToken: request.body.verificationToken,
    amount: request.body.amount
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
        buyerEmailAddress: request.body.email,
        billingAddress: {
          addressLine1: request.body.addressLine1,
          addressLine2: request.body.addressLine2,
          locality: request.body.locality,
          administrativeDistrictLevel1: request.body.administrativeDistrictLevel1,
          postalCode: request.body.postalCode,
          country: "US",
          firstName: request.body.firstname,
          lastName: request.body.lastname
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

      return response.json({
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
      return response.json({ error: "error with payment" });
    }
  });
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};
