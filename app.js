require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./routes");

app.set("port", process.env.PORT || 3000);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

app.post("/admin", (req, res) => {
  console.log(req.body);
  if (req.body.pin === process.env.content_pin) {
    try {
      console.log(`${__dirname}/public/content.json`);
      fs.writeFileSync(`${__dirname}/public/content.json`, JSON.stringify(req.body.contentJSON));
      res.json({ ok: true });
    } catch (err) {
      res.json({ error: "Error saving json. Contact administrator." });
    }
  } else {
    res.json({ error: "Wrong pin" });
  }
});

//prevents type error for number being Big Int
BigInt.prototype.toJSON = function () {
  return this.toString();
};

module.exports = app;
