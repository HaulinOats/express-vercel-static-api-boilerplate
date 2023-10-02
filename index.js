const express = require("express");
const path = require("path");
const port = process.env.PORT || 3000;

const app = express();

app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// default catch all handler

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

module.exports = app;
