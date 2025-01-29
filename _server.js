const express = require("express");

const { execute } = require("./main.js");

const app = express();
const port = 3000;

let flag = {};

app.get("/", (req, res) => res.send("HELLO WORLD"));

app.get("/api/send", (req, res) => {
  if (flag.inProgress) {
    res.status(200).json({
      message: "Already Inprogress",
    });
    return;
  }
  execute(flag);
  res.status(200).json({
    message: "Data received successfully",
  });
});

// if (require.main === module) {
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
// }

module.exports = app;
