const mongoose = require("mongoose");
const testModel = mongoose.Schema(
  {
    fileName: [{ type: mongoose.Schema.Types.Buffer}],
  },
  { timestamps: true }
);

const test = mongoose.model("test", testModel);

module.exports = test