var express = require("express");
var router = express.Router();

require("../models/connection");
const Event = require("../models/events");
const User = require("../models/users");
const Association = require("../models/associations");
const { checkBody } = require("../modules/checkBody");


////START - ROUTE GET SIMPLE ////

router.get("/getasso/:id", async (req, res) => {
  try {
    const data = await Association.findOne({_id: req.params.id });
    if (data) {
      res.json({ result: true, association: data });
    } else {
      res.json({ result: false, error: "Association not found" });
    }
  } catch (error) {
    res.status(500).json({ result: false, error: "ERROR SERVER" });
  }
});

//// END - ROUTE GET SIMPLE ////

router.post("/create", (req, res) => {
  if (
    !checkBody(req.body, [
      "name",
      "owner",
      "description",
      "siret",
      "email",
      "phone",
      "street",
      "zipcode",
      "city",
      "categories",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Check if the asso has not already been registered
  Association.findOne({ siret: req.body.siret }).then((data) => {
    if (data === null) {
      const categoriesArray = req.body.categories.split(",");
      const newAssociation = new Association({
        name: req.body.name,
        owner: req.body.owner,
        description: req.body.description,
        siret: req.body.siret,
        email: req.body.email,
        phone: req.body.phone,
        address: { street: req.body.street, city: req.body.city, zipcode: req.body.zipcode },
        categories: categoriesArray,
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
  if (!checkBody(req.body, ["token", "siret"])) {
    res.status(400).json({ result: false, error: "Missing or empty field" });
    return;
  }

  // Vérification si l'association existe avant de la supprimer
  const asso = await Association.findOne({ siret: req.body.siret }).populate("owner");

  if (!asso) {
    res.json({ result: false, error: "Asso not found" });
    return;
  }
  if (asso.owner.token !== req.body.token) {
    res.json({ result: false, error: "User not allowed to delete Asso" });
    return;
  }

  const deletedDoc = await Association.deleteOne({ siret: req.body.siret });
  if (deletedDoc.deletedCount > 0) {
    return res.json({ result: true, message: "asso successfully deleted " });
  } else {
    return res.json({ result: false, error: "asso could not be deleted " });
  }
});

router.put("/update/:id", async (req, res) => {
  const id = req.params.id; // Corrigé pour extraire directement l'ID comme chaîne
  const updates = req.body;

  try {
    // Vérifie la structure du corps de la requête
    if (!checkBody(req.body, ["token"])) {
      return res.status(400).json({
        result: false,
        error: "Event ID and token are required to update an event in the database",
      });
    }

    // Récupère l'événement avec les relations nécessaires
    const association = await Association.findById(id).populate("owner");

    if (!association) {
      return res.status(404).json({
        result: false,
        error: "Association not found in the database",
      });
    }

    // Vérifie si l'utilisateur est le propriétaire de l'association
    if (association.owner.token !== req.body.token) {
      return res.status(403).json({
        result: false,
        error: "Permission denied: current user is not the association owner",
        ownertoken: association.owner.token,
      });
    }

    if (updates.categories) {
      updates.categories = updates.categories
        .replace(/^\[|\]$/g, "") // Supprimer les crochets [ et ]
        .split(",") // Séparer les valeurs par des virgules
        .map((item) => item.trim()); // Supprimer les espaces autour des valeurs
    }

    // Met à jour les champs spécifiés dans le body uniquement
    const updatedAsso = await Association.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true } // Renvoie l'association mis à jour et applique les validateurs qui assure que le shéma est respecté
    );

    if (!updatedAsso) {
      return res.status(404).json({
        result: false,
        error: "Association not found after update",
      });
    }

    res.status(200).json({ result: true, association: updatedAsso });
  } catch (error) {
    res.status(500).json({
      result: false,
      error: error.message,
    });
  }
});

router.get("/filtered", async (req, res) => {
  try {
    // Récupération des filtres depuis les query params
    const { categories, location, keyword } = req.query;

    // Construction de l'objet de filtre
    let filters = {};

    // Filtrer par catégories multiples
    if (categories) {
      const categoriesArray = categories.split(",");
      filters.categories = { $in: categoriesArray }; // Mongoose : catégorie dans le tableau
    }

    if (keyword) {
      const regex = new RegExp(keyword, "i"); // Crée une expression régulière insensible à la casse
      filters.$or = [
        { name: regex }, // Rechercher le mot-clé dans la propriété name
        { description: regex }, // Rechercher le mot-clé dans la propriété `description`
      ];
    }

    if (location) {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(location)}`
      );
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        return res.json({ result: false, error: "Ville non trouvée." });
      }

      const firstCity = data.features[0];
      const searchedCity = {
        name: firstCity.properties.city,
        zipcode: firstCity.properties.postcode,
      };

      filters["address.zipcode"] = { $regex: `^${searchedCity.zipcode.slice(0, 2)}` };
    }

    // Recherche avec Mongoose
    const associations = await Association.find(filters);

    // Réponse JSON
    res.status(200).json({ result: true, filters: filters, associations: associations });
  } catch (error) {
    console.error("Erreur dans le filtrage :", error);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

module.exports = router;
