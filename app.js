require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connecté à MongoDB Atlas !');
    app.listen(process.env.PORT || 3000, () => {
      console.log('Serveur démarré sur le port 3000');
    });
  })
  .catch(err => {
    console.error('Erreur de connexion à MongoDB :', err);
  });

// Ton schema et routes ici (exemple)

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model('User', userSchema);

app.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
