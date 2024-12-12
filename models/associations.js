const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  street: String,
  city: String,
  zipcode: String,
});

const associationSchema = mongoose.Schema({
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  description: String,
  siret: String,
  email: String,
  phone: String,
  address: addressSchema,
  categories: [String],
});

const Association = mongoose.model("associations", associationSchema);

module.exports = Association;
