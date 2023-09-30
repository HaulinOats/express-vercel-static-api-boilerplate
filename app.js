const express = require("express");
const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

module.exports = app;
