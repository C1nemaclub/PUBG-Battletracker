const express = require('express');
const router = express.Router();

router.use('/contact', (req, res) => {
  res.render('contact');
});

router.use('/about', (req, res) => {
  res.render('about');
});

module.exports = router;
