const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  //   lastName: String,
  //   email: String,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
