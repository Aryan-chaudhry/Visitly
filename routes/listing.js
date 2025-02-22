const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const RentalRequest = require("../models/rentalRequest.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);
router.get("/search", listingController.search);
router.get("/sustain", listingController.sustain);
router.get("/comm", listingController.comm);
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);
// POST route to handle rental requests

// Rental Request Route
router.post("/:id/rent", isLoggedIn, wrapAsync(listingController.createRentalRequest));
// router.post("/:id/rent", async (req, res) => {
//   try {
//     console.log("Rent request received:", req.body);

//     // Extract data from the request body
//     const { rentStartDate, rentEndDate, renterId } = req.body;
//     const listing_id = req.params.id;

//     // Map the request body fields to match the schema
//     const rental_start_date = rentStartDate;
//     const rental_end_date = rentEndDate;
//     const user_id = renterId;

//     // Validate input fields
//     if (!rental_start_date || !rental_end_date || !user_id) {
//       console.log("Missing required fields");
//       console.log(rental_start_date, rental_end_date, user_id);
//       return res
//         .status(400)
//         .send(
//           "All fields (rental_start_date, rental_end_date, user_id) are required."
//         );
//     }

//     if (new Date(rental_start_date) >= new Date(rental_end_date)) {
//       console.log("Invalid date range");
//       return res.status(400).send("End date must be after start date.");
//     }

//     // Create a new rental request
//     const rentalRequest = new RentalRequest({
//       listing_id,
//       user_id,
//       rental_start_date,
//       rental_end_date,
//       status: "Pending",
//     });

//     // Save the rental request to the database
//     await rentalRequest.save();

//     console.log("Rental request saved:", rentalRequest);

//     // Fetch updated rental requests for the user
//     const requests = await RentalRequest.find({ user_id })
//       .populate("listing_id", "title description price image")
//       .exec();

      

//     // Render the updated cart view
//     res.render("cart/showCart.ejs", { requests });
//   } catch (error) {
//     console.error("Error processing rental request:", error);
//     res.status(500).send("Error processing rental request.");
//   }
// });

module.exports = router;
