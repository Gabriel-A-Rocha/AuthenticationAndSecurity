//jshint esversion:6

//importing external modules
const express = require('express');
const ejs = require('ejs');

//starting server
const app = express();
const port = 3000;
app.listen(port, () => console.log('Server up and running') );

//binding required middlewares
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'));

//define app settings
app.set('view engine', 'ejs');




//root route methods
app.route('/')

  .get( (req, res) => {
    res.render('home');
  })

  .post( (req, res) => {
    res.send(req.body.title);
  });
