const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  street: String,
  city: String,
  zipcode: Number,
});

const eventSchema = mongoose.Schema({
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: "associations" },
  startDate: Date,
  endDate: Date,
  limitDate: Date,
  name: String,
  description: String,
  isOpenToSubscription: Boolean,
  address: addressSchema,
  status: String,
  categories: [String],
  slotsAvailable: Number,
  target: [String],
});

const Event = mongoose.model("events", eventSchema);

module.exports = Event;
