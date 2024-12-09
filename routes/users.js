var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Association = require("../models/associations");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstname", "lastname", "email", "password", "birthday", "zipcode"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      // IF USER IS AN ASSOCIATION OWNER, HE CANNOT LIKE AN EVENT OR FOLLOW AN ASSOCIATION
      if (req.body.isAssociationOwner) {
        const newUser = new User({
          isAssociationOwner: req.body.isAssociationOwner,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          password: hash,
          birthday: req.body.birthday,
          zipcode: req.body.zipcode,
          token: uid2(32),
          likedEvents: null,
          followingAssociations: null,
        });

        newUser.save().then((newDoc) => {
          res.json({
            result: true,
            token: newDoc.token,
            isAssociationOwner: newDoc.isAssociationOwner,
            firstname: newDoc.firstname,
            lastname: newDoc.lastname,
            email: newDoc.email,
            birthday: newDoc.birthday,
            zipcode: newDoc.zipcode,
          });
        });
      }
      // IF USER IS NOT AN ASSOCIATION OWNER, HE CAN LIKE AN EVENT OR FOLLOW AN ASSOCIATION
      else {
        const newUser = new User({
          isAssociationOwner: req.body.isAssociationOwner,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          password: hash,
          birthday: req.body.birthday,
          zipcode: req.body.zipcode,
          token: uid2(32),
          likedEvents: [],
          followingAssociations: [],
        });
        newUser.save().then((newDoc) => {
          res.json({
            result: true,
            token: newDoc.token,
            isAssociationOwner: newDoc.isAssociationOwner,
            firstname: newDoc.firstname,
            lastname: newDoc.lastname,
            email: newDoc.email,
            birthday: newDoc.birthday,
            zipcode: newDoc.zipcode,
          });
        });
      }
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email })
    .populate("followingAssociations", "likedEvents")
    .then((data) => {
      if (bcrypt.compareSync(req.body.password, data.password)) {
        res.json({
          result: true,
          token: data.token,
          isAssociationOwner: data.isAssociationOwner,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          birthday: data.birthday,
          zipcode: data.zipcode,
        });
      } else {
        res.json({ result: false, error: "User not found or wrong password" });
      }
    });
});

module.exports = router;
