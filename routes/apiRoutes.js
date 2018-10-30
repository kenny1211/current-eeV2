var db = require("../models");
  // USER ROUTE------------------------------
// import formidable
var formidable = require('formidable');
var cloudinary = require('cloudinary');
require('dotenv').config();

// Requiring our models and passport as we've configured it
var passport = require("../config/passport");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = function(app, passport) {
  // Get all examples //BUDGET--------------------
  app.get("/api/budget", function(req, res) {
    db.Budget.findAll({}).then(function(budgetData) {
      res.json(budgetData);
    });
  });
  // Create a new example
  app.post("/api/budget", function(req, res) {
    db.Budget.create(req.body).then(function(budgetData) {
      res.json(budgetData);
    });
  });

  app.get("/api/wishlist", function(req, res) {
    db.Wishlist.findAll({}).then(function(wishlistData) {
      res.json(wishlistData);
    });
  });
  // Create a new example
  app.post("/api/wishlist", function(req, res) {
    // req.user.id
    db.Wishlist.create(req.body).then(function(wishlistData) {
      res.json(wishlistData);
    });
  });
  // Delete an example by id
  app.delete("/api/budget/:id", function(req, res) {
    db.Budget.destroy({
      where: {
        id: req.params.id
      }
    }).then(function(budgetData) {
      res.json(budgetData);
    });
  });

  // Update an example by id
  app.put("/api/budget/:id", function(req, res) {
    db.Budget.update(req.body, {
      where: {
        id: req.params.id
      }
    }).then(function(budgetData) {
      res.json(budgetData);
    });
  });

  // Get all examples //WISHLIST--------------------
  app.get("/api/wishlist", function(req, res) {
    db.Wishlist.findAll({}).then(function(wishlistData) {
      res.json(wishlistData);
    });
  });

  // Create a new example
  app.post("/api/wishlist", function(req, res) {
    db.Wishlist.create(req.body).then(function(wishlistData) {
      res.json(wishlistData);
    });
  });

  // Delete an example by id
  app.delete("/api/wishlist/:id", function(req, res) {
    db.Wishlist.destroy({
      where: {
        id: req.params.id
      }
    }).then(function(wishlistData) {
      res.json(wishlistData);
    });
  });

  // Update an example by id
  app.put("/api/wishlist/:id", function(req, res) {
    db.Wishlist.update(req.body, {
      where: {
        id: req.params.id
      }
    }).then(function(wishlistData) {
      res.json(wishlistData);
    });
  });

  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function (req, res) {
    // Since we're doing a POST with javascript, we can't actually redirect that post into a GET request
    // So we're sending the user back the route to the members page because the redirect will happen on the front end
    // They won't get this or even be able to access this page if they aren't authed
    console.log(req.user);
    res.json("/members");
  });



  /*
  Route for signing up a user. Since we are sending an image with the POST request, we cannot use body-parser since it cannot read the file's data, so we use Formidable instead. 
  Once we parse out the form and extract the image's data, we send that image's data to Cloudinary. When it's done uploading there, it executes our callback function and includes all of the newly uploaded image's data so we can use that URL to store in the user's table.
  
  The user's password is automatically hashed and stored securely thanks to how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in, otherwise send back an error 
  
  */
  app.post("/api/signup", function (req, res) {

    // Create a new instance of formidable to handle the request info
    var form = new formidable.IncomingForm();

    // parse information for form fields and incoming files
    form.parse(req, function (err, fields, files) {
      console.log(fields);
      console.log(files.photo);

      /* IF PHOTO/FILE EXISTS */
      if (files.photo) {
        // upload file to cloudinary, which'll return an object for the new image
        cloudinary.uploader.upload(files.photo.path, function (result) {
          console.log(result);
          // create new user
          db.User.create({
            email: fields.email,
            password: fields.password,
            photo: result.secure_url
          }).then(function (userInfo) {
            // Upon successful signup, log user in
            req.login(userInfo, function (err) {
              if (err) {
                console.log(err)
                return res.status(422).json(err);
              }
              console.log(req.user);
              res.json("/members");
            });
          }).catch(function (err) {
            console.log(err)
            res.status(422).json(err);
          });
        });
        /* IF NO PHOTO/FILE */
      } else {
        db.User.create({
          email: fields.email,
          password: fields.password,
        }).then(function (userInfo) {
         // Upon successful signup, log user in
         req.login(userInfo, function (err) {
           if (err) {
             console.log(err)
             return res.status(422).json(err);
           }
           console.log(req.user);
           return res.json("/members");
         });
        }).catch(function (err) {
          console.log(err);
          res.status(422).json(err);
        });
      }
    });

  });

  // Route for logging user out
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function (req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id,
        photo: req.user.photo
      });
    }
  });

};
