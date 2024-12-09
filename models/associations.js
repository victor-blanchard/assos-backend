const mongoose = require("mongoose");

const associationSchema = mongoose.Schema({
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  description: String,
  siret: Number,
  email: String,
  phone: String,
  streetAddress: String,
  city: String,
  zipcode: Number,
  categories: [String],
});

const Association = mongoose.model("associations", associationSchema);

module.exports = Association;
