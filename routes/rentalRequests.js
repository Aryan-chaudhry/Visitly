const express = require("express");
const router = express.Router();
const rentalRequest = require("../controllers/rentalRequests");
const { isLoggedIn } = require("../middleware.js");

router.get("/",isLoggedIn, rentalRequest.getCart);
router.get("/:userId",isLoggedIn, rentalRequest.getCart);
router.post("/delete/:id/:userId",isLoggedIn, rentalRequest.deleteRentalRequest);
router.get("/checkout/:userId/:listingId",isLoggedIn, rentalRequest.checkoutListing);

module.exports = router;