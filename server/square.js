const { ApiError, Client, Environment } = require("square");

const { isProduction } = require("./config");

const client = new Client({
  environment: isProduction ? Environment.Production : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

module.exports = { ApiError, client };
