if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const rentalRequestsRouter = require("./routes/rentalRequests.js");
   

// const dbUrl= "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));  
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:8080/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // First check if the user already exists using the Google ID
//         let existingUser = await User.findOne({ googleId: profile.id });

//         // If the user exists, just log them in
//         if (existingUser) {
//           return done(null, existingUser);
//         } else {
//           // If the user does not exist, check if email already exists in the database
//           let userByEmail = await User.findOne({ email: profile.emails[0].value });

//           if (userByEmail) {
//             // If email exists, update the user's googleId (we don't create a new user)
//             userByEmail.googleId = profile.id;
//             await userByEmail.save();
//             return done(null, userByEmail);
//           } else {
//             // If no user with this email, we reject the login with an error message
//             return done(null, false, { message: 'No account found with this email address.' });
//           }
//         }
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );


// login with google
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:8080/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         console.log("Google Profile:", profile); // Log the entire profile to check its content
//         console.log("Profile ID:", profile.id);  // Log the profile ID
//         console.log("Profile Email:", profile.emails); // Log the profile emails

//         // First check if the user already exists using the Google ID
//         let existingUser = await User.findOne({ googleId: profile.id });

//         if (existingUser) {
//           console.log("Existing user found:", existingUser); // Log existing user
//           return done(null, existingUser);
//         } else {
//           // If the user does not exist, check if email already exists in the database
//           let userByEmail = await User.findOne({ email: profile.emails[0].value });

//           if (userByEmail) {
//             console.log("User by email found:", userByEmail); // Log user found by email
//             // If email exists, update the user's googleId (we don't create a new user)
//             userByEmail.googleId = profile.id;
//             await userByEmail.save();
//             return done(null, userByEmail);
//           } else {
//             console.log("No account found with this email address."); // Log failure
//             // If no user with this email, we reject the login with an error message
//             return done(null, false, { message: 'No account found with this email address.' });
//           }
//         }
//       } catch (err) {
//         console.error("Error in Google Strategy:", err); // Log the error
//         return done(err, null);
//       }
//     }
//   )
// );

// logina and signup with google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile); // Log the entire profile to check its content
        console.log("Profile ID:", profile.id);  // Log the profile ID
        console.log("Profile Email:", profile.emails); // Log the profile emails

        // First check if the user already exists using the Google ID
        let existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          console.log("Existing user found:", existingUser); // Log existing user
          return done(null, existingUser); // Log in the existing user
        } else {
          // If the user does not exist, check if the email already exists in the database
          let userByEmail = await User.findOne({ email: profile.emails[0].value });

          if (userByEmail) {
            console.log("User by email found:", userByEmail); // Log user found by email
            // If email exists, update the user's googleId (we don't create a new user)
            userByEmail.googleId = profile.id;
            await userByEmail.save();
            console.log("User linked with Google ID:", userByEmail); // Log success
            return done(null, userByEmail); // Log in the user
          } else {
            // If no user with this email, create a new user with Google info (Sign-Up)

            const newUser = new User({
              email: profile.emails[0].value, // Google email
              username: profile.displayName || profile.emails[0].value.split('@')[0], // Fallback username
              googleId: profile.id, // Store Google ID for login
              // Setting password-related fields to dummy values to bypass password validation
              password: undefined, // No password needed for Google sign-up
              salt: undefined, // No salt needed
              hash: undefined, // No hash needed
            });

            await newUser.save(); // Save the new user to the database
            console.log("New user created:", newUser); // Log new user creation
            return done(null, newUser); // Log in the new user after sign-up
          }
        }
      } catch (err) {
        console.error("Error in Google Strategy:", err); // Log the error
        return done(err, null); // Return error
      }
    }
  )
);


// Login and signup with Facebook
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/facebook/callback",
      profileFields: ['id', 'emails', 'name'],  // Request profile and email
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Facebook Profile:", profile); // Log profile details
        console.log("Profile ID:", profile.id);  // Log profile ID
        console.log("Profile Email:", profile.emails); // Log profile emails

        // First, check if the user already exists using the Facebook ID
        let existingUser = await User.findOne({ facebookId: profile.id });

        if (existingUser) {
          console.log("Existing user found:", existingUser); // Log existing user
          return done(null, existingUser); // Log in the existing user
        } else {
          // If the user does not exist, check if the email already exists in the database
          let userByEmail = await User.findOne({ email: profile.emails[0].value });

          if (userByEmail) {
            console.log("User by email found:", userByEmail); // Log user found by email
            // If email exists, update the user's facebookId (we don't create a new user)
            userByEmail.facebookId = profile.id;
            await userByEmail.save();
            console.log("User linked with Facebook ID:", userByEmail); // Log success
            return done(null, userByEmail); // Log in the user
          } else {
            // If no user with this email, create a new user with Facebook info (Sign-Up)
            const newUser = new User({
              email: profile.emails[0].value, // Facebook email
              username: profile.displayName || profile.emails[0].value.split('@')[0], // Fallback username
              facebookId: profile.id, // Store Facebook ID for login
              password: undefined, // No password needed for Facebook sign-up
              salt: undefined, // No salt needed
              hash: undefined, // No hash needed
            });

            await newUser.save(); // Save the new user to the database
            console.log("New user created:", newUser); // Log new user creation
            return done(null, newUser); // Log in the new user after sign-up
          }
        }
      } catch (err) {
        console.error("Error in Facebook Strategy:", err); // Log the error
        return done(err, null); // Return error
      }
    }
  )
);


// passport.serializeUser(User.serializeUser());
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// passport.deserializeUser(User.deserializeUser());
passport.deserializeUser(async (id, done) => {
  try {
    let user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // If login is successful, show a success message and redirect to listings
    req.flash("success", `Welcome, ${req.user.username}!`);
    res.redirect("/listings");
  }
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    // If login is successful, show a success message and redirect to listings
    req.flash("success", `Welcome, ${req.user.username}!`);
    res.redirect("/listings");
  }
);




app.get("/", (req, res) => {
  // res.send("Hi, I am root");
  res.redirect("/listings");
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});



app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/rent", rentalRequestsRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});


app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("Server is listening to port 8080");
});