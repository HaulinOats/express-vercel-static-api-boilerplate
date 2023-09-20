require("dotenv").config();
const http = require("http");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
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
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      res.send("Thank you for contacting me. I will respond as soon as possible!");
    }
  });
});
app.use("/signup", (_req, res) => {
  res.sendFile(path.join(__dirname + "/public/signup.html"));
});
// default URL for website
app.use("/", (_req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});
const port = 3000;
app.listen(port);
console.debug("Server listening on port " + port);
