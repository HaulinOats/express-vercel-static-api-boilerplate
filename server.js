const http = require("http");
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static("public"));
// default URL for website
app.use("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});
app.use("/signup", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/signup.html"));
});
const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug("Server listening on port " + port);
