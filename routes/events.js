var express = require("express");
var router = express.Router();

require("../models/connection");
const { checkBody } = require("../modules/checkBody");
const Event = require("../models/events");
const User = require("../models/users");
const Association = require("../models/associations");

//OBTENIR TOUS LES EVENTS DE LA BDD
router.get("/getAllEvents", (req, res) => {
  Event.find()
    .populate("organiser")
    .then((data) => {
      res.json({ result: true, events: data });
    })
    .catch((error) => {
      console.error("Error fetching events:", error);
      res.json({ result: false, message: "Failed to fetch events", error: error.message });
    });
});

//OBTENIR TOUS LES EVENTS DE LA BDD D'UNE ASSO PRECISE
router.get("/getAllEvents/:id", (req, res) => {
  Event.find({ organiser: req.params.id })
    .populate("organiser")
    .then((data) => {
      res.json({ result: true, events: data });
    })
    .catch((error) => {
      console.error("Error fetching events:", error);
      res.json({ result: false, message: "Failed to fetch events", error: error.message });
    });
});

//OBTENIR UN EVENT DE LA BDD VIA SON ID
router.get("/eventById/:id", (req, res) => {
  Event.findById(req.params.id)
    .populate("organiser")
    .then((data) => {
      res.json({ result: true, event: data });
    })
    .catch((error) => {
      console.error("Error fetching event data:", error);
      res.json({ result: false, message: "Failed to fetch event's data", error: error.message });
    });
});

//CREER UN EVENT DANS LA BDD - RENVOI LE DOCUMENT ENTIER
router.post("/add", async (req, res) => {
  if (
    !checkBody(req.body, [
      "organiser",
      "startDate",
      "endDate",
      "limitDate",
      "name",
      "description",
      "street",
      "zipcode",
      "city",
      "status",
      "categories",
      "slotsAvailable",
      "target",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  try {
    const user = await User.findOne({ token: req.body.token });
    if (!user) {
      res.json({ result: false, error: "User token not found in database" });
      return;
    }
    const categoriesArray = req.body.categories.split(","); //permet de regrouper les categories de l'association dans un tableau
    const newEvent = new Event({
      organiser: req.body.organiser,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      limitDate: req.body.limitDate,
      name: req.body.name,
      description: req.body.description,
      address: { street: req.body.street, city: req.body.city, zipcode: req.body.zipcode },
      status: req.body.status,
      categories: categoriesArray,
      slotsAvailable: req.body.slotsAvailable,
      target: req.body.target,
      // userPhoto: "profilePicture.jpg",
    });

    const newDoc = await newEvent.save();
    res.json({ result: true, eventCreated: newDoc });
  } catch (error) {
    console.error("Error during event creation:", error);
    res.json({
      result: false,
      error: "An error occurred while creating the event",
      details: error.message,
    });
  }
});

//SUPPRIMER UN EVENT DE LA BDD A PARTIR DE SON _ID

router.delete("/delete", async (req, res) => {
  try {
    if (!checkBody(req.body, ["_id", "token"])) {
      return res.json({
        result: false,
        error: "event _id and token are required to delete an event from the database",
      });
    }
    const event = await Event.findOne({ _id: req.body._id }).populate({
      path: "organiser",
      populate: { path: "owner" },
    });
    if (!event) {
      return res.json({ result: false, error: "event _id not found in the database" });
    }
    if (event.organiser.owner.token !== req.body.token) {
      return res.json({
        result: false,
        error: "cannot delete, current user is not the event owner",
      });
    }

    const deletedDoc = await Event.deleteOne({ _id: req.body._id });
    if (deletedDoc.deletedCount > 0) {
      return res.json({ result: true, message: "event successfully deleted from the database" });
    } else {
      return res.json({ result: false, error: "event could not be deleted" });
    }
  } catch (error) {
    console.error("Error while deleting event:", error);
    res.json({ result: false, error: error });
  }
});

// ROUTE DE MISE A JOUR UNIQUEMENT DES CHAMPS ENVOYES EN BODY
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
    const event = await Event.findById(id).populate({
      path: "organiser",
      populate: { path: "owner" },
    });

    if (!event) {
      return res.status(404).json({
        result: false,
        error: "Event not found in the database",
      });
    }

    // Vérifie si l'utilisateur est le propriétaire
    if (event.organiser.owner.token !== req.body.token) {
      return res.status(403).json({
        result: false,
        error: "Permission denied: current user is not the event owner",
        ownertoken: event.organiser.owner.token,
      });
    }

    if (updates.categories) {
      updates.categories = updates.categories
        .replace(/^\[|\]$/g, "") // Supprimer les crochets [ et ]
        .split(",") // Séparer les valeurs par des virgules
        .map((item) => item.trim()); // Supprimer les espaces autour des valeurs
    }

    // Met à jour les champs spécifiés dans le body uniquement
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true } // Renvoie l'événement mis à jour et applique les validateurs qui assure que le shéma est respecté
    );

    if (!updatedEvent) {
      return res.status(404).json({
        result: false,
        error: "Event not found after update",
      });
    }

    res.status(200).json({ result: true, event: updatedEvent });
  } catch (error) {
    res.status(500).json({
      result: false,
      error: error.message,
    });
  }
});

router.get("/filtered", async (req, res) => {
  try {
    const { categories, target, openOnly, date, location, keyword } = req.query;

    let filters = {};

    // 1. **Filtrer par catégories**
    if (categories) {
      const categoriesArray = categories.split(",").map((cat) => cat.trim());
      filters.categories = { $in: categoriesArray };
    }

    // 2. **Filtrer par mot-clé dans le nom ou la description**
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      filters.$or = [{ name: regex }, { description: regex }];
    }

    // 3. **Filtrer par cible/target**
    if (target) {
      const targetArray = target.split(",").map((t) => t.trim());
      filters.target = { $in: targetArray };
    }

    // 4. **Filtrer par date (fin de l'événement >= date sélectionnée)**
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate)) {
        filters.endDate = { $gte: parsedDate };
      } else {
        return res.status(400).json({ result: false, error: "Date invalide." });
      }
    }

    // 5. **Filtrer par lieu/location** en utilisant API publique de data.gouv
    if (location) {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(location)}`
        );
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          return res.json({ result: false, error: "Ville non trouvée." });
        }

        const firstCity = data.features[0];
        const zipcode = firstCity.properties.postcode;
        filters["address.zipcode"] = { $regex: `^${zipcode.slice(0, 2)}` };
      } catch (fetchError) {
        console.error("Erreur API d'adresse :", fetchError);
        return res
          .status(500)
          .json({ result: false, error: "Erreur lors de la récupération de la localisation." });
      }
    }

    // 6. **Option openOnly** (Exemple supplémentaire si nécessaire)
    if (openOnly == "true") {
      filters.limitDate = { $gte: new Date().toDateString() };
    }

    // **Récupération des événements**
    const events = await Event.find(filters).populate("organiser");

    res.status(200).json({ result: true, filters, events });
  } catch (error) {
    console.error("Erreur dans le filtrage :", error);
    res.status(500).json({ result: false, error: "Une erreur est survenue sur le serveur." });
  }
});

module.exports = router;
