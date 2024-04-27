const express = require('express');
const session = require('express-session');
const router = express.Router();
const db = require('../database/config');
const isAuth = require('./middleware/isAuth');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});


router.get('/login', (req, res) => {
  return res.status(400).render('login', {
    message: "Suivre nos actualités et offres promotionnelles avec notre Newsletter"
  });
});




router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('login', {
      message: "Entrer un email et un mot de passe"
    });
  }
  

  db.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0) {
      const user = results[0];

      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
        }

        if (match) {
          if (user.role === 'admin') {
            req.session.admin = { id: user.id, name: user.name, email: user.email };
            console.log(req.session.admin);
            return res.status(200).render('./admin/admin');
          } else {
            req.session.user = { id: user.id, name: user.name, email: user.email };
            console.log(req.session.user);
            return res.status(200).render('./client');
          }
        } else {
          return res.status(400).render('login', {
            message: "Mot de passe incorrect"
          });
        }
      });
    } else {
      return res.status(400).render('login', {
        message: "Utilisateur non trouvé"
      });
    }
  });
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    db.query('INSERT INTO users SET ?', { name, email, password: hash }, (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
      } else {
        req.session.user = { id: results.insertId, name, email };
        return res.render('./login');
      }
    });
  });
});
// routes/users.js

// ... (other imports)

router.get('/admin', (req, res) => {
  // Check if the user is authenticated as admin
  if (req.session.admin) {
    const user = req.session.admin; // Use req.session.admin instead of req.session.user

    return res.render('./admin/admin', { user }); // Pass the user object to the view
  } else {
    // Redirect to login page or handle unauthorized access
    res.redirect('/login');
  }
});

// ... (other routes)

// Reservation form route
router.get('/reservation-form', isAuth, (req, res) => {
  let citiesArrive;
  let citiesDepart;
  let categories;

  // Fetch data for cities from city_arrive and city_depart tables
  db.query('SELECT id_city_a, attitude_city_a, longitude_city_a, name_city_a FROM city_arrive', (errorArrive, cityResultsArrive) => {
    if (errorArrive) {
      console.error(errorArrive);
      return res.status(500).send('Internal Server Error');
    }
    citiesArrive = cityResultsArrive;

    db.query('SELECT id_city_d, attitude_city_d, longitude_city_d, name_city_d FROM city_depart', (errorDepart, cityResultsDepart) => {
      if (errorDepart) {
        console.error(errorDepart);
        return res.status(500).send('Internal Server Error');
      }
      citiesDepart = cityResultsDepart;

      // Fetch data for categories from the category table
      db.query('SELECT id_category, name_category FROM category', (errorCategory, categoryResults) => {
        if (errorCategory) {
          console.error(errorCategory);
          return res.status(500).send('Internal Server Error');
        }
        categories = categoryResults;

        // Render the reservation form with city and category data
        res.render('reservation-form', { citiesArrive, citiesDepart, categories });
      });
    });
  });
});

// Handle form submission for reservations
router.post('/reserve', (req, res) => {
  // Your reservation logic
});



module.exports = router;
