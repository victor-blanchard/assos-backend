var express = require("express");
var router = express.Router();

require("../models/connection");
const { checkBody } = require("../modules/checkBody");
const Event = require("../models/events");
const User = require("../models/users");

//OBTENIR TOUS LES EVENTS DE LA BDD
router.get("/getAllEvents", (req, res) => {
  Event.find()
    .populate("organiser")
    .then((data) => {
      res.json({ result: true, events: data });
    });
});

//CREER UN EVENT DANS LA BDD - RENVOI LE DOCUMENT ENTIER
router.post("/add", (req, res) => {
  if (
    !checkBody(req.body, [
      "organiser",
      "startDate",
      "endDate",
      "limitDate",
      "name",
      "description",
      "isOpenToSubsciption",
      "address",
      "status",
      "categories",
      "slotsAvailable",
      "target",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({ token: req.body.token }).then((data) => {
    if (data === null) {
      res.json({ result: false, error: "user token not in database " });
    } else {
      const newEvent = new Event({
        organiser: req.body.organiser,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        limitDate: req.body.limitDate,
        name: req.body.name,
        description: req.body.description,
        isOpenToSubsciption: req.body.isOpenToSubsciption,
        address: req.body.address,
        status: req.body.status,
        categories: req.body.categories,
        slotsAvailable: req.body.slotsAvailable,
        target: req.body.target,
        // userPhoto: "profilePicture.jpg",
      });
      newEvent.save().then((newDoc) => {
        res.json({ result: true, eventCreated: newDoc });
      });
    }
  });
});

//SUPPRIMER UN EVENT DE LA BDD A PARTIR DE SON _ID
router.delete("/delete", (req, res) => {
  if (!checkBody(req.body, ["_id"])) {
    res.json({ result: false, error: "_id required to delete event from database" });
    return;
  }
  Event.findOne({ _id: req.body._id })
    .populate("organiser")
    .then((data) => {
      if (data === null) {
        res.json({ result: false, error: "event _id not in database " });
      } else {
        if (data.organiser.token !== req.body.token) {
          res.json({ result: false, error: "cannot delete, current user is not event owner " });
        } else {
          Tweet.deleteOne({ _id: req.body._id }).then((deletedDoc) => {
            if (deletedDoc.deletedCount > 0) {
              res.json({ result: true, error: "event successfully deleted from database " });
            }
          });
        }
      }
    });
});

//AJOUTER UN LIKE A UN TWEET DE LA BDD A PARTIR DE SON _ID

router.post("/addLike", async (req, res) => {
  // Vérification des paramètres requis
  if (!checkBody(req.body, ["_id", "token"])) {
    return res.json({
      result: false,
      error: "_id & token are required to add a like to a tweet in the database",
    });
  }

  const tweet = await Tweet.findOne({ _id: req.body._id });

  if (!tweet) {
    return res.json({ result: false, error: "Tweet _id not found in the database" });
  }
  // Vérification si l'utilisateur existe
  const user = await User.findOne({ token: req.body.token });
  if (!user) {
    return res.json({ result: false, error: "User token not found in the database" });
  }
  // Vérification si l'utilisateur a déjà liké le tweet
  const userAlreadyLiked = tweet.likedByUserToken.some((item) => item == req.body.token);

  if (userAlreadyLiked) {
    return res.json({ result: false, error: "User has already liked this tweet" });
  }
  // AJOUT DU USER TOKEN AU TABLEAU likedByUserToken
  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: req.body._id },
    {
      $inc: { likeCounter: 1 }, // Incrémentation du compteur de likes
      $push: { likedByUserToken: req.body.token },
    },
    { new: true } // Renvoie le tweet mis à jour
  );
  // REPONSE
  res.json({ result: true, tweetUpdated: updatedTweet });
});

//SUPPRIMER UN LIKE D'UN TWEET DE LA BDD A PARTIR DE SON _ID

router.post("/removeLike", async (req, res) => {
  // Vérification des paramètres requis
  if (!checkBody(req.body, ["_id", "token"])) {
    return res.json({
      result: false,
      error: "_id & token are required to remove a like to a tweet in the database",
    });
  }

  const tweet = await Tweet.findOne({ _id: req.body._id });

  if (!tweet) {
    return res.json({ result: false, error: "Tweet _id not found in the database" });
  }
  // Vérification si l'utilisateur existe
  const user = await User.findOne({ token: req.body.token });
  if (!user) {
    return res.json({ result: false, error: "User token not found in the database" });
  }
  // Vérification si l'utilisateur a déjà liké le tweet
  const userAlreadyLiked = tweet.likedByUserToken.some((item) => item == req.body.token);

  if (!userAlreadyLiked) {
    return res.json({ result: false, error: "User has not liked this tweet" });
  }
  // SUPPRESSION DU USER TOKEN DU TABLEAU likedByUserToken
  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: req.body._id },
    {
      $inc: { likeCounter: -1 }, // Incrémentation du compteur de likes
      $pull: { likedByUserToken: req.body.token },
    },
    { new: true } // Renvoie le tweet mis à jour
  );
  // REPONSE
  res.json({ result: true, tweetUpdated: updatedTweet });
});

module.exports = router;
