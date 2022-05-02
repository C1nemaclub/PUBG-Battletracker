const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});

app.get('/', (req, res) => {
  console.log('Got a request');
  res.render('index');
});

const userRouter = require('./routes/users');
app.use('/users', userRouter);

const infoRouter = require('./routes/info');
app.use('/info', infoRouter);

app.get('*', (req, res) => {
  res.render('notfound', { error: res.status(404).statusCode });
});