require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./routes");

app.set("port", process.env.PORT || 3000);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

//prevents type error for number being Big Int
BigInt.prototype.toJSON = function () {
  return this.toString();
};

module.exports = app;
