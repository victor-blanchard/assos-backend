const express = require('express');
const router = express.Ro
const Association = require('../models/associations');

// Route pour créer une association
router.post('/create', async (req, res) => {
  
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

        try {
            const user = await User.findOne({ token: req.body.token });
            if (!user) {
              res.json({ result: false, error: "User token not found in database" });
              return;
            }

        // Création de l'association
        const newAssociation = new Association({
            name,
            description,
        });

        await newAssociation.save();
        res.status(201).json({ message: 'Association créée avec succès.', association: newAssociation });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de l\'association.', error });
    }
});

// Route pour mettre à jour une association
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // Validation des données
        if (!name || !description) {
            return res.status(400).json({ message: 'Tous les champs sont requis.' });
        }

        // Mise à jour de l'association
        const updatedAssociation = await Association.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        if (!updatedAssociation) {
            return res.status(404).json({ message: 'Association non trouvée.' });
        }

        res.status(200).json({ message: 'Association mise à jour avec succès.', association: updatedAssociation });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'association.', error });
    }
});

// Route pour supprimer une association
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Suppression de l'association
        const deletedAssociation = await Association.findByIdAndDelete(id);

        if (!deletedAssociation) {
            return res.status(404).json({ message: 'Association non trouvée.' });
        }

        res.status(200).json({ message: 'Association supprimée avec succès.', association: deletedAssociation });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'association.', error });
    }
});

module.exports = router;