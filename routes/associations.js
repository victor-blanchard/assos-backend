var express = require("express");
var router = express.Router();

require("../models/connection");
const Event = require("../models/events");
const User = require("../models/users");
const Association = require("../models/associations");
const { checkBody } = require("../modules/checkBody");

router.post("/create", (req, res) => {
  if (
    !checkBody(req.body, [
      "name",
      "owner",
      "description",
      "siret",
      "email",
      "phone",
      "stretAddress",
      "city",
      "zipcode",
      "categories",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Check if the asso has not already been registered
  Association.findOne({ siret: req.body.siret }).then((data) => {
    if (data === null) {
      const newAssociation = new Association({
        name: req.body.name,
        owner: req.body.owner,
        description: req.body.description,
        siret: req.body.siret,
        email: req.body.email,
        phone: req.body.phone,
        streetAddress: req.body.streetAddress,
        city: req.body.city,
        zipcode: req.body.zipcode,
        categories: req.body.categories,
      });

      newAssociation.save().then((newDoc) => {
        res.json({
          result: true,
          newDoc: newDoc,
        });
      });
    } else {
      // Asso already exists in database
      res.json({ result: false, error: "Association already exists" });
    }
  });
});

module.exports = router;
