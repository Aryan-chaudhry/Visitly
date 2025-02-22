const mongoose = require("mongoose");
const Listing = require("./listing.js");
const User = require("./user.js");

const rentalRequestSchema = new mongoose.Schema({
  listing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rental_start_date: { type: Date, required: true },
  rental_end_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending", 
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_at: { type: Date, default: Date.now },
});

const RentalRequest = mongoose.model("RentalRequest", rentalRequestSchema);
module.exports = RentalRequest;