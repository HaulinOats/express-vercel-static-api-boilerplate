const { ApiError, Client, Environment } = require("square");

const { isProduction } = require("./config");

const client = new Client({
  environment: isProduction ? Environment.Production : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});
console.log(process.env);

module.exports = { ApiError, client };
