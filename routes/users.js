var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const Association = require("../models/associations");
const Event = require("../models/events");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const { emailService } = require("../modules/emailService");

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstname", "lastname", "email", "password", "birthday", "zipcode"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // emailService.sendEmail('walisylla.esse@gmail.com', 'Bienvenue', 'Nous sommes heureux de vous accueillir', '<b>Hello</b>')
  // .then(result => console.log('Email sent:', result))
  // .catch(error => console.error('Error sending email:', error));
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
          photoUrl: req.body.photoUrl || null, 
          publicId: req.body.publicId || null,  
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
            _id: newDoc._id,
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
          photoUrl: req.body.photoUrl || null, 
          publicId: req.body.publicId || null,

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
      if (data && bcrypt.compareSync(req.body.password, data.password)) {
        console.log(data);
        
        res.json({
          result: true,
          token: data.token,
          photoUrl: data.photoUrl, 
          publicId: data.publicId,
          isAssociationOwner: data.isAssociationOwner,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          birthday: data.birthday,
          zipcode: data.zipcode,
          likedEvents: data.likedEvents,
          followingAssociations: data.followingAssociations,
        });
      } else {
        res.json({ result: false, error: "User not found or wrong password" });
      }
    });
});

//// MEHMET TRAVAILLE A PARTIR DE CETTE LIGNE///////////////////////////////////////////

router.put("/update/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    if (user.token !== req.body.token) {
      return res.status(403).json({
        result: false,
        error: "Permission denied",
      });
    }

    const updateFields = {};
    if (req.body.firstname) updateFields.firstname = req.body.firstname;
    if (req.body.lastname) updateFields.lastname = req.body.lastname;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.birthday) updateFields.birthday = req.body.birthday;
    if (req.body.zipcode) updateFields.zipcode = req.body.zipcode;
    if (req.body.followingAssociations)
      updateFields.followingAssociations = req.body.followingAssociations;
    if (req.body.likedEvents) updateFields.likedEvents = req.body.likedEvents;

    const updatedUser = await User.findOneAndUpdate(
      { token: token },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    res.json({
      result: true,
      message: "User successfully updated",
      currentUser: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: "Failed to update user",
      details: error.message,
    });
  }
});

//ROUTE FOR ADDING AN EVENT TO THE LIST
router.put("/addLikeEvent/:token", async (req, res) => {
  try {
    // Récupération des paramètres
    const { token } = req.params;
    const eventId = req.body.eventId;

    // Vérification des entrées
    if (!eventId) {
      return res.status(400).json({ result: false, error: "Event ID is required" });
    }

    // Récupération de l'utilisateur
    const user = await User.findOne({ token }).populate("followingAssociations", "likedEvents");
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    // Vérification de l'événement
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ result: false, error: "Event not found" });
    }

    // Vérification si l'événement est déjà liké
    if (!user.likedEvents) {
      user.likedEvents = []; // Initialisation si le tableau n'existe pas
    }
    if (user.likedEvents.includes(eventId)) {
      return res.status(400).json({ result: false, error: "Event already in your favorites" });
    }

    // Ajout de l'événement
    user.likedEvents.push(eventId);
    await user.save();

    // Réponse réussie
    return res.json({
      result: true,
      message: "Event added to liked events",
      likedEvents: user.likedEvents,
    });
  } catch (error) {
    console.error("Error in addLikeEvent:", error);
    return res.status(500).json({ result: false, error: "Failed to add event" });
  }
});
//ROUTE FOR REMOVING AN EVENT FROM THE LIST

router.put("/removeLikeEvent/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const eventId = req.body.eventId;

    // Vérification des entrées
    if (!eventId) {
      return res.status(400).json({ result: false, error: "Event ID is required" });
    }

    // Récupération de l'utilisateur
    const user = await User.findOne({ token }).populate("followingAssociations", "likedEvents");
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    // Vérification de l'événement
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ result: false, error: "Event not found" });
    }

    if (!user.likedEvents.some((event) => event.toString() == eventId)) {
      return res.status(404).json({
        result: false,
        error: "Event cannot be removed from the list as it's not there",
      });
    }

    if (!user.likedEvents) {
      user.likedEvents = [];
    }

    user.likedEvents = user.likedEvents.filter((event) => event.toString() != eventId);
    await user.save();

    res.json({
      result: true,
      message: "Event removed from the list",
      likedEvents: user.likedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, error: "Failed to remove event" });
  }
});

