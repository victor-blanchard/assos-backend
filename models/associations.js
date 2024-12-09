const mongoose = require('mongoose');

const associationSchema = mongoose.Schema({
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  descritption: String,
  siret: Number,
  email: String,
  phone: Number,
  streetAdress: String,
  city: String,
  zipcode: Number,
  categories: [String],
  token: String,
});

const Association = mongoose.model('associations', associationSchema);

module.exports = Association;
