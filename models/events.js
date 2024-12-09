const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'associations' },
  startDate: Date,
  endDate: Date,
  limitDate: Date,
  name: String,
  description: String,
  isOpenToSubscription: Boolean,
  address: String,
  status: String,
  categories: [String],
  slotsAvailable: Number,
  target: [String],
});

const Event = mongoose.model('events', eventSchema);

module.exports = Event;