//ROUTE FOR ADDING AN ASSOCIATION TO THE LIST
router.put("/addLikeAsso/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    const assoId = req.body.assoId;
    const asso = await Association.findById(assoId);

    if (user.token !== req.body.token) {
      return res.status(403).json({
        result: false,
        error: "Permission denied",
      });
    }

    if (!asso) {
      return res.status(404).json({ result: false, error: "Association not found" });
    }

    if (!user.followingAssociations) {
      user.followingAssociations = [];
    }

    if (user.followingAssociations.some((asso) => asso.toString() === assoId)) {
      return res.status(404).json({ result: false, error: "Association already in your favorite" });
    }

    user.followingAssociations.push(assoId);
    await user.save();

    res.json({
      result: true,
      message: "Association added to liked associations",
      currentUser: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, error: "Failed to add association" });
  }
});

//ROUTE FOR REMOVING AN ASSOCIATION FROM THE LIST

router.put("/removeLikeAsso/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    const assoId = req.body.assoId;
    const asso = await Association.findById(assoId);

    if (user.token !== req.body.token) {
      return res.status(403).json({
        result: false,
        error: "Permission denied",
      });
    }

    if (!asso) {
      return res.status(404).json({ result: false, error: "Association not found" });
    }

    if (!user.followingAssociations.some((asso) => asso.toString() === assoId)) {
      return res.status(404).json({
        result: false,
        error: "Association cannot be removed from the list as it's not there",
      });
    }

    if (!user.followingAssociations) {
      user.followingAssociations = [];
    }

    user.followingAssociations = user.followingAssociations.filter(
      (asso) => asso.toString() !== assoId
    );
    await user.save();

    res.json({
      result: true,
      message: "Association removed from the list",
      currentUser: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, error: "Failed to remove association" });
  }
});

/// MEHMET TRAVAILLE JUSQUA CETTE LIGNE/////////////////////////////

router.get("/getUserLikedEvents/:token", async (req, res) => {
  try {
    const data = await User.findOne({ token: req.params.token }).populate("likedEvents");
    if (data) {
      res.json({ result: true, likedEvents: data.likedEvents });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ result: false, error: "ERROR SERVER" });
  }
});

router.get("/followingAssociations/:token", async (req, res) => {
  try {
    const data = await User.findOne({ token: req.params.token }).populate("followingAssociations");
    if (data) {
      res.json({ result: true, followingAssociations: data.followingAssociations });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ result: false, error: "ERROR SERVER" });
  }
});


//Photo

router.post('/upload', async (req, res) => {
  
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ result: false, message: 'Aucun fichier fourni' });
    };
    console.log("coucou",req.body);
    
    const token = req.body.token; // token transmis dans le corps de la requête
    const userId = await User.findOne({ token }).select('_id');//recup de l'id user
    console.log(userId);
    if (!userId) {
      return res.json({ result: false, message: 'Utilisateur non trouvé' });
    };

    const photoPath = `./tmp/${uniqid()}.jpg`;
    const resultMove = await req.files.file.mv(photoPath);
    
    if (!resultMove) {
      // const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      // fs.unlinkSync(photoPath);
      const resultCloudinary = await cloudinary.uploader.upload(photoPath, {
        public_id: `${uniqid()}` 
      });
      fs.unlinkSync(photoPath);

      

      console.log("ResultCloudinary", resultCloudinary);
      
      
      //Mise à jour de l'utilisateur dans la bdd
        const updateResult = await User.updateOne(
          { _id: userId._id },
          {
            photoUrl: resultCloudinary.secure_url,
            publicId: resultCloudinary.public_id
          }
        );
        console.log('updateResult =>', updateResult)
        if (updateResult.modifiedCount > 0) {
          res.json({
            result: true,
            photoUrl: resultCloudinary.secure_url,
            publicId: resultCloudinary.public_id,
          })
        } else {
          res.json({ result: false, message: 'Erreur lors de la mise à jour de l\'utilisateur' })
        }

    
    } else {
      res.json({ result: false, error: resultMove });
    }
  }catch(error) {
    console.error('Erreur lors de la recuperation de l\'image')
    res.json({result: false})
  }
  
});
//Delete photo

router.delete('/removephoto', (req, res) => {});

module.exports = router;
