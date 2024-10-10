const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { query, validationResult } = require('express-validator');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
});

app.use(limiter);

const apiKeyMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const validApiKey = process.env.API_KEY;

    if (token === validApiKey) {
      next();
    } else {
      res.status(403).json({ error: 'Accès interdit. Clé API invalide.' });
    }
  } else {
    res.status(403).json({ error: 'Accès interdit. En-tête Authorization manquant ou incorrect.' });
  }
};

app.get('/api/search', [
  apiKeyMiddleware,
  query('debut').isString().isLength({ min: 1 }).trim().escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const query = req.query.debut;
  try {
    const response = await axios.get(`https://base-donnees-publique.medicaments.gouv.fr/options_autocompletion.php?debut=${query}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
  }
});

app.listen(port, () => {
  console.log(`Serveur proxy en cours d'exécution sur le port ${port}`); 
});
