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
      "isOpenToSubsciption",
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

    const newEvent = new Event({
      organiser: req.body.organiser,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      limitDate: req.body.limitDate,
      name: req.body.name,
      description: req.body.description,
      isOpenToSubsciption: req.body.isOpenToSubsciption,
      address: { street: req.body.street, city: req.body.city, zipcode: req.body.zipcode },
      status: req.body.status,
      categories: req.body.categories,
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

module.exports = router;
