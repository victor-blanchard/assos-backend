const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  isAssociationOwner: Boolean,
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  birthday: Date,
  zipcode: Number,
  token: String,
  photoUrl: String,
  publicId: String,
  likedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "events" }],
  followingAssociations: [{ type: mongoose.Schema.Types.ObjectId, ref: "associations" }],
});

const User = mongoose.model("users", userSchema);

module.exports = User;
