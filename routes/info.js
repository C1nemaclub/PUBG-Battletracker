const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

router.use('/contact', (req, res) => {
  res.render('contact');
});

router.use('/about', (req, res) => {
  res.render('about');
});

router.post('/', (req, res) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.USER,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    name: req.body.sender,
    from: req.body.email,
    to: process.env.EMAIL,
    subject: req.body.subject,
    text: req.body.messagge,
  };

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
    else console.log(info);
  });

  console.log(req.body);
  res.redirect('/info/contact');
});

module.exports = router;
