const Listing = require("../models/listing");
const User = require("../models/user");
const RentalRequest = require("../models/rentalRequest");

// Fetch rental requests for a customer (Logged-in User)
module.exports.getCart = async (req, res) => {
  try {
    const customerId = req.user._id; // Logged-in user
    const requests = await RentalRequest.find({ customer_id: customerId }) // Fetch requests made by the customer
      .populate("listing_id", "title description price image")
      .exec();
    res.render("cart/showCart.ejs", { requests, customerId });
  } catch (error) {
    console.error("Error fetching rental requests:", error);
    res.status(500).send("Error fetching rental requests.");
  }
};

// Delete a rental request (Only Customer Can Delete Their Request)
module.exports.deleteRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user._id; // Logged-in user (Customer)

    // Ensure that the customer can only delete their own request
    const rentalRequest = await RentalRequest.findOne({
      _id: id,
      customer_id: customerId,
    });
    if (!rentalRequest) {
      return res
        .status(403)
        .send("Unauthorized to delete this rental request.");
    }

    await RentalRequest.findByIdAndDelete(id);
    console.log(`Rental request with ID ${id} deleted.`);
    res.redirect(`/rent/${customerId}`);
  } catch (error) {
    console.error("Error deleting rental request:", error);
    res.status(500).send("Error deleting rental request.");
  }
};

// Checkout a listing (Customer Checking Out)
module.exports.checkoutListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const customerId = req.user._id; // Logged-in user (Customer)

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).send("Listing not found.");

    const customer = await User.findById(customerId);
    if (!customer) return res.status(404).send("Customer not found.");

    res.render("cart/checkout.ejs", { listing, user: customer });
  } catch (error) {
    console.error("Error fetching listing or customer:", error);
    res.status(500).send("Error fetching listing or customer.");
  }
};