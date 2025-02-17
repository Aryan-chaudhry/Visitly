const Listing = require("../models/listing");
const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const RentalRequest = require("../models/rentalRequest"); // ✅ Import the model

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.sustain = async (req, res) => {
  const allListings = await Listing.find({});
  const sustainableListings = allListings.filter(listing => listing.sustainable);
  res.render('listings/sustain.ejs', { sustainableListings });
};

module.exports.comm = async (req, res) => {
  const allListings = await Listing.find({});
  const commercialListings = allListings.filter(listing => listing.commercial);
  res.render('listings/comm.ejs', { commercialListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  console.log(listing);
  const user = await User.findById(listing.owner);
  res.render("listings/show.ejs", { listing, user });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;
  let sustainablev = req.body.listing.sustainable === "true";
  let commercialev = req.body.listing.commercial === "true";
  const newListing = new Listing(
    req.body.listing
  );
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;
  newListing.sustainable = sustainablev;
  newListing.commercial = commercialev;
  let savedListing = await newListing.save();
  console.log(savedListing);

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Update route (updates listing details)
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let coordinate = await geocodingClient
    .forwardGeocode({
      query: ` ${req.body.listing.location},${req.body.listing.country}`,
      limit: 2,
    })
    .send();
    
  req.body.listing.geometry = coordinate.body.features[0].geometry;
  req.body.listing.sustainable = req.body.listing.sustainable === 'true'; // Ensure boolean value
  req.body.listing.commercial = req.body.listing.commercial === 'true'; 
  let updatedListing = await Listing.findByIdAndUpdate(id, req.body.listing);

  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    updatedListing.save();
  }
  req.flash("success", "Listing Updated !!");
  res.redirect(`/listings/${id}`);
};

// module.exports.updateListing = async (req, res) => {
//   let { id } = req.params;
//   let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

//   if (typeof req.file !== "undefined") {
//     let url = req.file.path;
//     let filename = req.file.filename;
//     listing.image = { url, filename };
//     await listing.save();
//   }

//   req.flash("success", "Listing Updated!");
//   res.redirect(`/listings/${id}`);
// };

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

//search ---

module.exports.search = async (req, res) => {
  console.log(req.query.q);
  let input = req.query.q.trim().replace(/\s+/g, " ");
  console.log(input);
  if (input == "" || input == " ") {
    req.flash("error", "Search value empty !!!");
    res.redirect("/listings");
  }

  let data = input.split("");
  let element = "";
  let flag = false;
  for (let index = 0; index < data.length; index++) {
    if (index == 0 || flag) {
      element = element + data[index].toUpperCase();
    } else {
      element = element + data[index].toLowerCase();
    }
    flag = data[index] == " ";
  }
  console.log(element);
  // baki sab sahi ho gya ok done bye bye ok
  let allListings = await Listing.find({
    title: { $regex: element, $options: "i" },
  });
  if (allListings.length != 0) {
    res.locals.success = "Listings searched by Title";
    res.render("listings/index.ejs", { allListings });
    return;
  }

  if (allListings.length == 0) {
    allListings = await Listing.find({
      category: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Category";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }
  if (allListings.length == 0) {
    allListings = await Listing.find({
      country: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Location";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }

  const intValue = parseInt(element, 10);
  const intDec = Number.isInteger(intValue);

  if (allListings.length == 0 && intDec) {
    allListings = await Listing.find({ price: { $lte: element } }).sort({
      price: 1,
    });
    if (allListings.length != 0) {
      res.locals.success = `Listings searched for less than Rs ${element}`;
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }
  if (allListings.length == 0) {
    req.flash("error", "Listings is not here !!!");
    res.redirect("/listings");
  }
};

/*  create rental request */

module.exports.createRentalRequest = async (req, res) => {
  try {
    console.log("Rent request received:", req.body);

    const { rentStartDate, rentEndDate, renterId } = req.body;
    const listing_id = req.params.id;

    // Validate input fields
    if (!rentStartDate || !rentEndDate || !renterId) {
      console.log("Missing required fields");
      return res
        .status(400)
        .send(
          "All fields (rental_start_date, rental_end_date, user_id) are required."
        );
    }

    if (new Date(rentStartDate) >= new Date(rentEndDate)) {
      console.log("Invalid date range");
      return res.status(400).send("End date must be after start date.");
    }

    // Create a new rental request
    const rentalRequest = new RentalRequest({
      listing_id,
      user_id: renterId,
      rental_start_date: rentStartDate,
      rental_end_date: rentEndDate,
      status: "Pending",
    });

    await rentalRequest.save();
    console.log("Rental request saved:", rentalRequest);

    // Fetch updated rental requests for the user
    const requests = await RentalRequest.find({ user_id: renterId })
      .populate("listing_id", "title description price image")
      .exec();

    // Render the updated cart view
    res.render("cart/showCart.ejs", { requests });
  } catch (error) {
    console.error("Error processing rental request:", error);
    res.status(500).send("Error processing rental request.");
  }
};
