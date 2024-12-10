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
      "streetAddress",
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


router.delete("/delete", async (req, res) => {
    // Validation des champs requis dans le corps de la requête
    if (!checkBody(req.body, ['token', 'siret'])) {
      res.status(400).json({ result: false, error: "Missing or empty field" });
      return;
    }
  
  
    // Vérification si l'association existe avant de la supprimer
    const asso = await Association.findOne({ siret: req.body.siret })
    .populate('owner')

        if (!asso) {
          res.json({ result: false, error: 'Asso not found' });
          return;
        }
        if(asso.owner.token !== req.body.token) {
            res.json({ result: false, error: 'User not allowed to delete Asso'});
            return;
        }

const deletedDoc = await Association.deleteOne({ siret: req.body.siret });
if (deletedDoc.deletedCount > 0) {
    return res.json({result:true, message: "asso successfully deleted "})
}
  else {
    return res.json({result:false, error: "asso could not be deleted "})
  }
})


router.put('/update', async (req, res) => {
    if (!checkBody(req.body, ['token', 'siret'])) {
      res.json({ result: false, error: 'Missing or empty fields' });
      return;
    }
  
    // Vérification si l'association existe avant de la modifier
    const asso = await Association.findOne({ siret: req.body.siret })
    .populate('owner')

        if (!asso) {
          res.json({ result: false, error: 'Asso not found' });
          return;
        }
        if(asso.owner.token !== req.body.token) {
            res.json({ result: false, error: 'User not allowed to update Asso'});
            return;
        }
        
            // Mise à jour des données de l'association
            const updatedAsso = await Association.findOneAndUpdate({ siret: req.body.siret }, {$set: updateFields},
                { new: true }) // Retourner le document mis à jour)
    
            if (updatedAsso) {
              res.json({ result: true, message: "Asso successfully updated", asso: updatedAsso });
            } else {
              res.status(500).json({ result: false, error: "Failed to update Asso" });
}})

  module.exports = router;